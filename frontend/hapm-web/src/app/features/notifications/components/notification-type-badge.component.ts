import { Component, input } from '@angular/core';
import { UiBadgeComponent } from '../../../shared/components/ui/badge/ui-badge.component';
import { NotificationType } from '../../../shared/models/enums';

@Component({
  selector: 'app-notification-type-badge',
  standalone: true,
  imports: [UiBadgeComponent],
  template: `<app-ui-badge [variant]="variant()">{{ type() }}</app-ui-badge>`,
})
export class NotificationTypeBadgeComponent {
  readonly type = input.required<NotificationType>();

  variant(): 'default' | 'success' | 'warning' | 'info' | 'destructive' | 'secondary' {
    const map: Partial<Record<NotificationType, 'default' | 'success' | 'warning' | 'info' | 'destructive' | 'secondary'>> = {
      AppointmentCancelled: 'destructive',
      PaymentReceived: 'success',
      LabReportUploaded: 'info',
      WaitlistSlotOpened: 'warning',
    };
    return map[this.type()] ?? 'secondary';
  }
}
