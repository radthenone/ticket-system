from django.contrib import admin

from apps.tickets.models import Ticket


# Register your models here.
@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Ticket._meta.get_fields()]
