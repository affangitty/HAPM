import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadgeComponent } from '../../../shared/components/ui/badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { MobileRecordCardComponent } from '../../../shared/components/mobile-record-card/mobile-record-card.component';
import { APPOINTMENT_STATUS_TONE, AppointmentStatus } from '../../../shared/models/enums';
import { DashboardAppointmentItem, DashboardPrescriptionItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-upcoming-appointments-table-widget',
  standalone: true,
  imports: [RouterLink, UiStatusBadgeComponent, MobileRecordCardComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-3' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Upcoming Appointments">
        <a actions routerLink="/patient/appointments" class="text-xs font-medium text-primary hover:underline">View All</a>
      </app-dashboard-section-header>
      <div class="space-y-3 md:hidden">
        @for (item of items(); track item.id) {
          <app-mobile-record-card
            [title]="item.doctor"
            [subtitle]="item.time"
            [fields]="[
              { label: 'Type', value: item.type },
              { label: 'Status', value: item.status },
            ]"
          >
            <span trailing>
              <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
            </span>
          </app-mobile-record-card>
        }
      </div>
      <div class="hidden md:block">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th class="px-2 py-3">Time</th><th class="px-2 py-3">Doctor</th><th class="px-2 py-3">Type</th><th class="px-2 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr class="border-b border-border/70">
                <td class="px-2 py-3">{{ item.time }}</td>
                <td class="px-2 py-3">{{ item.doctor }}</td>
                <td class="px-2 py-3 text-muted-foreground">{{ item.type }}</td>
                <td class="px-2 py-3"><app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" /></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-dashboard-widget-card>
  `,
})
export class UpcomingAppointmentsTableWidgetComponent {
  readonly items = input.required<DashboardAppointmentItem[]>();

  statusTone(status: string) {
    return APPOINTMENT_STATUS_TONE[status as AppointmentStatus] ?? 'default';
  }
}

@Component({
  selector: 'app-patient-prescriptions-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-1' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Recent Prescriptions" />
      <div class="space-y-3">
        @for (rx of items(); track rx.id) {
          <div class="rounded-xl border border-border p-3">
            @for (med of rx.medications; track med.name) {
              <p class="text-sm font-medium">{{ med.name }}</p>
              <p class="text-xs text-muted-foreground">{{ med.dose }} · {{ med.freq }}</p>
            }
            <p class="mt-2 text-xs" [class]="rx.status === 'Active' ? 'text-emerald-600' : 'text-muted-foreground'">{{ rx.status }}</p>
          </div>
        }
      </div>
      <a routerLink="/patient/prescriptions" class="mt-3 block text-xs font-medium text-primary hover:underline">View all prescriptions</a>
    </app-dashboard-widget-card>
  `,
})
export class PatientPrescriptionsWidgetComponent {
  readonly items = input.required<DashboardPrescriptionItem[]>();
}

@Component({
  selector: 'app-health-records-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-1' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Health Records" />
      <div class="space-y-2">
        <a routerLink="/patient/lab-reports" class="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">
          <span>Lab Results</span><span class="text-xs text-muted-foreground">View results</span>
        </a>
        <a routerLink="/patient/vitals" class="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">
          <span>Vital Signs</span><span class="text-xs text-amber-600">Review trends</span>
        </a>
        <a routerLink="/patient/prescriptions" class="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">
          <span>Prescriptions</span><span class="text-xs text-muted-foreground">Active medications</span>
        </a>
      </div>
    </app-dashboard-widget-card>
  `,
})
export class HealthRecordsWidgetComponent {}

@Component({
  selector: 'app-billing-overview-widget',
  standalone: true,
  imports: [RouterLink, UiButtonComponent, UiBadgeComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col self-stretch lg:col-span-3' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Billing Overview">
        @if (balanceDue() > 0) {
          <app-ui-badge variant="destructive" actions>Action Needed</app-ui-badge>
        }
      </app-dashboard-section-header>
      <p class="text-sm text-muted-foreground">Your current account balance</p>
      <p class="mt-2 text-4xl font-bold tabular-nums text-foreground">{{ formatMoney(balanceDue()) }}</p>
      @if (dueDate()) {
        <p class="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          Due by {{ dueDate() }}
        </p>
      }
      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <a routerLink="/patient/billing"><app-ui-button variant="outline" size="sm">View Statement</app-ui-button></a>
        @if (balanceDue() > 0 && payNowLink(); as link) {
          <a [routerLink]="link"><app-ui-button size="sm">Pay Now</app-ui-button></a>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class BillingOverviewWidgetComponent {
  readonly balanceDue = input(0);
  readonly dueDate = input<string | null>(null);
  readonly unpaidInvoiceId = input<number | null>(null);

  payNowLink(): string | null {
    const id = this.unpaidInvoiceId();
    return id ? `/patient/billing/invoices/${id}` : null;
  }

  formatMoney(v: number): string {
    return `$${v.toFixed(2)}`;
  }
}

@Component({
  selector: 'app-patient-vitals-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'block w-full' },
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Latest Vitals">
        <a actions routerLink="/patient/vitals" class="text-xs font-medium text-primary hover:underline">View trends</a>
      </app-dashboard-section-header>
      @if (vitals().length) {
        <div class="grid gap-3 sm:grid-cols-3">
          @for (v of vitals(); track v.label) {
            <div class="rounded-xl border border-border p-3">
              <p class="text-xs text-muted-foreground">{{ v.label }}</p>
              <p class="mt-1 text-lg font-semibold tabular-nums">{{ v.value }} <span class="text-sm font-normal text-muted-foreground">{{ v.unit }}</span></p>
            </div>
          }
        </div>
      } @else {
        <p class="py-4 text-center text-sm text-muted-foreground">No vitals recorded yet.</p>
      }
    </app-dashboard-widget-card>
  `,
})
export class PatientVitalsWidgetComponent {
  readonly vitals = input<import('../models/dashboard.models').DashboardVitalItem[]>([]);
}
