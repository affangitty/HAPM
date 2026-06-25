import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { DashboardActivityItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-activity-feed-widget',
  standalone: true,
  imports: [RouterLink, UiAvatarComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: {
    class: 'flex min-h-0 min-w-0 flex-col self-stretch',
    '[class]': 'className()',
  },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header [title]="title()" [subtitle]="subtitle()">
        @if (viewAllRoute()) {
          <a
            actions
            [routerLink]="viewAllRoute()"
            class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Audit logs
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        }
      </app-dashboard-section-header>

      <div class="space-y-3">
        @for (item of items(); track item.id) {
          <div class="flex items-start gap-3">
            <app-ui-avatar [name]="item.user" size="sm" class="!size-6 !text-[10px]" />
            <div class="min-w-0 flex-1">
              <p class="text-xs text-foreground">
                <span class="font-medium">{{ item.user }}</span>
                <span class="text-muted-foreground"> {{ item.action }}: </span>
                <span class="text-primary">{{ item.resource }}</span>
              </p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">{{ item.time }}</p>
            </div>
            <span [class]="categoryClass(item.category)" class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
              {{ item.category }}
            </span>
          </div>
        }
      </div>
    </app-dashboard-widget-card>
  `,
})
export class ActivityFeedWidgetComponent {
  readonly title = input('Recent Activity');
  readonly subtitle = input('System events and actions');
  readonly items = input.required<DashboardActivityItem[]>();
  readonly viewAllRoute = input<string | null>(null);
  readonly className = input('', { alias: 'class' });

  categoryClass(category: DashboardActivityItem['category']): string {
    const map: Record<DashboardActivityItem['category'], string> = {
      create: 'bg-emerald-50 text-emerald-700',
      write: 'bg-blue-50 text-blue-700',
      export: 'bg-amber-50 text-amber-700',
      access: 'bg-slate-100 text-slate-600',
    };
    return map[category];
  }
}
