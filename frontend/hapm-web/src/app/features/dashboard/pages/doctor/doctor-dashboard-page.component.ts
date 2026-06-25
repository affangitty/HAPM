import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../../shared/utils/page-load.util';
import { DashboardApiService } from '../../data/dashboard-api.service';
import { DoctorDashboardData } from '../../models/dashboard.models';
import { DashboardKpiGridComponent } from '../../widgets/dashboard-kpi-grid.component';
import { DashboardLoadingStateComponent, DashboardPageLayoutComponent, DASHBOARD_SPLIT_GRID_CLASS } from '../../widgets/dashboard-layout.component';
import { ActiveQueueWidgetComponent, AttentionWidgetComponent } from '../../widgets/stitch-doctor-widgets.component';
import { DashboardNotificationsWidgetComponent } from '../../widgets/dashboard-notifications-widget.component';
import { ScheduleTableWidgetComponent } from '../../widgets/stitch-table-widgets.component';

@Component({
  selector: 'app-doctor-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiButtonComponent, UiEmptyStateComponent, DashboardPageLayoutComponent, DashboardLoadingStateComponent,
    DashboardKpiGridComponent, ScheduleTableWidgetComponent, ActiveQueueWidgetComponent, AttentionWidgetComponent,
    DashboardNotificationsWidgetComponent,
  ],
  template: `
    @if (loading()) {
      <app-dashboard-loading-state />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      @if (data(); as dashboard) {
      <app-dashboard-page-layout [title]="dashboard.greeting" [subtitle]="dashboard.subtitle">
        <div actions>
          <a routerLink="/doctor/appointments">
            <app-ui-button size="sm">Start Next Consultation</app-ui-button>
          </a>
        </div>

        <app-dashboard-kpi-grid [kpis]="dashboard.kpis" />

        <div [class]="DASHBOARD_SPLIT_GRID_CLASS">
          <app-schedule-table-widget [items]="dashboard.schedule" viewAllRoute="/doctor/appointments" />
          <div class="flex min-h-0 flex-col gap-6 self-stretch lg:col-span-1">
            <app-active-queue-widget [items]="dashboard.schedule" />
            <app-attention-widget [items]="dashboard.attentionItems" />
          </div>
        </div>

        <app-dashboard-notifications-widget [items]="dashboard.notifications" viewAllRoute="/doctor/notifications" />
      </app-dashboard-page-layout>
      }
    }
  `,
})
export class DoctorDashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  protected readonly DASHBOARD_SPLIT_GRID_CLASS = DASHBOARD_SPLIT_GRID_CLASS;

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly data = signal<DoctorDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardApi.getDoctorDashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError, 'Unable to load dashboard.'),
    });
  }
}
