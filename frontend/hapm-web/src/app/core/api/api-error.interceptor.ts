import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { ApiErrorService } from './api-error.service';
import { AuthService } from '../auth/auth.service';
import { extractApiErrorMessage } from '../auth/utils/api-error.util';

let refreshInFlight: ReturnType<AuthService['refreshToken']> | null = null;

/**
 * HTTP error strategy:
 * - 401 on protected routes → refresh token once, retry request
 * - refresh failure → clear session, redirect login
 * - 403 → toast + optional unauthorized redirect for admin-only resources
 * - 5xx / network → user-facing toast via ApiErrorService
 * - 4xx validation → rethrow for page-level handling (forms)
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const errors = inject(ApiErrorService);

  const isAuthRoute =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');

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
        errors.show(extractApiErrorMessage(error, 'You do not have permission to perform this action.'), 'warning');
      } else if (error.status >= 500) {
        errors.show(extractApiErrorMessage(error, 'A server error occurred. Please try again.'), 'error');
      } else if (error.status === 0) {
        errors.show('Network error. Check your connection and try again.', 'error');
      }

      return throwError(() => error);
    }),
  );
};
