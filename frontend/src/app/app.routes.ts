import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/routes').then((m) => m.authRoutes),
  },
  {
    path: 'tickets',
    loadChildren: () => import('@features/tickets/routes').then((m) => m.ticketRoutes),
    canActivate: [authGuard],
  },
  {
    path: '404',
    loadComponent: () => import('@shared/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
  {
    path: '**',
    redirectTo: '404',
  },
];
