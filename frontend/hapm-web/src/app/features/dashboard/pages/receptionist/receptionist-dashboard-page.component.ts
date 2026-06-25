import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../../shared/utils/page-load.util';
import { DashboardApiService } from '../../data/dashboard-api.service';
import { ReceptionistDashboardData } from '../../models/dashboard.models';
import { DashboardKpiGridComponent } from '../../widgets/dashboard-kpi-grid.component';
import { DashboardNotificationsWidgetComponent } from '../../widgets/dashboard-notifications-widget.component';
import { DashboardLoadingStateComponent, DashboardPageLayoutComponent, DASHBOARD_SPLIT_GRID_CLASS } from '../../widgets/dashboard-layout.component';
import {
  CheckinTableWidgetComponent,
  ReceptionBillingWidgetComponent,
  RoomAllocationWidgetComponent,
} from '../../widgets/stitch-reception-widgets.component';

@Component({
  selector: 'app-receptionist-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiButtonComponent, UiEmptyStateComponent, DashboardPageLayoutComponent, DashboardLoadingStateComponent,
    DashboardKpiGridComponent, DashboardNotificationsWidgetComponent,
    CheckinTableWidgetComponent, RoomAllocationWidgetComponent, ReceptionBillingWidgetComponent,
  ],
  template: `
    @if (loading()) {
      <app-dashboard-loading-state />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      @if (data(); as dashboard) {
      <app-dashboard-page-layout [title]="dashboard.greeting" [subtitle]="dashboard.subtitle">
        <a actions routerLink="/reception/patients/new">
          <app-ui-button size="sm">+ New Patient</app-ui-button>
        </a>

        <app-dashboard-kpi-grid [kpis]="dashboard.kpis" />

        <div [class]="DASHBOARD_SPLIT_GRID_CLASS">
          <app-checkin-table-widget [items]="dashboard.queue" />
          <app-room-allocation-widget [rooms]="dashboard.rooms" />
        </div>

        <app-reception-billing-widget [metrics]="dashboard.billingMetrics" />

        <app-dashboard-notifications-widget [items]="dashboard.notifications" viewAllRoute="/reception/notifications" />
      </app-dashboard-page-layout>
      }
    }
  `,
})
export class ReceptionistDashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  protected readonly DASHBOARD_SPLIT_GRID_CLASS = DASHBOARD_SPLIT_GRID_CLASS;

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly data = signal<ReceptionistDashboardData | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.dashboardApi.getReceptionistDashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError, 'Unable to load dashboard.'),
    });
  }
}
