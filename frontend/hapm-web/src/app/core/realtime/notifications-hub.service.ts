import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuthService } from '../auth/auth.service';
import { NotificationDto } from '../../features/notifications/models/notification.models';
import { SignalRBaseService } from './signalr-base.service';

@Injectable({ providedIn: 'root' })
export class NotificationsHubService extends SignalRBaseService {
  private readonly authService = inject(AuthService);

  protected hubUrl = APP_CONFIG.hubNotifications;

  readonly unreadCount = signal(0);
  readonly latest = signal<NotificationDto | null>(null);
  readonly received$ = new Subject<NotificationDto>();

  private handlersBound = false;

  constructor() {
    super(inject(AuthService));
  }

  async connect(): Promise<void> {
    if (!this.authService.isAuthenticated()) return;
    await this.start();
    if (!this.handlersBound) {
      this.on<NotificationDto>('ReceiveNotification', (notification) => {
        this.latest.set(notification);
        this.unreadCount.update((c) => c + 1);
        this.received$.next(notification);
      });
      this.handlersBound = true;
    }
  }

  override async stop(): Promise<void> {
    this.handlersBound = false;
    this.off('ReceiveNotification');
    await super.stop();
  }
}
