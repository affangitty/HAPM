import { Component, computed, input } from '@angular/core';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { AUDIT_ACTION_TONE, AuditAction } from '../../../shared/models/enums';

@Component({
  selector: 'app-audit-action-badge',
  standalone: true,
  imports: [UiStatusBadgeComponent],
  template: `<app-ui-status-badge [label]="action()" [tone]="tone()" />`,
})
export class AuditActionBadgeComponent {
  readonly action = input.required<AuditAction>();
  readonly tone = computed(() => AUDIT_ACTION_TONE[this.action()]);
}
