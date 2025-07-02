import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'create-superuser',
    loadComponent: () =>
      import('@features/auth/create-superuser/create-superuser.component').then((m) => m.CreateSuperuserComponent),
  },
];
