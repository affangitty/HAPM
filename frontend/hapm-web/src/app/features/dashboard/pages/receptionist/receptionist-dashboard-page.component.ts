import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { DashboardApiService } from '../../data/dashboard-api.service';
import { ReceptionistDashboardData } from '../../models/dashboard.models';
import { DashboardLoadingStateComponent, DashboardPageLayoutComponent } from '../../widgets/dashboard-layout.component';
import {
  CheckinTableWidgetComponent,
  ReceptionBillingWidgetComponent,
  RoomAllocationWidgetComponent,
} from '../../widgets/stitch-reception-widgets.component';

@Component({
  selector: 'app-receptionist-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiButtonComponent, DashboardPageLayoutComponent, DashboardLoadingStateComponent,
    CheckinTableWidgetComponent, RoomAllocationWidgetComponent, ReceptionBillingWidgetComponent,
  ],
  template: `
    @if (loading()) {
      <app-dashboard-loading-state />
    } @else {
      @if (data(); as dashboard) {
      <app-dashboard-page-layout [title]="dashboard.greeting" [subtitle]="dashboard.subtitle">
        <a actions routerLink="/reception/patients/new">
          <app-ui-button size="sm">+ New Patient</app-ui-button>
        </a>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <app-checkin-table-widget [items]="dashboard.queue" />
          <app-room-allocation-widget [rooms]="dashboard.rooms" />
        </div>

        <app-reception-billing-widget [metrics]="dashboard.billingMetrics" />
      </app-dashboard-page-layout>
      }
    }
  `,
})
export class ReceptionistDashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  readonly loading = signal(true);
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
      error: () => this.loading.set(false),
    });
  }
}
