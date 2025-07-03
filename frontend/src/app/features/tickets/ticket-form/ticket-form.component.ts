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
    this.editMode = this.route.snapshot.data['mode'] === 'edit';
    if (this.editMode) {
      const id = this.route.snapshot.params['id'];
      if (id) {
        this.ticketId = id;
        this.loadTicketData();
      }
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
        },
        error: () => {
          this.errorService.addGeneralError("Can't load ticket data");
        },
      });
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

  onSubmit(partial: boolean = false): void {
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
    if (this.editMode && this.ticketId) {
      if (partial) {
        action = this.ticketService.partialUpdateTicket(this.ticketId, ticketData);
      } else {
        action = this.ticketService.updateTicket(this.ticketId, ticketData);
      }
    } else {
      action = this.ticketService.createTicket(ticketData);
    }

    action.subscribe({
      next: () => {
        if (this.editMode && this.ticketId) {
          this.ticketService.notifyTicketChanged({ ...ticketData, id: this.ticketId });
        }
        this.router.navigate(['/tickets']);
      },
      error: (error) => {
        this.errorService.getServerErrors(error, this.ticketForm);
      },
    });
  }

  backToList() {
    this.router.navigate(['/tickets']);
  }
}
