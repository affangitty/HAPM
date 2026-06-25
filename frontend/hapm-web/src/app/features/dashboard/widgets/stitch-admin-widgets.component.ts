import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BarChartComponent } from '../charts/bar-chart.component';
import { ChartDataPoint } from '../charts/chart.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-department-performance-widget',
  standalone: true,
  imports: [BarChartComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-3' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Department Performance" subtitle="Appointment volume by specialization">
        <select actions class="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </app-dashboard-section-header>
      <div class="flex min-h-0 flex-1 flex-col">
        <app-bar-chart [data]="data()" valueKey="count" color="#1D4ED8" [height]="220" ariaLabel="Department performance" />
      </div>
    </app-dashboard-widget-card>
  `,
})
export class DepartmentPerformanceWidgetComponent {
  readonly data = input.required<ChartDataPoint[]>();
}

@Component({
  selector: 'app-system-health-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-1' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="System Health" subtitle="Infrastructure status">
        <span actions class="inline-flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          </svg>
        </span>
      </app-dashboard-section-header>

      <div class="flex-1 space-y-4">
        @for (item of items(); track item.label) {
          <div>
            <div class="flex items-center justify-between gap-2 text-sm">
              <span class="font-medium text-foreground">{{ item.label }}</span>
              <span class="shrink-0 text-right" [class]="item.tone === 'danger' ? 'text-red-600' : item.tone === 'success' ? 'text-emerald-600' : 'text-muted-foreground'">
                {{ item.value }}
              </span>
            </div>
            @if (item.progress !== undefined) {
              <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full" [class]="item.tone === 'danger' ? 'bg-red-500' : 'bg-emerald-500'" [style.width.%]="item.progress"></div>
              </div>
            }
          </div>
        }
      </div>

      <a routerLink="/admin/audit-logs" class="mt-auto block w-full rounded-lg border border-border py-2 text-center text-sm font-medium text-foreground hover:bg-muted">
        View Detailed Logs
      </a>
    </app-dashboard-widget-card>
  `,
})
export class SystemHealthWidgetComponent {
  readonly items = input.required<{ label: string; value: string; tone?: 'success' | 'danger' | 'default'; progress?: number }[]>();
}
