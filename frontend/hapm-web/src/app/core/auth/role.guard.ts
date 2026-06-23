import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './auth.models';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed = (route.data['roles'] as UserRole[] | undefined) ?? [];
  if (allowed.length === 0) {
    return true;
  }

  if (auth.hasRole(...allowed)) {
    return true;
  }

  return router.createUrlTree(['/errors/unauthorized']);
};
