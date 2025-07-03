import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '@core/services/auth.service';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`,
      },
    });
  }
  return next(req);
};
