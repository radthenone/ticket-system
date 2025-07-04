import { ErrorService } from '@core/services/error.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { TicketStatus } from '@core/enums';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { Ticket } from '@app/core/interfaces';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.css',
})
export class TicketFormComponent implements OnInit {
  ticketForm: FormGroup;
  editMode = false;
  ticketId: string | null = null;
  submitted = false;
  ticketStatuses = Object.values(TicketStatus);
  private originalStatus: TicketStatus | null = null;
  availableStatuses: TicketStatus[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private errorService: ErrorService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: [TicketStatus.OPEN, Validators.required],
    });
  }

  ngOnInit(): void {
    this.errorService.clearAllErrors();
    this.editMode = this.route.snapshot.data['mode'] === 'edit';
    if (this.editMode) {
      const id = this.route.snapshot.params['id'];
      if (id) {
        this.ticketId = id;
        this.loadTicketData();
      }
    } else {
      this.availableStatuses = [TicketStatus.OPEN];
    }
  }

  private loadTicketData(useSetValue: boolean = false): void {
    console.log('loadTicketData called, ticketId:', this.ticketId);
    if (this.ticketId) {
      this.ticketService.getTicket(this.ticketId).subscribe({
        next: (ticket) => {
          console.log('Loaded ticket from backend:', ticket);
          const formData = {
            title: ticket?.title || '',
            description: ticket?.description || '',
            status: ticket?.status || TicketStatus.OPEN,
          };
          if (useSetValue) {
            this.ticketForm.setValue(formData);
          } else {
            this.ticketForm.patchValue(formData);
          }
          console.log('Form value after patch/set:', this.ticketForm.value);
          this.ticketForm.markAsPristine();
          this.originalStatus = ticket?.status || TicketStatus.OPEN;
          this.updateAvailableStatuses(this.originalStatus);
        },
        error: () => {
          this.errorService.addGeneralError("Can't load ticket data");
        },
      });
    }
  }

  private updateAvailableStatuses(currentStatus: TicketStatus): void {
    const allowedTransitions: { [key in TicketStatus]: TicketStatus[] } = {
      [TicketStatus.OPEN]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.OPEN],
      [TicketStatus.RESOLVED]: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      [TicketStatus.CLOSED]: [TicketStatus.CLOSED], // Closed tickets cannot be modified
    };

    this.availableStatuses = allowedTransitions[currentStatus] || [currentStatus];

    // Disable form if ticket is closed
    if (currentStatus === TicketStatus.CLOSED) {
      this.ticketForm.disable();
    }
  }

  // ERROR HANDLING METHODS

  isFieldInvalid(field: string): boolean {
    return this.errorService.isFieldInvalid(field, this.submitted);
  }

  isFieldValid(field: string): boolean {
    return this.errorService.isFieldValid(field, this.submitted);
  }

  getFieldErrors(field: string): string[] | null {
    return this.errorService.getFieldErrors(field);
  }

  getGeneralErrors(): string[] {
    return this.errorService.getGeneralErrors();
  }

  // END OF ERROR HANDLING METHODS

  onSubmit(): void {
    this.submitted = true;
    this.errorService.clearAllErrors();
    this.errorService.getClientErrors(this.ticketForm);

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      this.errorService.addGeneralError('Please fill all required fields correctly');
      return;
    }

    const ticketData = this.ticketForm.value;

    let action: Observable<Ticket>;
    const prevStatus = this.originalStatus;
    const newStatus = ticketData.status;
    this.loading = true;
    if (this.editMode && this.ticketId) {
      if (this.ticketForm.dirty) {
        action = this.ticketService.partialUpdateTicket(this.ticketId, ticketData);
      } else {
        action = this.ticketService.updateTicket(this.ticketId, ticketData);
      }
    } else {
      // For creating new tickets, don't send status (backend sets it to OPEN by default)
      const createData = {
        title: ticketData.title,
        description: ticketData.description
      };
      action = this.ticketService.createTicket(createData);
    }

    action.subscribe({
      next: (updatedTicket) => {
        if (this.editMode && prevStatus !== undefined && prevStatus !== null && prevStatus !== newStatus) {
          this.ticketService.notifyTicketChanged(updatedTicket);
        }
        this.loading = false;
        this.router.navigate(['/tickets']);
      },
      error: (error) => {
        this.loading = false;
        this.errorService.getServerErrors(error, this.ticketForm);
      },
    });
  }

  backToList() {
    this.router.navigate(['/tickets']);
  }

  get isTicketClosed(): boolean {
    return this.originalStatus === TicketStatus.CLOSED;
  }
}
