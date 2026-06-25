import { Component, inject } from '@angular/core';
import { ApiErrorService, ApiToastTone } from '../../../core/api/api-error.service';

@Component({
  selector: 'app-api-toast-host',
  standalone: true,
  template: `
    <div
      class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-md flex-col gap-2 px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of errorService.toasts(); track toast.id) {
        <div
          role="alert"
          class="pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm"
          [class]="toneClass(toast.tone)"
        >
          <div class="flex items-start gap-3">
            <span class="mt-0.5 shrink-0 text-base" aria-hidden="true">{{ icon(toast.tone) }}</span>
            <div class="min-w-0 flex-1">
              <p class="font-medium">{{ toast.message }}</p>
              @if (toast.items?.length) {
                <ul class="mt-2 list-inside list-disc space-y-1 text-xs opacity-90">
                  @for (item of toast.items; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              }
            </div>
            <button
              type="button"
              class="shrink-0 rounded p-1 text-xs opacity-70 hover:opacity-100"
              (click)="errorService.dismiss(toast.id)"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ApiToastHostComponent {
  readonly errorService = inject(ApiErrorService);

  icon(tone: ApiToastTone): string {
    switch (tone) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '✕';
    }
  }

  toneClass(tone: ApiToastTone): string {
    switch (tone) {
      case 'success':
        return 'border-emerald-300/80 bg-emerald-50/95 text-emerald-950';
      case 'warning':
        return 'border-amber-300/80 bg-amber-50/95 text-amber-950';
      case 'info':
        return 'border-sky-300/80 bg-sky-50/95 text-sky-950';
      default:
        return 'border-red-300/80 bg-red-50/95 text-red-950';
    }
  }
}
