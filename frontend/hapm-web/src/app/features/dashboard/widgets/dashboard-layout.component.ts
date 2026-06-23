import { Component, input } from '@angular/core';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';

@Component({
  selector: 'app-dashboard-loading-state',
  standalone: true,
  imports: [UiSkeletonComponent],
  template: `
    <div class="space-y-5">
      <div class="space-y-2">
        <app-ui-skeleton class="h-7 w-64" />
        <app-ui-skeleton class="h-4 w-80" />
      </div>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        @for (_ of skeletonCards; track $index) {
          <app-ui-skeleton class="h-28 rounded-xl" />
        }
      </div>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <app-ui-skeleton class="h-72 rounded-xl lg:col-span-2" />
        <app-ui-skeleton class="h-72 rounded-xl" />
      </div>
    </div>
  `,
})
export class DashboardLoadingStateComponent {
  readonly skeletonCards = Array.from({ length: 4 });
}

@Component({
  selector: 'app-dashboard-page-layout',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="mt-1 text-sm text-muted-foreground">{{ subtitle() }}</p>
          }
          <ng-content select="[meta]" />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <ng-content select="[actions]" />
        </div>
      </div>

      <ng-content />
    </div>
  `,
})
export class DashboardPageLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
