import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuthService } from '../auth/auth.service';
import { StaffMessageDto } from '../../features/staff-messages/models/staff-message.models';
import { SignalRBaseService } from './signalr-base.service';

@Injectable({ providedIn: 'root' })
export class ChatHubService extends SignalRBaseService {
  private readonly authService = inject(AuthService);

  protected hubUrl = APP_CONFIG.hubChat;

  readonly latest = signal<StaffMessageDto | null>(null);
  readonly received$ = new Subject<StaffMessageDto>();

  private handlersBound = false;

  constructor() {
    super(inject(AuthService));
  }

  async connect(): Promise<void> {
    const role = this.authService.role();
    if (!role || role === 'Patient') return;
    await this.start();
    if (!this.handlersBound) {
      this.on<StaffMessageDto>('ReceiveStaffMessage', (message) => {
        this.latest.set(message);
        this.received$.next(message);
      });
      this.handlersBound = true;
    }
  }

  override async stop(): Promise<void> {
    this.handlersBound = false;
    this.off('ReceiveStaffMessage');
    await super.stop();
  }
}
