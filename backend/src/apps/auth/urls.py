from django.urls import URLPattern, URLResolver, include, path
from rest_framework.routers import DefaultRouter

from apps.auth.views import AuthViewSet

router = DefaultRouter()
router.register(r"", AuthViewSet, basename="auth")

urlpatterns: list[URLPattern | URLResolver] = [
    path("", include(router.urls)),
]
