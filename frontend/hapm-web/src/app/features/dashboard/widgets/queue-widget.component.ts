import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { UiBadgeComponent } from '../../../shared/components/ui/badge/ui-badge.component';
import { DashboardDoctorAvailability, DashboardQueueItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-queue-widget',
  standalone: true,
  imports: [UiAvatarComponent, UiBadgeComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card [class]="className()">
      <div class="-mx-5 -mt-5 border-b border-border px-5 pb-3 pt-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-foreground">Patient Queue</h2>
            <p class="text-xs text-muted-foreground">Real-time status — refreshes automatically</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-muted"
            (click)="refresh.emit()"
          >
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-9-9" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div class="-mx-5 divide-y divide-border">
        @for (item of items(); track item.id; let i = $index) {
          <div class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
            <div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <span class="text-[11px] font-bold text-muted-foreground">{{ i + 1 }}</span>
            </div>
            <app-ui-avatar [name]="item.name" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-foreground">{{ item.name }}</p>
              <p class="text-xs text-muted-foreground">{{ item.time }} · {{ item.doctor }}</p>
            </div>
            <div class="shrink-0 text-right">
              <app-ui-badge [variant]="queueVariant(item.status)">{{ queueLabel(item) }}</app-ui-badge>
            </div>
            @if (item.status === 'waiting' || item.status === 'scheduled') {
              <button type="button" class="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                Check In
              </button>
            }
          </div>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class QueueWidgetComponent {
  readonly items = input.required<DashboardQueueItem[]>();
  readonly className = input('lg:col-span-2', { alias: 'class' });
  readonly refresh = output<void>();

  queueVariant(status: string): 'success' | 'warning' | 'info' | 'default' {
    const map: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
      'in-progress': 'success',
      waiting: 'warning',
      'checked-in': 'info',
      scheduled: 'default',
    };
    return map[status] ?? 'default';
  }

  queueLabel(item: DashboardQueueItem): string {
    if (item.status === 'waiting') return `Waiting · ${item.waitTime}`;
    if (item.status === 'in-progress') return 'In Progress';
    if (item.status === 'checked-in') return 'Checked In';
    return 'Scheduled';
  }
}

@Component({
  selector: 'app-doctor-availability-widget',
  standalone: true,
  imports: [RouterLink, UiAvatarComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Doctor Availability" subtitle="Current status">
        <a
          actions
          [routerLink]="viewAllRoute()"
          class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          All
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </app-dashboard-section-header>

      <div class="space-y-2.5">
        @for (doctor of doctors(); track doctor.id) {
          <div class="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/50">
            <app-ui-avatar [name]="doctor.name" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold text-foreground">{{ doctor.name }}</p>
              <p class="text-[10px] text-muted-foreground">{{ doctor.specialty }}</p>
            </div>
            <span
              class="size-2 shrink-0 rounded-full"
              [class]="doctor.status === 'available' ? 'bg-emerald-500' : 'bg-amber-400'"
            ></span>
          </div>
        }
      </div>

      <div class="mt-4 rounded-xl bg-blue-50 p-3">
        <p class="text-xs font-medium text-primary">Quick book</p>
        <p class="text-[11px] text-blue-600">3 doctors have open slots in the next 2 hours</p>
        <a
          [routerLink]="bookRoute()"
          class="mt-2 block w-full rounded-lg bg-primary py-2 text-center text-xs font-semibold text-primary-foreground"
        >
          Book Now
        </a>
      </div>
    </app-dashboard-widget-card>
  `,
})
export class DoctorAvailabilityWidgetComponent {
  readonly doctors = input.required<DashboardDoctorAvailability[]>();
  readonly viewAllRoute = input('/reception/doctors');
  readonly bookRoute = input('/reception/appointments');
}
