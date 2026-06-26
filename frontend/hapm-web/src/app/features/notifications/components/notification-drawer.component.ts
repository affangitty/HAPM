import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { NotificationsHubService } from '../../../core/realtime/notifications-hub.service';
import { NotificationListItemComponent } from './notification-list-item.component';
import { NotificationsApiService } from '../data/notifications-api.service';
import { NotificationDto } from '../models/notification.models';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [RouterLink, UiButtonComponent, UiEmptyStateComponent, UiSkeletonComponent, NotificationListItemComponent],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 lg:hidden" (click)="close.emit()"></div>
      <aside class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-xl" role="dialog" aria-modal="true" aria-label="Notifications">
        <div class="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 class="font-semibold">Notifications</h2>
            <p class="text-xs text-muted-foreground">{{ unreadCount() }} unread</p>
          </div>
          <button type="button" class="rounded-lg p-2 hover:bg-muted" aria-label="Close notifications" (click)="close.emit()">✕</button>
        </div>

        <div class="flex gap-2 border-b px-4 py-2">
          <app-ui-button size="sm" variant="outline" [loading]="markingAll()" (pressed)="markAllRead()">Mark all read</app-ui-button>
          <a [routerLink]="centerLink()" (click)="close.emit()"><app-ui-button size="sm">Open center</app-ui-button></a>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto p-4">
          @if (loading()) {
            @for (i of [1,2,3]; track i) { <app-ui-skeleton class="h-20" /> }
          } @else if (loadError()) {
            <app-ui-empty-state [title]="loadError()!" />
          } @else if (!items().length) {
            <app-ui-empty-state title="No notifications" message="You're all caught up." />
          } @else {
            @for (n of items(); track n.id) {
              <app-notification-list-item [notification]="n" (selected)="onSelect($event)" />
            }
          }
        </div>
      </aside>
    }
  `,
})
export class NotificationDrawerComponent {
  private readonly api = inject(NotificationsApiService);
  private readonly hub = inject(NotificationsHubService);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = input(false);
  readonly rolePrefix = input('admin');
  readonly close = output<void>();
  readonly selectNotification = output<NotificationDto>();

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly markingAll = signal(false);
  readonly items = signal<NotificationDto[]>([]);
  readonly unreadCount = signal(0);

  constructor() {
    effect(() => {
      if (this.open()) this.refresh();
    });
    this.hub.received$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.open()) this.refresh();
    });
  }

  centerLink(): string { return `/${this.rolePrefix()}/notifications`; }

  onSelect(n: NotificationDto): void {
    if (!n.isRead) {
      this.api.markAsRead(n.id).subscribe(() => this.refresh());
    }
    this.selectNotification.emit(n);
  }

  markAllRead(): void {
    this.markingAll.set(true);
    this.api.markAllAsRead().subscribe({
      next: () => { this.markingAll.set(false); this.refresh(); },
      error: () => this.markingAll.set(false),
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.api.getUnreadCount().subscribe({ next: (c) => this.unreadCount.set(c) });
    this.api.list({ page: 1, pageSize: 10 }).subscribe({
      next: (r) => { this.items.set(r.items); this.loading.set(false); },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }
}
