import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  const token = auth.getAccessToken();
  if (!token) {
    return router.createUrlTree(['/auth/login']);
  }

  return auth.loadCurrentUser().pipe(
    map((user) => (user ? true : router.createUrlTree(['/auth/login']))),
  );
};

export const guestGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (state.url.includes('/auth/reset-password')) {
    return true;
  }

  return router.createUrlTree([auth.getHomeRoute()]);
};
