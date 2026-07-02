import { Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ChatHubService } from '../../../core/realtime/chat-hub.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { VIEWPORT } from '../../../shared/utils/viewport.util';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { ConversationSidebarComponent } from '../components/conversation-sidebar.component';
import { MessageBubbleComponent } from '../components/message-bubble.component';
import { MessageComposerComponent } from '../components/message-composer.component';
import { StaffMessagesApiService } from '../data/staff-messages-api.service';
import { ConversationThread, StaffMessageDto } from '../models/staff-message.models';

@Component({
  selector: 'app-messaging-dashboard-page',
  standalone: true,
  imports: [
    UiEmptyStateComponent,
    FormsModule, ReactiveFormsModule, UiPageHeaderComponent, UiSkeletonComponent,
    ConversationSidebarComponent, MessageBubbleComponent, MessageComposerComponent,
    FormFieldComponent, UiSelectComponent, UiButtonComponent,
  ],
  template: `
    <app-ui-page-header title="Staff Messaging" subtitle="Team collaboration and doctor coordination" />

    <div class="flex h-[min(720px,calc(100dvh-11rem))] min-h-[320px] overflow-hidden rounded-xl border lg:grid lg:grid-cols-[minmax(0,280px)_1fr]">
      <div
        class="h-full min-h-0 overflow-hidden border-b lg:border-b-0 lg:border-r"
        [class]="mobilePanel() === 'thread' ? 'hidden lg:block' : 'block'"
      >
        <app-conversation-sidebar
          [threads]="threads()"
          [selectedId]="selectedThread()?.id ?? null"
          (select)="selectThread($event)"
        />
      </div>

      <div
        class="min-h-0 min-w-0 flex-1 flex-col bg-background"
        [class]="mobilePanel() === 'list' ? 'hidden lg:flex' : 'flex'"
      >
        @if (selectedThread(); as thread) {
          <div class="flex items-center gap-2 border-b px-3 py-3 sm:px-4">
            <button
              type="button"
              class="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Back to conversations"
              (click)="showConversationList()"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div class="min-w-0 flex-1">
              <h3 class="truncate font-semibold">{{ thread.title }}</h3>
              <p class="truncate text-xs text-muted-foreground">{{ thread.subtitle }}</p>
            </div>
          </div>

          <div class="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
            @if (loading()) {
              <app-ui-skeleton class="h-16" /><app-ui-skeleton class="h-16" />
            } @else if (loadError()) {
              <app-ui-empty-state [title]="loadError()!" />
            } @else {
              @for (msg of messages(); track msg.id) {
                <app-message-bubble [message]="msg" [mine]="msg.senderUserId === currentUserId()" />
              }
            }
          </div>

          <app-message-composer [sending]="sending()" (send)="sendMessage($event)" />
        } @else {
          <div class="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center sm:p-6">
            <p class="text-sm text-muted-foreground">Select a conversation or start a new message</p>
            @if (isStaff()) {
              <form class="w-full max-w-md space-y-3 text-left" [formGroup]="newThreadForm" (ngSubmit)="startDoctorThread()">
                <app-form-field label="Message doctor">
                  <app-ui-select formControlName="doctorId" [options]="doctorOptions()" placeholder="Select doctor" />
                </app-form-field>
                <app-ui-button type="submit" size="sm">Open chat</app-ui-button>
              </form>
            }
            @if (isAdmin()) {
              <app-ui-button variant="outline" size="sm" (pressed)="selectBroadcast()">Open staff broadcast</app-ui-button>
            }
          </div>
        }

        @if (error()) { <p class="px-4 pb-2 text-sm text-destructive">{{ error() }}</p> }
      </div>
    </div>
  `,
})
export class MessagingDashboardPageComponent implements OnInit {
  private readonly api = inject(StaffMessagesApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly auth = inject(AuthService);
  private readonly hub = inject(ChatHubService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly messages = signal<StaffMessageDto[]>([]);
  readonly threads = signal<ConversationThread[]>([]);
  readonly selectedThread = signal<ConversationThread | null>(null);
  readonly doctorOptions = signal<{ label: string; value: string }[]>([]);
  readonly mobilePanel = signal<'list' | 'thread'>('list');
  readonly isLargeScreen = signal(this.readLargeScreen());

  readonly newThreadForm = this.fb.nonNullable.group({ doctorId: ['', Validators.required] });

  readonly currentUserId = () => this.auth.user()?.id ?? 0;

  ngOnInit(): void {
    this.hub.received$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((msg) => {
      const thread = this.selectedThread();
      if (thread && this.messageBelongsToThread(msg, thread)) {
        this.messages.update((list) => [...list, msg]);
      }
      this.buildThreads(this.messages());
    });

    this.doctorsApi.list({ page: 1, pageSize: 100, sortBy: 'name' }).subscribe({
      next: (r) => this.doctorOptions.set(r.items.map((d) => ({ label: d.fullName, value: String(d.id) }))),
    });

    this.loadMessages();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isLargeScreen.set(this.readLargeScreen());
    if (this.isLargeScreen()) {
      this.mobilePanel.set('list');
    }
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  showConversationList(): void {
    this.mobilePanel.set('list');
  }

  selectThread(thread: ConversationThread): void {
    this.selectedThread.set(thread);
    if (!this.isLargeScreen()) {
      this.mobilePanel.set('thread');
    }
    this.loadMessagesForThread(thread);
  }

  selectBroadcast(): void {
    this.selectThread({ id: 'broadcast', title: 'Staff broadcast', subtitle: 'All clinical staff', target: 'StaffBroadcast' });
  }

  startDoctorThread(): void {
    const doctorId = Number(this.newThreadForm.getRawValue().doctorId);
    const label = this.doctorOptions().find((d) => d.value === String(doctorId))?.label ?? 'Doctor';
    this.selectThread({ id: `doctor-${doctorId}`, title: label, subtitle: 'Direct message', target: 'DoctorRoom', doctorId });
  }

  sendMessage(content: string): void {
    const thread = this.selectedThread();
    if (!thread) return;
    this.sending.set(true);
    this.error.set(null);

    const req$ = thread.target === 'StaffBroadcast'
      ? this.api.broadcast({ content })
      : this.api.sendToDoctor({ doctorId: thread.doctorId!, content });

    req$.subscribe({
      next: (msg) => {
        this.messages.update((list) => [...list, msg]);
        this.sending.set(false);
      },
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to send message.'));
        this.sending.set(false);
      },
    });
  }

  private loadMessages(): void {
    this.loading.set(true);
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (r) => {
        this.messages.set(r.items);
        this.buildThreads(r.items);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private loadMessagesForThread(thread: ConversationThread): void {
    this.loading.set(true);
    this.api.list({
      page: 1, pageSize: 100,
      target: thread.target,
      doctorId: thread.doctorId,
    }).subscribe({
      next: (r) => { this.messages.set(r.items); this.loading.set(false); },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private buildThreads(messages: StaffMessageDto[]): void {
    const map = new Map<string, ConversationThread>();
    map.set('broadcast', { id: 'broadcast', title: 'Staff broadcast', subtitle: 'All clinical staff', target: 'StaffBroadcast' });

    for (const msg of messages) {
      if (msg.target === 'StaffBroadcast') {
        const t = map.get('broadcast')!;
        map.set('broadcast', { ...t, lastMessage: msg.content, lastAt: msg.createdAtUtc });
      } else if (msg.doctorId) {
        const id = `doctor-${msg.doctorId}`;
        map.set(id, {
          id,
          title: msg.doctorName ?? `Doctor #${msg.doctorId}`,
          subtitle: 'Direct message',
          target: 'DoctorRoom',
          doctorId: msg.doctorId,
          lastMessage: msg.content,
          lastAt: msg.createdAtUtc,
        });
      }
    }
    this.threads.set(Array.from(map.values()));
  }

  private messageBelongsToThread(msg: StaffMessageDto, thread: ConversationThread): boolean {
    if (thread.target === 'StaffBroadcast') return msg.target === 'StaffBroadcast';
    return msg.target === 'DoctorRoom' && msg.doctorId === thread.doctorId;
  }

  private readLargeScreen(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= VIEWPORT.lg;
  }
}
