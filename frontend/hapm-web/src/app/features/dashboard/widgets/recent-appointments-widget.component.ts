import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { APPOINTMENT_STATUS_TONE, AppointmentStatus } from '../../../shared/models/enums';
import { DashboardAppointmentItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-recent-appointments-widget',
  standalone: true,
  imports: [RouterLink, UiStatusBadgeComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'block w-full' },
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Recent Appointments">
        <a actions [routerLink]="viewAllRoute()" class="text-xs font-medium text-primary hover:underline">View all</a>
      </app-dashboard-section-header>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th class="px-2 py-3">Patient</th>
              <th class="px-2 py-3">Doctor</th>
              <th class="px-2 py-3">Date</th>
              <th class="px-2 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr class="border-b border-border/70">
                <td class="px-2 py-3">{{ item.patient }}</td>
                <td class="px-2 py-3">{{ item.doctor }}</td>
                <td class="px-2 py-3 text-muted-foreground">{{ item.date }} {{ item.time }}</td>
                <td class="px-2 py-3">
                  <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
                </td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="px-2 py-6 text-center text-muted-foreground">No recent appointments.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </app-dashboard-widget-card>
  `,
})
export class RecentAppointmentsWidgetComponent {
  readonly items = input.required<DashboardAppointmentItem[]>();
  readonly viewAllRoute = input('/admin/appointments');

  statusTone(status: string) {
    return APPOINTMENT_STATUS_TONE[status as AppointmentStatus] ?? 'default';
  }
}
