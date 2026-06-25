import { Component, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { PeakHourCellDto, SpecializationRevenueDto } from '../../../core/api/models';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { AuditLogsApiService } from '../../audit-logs/data/audit-logs-api.service';
import { BarChartComponent } from '../../dashboard/charts/bar-chart.component';
import { ChartDataPoint } from '../../dashboard/charts/chart.models';
import { DashboardApiService } from '../../dashboard/data/dashboard-api.service';
import { DashboardActivityItem, DashboardKpi } from '../../dashboard/models/dashboard.models';
import { ActivityFeedWidgetComponent } from '../../dashboard/widgets/activity-feed-widget.component';
import { DashboardKpiGridComponent } from '../../dashboard/widgets/dashboard-kpi-grid.component';
import { DashboardSectionHeaderComponent } from '../../dashboard/widgets/dashboard-section-header.component';
import { DashboardWidgetCardComponent } from '../../dashboard/widgets/dashboard-kpi-grid.component';
import { DASHBOARD_PAIR_GRID_CLASS, DASHBOARD_SPLIT_GRID_CLASS, DASHBOARD_STACK_CLASS } from '../../dashboard/widgets/dashboard-layout.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiBadgeComponent } from '../../../shared/components/ui/badge/ui-badge.component';

interface ActionAlert {
  title: string;
  message: string;
  color: string;
}

@Component({
  selector: 'app-admin-analytics-page',
  standalone: true,
  imports: [
    UiEmptyStateComponent,
    UiPageHeaderComponent, UiSkeletonComponent, DashboardKpiGridComponent, DashboardWidgetCardComponent,
    DashboardSectionHeaderComponent, BarChartComponent, ActivityFeedWidgetComponent, UiBadgeComponent,
  ],
  template: `
    <app-ui-page-header title="Analytics" subtitle="Operational and financial insights" />

    @if (loading()) {
      <app-ui-skeleton class="h-64" />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      <div class="mt-6" [class]="DASHBOARD_STACK_CLASS">
        <app-dashboard-kpi-grid [kpis]="kpis()" />

        <div [class]="DASHBOARD_SPLIT_GRID_CLASS">
          <app-dashboard-widget-card class="min-h-0 flex-1 lg:col-span-3">
            <app-dashboard-section-header title="Peak appointment hours" subtitle="Busiest times of day (last 30 days)" />
            <div class="flex min-h-0 flex-1 flex-col">
              <app-bar-chart [data]="peakHourChart()" valueKey="count" color="#0D9488" [height]="220" ariaLabel="Peak appointment hours" />
            </div>
          </app-dashboard-widget-card>

          <app-dashboard-widget-card class="min-h-0 flex-1 lg:col-span-1">
            <app-dashboard-section-header title="Revenue by specialty" subtitle="Collected payments" />
            <div class="flex min-h-0 flex-1 flex-col">
              <app-bar-chart [data]="revenueChart()" valueKey="revenue" color="#1D4ED8" [height]="220" ariaLabel="Revenue by specialization" />
            </div>
          </app-dashboard-widget-card>
        </div>

        <div [class]="DASHBOARD_PAIR_GRID_CLASS">
          <app-activity-feed-widget class="lg:col-span-2" [items]="activity()" viewAllRoute="/admin/audit-logs" title="Recent Activities" />
          <app-dashboard-widget-card class="min-h-0 flex-1 lg:col-span-2">
            <app-dashboard-section-header title="Action Required">
              @if (actionAlerts().length) {
                <app-ui-badge variant="destructive" actions>{{ actionAlerts().length }} New</app-ui-badge>
              }
            </app-dashboard-section-header>
            <div class="space-y-3">
              @for (alert of actionAlerts(); track alert.title) {
                <div class="rounded-xl border border-border p-4" [style.border-left]="'4px solid ' + alert.color">
                  <p class="font-medium">{{ alert.title }}</p>
                  <p class="mt-1 text-sm text-muted-foreground">{{ alert.message }}</p>
                </div>
              } @empty {
                <p class="text-sm text-muted-foreground">No operational alerts right now.</p>
              }
            </div>
          </app-dashboard-widget-card>
        </div>
      </div>
    }
  `,
})
export class AdminAnalyticsPageComponent implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly auditApi = inject(AuditLogsApiService);

  protected readonly DASHBOARD_SPLIT_GRID_CLASS = DASHBOARD_SPLIT_GRID_CLASS;
  protected readonly DASHBOARD_PAIR_GRID_CLASS = DASHBOARD_PAIR_GRID_CLASS;
  protected readonly DASHBOARD_STACK_CLASS = DASHBOARD_STACK_CLASS;

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly kpis = signal<DashboardKpi[]>([]);
  readonly peakHourChart = signal<ChartDataPoint[]>([]);
  readonly revenueChart = signal<ChartDataPoint[]>([]);
  readonly activity = signal<DashboardActivityItem[]>([]);
  readonly actionAlerts = signal<ActionAlert[]>([]);

  ngOnInit(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const fromIso = from.toISOString().slice(0, 10);
    const toIso = to.toISOString().slice(0, 10);

    forkJoin({
      dashboard: this.api.getAdminDashboard().pipe(catchError(() => of(null))),
      peakHours: this.api.getPeakHours(fromIso, toIso).pipe(catchError(() => of([] as PeakHourCellDto[]))),
      revenue: this.api.getRevenueBySpecialization().pipe(catchError(() => of([] as SpecializationRevenueDto[]))),
      stats: this.api.getStats().pipe(catchError(() => of(null))),
      audits: this.auditApi.list({ page: 1, pageSize: 8, sortDescending: true }).pipe(catchError(() => of({ items: [] }))),
    }).subscribe({
      next: ({ dashboard, peakHours, revenue, stats, audits }) => {
        if (!dashboard && !stats) {
          setPageLoadFailed(this.loading, this.loadError, 'Unable to load analytics.');
          return;
        }
        if (dashboard) {
          this.kpis.set(dashboard.kpis);
        }
        this.peakHourChart.set(this.mapPeakHours(peakHours));
        this.revenueChart.set(
          revenue.map((r) => ({ label: r.specialization, revenue: r.totalRevenue })),
        );
        this.activity.set(
          audits.items.map((log) => ({
            id: log.id,
            user: log.userEmail ?? 'System',
            action: log.action,
            resource: `${log.entityName} #${log.entityId}`,
            time: new Date(log.timestampUtc).toLocaleString(),
            category: this.auditCategory(log.action),
          })),
        );
        if (stats) {
          this.actionAlerts.set(this.buildAlerts(stats.pendingInvoices, stats.upcomingAppointments));
        }
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private mapPeakHours(cells: PeakHourCellDto[]): ChartDataPoint[] {
    const byHour = new Map<number, number>();
    for (const cell of cells) {
      byHour.set(cell.hour, (byHour.get(cell.hour) ?? 0) + cell.appointmentCount);
    }
    return Array.from(byHour.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({
        label: `${hour.toString().padStart(2, '0')}:00`,
        count,
      }));
  }

  private buildAlerts(pendingInvoices: number, upcomingAppointments: number): ActionAlert[] {
    const alerts: ActionAlert[] = [];
    if (pendingInvoices > 0) {
      alerts.push({
        title: 'Pending invoices',
        message: `${pendingInvoices} invoice${pendingInvoices === 1 ? '' : 's'} awaiting payment or follow-up.`,
        color: '#EF4444',
      });
    }
    if (upcomingAppointments > 20) {
      alerts.push({
        title: 'High appointment volume',
        message: `${upcomingAppointments} upcoming appointments — review staffing and room allocation.`,
        color: '#F59E0B',
      });
    }
    return alerts;
  }

  private auditCategory(action: string): DashboardActivityItem['category'] {
    if (action === 'Created') return 'create';
    if (action === 'Exported') return 'export';
    if (action === 'Deleted') return 'write';
    return 'access';
  }
}
