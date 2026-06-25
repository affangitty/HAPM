import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadgeComponent } from '../../../shared/components/ui/badge/ui-badge.component';
import { DashboardScheduleItem } from '../models/dashboard.models';
import { DashboardSectionHeaderComponent } from './dashboard-section-header.component';
import { DashboardWidgetCardComponent } from './dashboard-kpi-grid.component';

@Component({
  selector: 'app-active-queue-widget',
  standalone: true,
  imports: [UiBadgeComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Active Queue">
        <app-ui-badge variant="warning" actions>{{ waitingCount() }} Waiting</app-ui-badge>
      </app-dashboard-section-header>
      @if (nextPatient(); as patient) {
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p class="font-semibold text-foreground">{{ patient.patient }}</p>
          <p class="mt-1 text-xs text-muted-foreground">Wait: {{ patient.duration }}</p>
          <p class="mt-2 flex items-center gap-1 text-xs text-emerald-700">
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            Vitals complete
          </p>
        </div>
      } @else {
        <p class="py-6 text-center text-sm text-muted-foreground">No patients waiting.</p>
      }
    </app-dashboard-widget-card>
  `,
})
export class ActiveQueueWidgetComponent {
  readonly items = input.required<DashboardScheduleItem[]>();

  waitingCount(): number {
    return this.items().filter((i) => i.status === 'CheckedIn' || i.highlight).length;
  }

  nextPatient(): DashboardScheduleItem | null {
    return this.items().find((i) => i.highlight) ?? this.items().find((i) => i.status === 'CheckedIn') ?? null;
  }
}

@Component({
  selector: 'app-attention-widget',
  standalone: true,
  imports: [RouterLink, UiBadgeComponent, DashboardSectionHeaderComponent, DashboardWidgetCardComponent],
  host: { class: 'flex min-h-0 min-w-0 flex-col' },
  template: `
    <app-dashboard-widget-card class="min-h-0 flex-1">
      <app-dashboard-section-header title="Requires Attention">
        <app-ui-badge variant="destructive" actions>{{ items().length }} Labs</app-ui-badge>
      </app-dashboard-section-header>
      <div class="space-y-3">
        @for (item of items(); track item.id) {
          <div class="rounded-xl border border-border p-3">
            <p class="text-sm font-medium">{{ item.title }}</p>
            <p class="text-xs text-muted-foreground">{{ item.subtitle }}</p>
            <div class="mt-2">
              <app-ui-badge [variant]="item.tone === 'danger' ? 'destructive' : item.tone">{{ item.status }}</app-ui-badge>
            </div>
          </div>
        } @empty {
          <p class="py-4 text-center text-sm text-muted-foreground">No pending lab reviews.</p>
        }
      </div>
      <a routerLink="/doctor/lab-reports" class="mt-4 block text-center text-xs font-medium text-primary hover:underline">View All Inbox Items</a>
    </app-dashboard-widget-card>
  `,
})
export class AttentionWidgetComponent {
  readonly items = input.required<{ id: string; title: string; subtitle: string; status: string; tone: 'success' | 'danger' | 'default' }[]>();
}
