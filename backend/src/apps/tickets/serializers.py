from rest_framework import serializers

from apps.tickets.models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for the Ticket model."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Ticket
        fields = [
            "_id",
            "title",
            "description",
            "status",
            "user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["_id", "created_at", "updated_at", "user"]

    def validate_title(self, value):
        """Ensure the title is at least 3 characters long."""
        if len(value) < 3:
            raise serializers.ValidationError(
                "Title must be at least 3 characters long."
            )
        user = self.context["request"].user
        if Ticket.objects.filter(title=value, user=user).exists():
            raise serializers.ValidationError(
                "A ticket with this title already exists."
            )
        return value

    def validate_description(self, value):
        """Ensure the description is at least 10 characters long."""
        if len(value) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long."
            )
        return value
