import uuid

from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator
from django.db import models

from apps.tickets.enums import TicketStatus
from utils import TimestampedModel

# Create your models here.


class Ticket(TimestampedModel):
    """Model representing a support ticket in the system."""

    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, db_column="id"
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tickets")
    title = models.CharField(max_length=30, validators=[MinLengthValidator(3)])
    description = models.TextField(max_length=500, validators=[MinLengthValidator(10)])
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN,
    )

    def __str__(self):
        return f"Ticket {self.id} - {self.title}"

    class Meta:
        db_table = "tickets"
        verbose_name = "ticket"
        verbose_name_plural = "tickets"
