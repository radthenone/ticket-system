from django.db import models


class TicketStatus(models.TextChoices):
    OPEN = "open", "Open"
    IN_PROGRESS = "in_progress", "In Progress"
    RESOLVED = "resolved", "Resolved"
    CLOSED = "closed", "Closed"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]
