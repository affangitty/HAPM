import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export type HubConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export abstract class SignalRBaseService {
  protected connection: HubConnection | null = null;
  private readonly registeredEvents = new Set<string>();

  readonly status = signal<HubConnectionStatus>('disconnected');

  constructor(protected readonly auth: AuthService) {}

  protected abstract hubUrl: string;

  protected buildConnection(): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => this.auth.getAccessToken() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();
  }

  protected wireLifecycleEvents(): void {
    if (!this.connection) return;

    this.connection.onreconnecting(() => this.status.set('reconnecting'));
    this.connection.onreconnected(() => this.status.set('connected'));
    this.connection.onclose(() => this.status.set('disconnected'));
  }

  async start(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    if (!this.connection) {
      this.connection = this.buildConnection();
      this.wireLifecycleEvents();
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.status.set('connecting');
      await this.connection.start();
      this.status.set('connected');
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      for (const event of this.registeredEvents) {
        this.connection.off(event);
      }
      this.registeredEvents.clear();
      await this.connection.stop();
      this.connection = null;
      this.status.set('disconnected');
    }
  }

  protected on<T>(event: string, handler: (payload: T) => void): void {
    if (!this.connection) return;
    this.connection.off(event);
    this.connection.on(event, handler);
    this.registeredEvents.add(event);
  }

  protected off(event: string): void {
    this.connection?.off(event);
    this.registeredEvents.delete(event);
  }

  protected async invoke(method: string, ...args: unknown[]): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
    await this.connection.invoke(method, ...args);
  }
}
