import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from '../../api/api.models';

function humanizeField(field: string): string {
  const cleaned = field.replace(/\$/g, '').replace(/\./g, ' ');
  return cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function messagesFromProblem(body: ProblemDetails): string[] {
  if (body.errors) {
    return Object.entries(body.errors).flatMap(([field, msgs]) =>
      msgs.map((m) => {
        const label = humanizeField(field);
        return msgs.length === 1 && field.toLowerCase() in { email: 1, password: 1 }
          ? m
          : `${label}: ${m}`;
      }),
    );
  }
  if (body.detail) return [body.detail];
  if (body.title) return [body.title];
  return [];
}

export function extractAllApiErrorMessages(error: unknown, fallback?: string): string[] {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ProblemDetails | string | null;
    if (typeof body === 'string' && body.length > 0) return [body];
    if (body && typeof body === 'object') {
      const fromProblem = messagesFromProblem(body);
      if (fromProblem.length) return fromProblem;
    }
    if (error.status === 401) return ['Invalid email or password.'];
    if (error.status === 403) return ['You do not have permission to perform this action.'];
    if (error.status === 429) return ['Too many attempts. Please wait and try again.'];
    if (error.status === 0) return ['Network error. Check your connection and try again.'];
  }
  return fallback ? [fallback] : [];
}

/** First API error message, or fallback. */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  return extractAllApiErrorMessages(error, fallback)[0] ?? fallback;
}
