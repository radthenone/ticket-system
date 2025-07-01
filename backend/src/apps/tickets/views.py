import logging

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.tickets.models import Ticket
from apps.tickets.serializers import TicketSerializer

# Create your views here.

logger = logging.getLogger(__name__)


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user)

    def get_serializer(self, *args, **kwargs):
        serializer_class = self.get_serializer_class()
        kwargs.setdefault('context', self.get_serializer_context())
        serializer = serializer_class(*args, **kwargs)
        request = self.request
        if request and request.method == 'POST':
            serializer.fields['status'].read_only = True
        return serializer
