import { Component, input } from '@angular/core';
import { UiCardComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { DashboardKpi } from '../models/dashboard.models';
import { DASHBOARD_KPI_GRID_CLASS } from './dashboard-layout.component';

@Component({
  selector: 'app-dashboard-kpi-grid',
  standalone: true,
  imports: [UiKpiCardComponent],
  host: { class: 'block w-full shrink-0' },
  template: `
    <div [class]="DASHBOARD_KPI_GRID_CLASS">
      @for (kpi of kpis(); track kpi.title) {
        <app-ui-kpi-card
          [title]="kpi.title"
          [value]="kpi.value"
          [subtitle]="kpi.subtitle"
          [trend]="kpi.trend ?? 'neutral'"
          [trendValue]="kpi.trendValue ?? null"
          [iconPath]="kpi.iconPath"
          [iconBg]="kpi.iconBg ?? 'bg-blue-50'"
          [iconColor]="kpi.iconColor ?? 'text-blue-600'"
        />
      }
    </div>
  `,
})
export class DashboardKpiGridComponent {
  readonly kpis = input.required<DashboardKpi[]>();
  protected readonly DASHBOARD_KPI_GRID_CLASS = DASHBOARD_KPI_GRID_CLASS;
}

@Component({
  selector: 'app-dashboard-widget-card',
  standalone: true,
  imports: [UiCardComponent],
  host: {
    class: 'flex min-h-0 min-w-0 flex-col self-stretch',
    '[class]': 'className()',
  },
  template: `
    <app-ui-card class="flex min-h-0 flex-1 flex-col gap-0">
      <div class="flex min-h-0 flex-1 flex-col p-5">
        <ng-content />
      </div>
    </app-ui-card>
  `,
})
export class DashboardWidgetCardComponent {
  readonly className = input('', { alias: 'class' });
}
