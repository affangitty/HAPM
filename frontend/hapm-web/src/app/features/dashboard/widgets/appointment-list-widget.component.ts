import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { APPOINTMENT_STATUS_TONE, AppointmentStatus } from '../../../shared/models/enums';
import { DashboardAppointmentItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-appointment-list-widget',
  standalone: true,
  imports: [
    RouterLink,
    UiAvatarComponent,
    UiStatusBadgeComponent,
    DashboardSectionHeaderComponent,
    DashboardWidgetCardComponent,
  ],
  template: `
    <app-dashboard-widget-card [class]="className()">
      <app-dashboard-section-header [title]="title()" [subtitle]="subtitle()">
        @if (viewAllRoute()) {
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
        }
      </app-dashboard-section-header>

      <div class="-mx-5 divide-y divide-border border-t border-border">
        @for (item of items(); track item.id) {
          <div class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
            <app-ui-avatar [name]="item.patient" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-foreground">{{ item.patient }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ item.doctor }} · {{ item.type }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-xs font-medium text-foreground">{{ item.time }}</p>
              <div class="mt-0.5">
                <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
              </div>
            </div>
          </div>
        } @empty {
          <p class="px-5 py-8 text-center text-sm text-muted-foreground">No appointments to show.</p>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class AppointmentListWidgetComponent {
  readonly title = input('Recent Appointments');
  readonly subtitle = input<string | null>(null);
  readonly items = input.required<DashboardAppointmentItem[]>();
  readonly viewAllRoute = input<string | null>(null);
  readonly className = input('', { alias: 'class' });

  statusTone(status: string) {
    return APPOINTMENT_STATUS_TONE[status as AppointmentStatus] ?? 'default';
  }
}
