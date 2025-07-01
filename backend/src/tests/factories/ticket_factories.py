import factory

from apps.tickets.enums import TicketStatus
from apps.tickets.models import Ticket
from tests.factories.user_factories import UserFactory


class TicketFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Ticket

    user = factory.SubFactory(UserFactory)
    title = factory.Faker("sentence", nb_words=4)
    description = factory.Faker("text", max_nb_chars=200)
    status = TicketStatus.OPEN

    class Params:
        resolved = factory.Trait(status=TicketStatus.RESOLVED)
        open = factory.Trait(status=TicketStatus.OPEN)
        in_progress = factory.Trait(status=TicketStatus.IN_PROGRESS)
        closed = factory.Trait(status=TicketStatus.CLOSED)
