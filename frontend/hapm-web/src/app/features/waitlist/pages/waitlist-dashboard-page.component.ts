import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { WaitlistStatusBadgeComponent } from '../components/waitlist-status-badge.component';
import { WaitlistApiService } from '../data/waitlist-api.service';
import { WaitlistEntryDto } from '../models/waitlist.models';

@Component({
  selector: 'app-waitlist-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    UiPageHeaderComponent,
    UiKpiCardComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    WaitlistStatusBadgeComponent,
  ],
  template: `
    <app-ui-page-header title="Waitlist Dashboard" subtitle="Track queue status and slot notifications">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/waitlist/list'">
          <app-ui-button size="sm" variant="outline">View all</app-ui-button>
        </a>
        <a [routerLink]="basePath() + '/waitlist/join'">
          <app-ui-button size="sm">Join waitlist</app-ui-button>
        </a>
      </div>
    </app-ui-page-header>

    @if (loading()) {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (i of [1, 2, 3, 4]; track i) {
          <app-ui-skeleton class="h-28" />
        }
      </div>
      <app-ui-skeleton class="h-64" />
    } @else {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-ui-kpi-card title="Active" [value]="formatCount(stats().active)" subtitle="Waiting for slots" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M12 6v6l4 2" />
        <app-ui-kpi-card title="Notified" [value]="formatCount(stats().notified)" subtitle="Slots available" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <app-ui-kpi-card title="Cancelled" [value]="formatCount(stats().cancelled)" subtitle="Removed from queue" iconBg="bg-red-50" iconColor="text-red-600" iconPath="M18 6 6 18M6 6l12 12" />
        <app-ui-kpi-card title="Total" [value]="formatCount(stats().total)" subtitle="All entries" iconBg="bg-violet-50" iconColor="text-violet-600" iconPath="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      </div>

      <div class="rounded-xl border bg-card">
        <div class="flex items-center justify-between border-b px-5 py-4">
          <h2 class="font-semibold">Recent entries</h2>
          <a [routerLink]="basePath() + '/waitlist/list'" class="text-sm text-primary hover:underline">See list</a>
        </div>

        @if (!recent().length) {
          <div class="p-6">
            <app-ui-empty-state
              title="No waitlist entries"
              message="Join the waitlist to be notified when appointment slots open."
              actionLabel="Join waitlist"
              (actionClick)="goJoin()"
            />
          </div>
        } @else {
          <div class="divide-y">
            @for (entry of recent(); track entry.id) {
              <a [routerLink]="detailLink(entry.id)" class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40">
                <div>
                  <p class="font-medium">{{ entry.doctorName }}</p>
                  <p class="text-sm text-muted-foreground">{{ entry.patientName }} · {{ entry.preferredDate }}</p>
                </div>
                <app-waitlist-status-badge [status]="entry.status" />
              </a>
            }
          </div>
        }
      </div>
    }
  `,
})
export class WaitlistDashboardPageComponent implements OnInit {
  private readonly api = inject(WaitlistApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly recent = signal<WaitlistEntryDto[]>([]);
  readonly stats = signal({ active: 0, notified: 0, cancelled: 0, total: 0 });

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        const items = result.items;
        this.recent.set(items.slice(0, 5));
        this.stats.set({
          active: items.filter((e) => e.status === 'Active').length,
          notified: items.filter((e) => e.status === 'Notified').length,
          cancelled: items.filter((e) => e.status === 'Cancelled').length,
          total: result.totalCount,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }

  detailLink(id: number): string {
    return `${this.basePath()}/waitlist/${id}`;
  }

  goJoin(): void {
    void this.router.navigate([`${this.basePath()}/waitlist/join`]);
  }

  formatCount(value: number): string {
    return String(value);
  }
}
