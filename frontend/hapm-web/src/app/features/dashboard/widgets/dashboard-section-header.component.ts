import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-section-header',
  standalone: true,
  template: `
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-sm font-semibold text-foreground">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="text-xs text-muted-foreground">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <ng-content select="[actions]" />
      </div>
    </div>
  `,
})
export class DashboardSectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
