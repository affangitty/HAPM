import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from '../../api/api.models';

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ProblemDetails | string | null;
    if (typeof body === 'string' && body.length > 0) {
      return body;
    }
    if (body && typeof body === 'object') {
      if (body.detail) return body.detail;
      if (body.title) return body.title;
      if (body.errors) {
        const first = Object.values(body.errors)[0];
        if (first?.[0]) return first[0];
      }
    }
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 429) return 'Too many attempts. Please wait and try again.';
  }
  return fallback;
}
