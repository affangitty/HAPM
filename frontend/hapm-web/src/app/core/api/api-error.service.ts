import { Injectable, signal } from '@angular/core';

export type ApiToastTone = 'error' | 'warning' | 'info' | 'success';

export interface ApiToast {
  id: number;
  message: string;
  tone: ApiToastTone;
}

/**
 * Global API error / notification surface.
 * Components subscribe via `toasts()` or call `show()` from interceptors and pages.
 */
@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private seq = 0;
  readonly toasts = signal<ApiToast[]>([]);

  show(message: string, tone: ApiToastTone = 'error', durationMs = 5000): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, message, tone }]);
    if (durationMs > 0) {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
