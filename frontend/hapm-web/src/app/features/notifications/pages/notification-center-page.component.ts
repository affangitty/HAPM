import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificationsHubService } from '../../../core/realtime/notifications-hub.service';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { NotificationListItemComponent } from '../components/notification-list-item.component';
import { NotificationsApiService } from '../data/notifications-api.service';
import { NotificationDto } from '../models/notification.models';

@Component({
  selector: 'app-notification-center-page',
  standalone: true,
  imports: [
    UiPageHeaderComponent, UiFilterBarComponent, UiButtonComponent, UiCardComponent,
    UiEmptyStateComponent, UiSkeletonComponent, NotificationListItemComponent,
  ],
  template: `
    <app-ui-page-header title="Notifications" [subtitle]="unreadCount() + ' unread notification' + (unreadCount() === 1 ? '' : 's')">
      <app-ui-button actions size="sm" variant="outline" [loading]="markingAll()" (pressed)="markAllRead()">Mark all as read</app-ui-button>
    </app-ui-page-header>

    <div class="mb-4 flex flex-wrap gap-2">
      <button type="button" class="rounded-lg px-3 py-1.5 text-sm font-medium" [class]="filter() === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'" (click)="setFilter('all')">All</button>
      <button type="button" class="rounded-lg px-3 py-1.5 text-sm font-medium" [class]="filter() === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'" (click)="setFilter('unread')">Unread ({{ unreadCount() }})</button>
    </div>

    <app-ui-filter-bar searchPlaceholder="Search notifications..." (searchChange)="onSearch($event)" />

    @if (loading()) {
      <div class="max-w-2xl space-y-2">@for (i of [1,2,3,4]; track i) { <app-ui-skeleton class="h-20" /> }</div>
    } @else if (!filtered().length) {
      <app-ui-empty-state title="No notifications" message="Alerts will appear here in real time." />
    } @else {
      <div class="max-w-2xl space-y-6">
        @for (group of grouped(); track group.label) {
          <div>
            <p class="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{{ group.label }}</p>
            <app-ui-card class="overflow-hidden">
              <div class="divide-y divide-border">
                @for (n of group.items; track n.id) {
                  <app-notification-list-item [notification]="n" (selected)="openDetail($event)" />
                }
              </div>
            </app-ui-card>
          </div>
        }
      </div>
    }
  `,
})
export class NotificationCenterPageComponent implements OnInit {
  private readonly api = inject(NotificationsApiService);
  private readonly hub = inject(NotificationsHubService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly markingAll = signal(false);
  readonly items = signal<NotificationDto[]>([]);
  readonly filtered = signal<NotificationDto[]>([]);
  readonly unreadCount = signal(0);
  readonly filter = signal<'all' | 'unread'>('all');
  search = '';

  readonly grouped = computed(() => {
    const items = this.filtered();
    const today = new Date().toDateString();
    const todayItems = items.filter((n) => new Date(n.createdAtUtc).toDateString() === today);
    const earlierItems = items.filter((n) => new Date(n.createdAtUtc).toDateString() !== today);
    const groups = [];
    if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
    if (earlierItems.length) groups.push({ label: 'Earlier', items: earlierItems });
    return groups;
  });

  ngOnInit(): void {
    this.load();
    this.hub.received$.subscribe(() => this.load());
  }

  setFilter(f: 'all' | 'unread'): void { this.filter.set(f); this.load(); }
  onSearch(v: string): void { this.search = v.toLowerCase(); this.applyFilter(); }

  markAllRead(): void {
    this.markingAll.set(true);
    this.api.markAllAsRead().subscribe({
      next: () => { this.markingAll.set(false); this.load(); },
      error: () => this.markingAll.set(false),
    });
  }

  openDetail(n: NotificationDto): void {
    void this.router.navigate([`${this.basePath()}/notifications/${n.id}`]);
  }

  private load(): void {
    this.loading.set(true);
    this.api.getUnreadCount().subscribe({ next: (c) => this.unreadCount.set(c) });
    this.api.list({ page: 1, pageSize: 50, unreadOnly: this.filter() === 'unread' }).subscribe({
      next: (r) => { this.items.set(r.items); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private applyFilter(): void {
    const q = this.search;
    this.filtered.set(!q ? this.items() : this.items().filter((n) =>
      n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)));
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
