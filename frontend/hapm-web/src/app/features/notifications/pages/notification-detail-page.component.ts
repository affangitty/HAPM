import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { NotificationTypeBadgeComponent } from '../components/notification-type-badge.component';
import { NotificationsApiService } from '../data/notifications-api.service';

@Component({
  selector: 'app-notification-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    UiCardComponent,
    UiCardContentComponent,
    UiButtonComponent,
    UiSkeletonComponent,
    UiEmptyStateComponent,
    NotificationTypeBadgeComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to notifications</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-40" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Notification not found" message="This notification may have been removed." />
    } @else {
      @if (notification(); as n) {
        <div class="mt-2 mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold">{{ n.title }}</h1>
            <p class="text-sm text-muted-foreground">{{ n.createdAtUtc | date: 'medium' }}</p>
          </div>
          <app-notification-type-badge [type]="n.type" />
        </div>

        <app-ui-card>
          <app-ui-card-content class="space-y-4 p-5">
            <p>{{ n.message }}</p>
            <p class="text-sm text-muted-foreground">
              Status: {{ n.isRead ? 'Read' : 'Unread' }}
              @if (n.readAtUtc) { · Read at {{ n.readAtUtc | date: 'medium' }} }
            </p>
            @if (!n.isRead) {
              <app-ui-button size="sm" [loading]="marking()" (pressed)="markRead()">Mark as read</app-ui-button>
            }
          </app-ui-card-content>
        </app-ui-card>
      }
    }
  `,
})
export class NotificationDetailPageComponent {
  private readonly api = inject(NotificationsApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader(
    'id',
    (id) => this.api.getById(id),
    this.destroyRef,
    {
      onLoaded: (n) => {
        if (!n.isRead) this.markRead();
      },
    },
  );

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly notification = this.routeState.data;
  readonly marking = signal(false);

  markRead(): void {
    const n = this.notification();
    if (!n || n.isRead) return;
    this.marking.set(true);
    this.api.markAsRead(n.id).subscribe({
      next: () => {
        this.notification.set({ ...n, isRead: true, readAtUtc: new Date().toISOString() });
        this.marking.set(false);
      },
      error: () => this.marking.set(false),
    });
  }

  listLink(): string {
    return roleRoute(this.router, 'notifications');
  }
}
