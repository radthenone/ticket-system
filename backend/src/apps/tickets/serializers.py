from rest_framework import serializers

from apps.tickets.enums import TicketStatus
from apps.tickets.models import Ticket


class TicketListSerializer(serializers.ModelSerializer):
    """Serializer for listing tickets - minimal fields"""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Ticket
        fields = [
            "id",
            "user",
            "title",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]


class TicketDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed ticket view"""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Ticket
        fields = [
            "id",
            "user",
            "title",
            "description",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class TicketCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new tickets"""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Ticket
        fields = [
            "id",
            "user",
            "title",
            "description",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "user", "status", "created_at"]

    def validate_title(self, value):
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
        if len(value) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long."
            )
        return value


class TicketUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tickets"""

    class Meta:
        model = Ticket
        fields = ["title", "description", "status", "updated_at"]
        read_only_fields = ["updated_at"]

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError(
                "Title must be at least 3 characters long."
            )
        queryset = Ticket.objects.filter(title=value, user=self.context["request"].user)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "A ticket with this title already exists."
            )
        return value

    def validate_description(self, value):
        if len(value) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long."
            )
        return value

    def validate_status(self, value):
        if not self.instance:
            return value
        current_status = self.instance.status
        allowed_transitions = {
            TicketStatus.OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
            TicketStatus.IN_PROGRESS: [TicketStatus.RESOLVED, TicketStatus.OPEN],
            TicketStatus.RESOLVED: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
            TicketStatus.CLOSED: [],
        }
        if current_status == TicketStatus.CLOSED:
            raise serializers.ValidationError(
                "Cannot modify status of a closed ticket."
            )
        if value not in allowed_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot change status from {current_status} to {value}."
            )
        return value
