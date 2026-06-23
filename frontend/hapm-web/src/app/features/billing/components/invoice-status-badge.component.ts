import { Component, computed, input } from '@angular/core';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { INVOICE_STATUS_TONE, InvoiceStatus } from '../../../shared/models/enums';

@Component({
  selector: 'app-invoice-status-badge',
  standalone: true,
  imports: [UiStatusBadgeComponent],
  template: `<app-ui-status-badge [label]="status()" [tone]="tone()" />`,
})
export class InvoiceStatusBadgeComponent {
  readonly status = input.required<InvoiceStatus>();
  readonly tone = computed(() => INVOICE_STATUS_TONE[this.status()]);
}
