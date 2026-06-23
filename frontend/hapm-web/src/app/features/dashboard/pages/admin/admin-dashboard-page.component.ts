import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { AuditLogsApiService } from '../../../audit-logs/data/audit-logs-api.service';
import { AuditLogDto } from '../../../audit-logs/models/audit-log.models';
import { DashboardApiService } from '../../data/dashboard-api.service';
import { AdminDashboardData } from '../../models/dashboard.models';
import { DepartmentPerformanceWidgetComponent, SystemHealthWidgetComponent } from '../../widgets/stitch-admin-widgets.component';
import { AuditLogTableWidgetComponent } from '../../widgets/stitch-table-widgets.component';
import { DashboardKpiGridComponent } from '../../widgets/dashboard-kpi-grid.component';
import { DashboardLoadingStateComponent, DashboardPageLayoutComponent } from '../../widgets/dashboard-layout.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiButtonComponent, DashboardPageLayoutComponent, DashboardLoadingStateComponent,
    DashboardKpiGridComponent, DepartmentPerformanceWidgetComponent, SystemHealthWidgetComponent,
    AuditLogTableWidgetComponent,
  ],
  template: `
    @if (loading()) {
      <app-dashboard-loading-state />
    } @else {
      @if (data(); as dashboard) {
      <app-dashboard-page-layout [title]="dashboard.greeting" [subtitle]="dashboard.subtitle">
        <p meta class="mt-2 text-xs text-muted-foreground">Last updated: {{ lastUpdated() }}</p>
        <div actions class="flex flex-wrap gap-2">
          <a routerLink="/admin/exports"><app-ui-button variant="outline" size="sm">Export</app-ui-button></a>
          <a routerLink="/admin/appointments"><app-ui-button size="sm">New Appointment</app-ui-button></a>
        </div>

        <app-dashboard-kpi-grid [kpis]="dashboard.kpis" />

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <app-department-performance-widget [data]="departmentChart(dashboard)" />
          <app-system-health-widget [items]="dashboard.systemHealth" />
        </div>

        <app-audit-log-table-widget [rows]="auditLogs()" />
      </app-dashboard-page-layout>
      }
    }
  `,
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly auditApi = inject(AuditLogsApiService);

  readonly loading = signal(true);
  readonly data = signal<AdminDashboardData | null>(null);
  readonly auditLogs = signal<AuditLogDto[]>([]);

  ngOnInit(): void {
    this.dashboardApi.getAdminDashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.auditApi.list({ page: 1, pageSize: 5, sortDescending: true }).subscribe({
      next: (r) => this.auditLogs.set(r.items),
    });
  }

  lastUpdated(): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', hour: 'numeric', minute: '2-digit',
    }).format(new Date());
  }

  departmentChart(dashboard: AdminDashboardData) {
    return dashboard.departmentPerformance.map((d) => ({ label: d.label, count: d.count }));
  }
}
