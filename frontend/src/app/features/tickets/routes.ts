import { Routes } from '@angular/router';

export const ticketRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/tickets/ticket-list/ticket-list.component').then((m) => m.TicketListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('@features/tickets/ticket-form/ticket-form.component').then((m) => m.TicketFormComponent),
    data: { mode: 'create' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('@features/tickets/ticket-form/ticket-form.component').then((m) => m.TicketFormComponent),
    data: { mode: 'edit' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('@features/tickets/ticket-detail/ticket-detail.component').then((m) => m.TicketDetailComponent),
  },
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
