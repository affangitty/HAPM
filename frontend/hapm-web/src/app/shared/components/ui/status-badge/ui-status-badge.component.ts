import { Component, input } from '@angular/core';
import { UiBadgeComponent } from '../badge/ui-badge.component';
import { StatusTone } from '../../../models/enums';

@Component({
  selector: 'app-ui-status-badge',
  standalone: true,
  imports: [UiBadgeComponent],
  template: `<app-ui-badge [variant]="tone()">{{ label() }}</app-ui-badge>`,
})
export class UiStatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('default');
}
