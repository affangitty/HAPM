import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { MobileRecordCardComponent } from '../../../shared/components/mobile-record-card/mobile-record-card.component';
import { APPOINTMENT_STATUS_TONE, AppointmentStatus } from '../../../shared/models/enums';
import { AuditLogDto } from '../../audit-logs/models/audit-log.models';
import { DashboardScheduleItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-audit-log-table-widget',
  standalone: true,
  imports: [RouterLink, UiAvatarComponent, UiStatusBadgeComponent, MobileRecordCardComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'block w-full shrink-0' },
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Recent Audit Logs" subtitle="System activity and compliance events">
        <a actions routerLink="/admin/audit-logs" class="text-xs font-medium text-primary hover:underline">View All →</a>
      </app-dashboard-section-header>

      <div class="space-y-3 md:hidden">
        @for (row of rows(); track row.id) {
          <app-mobile-record-card
            [title]="row.userEmail ?? 'System'"
            [subtitle]="formatTime(row.timestampUtc)"
            [fields]="[
              { label: 'Action', value: row.action },
              { label: 'Resource', value: row.entityName + ' #' + row.entityId },
              { label: 'Status', value: row.action === 'Deleted' ? 'Failed' : 'Success' },
            ]"
          />
        } @empty {
          <p class="py-6 text-center text-sm text-muted-foreground">No audit activity yet.</p>
        }
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="border-b bg-muted/50">
            <tr class="text-xs uppercase tracking-wide text-muted-foreground">
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Timestamp</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">User</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Action</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Resource</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr class="border-b border-border/70 hover:bg-muted/40">
                <td class="h-12 whitespace-nowrap px-4 align-middle text-xs tabular-nums text-muted-foreground">{{ formatTime(row.timestampUtc) }}</td>
                <td class="h-12 px-4 align-middle">
                  <div class="flex items-center gap-2">
                    <app-ui-avatar [name]="row.userEmail ?? 'System'" size="sm" class="!size-7 !text-[10px]" />
                    <span class="font-medium">{{ row.userEmail ?? 'System' }}</span>
                  </div>
                </td>
                <td class="h-12 px-4 align-middle">{{ row.action }}</td>
                <td class="h-12 px-4 align-middle text-muted-foreground">{{ row.entityName }} #{{ row.entityId }}</td>
                <td class="h-12 px-4 align-middle">
                  <app-ui-status-badge [label]="row.action === 'Deleted' ? 'Failed' : 'Success'" [tone]="row.action === 'Deleted' ? 'destructive' : 'success'" />
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-4 py-8 text-center text-muted-foreground">No audit activity yet.</td></tr>
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
  imports: [RouterLink, UiAvatarComponent, UiStatusBadgeComponent, UiButtonComponent, MobileRecordCardComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-3' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header [title]="title()" subtitle="Today's clinical queue">
        <a actions [routerLink]="viewAllRoute()" class="text-xs font-medium text-primary hover:underline">View calendar</a>
      </app-dashboard-section-header>

      <div class="space-y-3 md:hidden">
        @for (item of items(); track item.id) {
          <app-mobile-record-card
            [title]="item.patient"
            [subtitle]="item.time"
            [className]="item.highlight ? 'bg-teal-50' : ''"
            [fields]="[
              { label: 'Reason', value: item.type },
              { label: 'Status', value: item.status },
            ]"
          >
            <span trailing>
              <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
            </span>
            <div class="mt-3 flex gap-2">
              @if (item.highlight) {
                <app-ui-button size="sm">Start Visit</app-ui-button>
              } @else {
                <a [routerLink]="viewAllRoute()" class="text-xs font-medium text-primary hover:underline">Review Chart</a>
              }
            </div>
          </app-mobile-record-card>
        }
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="border-b bg-muted/50">
            <tr class="text-xs uppercase tracking-wide text-muted-foreground">
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Time</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Patient</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Reason</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Status</th>
              <th class="h-12 whitespace-nowrap px-4 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr class="border-b border-border/70" [class.bg-teal-50]="item.highlight">
                <td class="h-12 whitespace-nowrap px-4 align-middle font-medium">{{ item.time }}</td>
                <td class="h-12 px-4 align-middle">
                  <div class="flex items-center gap-2">
                    <app-ui-avatar [name]="item.patient" size="sm" class="!size-7 !text-[10px]" />
                    {{ item.patient }}
                  </div>
                </td>
                <td class="h-12 px-4 align-middle text-muted-foreground">{{ item.type }}</td>
                <td class="h-12 px-4 align-middle">
                  <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
                </td>
                <td class="h-12 px-4 align-middle">
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

  statusTone(status: string) {
    return APPOINTMENT_STATUS_TONE[status as AppointmentStatus] ?? 'default';
  }
}
