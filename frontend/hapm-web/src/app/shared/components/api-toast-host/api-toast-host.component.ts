import { Component, inject } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';

@Component({
  selector: 'app-api-toast-host',
  standalone: true,
  template: `
  <div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2" aria-live="polite" aria-atomic="true">
    @for (toast of errorService.toasts(); track toast.id) {
      <div
        role="alert"
        class="pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg"
        [class]="toneClass(toast.tone)"
      >
        <div class="flex items-start justify-between gap-3">
          <p>{{ toast.message }}</p>
          <button
            type="button"
            class="shrink-0 text-xs underline opacity-80"
            (click)="errorService.dismiss(toast.id)"
            aria-label="Dismiss notification"
          >Dismiss</button>
        </div>
      </div>
    }
  </div>
  `,
})
export class ApiToastHostComponent {
  readonly errorService = inject(ApiErrorService);

  toneClass(tone: string): string {
    switch (tone) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-900';
      case 'info':
        return 'border-sky-200 bg-sky-50 text-sky-900';
      default:
        return 'border-red-200 bg-red-50 text-red-900';
    }
  }
}
