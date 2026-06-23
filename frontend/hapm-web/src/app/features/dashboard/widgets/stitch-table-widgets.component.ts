import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { APPOINTMENT_STATUS_TONE, AppointmentStatus } from '../../../shared/models/enums';
import { AuditLogDto } from '../../audit-logs/models/audit-log.models';
import { DashboardScheduleItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-audit-log-table-widget',
  standalone: true,
  imports: [RouterLink, UiAvatarComponent, UiStatusBadgeComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Recent Audit Logs" subtitle="System activity and compliance events">
        <a actions routerLink="/admin/audit-logs" class="text-xs font-medium text-primary hover:underline">View All →</a>
      </app-dashboard-section-header>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th class="px-2 py-3 font-medium">Timestamp</th>
              <th class="px-2 py-3 font-medium">User</th>
              <th class="px-2 py-3 font-medium">Action</th>
              <th class="px-2 py-3 font-medium">Resource</th>
              <th class="px-2 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr class="border-b border-border/70 hover:bg-muted/40">
                <td class="px-2 py-3 text-xs text-muted-foreground">{{ formatTime(row.timestampUtc) }}</td>
                <td class="px-2 py-3">
                  <div class="flex items-center gap-2">
                    <app-ui-avatar [name]="row.userEmail ?? 'System'" size="sm" class="!size-7 !text-[10px]" />
                    <span class="font-medium">{{ row.userEmail ?? 'System' }}</span>
                  </div>
                </td>
                <td class="px-2 py-3">{{ row.action }}</td>
                <td class="px-2 py-3 text-muted-foreground">{{ row.entityName }} #{{ row.entityId }}</td>
                <td class="px-2 py-3">
                  <app-ui-status-badge [label]="row.action === 'Deleted' ? 'Failed' : 'Success'" [tone]="row.action === 'Deleted' ? 'destructive' : 'success'" />
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-2 py-8 text-center text-muted-foreground">No audit activity yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </app-dashboard-widget-card>
  `,
})
export class AuditLogTableWidgetComponent {
  readonly rows = input.required<AuditLogDto[]>();

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString();
  }
}

@Component({
  selector: 'app-schedule-table-widget',
  standalone: true,
  imports: [RouterLink, UiAvatarComponent, UiStatusBadgeComponent, UiButtonComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card [class]="className()">
      <app-dashboard-section-header [title]="title()" subtitle="Today's clinical queue">
        <a actions [routerLink]="viewAllRoute()" class="text-xs font-medium text-primary hover:underline">View calendar</a>
      </app-dashboard-section-header>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th class="px-2 py-3 font-medium">Time</th>
              <th class="px-2 py-3 font-medium">Patient</th>
              <th class="px-2 py-3 font-medium">Reason</th>
              <th class="px-2 py-3 font-medium">Status</th>
              <th class="px-2 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr class="border-b border-border/70" [class.bg-teal-50]="item.highlight">
                <td class="px-2 py-3 font-medium">{{ item.time }}</td>
                <td class="px-2 py-3">
                  <div class="flex items-center gap-2">
                    <app-ui-avatar [name]="item.patient" size="sm" class="!size-7 !text-[10px]" />
                    {{ item.patient }}
                  </div>
                </td>
                <td class="px-2 py-3 text-muted-foreground">{{ item.type }}</td>
                <td class="px-2 py-3">
                  <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
                </td>
                <td class="px-2 py-3">
                  @if (item.highlight) {
                    <app-ui-button size="sm">Start Visit</app-ui-button>
                  } @else {
                    <a [routerLink]="viewAllRoute()" class="text-xs font-medium text-primary hover:underline">Review Chart</a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-dashboard-widget-card>
  `,
})
export class ScheduleTableWidgetComponent {
  readonly title = input("Today's Schedule");
  readonly items = input.required<DashboardScheduleItem[]>();
  readonly viewAllRoute = input('/doctor/appointments');
  readonly className = input('lg:col-span-2', { alias: 'class' });

  statusTone(status: string) {
    return APPOINTMENT_STATUS_TONE[status as AppointmentStatus] ?? 'default';
  }
}
