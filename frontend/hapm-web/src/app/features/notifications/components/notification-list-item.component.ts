import { Component, input, output } from '@angular/core';
import { NotificationType } from '../../../shared/models/enums';
import { NotificationDto } from '../models/notification.models';

@Component({
  selector: 'app-notification-list-item',
  standalone: true,
  template: `
    <button
      type="button"
      class="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      [class]="notification().isRead ? '' : 'bg-blue-50/40'"
      (click)="selected.emit(notification())"
    >
      <div class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl" [class]="iconStyle().bg">
        <svg class="size-4" [class]="iconStyle().color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path [attr.d]="iconStyle().path" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="text-sm font-medium" [class]="notification().isRead ? 'text-muted-foreground' : 'text-foreground'">
            {{ notification().title }}
          </p>
          @if (isCritical()) {
            <span class="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Critical</span>
          }
        </div>
        <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">{{ notification().message }}</p>
        <p class="mt-1 text-[10px] text-muted-foreground">{{ relativeTime(notification().createdAtUtc) }}</p>
      </div>
      @if (!notification().isRead) {
        <div class="mt-2 size-2 shrink-0 rounded-full bg-blue-500"></div>
      }
    </button>
  `,
})
export class NotificationListItemComponent {
  readonly notification = input.required<NotificationDto>();
  readonly selected = output<NotificationDto>();

  iconStyle(): { bg: string; color: string; path: string } {
    const type = this.notification().type;
    const map: Partial<Record<NotificationType, { bg: string; color: string; path: string }>> = {
      AppointmentBooked: { bg: 'bg-blue-50', color: 'text-blue-500', path: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
      AppointmentConfirmed: { bg: 'bg-blue-50', color: 'text-blue-500', path: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
      AppointmentCancelled: { bg: 'bg-blue-50', color: 'text-blue-500', path: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
      AppointmentReminder: { bg: 'bg-blue-50', color: 'text-blue-500', path: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
      AppointmentCompleted: { bg: 'bg-blue-50', color: 'text-blue-500', path: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
      LabReportUploaded: { bg: 'bg-teal-50', color: 'text-teal-500', path: 'M9 3h6l3 7v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10l3-7z' },
      PaymentReceived: { bg: 'bg-emerald-50', color: 'text-emerald-500', path: 'M2 8h20M2 12h20M6 16h.01M10 16h.01' },
      InvoiceGenerated: { bg: 'bg-emerald-50', color: 'text-emerald-500', path: 'M2 8h20M2 12h20M6 16h.01M10 16h.01' },
      PrescriptionIssued: { bg: 'bg-violet-50', color: 'text-violet-500', path: 'M10.5 20.5 14 17l8-8-3.5-3.5-8 8-3.5 3.5z' },
      WaitlistSlotOpened: { bg: 'bg-amber-50', color: 'text-amber-500', path: 'M12 8v4l3 3' },
      FollowUpDue: { bg: 'bg-amber-50', color: 'text-amber-500', path: 'M12 8v4l3 3' },
    };
    return map[type] ?? { bg: 'bg-slate-100', color: 'text-slate-500', path: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' };
  }

  isCritical(): boolean {
    return this.notification().type === 'AppointmentCancelled' || this.notification().message.toLowerCase().includes('critical');
  }

  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return new Date(iso).toLocaleDateString();
  }
}
