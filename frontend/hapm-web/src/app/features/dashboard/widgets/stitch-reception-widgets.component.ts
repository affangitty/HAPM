import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { MobileRecordCardComponent } from '../../../shared/components/mobile-record-card/mobile-record-card.component';
import { APPOINTMENT_STATUS_TONE, AppointmentStatus } from '../../../shared/models/enums';
import { DashboardQueueItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-checkin-table-widget',
  standalone: true,
  imports: [RouterLink, UiButtonComponent, UiStatusBadgeComponent, MobileRecordCardComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-3' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Patient Check-in">
        <a actions routerLink="/reception/appointments" class="text-xs font-medium text-primary hover:underline">View All</a>
      </app-dashboard-section-header>

      <div class="space-y-3 md:hidden">
        @for (item of items(); track item.id) {
          <app-mobile-record-card
            [title]="item.name"
            [subtitle]="item.time"
            [fields]="[
              { label: 'Provider', value: item.doctor },
              { label: 'Status', value: item.status },
            ]"
          >
            <span trailing>
              <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
            </span>
            <div class="mt-3">
              <app-ui-button size="sm" variant="outline">Check In</app-ui-button>
            </div>
          </app-mobile-record-card>
        }
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th class="px-2 py-3">Time</th><th class="px-2 py-3">Patient</th><th class="px-2 py-3">Provider</th><th class="px-2 py-3">Status</th><th class="px-2 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr class="border-b border-border/70">
                <td class="px-2 py-3">{{ item.time }}</td>
                <td class="px-2 py-3 font-medium">{{ item.name }}</td>
                <td class="px-2 py-3 text-muted-foreground">{{ item.doctor }}</td>
                <td class="px-2 py-3"><app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" /></td>
                <td class="px-2 py-3"><app-ui-button size="sm" variant="outline">Check In</app-ui-button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-dashboard-widget-card>
  `,
})
export class CheckinTableWidgetComponent {
  readonly items = input.required<DashboardQueueItem[]>();

  statusTone(status: string) {
    return APPOINTMENT_STATUS_TONE[status as AppointmentStatus] ?? 'default';
  }
}

@Component({
  selector: 'app-room-allocation-widget',
  standalone: true,
  imports: [DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-1' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Room Allocation" />
      <div class="space-y-3">
        @for (room of rooms(); track room.id) {
          <div class="flex overflow-hidden rounded-xl border border-border">
            <div class="w-1.5" [class]="room.occupied ? 'bg-red-500' : 'bg-emerald-500'"></div>
            <div class="flex-1 p-3">
              <p class="text-sm font-medium">{{ room.name }}</p>
              <p class="text-xs text-muted-foreground">{{ room.occupied ? room.detail : 'Available' }}</p>
            </div>
          </div>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class RoomAllocationWidgetComponent {
  readonly rooms = input.required<{ id: string; name: string; occupied: boolean; detail?: string }[]>();
}

@Component({
  selector: 'app-reception-billing-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'block w-full shrink-0' },
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Billing & Invoicing Overview">
        <a actions routerLink="/reception/billing" class="text-xs font-medium text-primary hover:underline">Go to Billing</a>
      </app-dashboard-section-header>
      <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        @for (metric of metrics(); track metric.label) {
          <div class="rounded-xl border border-border p-4">
            <p class="text-xs text-muted-foreground">{{ metric.label }}</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ metric.value }}</p>
            <p class="mt-1 text-xs" [class]="metric.tone === 'success' ? 'text-emerald-600' : metric.tone === 'danger' ? 'text-red-600' : 'text-muted-foreground'">{{ metric.subtitle }}</p>
          </div>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class ReceptionBillingWidgetComponent {
  readonly metrics = input.required<{ label: string; value: string; subtitle: string; tone?: 'success' | 'danger' | 'default' }[]>();
}
