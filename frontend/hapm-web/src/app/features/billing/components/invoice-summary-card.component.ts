import { Component, input } from '@angular/core';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { InvoiceStatusBadgeComponent } from './invoice-status-badge.component';
import { InvoiceDto } from '../models/billing.models';

@Component({
  selector: 'app-invoice-summary-card',
  standalone: true,
  imports: [UiCardComponent, UiCardContentComponent, InvoiceStatusBadgeComponent],
  template: `
    <app-ui-card>
      <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p class="text-xs text-muted-foreground">Invoice</p>
          <p class="font-mono font-semibold">{{ invoice().invoiceNumber }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Patient</p>
          <p class="font-medium">{{ invoice().patientName }}</p>
          <p class="text-sm text-muted-foreground">MRN {{ invoice().medicalRecordNumber }}</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Total</p>
          <p class="text-xl font-bold">{{ formatMoney(invoice().totalAmount) }}</p>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs text-muted-foreground">Status</p>
          <app-invoice-status-badge [status]="invoice().status" />
          <p class="text-sm text-muted-foreground">Balance: {{ formatMoney(invoice().balanceDue) }}</p>
        </div>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class InvoiceSummaryCardComponent {
  readonly invoice = input.required<InvoiceDto>();

  formatMoney(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}
