import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { Ticket } from '@core/interfaces/ticket.interface';
import { ErrorService } from '@core/services/error.service';
import { TicketStatus } from '@core/enums';
import { first, Subscription } from 'rxjs';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
})
export class TicketListComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  isLoading = false;
  hasLoaded = false;
  subscription: Subscription | null = null;
  ticketStatusChangedMessage: string | null = null;

  constructor(
    private ticketService: TicketService,
    private router: Router,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.errorService.clearAllErrors();
    this.loadTickets();
    // Listen for ticket status changes
    this.subscription = this.ticketService.ticketChanged$.pipe(first()).subscribe((ticket) => {
      console.log('Ticket status change detected:', ticket);
      if (ticket && ticket.status) {
        this.ticketStatusChangedMessage = `Ticket "${ticket.title}" status changed to ${ticket.status}`;
        setTimeout(() => {
          this.ticketStatusChangedMessage = null;
          this.ticketService.resetNotifyTicketChanged();
        }, 10000); // Clear message after 10 seconds
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // ERROR HANDLING METHODS

  getGeneralErrors(): string[] {
    return this.errorService.getGeneralErrors();
  }

  // END OF ERROR HANDLING METHODS

  loadTickets(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorService.clearAllErrors();

    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.isLoading = false;
        this.hasLoaded = true;
        this.tickets = tickets;

        if (tickets.length === 0) {
          this.errorService.addGeneralError('You must first create ticket');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasLoaded = false;
        this.errorService.getServerErrors(error);
      },
    });
  }

  viewTicketDetails(ticket: Ticket): void {
    if (ticket.id) {
      this.router.navigate(['/tickets', ticket.id]);
    }
  }

  createTicket(): void {
    this.router.navigate(['/tickets/new']);
  }

  editTicket(ticket: Ticket): void {
    if (ticket.id) {
      this.router.navigate(['/tickets', ticket.id, 'edit']);
    }
  }

  deleteTicket(ticket: Ticket): void {
    if (!ticket.id) {
      return;
    }

    // Check if ticket is closed - prevent deletion
    if (ticket.status === TicketStatus.CLOSED) {
      this.errorService.addGeneralError("You can't delete closed tickets");
      return;
    }

    if (confirm('Are you sure you want to delete this ticket?')) {
      this.ticketService.deleteTicket(ticket.id).subscribe({
        next: () => {
          console.log('Ticket deleted successfully');
          // Usuń ticket z lokalnej listy zamiast przeładowywać wszystkie
          this.tickets = this.tickets.filter((t) => t.id !== ticket.id);

          // Jeśli lista jest pusta, pokaż odpowiedni komunikat
          if (this.tickets.length === 0) {
            this.errorService.addGeneralError('You must first create ticket');
          }
        },
        error: (error) => {
          this.errorService.getServerErrors(error);
          console.error('Error deleting ticket:', error);
        },
      });
    }
  }
}
