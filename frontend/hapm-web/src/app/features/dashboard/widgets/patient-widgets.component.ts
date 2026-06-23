import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { UiBadgeComponent } from '../../../shared/components/ui/badge/ui-badge.component';
import { DashboardAppointmentItem, DashboardPrescriptionItem, DashboardVitalItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-next-appointment-widget',
  standalone: true,
  imports: [DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Next Appointment" />

      @if (appointment(); as apt) {
        <div class="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div class="mb-3 flex items-center gap-2">
            <div class="flex size-9 items-center justify-center rounded-xl bg-primary">
              <svg class="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-primary">{{ apt.date }}</p>
              <p class="text-xs text-blue-600">{{ apt.time }} · {{ apt.duration }}</p>
            </div>
          </div>
          <p class="text-sm font-medium text-foreground">{{ apt.type }}</p>
          <div class="mt-1 flex items-center gap-2">
            <svg class="size-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11 2v2M7 4h10M6 8h12v10H6z" />
            </svg>
            <p class="text-xs text-muted-foreground">{{ apt.doctor }}</p>
          </div>
          <div class="mt-3 flex gap-2">
            <button type="button" class="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">
              Check in
            </button>
            <button type="button" class="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground">
              Reschedule
            </button>
          </div>
        </div>
      } @else {
        <p class="py-8 text-center text-sm text-muted-foreground">No upcoming appointments.</p>
      }
    </app-dashboard-widget-card>
  `,
})
export class NextAppointmentWidgetComponent {
  readonly appointment = input<DashboardAppointmentItem | null>(null);
}

@Component({
  selector: 'app-vitals-summary-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Recent Vitals" subtitle="Last recorded today">
        <a
          actions
          [routerLink]="viewRoute()"
          class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </app-dashboard-section-header>

      <div class="space-y-3">
        @for (vital of vitals(); track vital.label) {
          <div class="flex items-center gap-3">
            <div class="flex size-7 items-center justify-center rounded-lg bg-muted">
              <svg class="size-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-xs text-muted-foreground">{{ vital.label }}</p>
              <p class="text-sm font-semibold text-foreground">
                {{ vital.value }}
                <span class="text-xs font-normal text-muted-foreground">{{ vital.unit }}</span>
              </p>
            </div>
            <span class="text-xs font-medium" [class]="vital.statusColor">{{ vital.status }}</span>
          </div>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class VitalsSummaryWidgetComponent {
  readonly vitals = input.required<DashboardVitalItem[]>();
  readonly viewRoute = input('/patient/vitals');
}

@Component({
  selector: 'app-prescription-cards-widget',
  standalone: true,
  imports: [RouterLink, UiAvatarComponent, UiBadgeComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Recent Prescriptions">
        <a
          actions
          [routerLink]="viewAllRoute()"
          class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </app-dashboard-section-header>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        @for (rx of items(); track rx.id) {
          <div class="rounded-xl border border-border bg-muted/30 p-3">
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <app-ui-avatar [name]="rx.patient" size="sm" class="!size-6 !text-[10px]" />
                <span class="text-xs font-semibold text-foreground">{{ rx.patient }}</span>
              </div>
              <app-ui-badge [variant]="rx.status === 'active' ? 'success' : 'default'">{{ rx.status }}</app-ui-badge>
            </div>
            <div class="space-y-1">
              @for (med of rx.medications; track med.name) {
                <p class="text-xs text-foreground">
                  {{ med.name }}
                  <span class="text-muted-foreground">{{ med.dose }} · {{ med.freq }}</span>
                </p>
              }
            </div>
            <p class="mt-2 text-[10px] text-muted-foreground">{{ rx.id }} · {{ rx.date }}</p>
          </div>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class PrescriptionCardsWidgetComponent {
  readonly items = input.required<DashboardPrescriptionItem[]>();
  readonly viewAllRoute = input('/doctor/prescriptions');
}
