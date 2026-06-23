import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { DashboardApiService } from '../../data/dashboard-api.service';
import { PatientDashboardData } from '../../models/dashboard.models';
import { DashboardLoadingStateComponent, DashboardPageLayoutComponent } from '../../widgets/dashboard-layout.component';
import {
  BillingOverviewWidgetComponent,
  HealthRecordsWidgetComponent,
  PatientPrescriptionsWidgetComponent,
  UpcomingAppointmentsTableWidgetComponent,
} from '../../widgets/stitch-patient-widgets.component';

@Component({
  selector: 'app-patient-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiButtonComponent, DashboardPageLayoutComponent, DashboardLoadingStateComponent,
    UpcomingAppointmentsTableWidgetComponent, PatientPrescriptionsWidgetComponent,
    HealthRecordsWidgetComponent, BillingOverviewWidgetComponent,
  ],
  template: `
    @if (loading()) {
      <app-dashboard-loading-state />
    } @else {
      @if (data(); as dashboard) {
      <app-dashboard-page-layout [title]="dashboard.greeting" [subtitle]="dashboard.subtitle">
        <a actions routerLink="/patient/appointments">
          <app-ui-button size="sm">+ New Appointment</app-ui-button>
        </a>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <app-upcoming-appointments-table-widget [items]="dashboard.upcomingAppointments" />
          <app-patient-prescriptions-widget [items]="dashboard.prescriptions" />
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <app-health-records-widget />
          <app-billing-overview-widget [balanceDue]="dashboard.balanceDue" [dueDate]="dashboard.balanceDueDate" />
        </div>
      </app-dashboard-page-layout>
      }
    }
  `,
})
export class PatientDashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  readonly loading = signal(true);
  readonly data = signal<PatientDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardApi.getPatientDashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
