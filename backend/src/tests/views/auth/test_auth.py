import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token

from tests.factories import UserFactory


@pytest.mark.django_db
class TestAuthViewSet:
    def test_create_superuser_success_new_user(self, api_client):
        """Test successful creation of new superuser."""
        # Given
        url = reverse("auth-create-superuser")
        data = {
            "username": "newadmin",
            "email": "newadmin@example.com",
            "password": "newpassword123",
        }

        # When
        response = api_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()

        assert "token" in response_data
        assert "user" in response_data
        assert response_data["message"] == "Superuser newadmin created successfully"
        assert response_data["user"]["username"] == "newadmin"
        assert response_data["user"]["email"] == "newadmin@example.com"

        # Verify user was created in database
        user = User.objects.get(username="newadmin")
        assert user.is_superuser is True
        assert user.is_staff is True
        assert user.is_active is True

        # Verify token was created
        token = Token.objects.get(user=user)
        assert token.key == response_data["token"]

    def test_create_superuser_success_existing_user(self, api_client):
        """Test successful response for existing superuser."""
        # Given
        existing_user = UserFactory(
            username="admin",
            email="admin@example.com",
            is_superuser=True,
            is_staff=True,
        )
        Token.objects.create(user=existing_user)

        url = reverse("auth-create-superuser")
        data = {
            "username": "admin",
            "email": "admin@example.com",
            "password": "password123",
        }

        # When
        response = api_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        assert response_data["message"] == "Superuser admin already exists"
        assert response_data["user"]["username"] == "admin"

    def test_login_success_with_credentials(self, api_client):
        """Test successful login with provided credentials."""
        # Given
        user = UserFactory(username="testuser")
        user.set_password("testpass123")
        user.save()

        url = reverse("auth-login")
        data = {"username": "testuser", "password": "testpass123"}

        # When
        response = api_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        assert "token" in response_data
        assert "user" in response_data
        assert response_data["user"]["username"] == "testuser"

        # Verify token was created
        token = Token.objects.get(user=user)
        assert token.key == response_data["token"]

    def test_login_success_auto_login(self, api_client, settings):
        """Test successful auto login using settings."""
        # Given
        settings.DJANGO_SUPERUSER_USERNAME = "admin"
        settings.DJANGO_SUPERUSER_PASSWORD = "adminpass"

        admin_user = UserFactory(username="admin")
        admin_user.set_password("adminpass")
        admin_user.save()

        url = reverse("auth-login")
        data = {"auto": True}

        # When
        response = api_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()

        assert response_data["user"]["username"] == "admin"

    def test_login_failure_invalid_credentials(self, api_client):
        """Test login failure with invalid credentials."""
        # Given
        url = reverse("auth-login")
        data = {"username": "nonexistent", "password": "wrongpass"}

        # When
        response = api_client.post(url, data, format="json")

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        response_data = response.json()
        assert response_data["error"] == "Invalid username or password"

    def test_logout_success(self, authenticated_client):
        """Test successful logout."""
        # Given
        url = reverse("auth-logout")
        user = authenticated_client.user

        # Verify token exists before logout
        assert Token.objects.filter(user=user).exists()

        # When
        response = authenticated_client.post(url)

        # Then
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify token was deleted
        assert not Token.objects.filter(user=user).exists()

    def test_logout_requires_authentication(self, api_client):
        """Test logout requires authentication."""
        # Given
        url = reverse("auth-logout")

        # When
        response = api_client.post(url)

        # Then
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
