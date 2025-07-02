import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

export const authGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const isLoggedIn = authService.isLoggedIn();
  const router = inject(Router);

  if (!isLoggedIn) {
    console.log('AuthGuard: User is not logged in');
    router.navigate(['/auth/login']);
    return false;
  }

  console.log('AuthGuard: User is logged in');
  return true;
};
