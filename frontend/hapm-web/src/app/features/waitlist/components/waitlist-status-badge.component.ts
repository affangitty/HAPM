import { Component, computed, input } from '@angular/core';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { WAITLIST_STATUS_TONE, WaitlistStatus } from '../../../shared/models/enums';

@Component({
  selector: 'app-waitlist-status-badge',
  standalone: true,
  imports: [UiStatusBadgeComponent],
  template: `<app-ui-status-badge [label]="status()" [tone]="tone()" />`,
})
export class WaitlistStatusBadgeComponent {
  readonly status = input.required<WaitlistStatus>();

  readonly tone = computed(() => WAITLIST_STATUS_TONE[this.status()]);
}
