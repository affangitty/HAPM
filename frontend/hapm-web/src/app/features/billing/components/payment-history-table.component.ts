import { Component, input } from '@angular/core';
import {
  UiTableBodyComponent, UiTableCellComponent, UiTableComponent,
  UiTableHeadComponent, UiTableHeaderComponent, UiTableRowComponent,
} from '../../../shared/components/ui/table/ui-table.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { PaymentDto } from '../models/billing.models';

@Component({
  selector: 'app-payment-history-table',
  standalone: true,
  imports: [UiTableComponent, UiTableHeaderComponent, UiTableBodyComponent, UiTableRowComponent, UiTableHeadComponent, UiTableCellComponent, UiEmptyStateComponent],
  template: `
    @if (!payments().length) {
      <app-ui-empty-state title="No payments" message="Payment records will appear here." />
    } @else {
      <div class="overflow-x-auto rounded-xl border">
        <app-ui-table>
          <app-ui-table-header>
            <app-ui-table-row>
              <app-ui-table-head>Receipt</app-ui-table-head>
              <app-ui-table-head>Amount</app-ui-table-head>
              <app-ui-table-head>Method</app-ui-table-head>
              <app-ui-table-head class="hidden sm:table-cell">Notes</app-ui-table-head>
              <app-ui-table-head>Date</app-ui-table-head>
            </app-ui-table-row>
          </app-ui-table-header>
          <app-ui-table-body>
            @for (p of payments(); track p.id) {
              <app-ui-table-row>
                <app-ui-table-cell class="font-mono text-xs">{{ p.receiptNumber }}</app-ui-table-cell>
                <app-ui-table-cell class="font-medium text-emerald-600">{{ '$' + p.amount.toFixed(2) }}</app-ui-table-cell>
                <app-ui-table-cell>{{ p.method }}</app-ui-table-cell>
                <app-ui-table-cell class="hidden sm:table-cell text-muted-foreground">{{ p.notes || '—' }}</app-ui-table-cell>
                <app-ui-table-cell>{{ formatDate(p.paidAtUtc) }}</app-ui-table-cell>
              </app-ui-table-row>
            }
          </app-ui-table-body>
        </app-ui-table>
      </div>
    }
  `,
})
export class PaymentHistoryTableComponent {
  readonly payments = input.required<PaymentDto[]>();

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
  }
}
