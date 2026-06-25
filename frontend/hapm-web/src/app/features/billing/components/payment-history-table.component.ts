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
          <thead appUiTableHeader>
            <tr appUiTableRow>
              <th appUiTableHead>Receipt</th>
              <th appUiTableHead>Amount</th>
              <th appUiTableHead>Method</th>
              <th appUiTableHead class="hidden sm:table-cell">Notes</th>
              <th appUiTableHead>Date</th>
            </tr>
          </thead>
          <tbody appUiTableBody>
            @for (p of payments(); track p.id) {
              <tr appUiTableRow>
                <td appUiTableCell class="font-mono text-xs">{{ p.receiptNumber }}</td>
                <td appUiTableCell class="font-medium text-emerald-600">{{ '$' + p.amount.toFixed(2) }}</td>
                <td appUiTableCell>{{ p.method }}</td>
                <td appUiTableCell class="hidden sm:table-cell text-muted-foreground">{{ p.notes || '—' }}</td>
                <td appUiTableCell>{{ formatDate(p.paidAtUtc) }}</td>
              </tr>
            }
          </tbody>
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
