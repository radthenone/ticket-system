from django.urls import URLPattern, URLResolver, include, path
from rest_framework.routers import DefaultRouter

from apps.tickets.views import TicketViewSet

router = DefaultRouter()
router.register(r"", TicketViewSet, basename="tickets")

urlpatterns: list[URLPattern | URLResolver] = [
    path("", include(router.urls)),
]
