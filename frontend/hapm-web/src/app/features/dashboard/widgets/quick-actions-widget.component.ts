import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardQuickAction } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-quick-actions-widget',
  standalone: true,
  imports: [RouterLink, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  template: `
    <app-dashboard-widget-card>
      <app-dashboard-section-header [title]="title()" />

      <div class="space-y-2">
        @for (action of actions(); track action.label) {
          <a
            [routerLink]="action.route"
            class="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted"
          >
            <div class="flex size-7 items-center justify-center rounded-lg bg-blue-50">
              <svg class="size-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path [attr.d]="action.iconPath" />
              </svg>
            </div>
            <span class="flex-1 text-xs font-medium text-foreground">{{ action.label }}</span>
            <svg class="size-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class QuickActionsWidgetComponent {
  readonly title = input('Quick Actions');
  readonly actions = input.required<DashboardQuickAction[]>();
}
