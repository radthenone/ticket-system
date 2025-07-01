import uuid

import pytest
from django.urls import reverse
from rest_framework import status

from apps.tickets.enums import TicketStatus
from apps.tickets.models import Ticket
from tests.factories import TicketFactory, UserFactory


@pytest.mark.django_db
class TestTicketViewSet:
    def test_create_ticket_success(self, authenticated_client):
        """Test successful ticket creation."""
        # Given
        url = reverse("tickets-list")
        data = {
            "title": "New Bug Report",
            "description": "This is a detailed bug description with more than 10 characters",
        }

        # When
        response = authenticated_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()

        assert response_data["title"] == "New Bug Report"
        assert response_data["description"] == data["description"]
        assert response_data["status"] == TicketStatus.OPEN

        # Verify ticket was created in database
        ticket = Ticket.objects.get(_id=response_data["_id"])
        assert ticket.user == authenticated_client.user
        assert ticket.title == "New Bug Report"

    def test_create_ticket_failure_title_too_short(self, authenticated_client):
        """Test ticket creation failure with short title."""
        # Given
        url = reverse("tickets-list")
        data = {
            "title": "AB",  # Too short
            "description": "This is a valid description",
        }

        # When
        response = authenticated_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response_data = response.json()
        assert any(
            "co najmniej" in msg or "przynajmniej" in msg
            for msg in response_data["title"]
        )

    def test_create_ticket_failure_description_too_short(self, authenticated_client):
        """Test ticket creation failure with short description."""
        # Given
        url = reverse("tickets-list")
        data = {
            "title": "Valid Title",
            "description": "Short",  # Too short
        }

        # When
        response = authenticated_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response_data = response.json()
        assert any(
            "co najmniej" in msg or "przynajmniej" in msg
            for msg in response_data["description"]
        )

    def test_create_ticket_failure_duplicate_title(self, authenticated_client):
        """Test ticket creation failure with duplicate title."""
        # Given
        user = authenticated_client.user
        TicketFactory(user=user, title="Duplicate Title")

        url = reverse("tickets-list")
        data = {
            "title": "Duplicate Title",
            "description": "This is a valid description",
        }

        # When
        response = authenticated_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response_data = response.json()
        assert "A ticket with this title already exists." in response_data["title"]

    def test_list_tickets_success(self, authenticated_client, multiple_tickets):
        """Test successful ticket listing."""
        # Given
        url = reverse("tickets-list")

        # When
        response = authenticated_client.get(url)

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        assert len(response_data) == 3
        titles = [ticket["title"] for ticket in response_data]
        assert "Test Ticket 1" in titles
        assert "Test Ticket 2" in titles
        assert "Test Ticket 3" in titles

    def test_list_tickets_user_isolation(self, authenticated_client):
        """Test user can only see their own tickets."""
        # Given
        user = authenticated_client.user
        other_user = UserFactory()

        # Create tickets for both users
        TicketFactory(user=user, title="My Ticket")
        TicketFactory(user=other_user, title="Other User Ticket")

        url = reverse("tickets-list")

        # When
        response = authenticated_client.get(url)

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        assert len(response_data) == 1
        assert response_data[0]["title"] == "My Ticket"

    def test_retrieve_ticket_success(self, authenticated_client, ticket):
        """Test successful ticket retrieval."""
        # Given
        url = reverse("tickets-detail", kwargs={"pk": ticket._id})

        # When
        response = authenticated_client.get(url)

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        assert response_data["title"] == ticket.title
        assert response_data["description"] == ticket.description
        assert response_data["status"] == ticket.status

    def test_update_ticket_success(self, authenticated_client, ticket):
        """Test successful ticket update."""
        # Given
        url = reverse("tickets-detail", kwargs={"pk": ticket._id})
        data = {"title": "Updated Title", "status": TicketStatus.IN_PROGRESS}

        # When
        response = authenticated_client.patch(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        assert response_data["title"] == "Updated Title"
        assert response_data["status"] == TicketStatus.IN_PROGRESS

        # Verify database was updated
        ticket.refresh_from_db()
        assert ticket.title == "Updated Title"
        assert ticket.status == TicketStatus.IN_PROGRESS

    def test_delete_ticket_success(self, authenticated_client, open_ticket):
        """Test successful ticket deletion."""
        # Given
        url = reverse("tickets-detail", kwargs={"pk": open_ticket._id})

        # When
        response = authenticated_client.delete(url)

        # Then
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify ticket was deleted
        assert not Ticket.objects.filter(_id=open_ticket._id).exists()

    def test_ticket_requires_authentication(self, api_client):
        """Test ticket endpoints require authentication."""
        # Given
        url = reverse("tickets-list")

        # When
        response = api_client.get(url)

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_ticket_different_statuses(
        self, authenticated_client, tickets_with_different_statuses
    ):
        """Test tickets with different statuses."""
        # Given
        url = reverse("tickets-list")

        # When
        response = authenticated_client.get(url)

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        statuses = [ticket["status"] for ticket in response_data]
        assert TicketStatus.OPEN in statuses
        assert TicketStatus.IN_PROGRESS in statuses
        assert TicketStatus.RESOLVED in statuses
        assert TicketStatus.CLOSED in statuses

    def test_cannot_update_ticket_of_another_user(self, authenticated_client):
        other_user = UserFactory()
        ticket = TicketFactory(user=other_user)
        url = reverse("tickets-detail", kwargs={"pk": ticket._id})
        data = {"title": "Hacked!"}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_delete_ticket_of_another_user(self, authenticated_client):
        other_user = UserFactory()
        ticket = TicketFactory(user=other_user)
        url = reverse("tickets-detail", kwargs={"pk": ticket._id})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_nonexistent_ticket_returns_404(self, authenticated_client):
        url = reverse("tickets-detail", kwargs={"pk": uuid.uuid4()})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_ticket_unauthenticated(self, api_client):
        url = reverse("tickets-list")
        data = {"title": "Anon", "description": "Test description"}
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_ticket_with_special_characters(self, authenticated_client):
        url = reverse("tickets-list")
        data = {
            "title": "!@#$%^&*()_+ąęśćżźół",
            "description": "Special characters: ąćęłńóśźż and emoji 🚀🔥",
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()
        assert response_data["title"] == data["title"]
        assert data["description"] in response_data["description"]

    def test_ticket_list_pagination(self, authenticated_client):
        for _ in range(15):
            TicketFactory(user=authenticated_client.user)
        url = reverse("tickets-list")
        response = authenticated_client.get(url, {"limit": 10, "offset": 0})
        if "results" in response.json():
            assert len(response.json()["results"]) == 10
        else:
            assert len(response.json()) == 15

    def test_create_ticket_with_non_open_status_fails(self, authenticated_client):
        """Nie można utworzyć ticketu z innym statusem niż 'open'."""
        url = reverse("tickets-list")
        data = {
            "title": "Test status",
            "description": "Opis dłuższy niż 10 znaków",
            "status": TicketStatus.IN_PROGRESS,
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()
        assert response_data["status"] == TicketStatus.OPEN

    def test_update_ticket_status(self, authenticated_client, ticket):
        """Można zmienić status ticketu przez PATCH."""
        url = reverse("tickets-detail", kwargs={"pk": ticket._id})
        data = {"status": TicketStatus.IN_PROGRESS}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["status"] == TicketStatus.IN_PROGRESS
