import { Component, input } from '@angular/core';

export interface MobileRecordField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-mobile-record-card',
  standalone: true,
  template: `
    <article
      class="rounded-xl border border-border bg-card p-4"
      [class]="className()"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          @if (title()) {
            <h3 class="font-semibold text-foreground">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="mt-0.5 text-sm text-muted-foreground">{{ subtitle() }}</p>
          }
        </div>
        <ng-content select="[trailing]" />
      </div>

      @if (fields().length) {
        <dl class="mt-3 grid gap-2 border-t border-border/60 pt-3">
          @for (field of fields(); track field.label) {
            <div class="flex justify-between gap-3 text-sm">
              <dt class="shrink-0 text-muted-foreground">{{ field.label }}</dt>
              <dd class="text-right font-medium text-foreground">{{ field.value }}</dd>
            </div>
          }
        </dl>
      }

      <ng-content />
    </article>
  `,
})
export class MobileRecordCardComponent {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly fields = input<MobileRecordField[]>([]);
  readonly className = input('');
}
