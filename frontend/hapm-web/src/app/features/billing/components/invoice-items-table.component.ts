import { Component, input } from '@angular/core';
import {
  UiTableBodyComponent, UiTableCellComponent, UiTableComponent,
  UiTableHeadComponent, UiTableHeaderComponent, UiTableRowComponent,
} from '../../../shared/components/ui/table/ui-table.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { InvoiceItemDto } from '../models/billing.models';

@Component({
  selector: 'app-invoice-items-table',
  standalone: true,
  imports: [UiTableComponent, UiTableHeaderComponent, UiTableBodyComponent, UiTableRowComponent, UiTableHeadComponent, UiTableCellComponent, UiEmptyStateComponent],
  template: `
    @if (!items().length) {
      <app-ui-empty-state title="No line items" message="This invoice has no items." />
    } @else {
      <div class="overflow-x-auto rounded-xl border">
        <app-ui-table>
          <thead appUiTableHeader>
            <tr appUiTableRow>
              <th appUiTableHead>Description</th>
              <th appUiTableHead>Qty</th>
              <th appUiTableHead>Unit price</th>
              <th appUiTableHead>Amount</th>
            </tr>
          </thead>
          <tbody appUiTableBody>
            @for (item of items(); track item.id) {
              <tr appUiTableRow>
                <td appUiTableCell>{{ item.description }}</td>
                <td appUiTableCell>{{ item.quantity }}</td>
                <td appUiTableCell>{{ '$' + item.unitPrice.toFixed(2) }}</td>
                <td appUiTableCell class="font-medium">{{ '$' + item.amount.toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </app-ui-table>
      </div>
    }
  `,
})
export class InvoiceItemsTableComponent {
  readonly items = input.required<InvoiceItemDto[]>();
}
