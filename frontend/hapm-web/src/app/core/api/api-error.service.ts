import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { extractAllApiErrorMessages } from '../auth/utils/api-error.util';

export type ApiToastTone = 'error' | 'warning' | 'info' | 'success';

export interface ApiToast {
  id: number;
  message: string;
  items?: string[];
  tone: ApiToastTone;
}

/**
 * Global toast surface for validation feedback, API errors, and success messages.
 */
@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private seq = 0;
  readonly toasts = signal<ApiToast[]>([]);

  show(message: string, tone: ApiToastTone = 'error', durationMs = 6000): void {
    this.push({ message, tone }, durationMs);
  }

  showSuccess(message: string, durationMs = 4000): void {
    this.show(message, 'success', durationMs);
  }

  showWarning(message: string, durationMs = 6000): void {
    this.show(message, 'warning', durationMs);
  }

  showWithItems(message: string, items: string[], tone: ApiToastTone = 'error', durationMs = 8000): void {
    if (!items.length) return;
    if (items.length === 1) {
      this.show(items[0], tone, durationMs);
      return;
    }
    this.push({ message, items, tone }, durationMs);
  }

  showFromError(error: unknown, fallback = 'Something went wrong.'): void {
    const messages = extractAllApiErrorMessages(error, fallback);
    if (!messages.length) return;

    const tone: ApiToastTone =
      error instanceof HttpErrorResponse && error.status === 409 ? 'warning' : 'error';

    if (messages.length === 1) {
      this.show(messages[0], tone);
    } else {
      this.showWithItems('Please fix the following:', messages, tone);
    }
  }

  showFormValidation(items: string[]): void {
    if (!items.length) {
      this.showWarning('Please complete all required fields.');
      return;
    }
    if (items.length === 1) {
      this.showWarning(items[0]);
    } else {
      this.showWithItems('Please correct the form:', items, 'warning');
    }
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }

  private push(toast: Omit<ApiToast, 'id'>, durationMs: number): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, ...toast }]);
    if (durationMs > 0) {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
