import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { ErrorService } from '@core/services/error.service';
import { TicketStatus } from '@core/enums';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

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
  ticketId: number | null = null;
  error: string | null = null;
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
      status: [TicketStatus.OPEN, Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.editMode = data['mode'] === 'edit';
    });

    if (this.editMode) {
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.ticketId = +params['id'];
          this.loadTicketData();
        }
      });
    }
  }

  private loadTicketData(): void {
    if (this.ticketId) {
      this.ticketService.getTicket(this.ticketId).subscribe({
        next: (ticket) => {
          this.ticketForm.patchValue(ticket);
        },
        error: (err) => {
          this.error = "Can't load ticket data";
          this.errorService.handleServerErrors(this.ticketForm, err);
        }
      });
    }
  }

  getFieldError(field: string) {
    return this.errorService.getFieldError(field);
  }

  get otherErrors() {
    return this.errorService.getFormErrors(this.ticketForm);
  }

  submit(): void {
    if (this.ticketForm.invalid) {
      this.error = 'Please fill all required fields correctly';
      return;
    }

    this.submitted = true;
    const ticketData = this.ticketForm.value;

    const action = this.editMode && this.ticketId
      ? this.ticketService.updateTicket(this.ticketId, ticketData)
      : this.ticketService.createTicket(ticketData);

    action.subscribe({
      next: () => {
        this.submitted = false;
        this.router.navigate(['/tickets']);
      },
      error: (err) => {
        this.submitted = false;
        this.errorService.handleServerErrors(this.ticketForm, err);
      }
    });
  }

  backToList() {
    this.router.navigate(['/tickets']);
  }
}
