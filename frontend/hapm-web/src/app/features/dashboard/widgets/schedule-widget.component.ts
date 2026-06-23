import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { APPOINTMENT_STATUS_TONE, AppointmentStatus } from '../../../shared/models/enums';
import { DashboardScheduleItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-schedule-widget',
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
            Full calendar
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        }
      </app-dashboard-section-header>

      <div class="space-y-2">
        @for (item of items(); track item.id) {
          <div
            class="flex items-center gap-3 rounded-xl border p-3 transition-all"
            [class]="
              item.highlight
                ? 'border-teal-200 bg-teal-50'
                : item.type === 'internal'
                  ? 'border-dashed border-border'
                  : 'border-border hover:bg-muted/50'
            "
          >
            <div class="w-16 shrink-0 text-right">
              <p class="text-xs font-semibold" [class]="item.type === 'internal' ? 'text-muted-foreground' : 'text-foreground'">
                {{ item.time }}
              </p>
              <p class="text-[10px] text-muted-foreground">{{ item.duration }}</p>
            </div>
            <div class="h-8 w-px bg-border"></div>
            @if (item.type !== 'internal') {
              <app-ui-avatar [name]="item.patient" size="sm" />
            } @else {
              <div class="flex size-8 items-center justify-center rounded-full bg-muted">
                <svg class="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            }
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium" [class]="item.type === 'internal' ? 'text-muted-foreground' : 'text-foreground'">
                {{ item.patient }}
              </p>
              @if (item.type !== 'internal') {
                <p class="text-xs text-muted-foreground">{{ item.type }}</p>
              }
            </div>
            @if (item.type !== 'internal') {
              <app-ui-status-badge [label]="item.status" [tone]="statusTone(item.status)" />
            }
          </div>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class ScheduleWidgetComponent {
  readonly title = input("Today's Schedule");
  readonly subtitle = input<string | null>(null);
  readonly items = input.required<DashboardScheduleItem[]>();
  readonly viewAllRoute = input<string | null>(null);
  readonly className = input('', { alias: 'class' });

  statusTone(status: string) {
    return APPOINTMENT_STATUS_TONE[status as AppointmentStatus] ?? 'default';
  }
}
