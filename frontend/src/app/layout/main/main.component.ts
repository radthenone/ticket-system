import { Component, Output, EventEmitter } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardComponent } from '@app/shared/dashboard/dashboard.component';
import { TicketListComponent } from '@app/features/tickets/ticket-list/ticket-list.component';
import { Ticket } from '@app/core/interfaces/ticket.interface';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent {}
