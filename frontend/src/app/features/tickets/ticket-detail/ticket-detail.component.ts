import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { Ticket } from '@core/interfaces';
import { CommonModule } from '@angular/common';
import { ErrorService } from '@app/core/services/error.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
})
export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private router: Router,
    private errorService: ErrorService
  ) {}

  // ERROR HANDLING METHODS

  getGeneralErrors(): string[] {
    return this.errorService.getGeneralErrors();
  }

  // END OF ERROR HANDLING METHODS

  ngOnInit() {
    this.errorService.clearAllErrors();
    const id = this.route.snapshot.params['id'];
    this.loading = true;
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
      },
      error: (error) => {
        this.errorService.addGeneralError("Can't load tickets");
        this.errorService.getServerErrors(error);
        this.loading = false;
      },
    });
  }

  goToEdit() {
    if (this.ticket && this.ticket.id) {
      this.router.navigate(['/tickets', this.ticket.id, 'edit']);
    }
  }

  backToList() {
    this.router.navigate(['/tickets']);
  }
}
