import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../../shared/utils/page-load.util';
import { DashboardApiService } from '../../data/dashboard-api.service';
import { PatientDashboardData } from '../../models/dashboard.models';
import { DashboardKpiGridComponent } from '../../widgets/dashboard-kpi-grid.component';
import { DashboardLoadingStateComponent, DashboardPageLayoutComponent, DASHBOARD_SPLIT_GRID_CLASS } from '../../widgets/dashboard-layout.component';
import { DashboardNotificationsWidgetComponent } from '../../widgets/dashboard-notifications-widget.component';
import {
  BillingOverviewWidgetComponent,
  HealthRecordsWidgetComponent,
  PatientPrescriptionsWidgetComponent,
  PatientVitalsWidgetComponent,
  UpcomingAppointmentsTableWidgetComponent,
} from '../../widgets/stitch-patient-widgets.component';

@Component({
  selector: 'app-patient-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiButtonComponent, UiEmptyStateComponent, DashboardPageLayoutComponent, DashboardLoadingStateComponent,
    DashboardKpiGridComponent, DashboardNotificationsWidgetComponent,
    UpcomingAppointmentsTableWidgetComponent, PatientPrescriptionsWidgetComponent,
    HealthRecordsWidgetComponent, BillingOverviewWidgetComponent, PatientVitalsWidgetComponent,
  ],
  template: `
    @if (loading()) {
      <app-dashboard-loading-state />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      @if (data(); as dashboard) {
      <app-dashboard-page-layout [title]="dashboard.greeting" [subtitle]="dashboard.subtitle">
        <a actions routerLink="/patient/appointments">
          <app-ui-button size="sm">+ New Appointment</app-ui-button>
        </a>

        <app-dashboard-kpi-grid [kpis]="dashboard.kpis" />

        <div [class]="DASHBOARD_SPLIT_GRID_CLASS">
          <app-upcoming-appointments-table-widget [items]="dashboard.upcomingAppointments" />
          <app-patient-prescriptions-widget [items]="dashboard.prescriptions" />
        </div>

        <app-patient-vitals-widget [vitals]="dashboard.vitals" />

        <div [class]="DASHBOARD_SPLIT_GRID_CLASS">
          <app-health-records-widget />
          <app-billing-overview-widget [balanceDue]="dashboard.balanceDue" [dueDate]="dashboard.balanceDueDate" />
        </div>

        <app-dashboard-notifications-widget [items]="dashboard.notifications" viewAllRoute="/patient/notifications" />
      </app-dashboard-page-layout>
      }
    }
  `,
})
export class PatientDashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  protected readonly DASHBOARD_SPLIT_GRID_CLASS = DASHBOARD_SPLIT_GRID_CLASS;

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly data = signal<PatientDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardApi.getPatientDashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError, 'Unable to load dashboard.'),
    });
  }
}
