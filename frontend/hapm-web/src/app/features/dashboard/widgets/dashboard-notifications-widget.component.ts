import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardNotification } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-dashboard-notifications-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'block w-full' },
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header title="Notifications">
        <a actions [routerLink]="viewAllRoute()" class="text-xs font-medium text-primary hover:underline">View all</a>
      </app-dashboard-section-header>
      <div class="space-y-2">
        @for (n of items(); track n.id) {
          <div class="rounded-xl border border-border px-3 py-2" [class.opacity-60]="n.read">
            <p class="text-sm font-medium">{{ n.title }}</p>
            <p class="text-xs text-muted-foreground">{{ n.message }}</p>
            <p class="mt-1 text-[10px] text-muted-foreground">{{ n.time }}</p>
          </div>
        } @empty {
          <p class="py-4 text-center text-sm text-muted-foreground">No recent notifications.</p>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class DashboardNotificationsWidgetComponent {
  readonly items = input.required<DashboardNotification[]>();
  readonly viewAllRoute = input.required<string>();
}
