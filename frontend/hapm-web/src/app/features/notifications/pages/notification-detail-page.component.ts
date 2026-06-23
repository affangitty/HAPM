import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { NotificationTypeBadgeComponent } from '../components/notification-type-badge.component';
import { NotificationsApiService } from '../data/notifications-api.service';
import { NotificationDto } from '../models/notification.models';

@Component({
  selector: 'app-notification-detail-page',
  standalone: true,
  imports: [
    DatePipe, RouterLink, UiCardComponent, UiCardContentComponent,
    UiButtonComponent, UiSkeletonComponent, NotificationTypeBadgeComponent,
  ],
  template: `
    <a [routerLink]="basePath() + '/notifications'" class="text-xs text-primary hover:underline">← Back to notifications</a>

    @if (loading()) { <app-ui-skeleton class="mt-4 h-40" /> } @else {
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
export class NotificationDetailPageComponent implements OnInit {
  private readonly api = inject(NotificationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly marking = signal(false);
  readonly notification = signal<NotificationDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (r) => {
        const n = r.items.find((item) => item.id === id) ?? null;
        this.notification.set(n);
        this.loading.set(false);
        if (n && !n.isRead) this.markRead();
      },
      error: () => this.loading.set(false),
    });
  }

  markRead(): void {
    const n = this.notification();
    if (!n) return;
    this.marking.set(true);
    this.api.markAsRead(n.id).subscribe({
      next: () => {
        this.notification.set({ ...n, isRead: true, readAtUtc: new Date().toISOString() });
        this.marking.set(false);
      },
      error: () => this.marking.set(false),
    });
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
