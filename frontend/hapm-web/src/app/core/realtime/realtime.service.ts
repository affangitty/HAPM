import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { AppointmentsHubService } from './appointments-hub.service';
import { ChatHubService } from './chat-hub.service';
import { NotificationsHubService } from './notifications-hub.service';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthService);
  private readonly notificationsHub = inject(NotificationsHubService);
  private readonly chatHub = inject(ChatHubService);
  private readonly appointmentsHub = inject(AppointmentsHubService);

  async connect(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    await Promise.all([
      this.notificationsHub.connect(),
      this.chatHub.connect(),
      this.appointmentsHub.connect(),
    ]);
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.notificationsHub.stop(),
      this.chatHub.stop(),
      this.appointmentsHub.stop(),
    ]);
  }
}
