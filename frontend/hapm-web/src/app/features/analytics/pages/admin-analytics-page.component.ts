import { Component, inject, OnInit, signal } from '@angular/core';
import { AreaChartComponent } from '../../dashboard/charts/area-chart.component';
import { BarChartComponent } from '../../dashboard/charts/bar-chart.component';
import { ChartDataPoint, ChartSeries } from '../../dashboard/charts/chart.models';
import { DashboardApiService } from '../../dashboard/data/dashboard-api.service';
import { ActivityFeedWidgetComponent } from '../../dashboard/widgets/activity-feed-widget.component';
import { DashboardKpiGridComponent } from '../../dashboard/widgets/dashboard-kpi-grid.component';
import { DashboardSectionHeaderComponent } from '../../dashboard/widgets/dashboard-section-header.component';
import { DashboardWidgetCardComponent } from '../../dashboard/widgets/dashboard-kpi-grid.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiBadgeComponent } from '../../../shared/components/ui/badge/ui-badge.component';
import { MOCK_ADMIN_DASHBOARD } from '../../dashboard/data/dashboard-mock.data';

@Component({
  selector: 'app-admin-analytics-page',
  standalone: true,
  imports: [
    UiPageHeaderComponent, UiSkeletonComponent, DashboardKpiGridComponent, DashboardWidgetCardComponent,
    DashboardSectionHeaderComponent, AreaChartComponent, BarChartComponent, ActivityFeedWidgetComponent, UiBadgeComponent,
  ],
  template: `
    <app-ui-page-header title="Analytics" subtitle="Operational and financial insights" />

    @if (loading()) {
      <app-ui-skeleton class="h-64" />
    } @else {
      <app-dashboard-kpi-grid class="mb-6 block" [kpis]="kpis()" />

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <app-dashboard-widget-card class="lg:col-span-2">
          <app-dashboard-section-header title="Appointment Analytics" subtitle="Patient flow over the last 30 days">
            <select actions class="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground">
              <option>Last 30 Days</option>
            </select>
          </app-dashboard-section-header>
          <app-area-chart [data]="appointmentTrend()" [series]="appointmentSeries" [height]="220" />
        </app-dashboard-widget-card>

        <app-dashboard-widget-card>
          <app-dashboard-section-header title="Revenue" subtitle="Jan – Jun" />
          <app-bar-chart [data]="revenueData()" valueKey="revenue" color="#1D4ED8" [height]="220" />
        </app-dashboard-widget-card>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <app-activity-feed-widget [items]="activity()" viewAllRoute="/admin/audit-logs" title="Recent Activities" />
        <app-dashboard-widget-card>
          <app-dashboard-section-header title="Action Required">
            <app-ui-badge variant="destructive" actions>3 New</app-ui-badge>
          </app-dashboard-section-header>
          <div class="space-y-3">
            @for (alert of actionAlerts; track alert.title) {
              <div class="rounded-xl border border-border p-4" [style.border-left]="'4px solid ' + alert.color">
                <p class="font-medium">{{ alert.title }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ alert.message }}</p>
              </div>
            }
          </div>
        </app-dashboard-widget-card>
      </div>
    }
  `,
})
export class AdminAnalyticsPageComponent implements OnInit {
  private readonly api = inject(DashboardApiService);

  readonly loading = signal(true);
  readonly kpis = signal(MOCK_ADMIN_DASHBOARD.kpis);
  readonly appointmentTrend = signal<ChartDataPoint[]>(MOCK_ADMIN_DASHBOARD.appointmentTrend);
  readonly revenueData = signal<ChartDataPoint[]>(MOCK_ADMIN_DASHBOARD.revenue);
  readonly activity = signal(MOCK_ADMIN_DASHBOARD.activity);

  readonly appointmentSeries: ChartSeries[] = [
    { key: 'appointments', label: 'Appointments', color: '#1D4ED8' },
    { key: 'completed', label: 'Completed', color: '#10B981' },
  ];

  readonly actionAlerts = [
    { title: 'Server Capacity Warning', message: 'Storage nearing threshold — review infrastructure logs.', color: '#EF4444' },
    { title: 'Low Inventory Alert', message: 'Clinical supplies below reorder point.', color: '#0D9488' },
    { title: 'Pending Approvals', message: 'Staff leave requests awaiting administrator review.', color: '#F59E0B' },
  ];

  ngOnInit(): void {
    this.api.getAdminDashboard().subscribe({
      next: (d) => {
        this.kpis.set(d.kpis);
        this.appointmentTrend.set(d.appointmentTrend);
        this.revenueData.set(d.revenue);
        this.activity.set(d.activity);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
