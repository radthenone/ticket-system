import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { Ticket } from '@core/interfaces/ticket.interface';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = true;
  error: string | null = null;
  private hasLoaded = false;

  constructor(
    private ticketService: TicketService,
    private router: Router,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    if (!this.hasLoaded) {
      this.loadTickets();
      this.hasLoaded = true;
    }
  }

  loadTickets(): void {
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorService.handleError(error);
        console.error('Error loading tickets:', error);
        this.isLoading = false;
        this.error = error.message;
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
    if (ticket.id) {
      if (confirm('Are you sure you want to delete this ticket?')) {
        this.ticketService.deleteTicket(ticket.id).subscribe({
          next: () => {
            console.log('Ticket deleted successfully');
            this.loadTickets();
          },
          error: (error) => {
            console.error('Error deleting ticket:', error);
            alert('An error occurred while deleting the ticket.');
          },
        });
      }
    }
  }
}
