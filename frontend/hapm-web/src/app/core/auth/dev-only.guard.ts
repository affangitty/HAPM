import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/** Blocks routes that should only exist in non-production builds (e.g. open patient self-registration). */
export const devOnlyGuard: CanActivateFn = () => {
  if (!environment.production) return true;
  return inject(Router).createUrlTree(['/auth/login']);
};
