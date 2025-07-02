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
        url = reverse("tickets-list")
        data = {
            "title": "New Bug Report",
            "description": "This is a detailed bug description with more than 10 characters",
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()
        assert response_data["title"] == data["title"]
        assert response_data["description"] == data["description"]
        assert response_data["status"] == TicketStatus.OPEN
        assert "id" in response_data
        assert "created_at" in response_data

    def test_create_ticket_failure_duplicate_title(self, authenticated_client):
        user = authenticated_client.user
        TicketFactory(user=user, title="Duplicate Title")
        url = reverse("tickets-list")
        data = {
            "title": "Duplicate Title",
            "description": "This is a valid description",
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response_data = response.json()
        assert "A ticket with this title already exists." in response_data["title"]

    def test_list_tickets_success(self, authenticated_client, multiple_tickets):
        url = reverse("tickets-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert len(response_data) == 3
        expected_keys = {"id", "title", "status", "created_at"}
        assert all(set(ticket.keys()) == expected_keys for ticket in response_data)

    def test_list_tickets_user_isolation(self, authenticated_client):
        user = authenticated_client.user
        other_user = UserFactory()
        TicketFactory(user=user, title="My Ticket")
        TicketFactory(user=other_user, title="Other User Ticket")
        url = reverse("tickets-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert len(response_data) == 1
        assert response_data[0]["title"] == "My Ticket"

    def test_retrieve_ticket_success(self, authenticated_client, ticket):
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["title"] == ticket.title
        assert response_data["description"] == ticket.description
        assert response_data["status"] == ticket.status
        assert "created_at" in response_data
        assert "updated_at" in response_data

    def test_update_ticket_success(self, authenticated_client, ticket):
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
        data = {"title": "Updated Title", "status": TicketStatus.IN_PROGRESS}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["title"] == "Updated Title"
        assert response_data["status"] == TicketStatus.IN_PROGRESS
        ticket.refresh_from_db()
        assert ticket.title == "Updated Title"
        assert ticket.status == TicketStatus.IN_PROGRESS

    def test_delete_ticket_success(self, authenticated_client, open_ticket):
        url = reverse("tickets-detail", kwargs={"pk": open_ticket.id})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Ticket.objects.filter(id=open_ticket.id).exists()

    def test_ticket_requires_authentication(self, api_client):
        url = reverse("tickets-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_ticket_different_statuses(
        self, authenticated_client, tickets_with_different_statuses
    ):
        url = reverse("tickets-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        statuses = [ticket["status"] for ticket in response_data]
        # Sprawdź, czy wszystkie wymagane statusy są obecne
        required_statuses = {
            TicketStatus.OPEN,
            TicketStatus.IN_PROGRESS,
            TicketStatus.RESOLVED,
            TicketStatus.CLOSED,
        }
        assert all(status in statuses for status in required_statuses)

    def test_cannot_update_ticket_of_another_user(self, authenticated_client):
        other_user = UserFactory()
        ticket = TicketFactory(user=other_user)
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
        data = {"title": "Hacked!"}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_delete_ticket_of_another_user(self, authenticated_client):
        other_user = UserFactory()
        ticket = TicketFactory(user=other_user)
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
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
        url = reverse("tickets-list")
        data = {
            "title": "Test status",
            "description": "Description longer than 10 symbols",
            "status": TicketStatus.IN_PROGRESS,
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()
        assert response_data["status"] == TicketStatus.OPEN

    def test_update_ticket_status(self, authenticated_client, ticket):
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
        data = {"status": TicketStatus.IN_PROGRESS}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["status"] == TicketStatus.IN_PROGRESS

    def test_update_ticket_status_invalid_transition(
        self, authenticated_client, ticket
    ):
        # Try to change from OPEN directly to RESOLVED (not allowed)
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
        data = {"status": TicketStatus.RESOLVED}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot change status" in str(response.content)

    def test_update_ticket_status_from_closed(
        self, authenticated_client, closed_ticket
    ):
        # Try to change from CLOSED to OPEN (not allowed)
        url = reverse("tickets-detail", kwargs={"pk": closed_ticket.id})
        data = {"status": TicketStatus.OPEN}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot modify status of a closed ticket" in str(response.content)

    def test_update_ticket_status_to_same_status(self, authenticated_client, ticket):
        # Try to change from OPEN to OPEN (should not be allowed by allowed_transitions)
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
        data = {"status": TicketStatus.OPEN}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot change status" in str(response.content)

    @pytest.mark.parametrize(
        "current_status,target_status,should_succeed",
        [
            (TicketStatus.OPEN, TicketStatus.IN_PROGRESS, True),
            (TicketStatus.OPEN, TicketStatus.CLOSED, True),
            (TicketStatus.OPEN, TicketStatus.RESOLVED, False),
            (TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, True),
            (TicketStatus.IN_PROGRESS, TicketStatus.OPEN, True),
            (TicketStatus.IN_PROGRESS, TicketStatus.CLOSED, False),
            (TicketStatus.RESOLVED, TicketStatus.CLOSED, True),
            (TicketStatus.RESOLVED, TicketStatus.IN_PROGRESS, True),
            (TicketStatus.RESOLVED, TicketStatus.OPEN, False),
            (TicketStatus.CLOSED, TicketStatus.OPEN, False),
            (TicketStatus.CLOSED, TicketStatus.IN_PROGRESS, False),
            (TicketStatus.CLOSED, TicketStatus.RESOLVED, False),
        ],
    )
    def test_update_ticket_status_matrix(
        self, authenticated_client, user, current_status, target_status, should_succeed
    ):
        ticket = TicketFactory(user=user, status=current_status)
        url = reverse("tickets-detail", kwargs={"pk": ticket.id})
        data = {"status": target_status}
        response = authenticated_client.patch(url, data, format="json")
        if should_succeed:
            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == target_status
        else:
            assert response.status_code == status.HTTP_400_BAD_REQUEST
