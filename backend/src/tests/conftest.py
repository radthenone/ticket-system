# conftest.py w root projektu
import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.tickets.enums import TicketStatus
from tests.factories import TicketFactory, UserFactory


@pytest.fixture
def api_client():
    """API client for testing"""
    return APIClient()


@pytest.fixture
def user():
    """Create test user using factory"""
    return UserFactory()


@pytest.fixture
def admin_user():
    """Create admin user using factory"""
    return UserFactory(
        username="admin", email="admin@example.com", is_superuser=True, is_staff=True
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """API client with authenticated user"""
    token, created = Token.objects.get_or_create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    api_client.user = user
    return api_client


@pytest.fixture
def ticket(user):
    """Create test ticket using factory"""
    return TicketFactory(
        user=user,
        title="Test Ticket",
        description="This is a test ticket description",
        status=TicketStatus.OPEN,
    )


@pytest.fixture
def multiple_tickets(user):
    """Create multiple test tickets using factory"""
    tickets = []
    for i in range(3):
        status = TicketStatus.OPEN if i % 2 == 0 else TicketStatus.IN_PROGRESS
        ticket = TicketFactory(
            user=user,
            title=f"Test Ticket {i + 1}",
            description=f"This is test ticket {i + 1} description",
            status=status,
        )
        tickets.append(ticket)
    return tickets


# Dodatkowe fixtures używające traits
@pytest.fixture
def open_ticket(user):
    """Create ticket with OPEN status"""
    return TicketFactory(user=user, open=True)


@pytest.fixture
def in_progress_ticket(user):
    """Create ticket with IN_PROGRESS status"""
    return TicketFactory(user=user, in_progress=True)


@pytest.fixture
def resolved_ticket(user):
    """Create ticket with RESOLVED status"""
    return TicketFactory(user=user, resolved=True)


@pytest.fixture
def closed_ticket(user):
    """Create ticket with CLOSED status"""
    return TicketFactory(user=user, closed=True)


@pytest.fixture
def tickets_with_different_statuses(user):
    """Create tickets with all possible statuses"""
    return [
        TicketFactory(user=user, open=True),
        TicketFactory(user=user, in_progress=True),
        TicketFactory(user=user, resolved=True),
        TicketFactory(user=user, closed=True),
    ]


@pytest.fixture
def multiple_users_with_tickets():
    """Create multiple users each with their own tickets"""
    users_tickets = []
    for i in range(3):
        user = UserFactory(username=f"user{i}")
        tickets = TicketFactory.create_batch(2, user=user)
        users_tickets.append({"user": user, "tickets": tickets})
    return users_tickets


@pytest.fixture
def batch_tickets():
    """Create batch of tickets for performance testing"""
    return TicketFactory.create_batch(10)
