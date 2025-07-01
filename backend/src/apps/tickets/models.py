import uuid

from django.contrib.auth.models import User
from django.db import models

from apps.tickets.enums import TicketStatus
from utils import TimestampedModel

# Create your models here.


class Ticket(TimestampedModel):
    """Model representing a support ticket in the system."""

    _id = models.AutoField(primary_key=True, db_column="id", default=uuid.uuid4)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tickets")
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN,
    )

    def __str__(self):
        return self.title

    class Meta:
        db_table = "tickets"
        verbose_name = "ticket"
        verbose_name_plural = "tickets"
