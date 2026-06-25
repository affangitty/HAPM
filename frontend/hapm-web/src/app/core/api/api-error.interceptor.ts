import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { ApiErrorService } from './api-error.service';
import { AuthService } from '../auth/auth.service';
import { extractAllApiErrorMessages } from '../auth/utils/api-error.util';

let refreshInFlight: ReturnType<AuthService['refreshToken']> | null = null;

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

function shouldToastMutationError(req: { url: string; method: string }, status: number): boolean {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return false;
  if (AUTH_ROUTES.some((r) => req.url.includes(r))) return false;
  return status === 400 || status === 409 || status === 422;
}

/**
 * HTTP error strategy:
 * - 401 → refresh token once, retry request
 * - 403 / 5xx / network → toast
 * - 400 / 409 on mutations → toast all validation/conflict messages
 * - errors rethrown so pages can still update local state
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const errors = inject(ApiErrorService);

  const isAuthRoute = AUTH_ROUTES.some((r) => req.url.includes(r));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRoute) {
        if (!refreshInFlight) {
          refreshInFlight = auth.refreshToken();
        }

        return refreshInFlight.pipe(
          switchMap((refreshed) => {
            refreshInFlight = null;
            if (!refreshed) {
              void router.navigate(['/auth/login']);
              return throwError(() => error);
            }
            const token = auth.getAccessToken();
            return next(
              req.clone({
                setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
              }),
            );
          }),
          catchError((retryError) => {
            refreshInFlight = null;
            void router.navigate(['/auth/login']);
            return throwError(() => retryError);
          }),
        );
      }

      if (error.status === 403) {
        const msgs = extractAllApiErrorMessages(error, 'You do not have permission to perform this action.');
        errors.show(msgs[0], 'warning');
      } else if (error.status >= 500) {
        const msgs = extractAllApiErrorMessages(error, 'A server error occurred. Please try again.');
        errors.show(msgs[0], 'error');
      } else if (error.status === 0) {
        errors.show('Network error. Check your connection and try again.', 'error');
      } else if (shouldToastMutationError(req, error.status)) {
        errors.showFromError(error);
      }

      return throwError(() => error);
    }),
  );
};
