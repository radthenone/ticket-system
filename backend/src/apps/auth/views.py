import logging

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action == "logout":
            self.permission_classes = [IsAuthenticated]
        return [permission() for permission in self.permission_classes]

    @action(detail=False, methods=["post"])
    def create_superuser(self, request):
        email = request.data.get(
            "email", getattr(settings, "DJANGO_SUPERUSER_EMAIL", "admin@admin.com")
        )
        username = request.data.get(
            "username", getattr(settings, "DJANGO_SUPERUSER_USERNAME", "admin")
        )
        password = request.data.get(
            "password", getattr(settings, "DJANGO_SUPERUSER_PASSWORD", "admin")
        )

        if User.objects.filter(username=username, is_superuser=True).exists():
            user = User.objects.get(username=username)
            logger.info("Superuser %s already exists", user.username)
            message = f"Superuser {user.username} already exists"
            status_code = status.HTTP_200_OK
        else:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                is_active=True,
            )
            logger.info("Superuser %s created successfully", user.username)
            message = f"Superuser {user.username} created successfully"
            status_code = status.HTTP_201_CREATED

        token, created = Token.objects.get_or_create(user=user)
        if created:
            logger.info("Token %s created for %s", token.key, user.username)
        logger.info("Returning token %s for superuser %s", token.key, user.username)

        return Response(
            {
                "message": message,
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=status_code,
        )

    @action(detail=False, methods=["post"])
    def login(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        is_auto_login = bool(request.data.get("auto", False))
        if is_auto_login:
            username = getattr(settings, "DJANGO_SUPERUSER_USERNAME", "admin")
            password = getattr(settings, "DJANGO_SUPERUSER_PASSWORD", "admin")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            if created:
                logger.info("Token %s created for %s", token.key, user.username)
            logger.info("Returning token %s for user %s", token.key, user.username)
            return Response(
                {
                    "token": token.key,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                },
                status=status.HTTP_200_OK,
            )
        logger.warning("Login failed for username %s", username)
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    @action(detail=False, methods=["post"])
    def logout(self, request):
        Token.objects.filter(user=request.user).delete()
        logger.info("User %s logged out", request.user.username)
        return Response(status=status.HTTP_204_NO_CONTENT)
