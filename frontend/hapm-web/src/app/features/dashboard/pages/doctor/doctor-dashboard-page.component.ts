import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { DashboardApiService } from '../../data/dashboard-api.service';
import { DoctorDashboardData } from '../../models/dashboard.models';
import { DashboardKpiGridComponent } from '../../widgets/dashboard-kpi-grid.component';
import { DashboardLoadingStateComponent, DashboardPageLayoutComponent } from '../../widgets/dashboard-layout.component';
import { ActiveQueueWidgetComponent, AttentionWidgetComponent } from '../../widgets/stitch-doctor-widgets.component';
import { ScheduleTableWidgetComponent } from '../../widgets/stitch-table-widgets.component';

@Component({
  selector: 'app-doctor-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiButtonComponent, DashboardPageLayoutComponent, DashboardLoadingStateComponent,
    DashboardKpiGridComponent, ScheduleTableWidgetComponent, ActiveQueueWidgetComponent, AttentionWidgetComponent,
  ],
  template: `
    @if (loading()) {
      <app-dashboard-loading-state />
    } @else {
      @if (data(); as dashboard) {
      <app-dashboard-page-layout [title]="dashboard.greeting" [subtitle]="dashboard.subtitle">
        <div actions>
          <a routerLink="/doctor/appointments">
            <app-ui-button size="sm">Start Next Consultation</app-ui-button>
          </a>
        </div>

        <app-dashboard-kpi-grid [kpis]="dashboard.kpis" />

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <app-schedule-table-widget [items]="dashboard.schedule" viewAllRoute="/doctor/appointments" />
          <div class="space-y-6">
            <app-active-queue-widget [items]="dashboard.schedule" />
            <app-attention-widget [items]="dashboard.attentionItems" />
          </div>
        </div>
      </app-dashboard-page-layout>
      }
    }
  `,
})
export class DoctorDashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  readonly loading = signal(true);
  readonly data = signal<DoctorDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardApi.getDoctorDashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
