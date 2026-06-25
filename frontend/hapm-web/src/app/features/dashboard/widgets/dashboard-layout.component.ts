import { Component, input } from '@angular/core';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';

/** Four equal KPI columns; matches wide widget row gutters below. */
export const DASHBOARD_KPI_GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4';

/** Vertical stack for dashboard sections (KPI row, widget row, full-width tables). */
export const DASHBOARD_STACK_CLASS = 'flex flex-col gap-6';

/** 3:1 split aligned to the KPI row above (3 + 1 of 4 columns). */
export const DASHBOARD_SPLIT_GRID_CLASS =
  'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch [&>*]:min-h-0';

/** Two equal halves on the 4-column grid (e.g. activity + alerts). */
export const DASHBOARD_PAIR_GRID_CLASS =
  'grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch [&>*]:min-h-0';

@Component({
  selector: 'app-dashboard-loading-state',
  standalone: true,
  imports: [UiSkeletonComponent],
  template: `
    <div [class]="DASHBOARD_STACK_CLASS">
      <div class="space-y-2">
        <app-ui-skeleton class="h-7 w-64" />
        <app-ui-skeleton class="h-4 w-80" />
      </div>
      <div [class]="DASHBOARD_KPI_GRID_CLASS">
        @for (_ of skeletonCards; track $index) {
          <app-ui-skeleton class="h-28 rounded-xl" />
        }
      </div>
      <div [class]="DASHBOARD_SPLIT_GRID_CLASS">
        <app-ui-skeleton class="h-72 rounded-xl lg:col-span-3" />
        <app-ui-skeleton class="h-72 rounded-xl lg:col-span-1" />
      </div>
    </div>
  `,
})
export class DashboardLoadingStateComponent {
  readonly skeletonCards = Array.from({ length: 4 });
  protected readonly DASHBOARD_KPI_GRID_CLASS = DASHBOARD_KPI_GRID_CLASS;
  protected readonly DASHBOARD_SPLIT_GRID_CLASS = DASHBOARD_SPLIT_GRID_CLASS;
  protected readonly DASHBOARD_STACK_CLASS = DASHBOARD_STACK_CLASS;
}

@Component({
  selector: 'app-dashboard-page-layout',
  standalone: true,
  template: `
    <div class="flex flex-col gap-6">
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

      <div [class]="DASHBOARD_STACK_CLASS">
        <ng-content />
      </div>
    </div>
  `,
})
export class DashboardPageLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  protected readonly DASHBOARD_STACK_CLASS = DASHBOARD_STACK_CLASS;
}
