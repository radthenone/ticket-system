import logging

from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import ValidationError

from apps.tickets.enums import TicketStatus
from apps.tickets.models import Ticket
from apps.tickets.serializers import (
    TicketCreateSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
    TicketUpdateSerializer,
)

# Create your views here.

logger = logging.getLogger(__name__)


class TicketViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user).order_by("-created_at")

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return TicketListSerializer
        elif self.action == "create":
            return TicketCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return TicketUpdateSerializer
        else:
            return TicketDetailSerializer

    def perform_destroy(self, instance):
        if instance.status == TicketStatus.CLOSED:
            raise ValidationError(detail="You can't delete closed ticket", code=400)
        instance.delete()
