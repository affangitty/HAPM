import { Component, input } from '@angular/core';
import { DashboardNotification } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-notification-list-widget',
  standalone: true,
  imports: [DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header [title]="title()" [subtitle]="subtitle()" />

      <div class="space-y-2">
        @for (item of items(); track item.id) {
          <div
            class="rounded-xl border p-3 transition-colors"
            [class]="item.read ? 'border-border bg-card' : 'border-blue-100 bg-blue-50/50'"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground">{{ item.title }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">{{ item.message }}</p>
              </div>
              @if (!item.read) {
                <span class="mt-1 size-2 shrink-0 rounded-full bg-primary"></span>
              }
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-[11px] text-muted-foreground">{{ item.time }}</span>
              <span [class]="priorityClass(item.priority)" class="rounded px-1.5 py-0.5 text-[10px] font-medium">
                {{ item.priority }}
              </span>
            </div>
          </div>
        } @empty {
          <p class="py-6 text-center text-sm text-muted-foreground">No notifications.</p>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class NotificationListWidgetComponent {
  readonly title = input('Notifications');
  readonly subtitle = input<string | null>('Latest alerts');
  readonly items = input.required<DashboardNotification[]>();

  priorityClass(priority: DashboardNotification['priority']): string {
    const map: Record<DashboardNotification['priority'], string> = {
      normal: 'bg-slate-100 text-slate-600',
      high: 'bg-amber-50 text-amber-700',
      critical: 'bg-red-50 text-red-700',
    };
    return map[priority];
  }
}
