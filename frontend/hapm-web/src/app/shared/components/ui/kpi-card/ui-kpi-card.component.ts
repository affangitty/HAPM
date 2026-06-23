import { Component, input } from '@angular/core';
import { UiCardComponent, UiCardContentComponent } from '../card/ui-card.component';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-kpi-card',
  standalone: true,
  imports: [UiCardComponent, UiCardContentComponent],
  template: `
    <app-ui-card [class]="cn('gap-0', className())">
      <app-ui-card-content class="p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-muted-foreground">{{ title() }}</p>
            <p class="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">{{ value() }}</p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              @if (trendValue()) {
                <span [class]="trendClass()" class="inline-flex items-center gap-0.5 text-xs font-medium">
                  @if (trend() === 'up') {
                    <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  }
                  @if (trend() === 'down') {
                    <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  }
                  {{ trendValue() }}
                </span>
              }
              @if (subtitle()) {
                <p class="text-xs text-muted-foreground">{{ subtitle() }}</p>
              }
            </div>
          </div>

          @if (iconPath()) {
            <div [class]="cn('shrink-0 rounded-xl p-2.5', iconBg())">
              <svg
                class="size-5"
                [class]="iconColor()"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path [attr.d]="iconPath()" />
              </svg>
            </div>
          }
        </div>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class UiKpiCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly trend = input<'up' | 'down' | 'neutral'>('neutral');
  readonly trendValue = input<string | null>(null);
  readonly iconPath = input<string | null>(null);
  readonly iconBg = input('bg-blue-50');
  readonly iconColor = input('text-blue-600');
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;

  trendClass(): string {
    const map = {
      up: 'text-emerald-600',
      down: 'text-red-600',
      neutral: 'text-muted-foreground',
    };
    return map[this.trend()];
  }
}
