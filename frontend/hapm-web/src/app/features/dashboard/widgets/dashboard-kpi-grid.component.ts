import { Component, input } from '@angular/core';
import { UiCardComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { DashboardKpi } from '../models/dashboard.models';

@Component({
  selector: 'app-dashboard-kpi-grid',
  standalone: true,
  imports: [UiKpiCardComponent],
  template: `
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
}

@Component({
  selector: 'app-dashboard-widget-card',
  standalone: true,
  imports: [UiCardComponent],
  template: `
    <app-ui-card [class]="className()">
      <div class="p-5">
        <ng-content />
      </div>
    </app-ui-card>
  `,
})
export class DashboardWidgetCardComponent {
  readonly className = input('', { alias: 'class' });
}
