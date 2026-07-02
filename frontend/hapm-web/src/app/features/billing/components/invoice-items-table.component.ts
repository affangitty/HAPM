import { Component, input } from '@angular/core';
import {
  UiTableBodyComponent, UiTableCellComponent, UiTableComponent,
  UiTableHeadComponent, UiTableHeaderComponent, UiTableRowComponent,
} from '../../../shared/components/ui/table/ui-table.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { MobileRecordCardComponent } from '../../../shared/components/mobile-record-card/mobile-record-card.component';
import { InvoiceItemDto } from '../models/billing.models';

@Component({
  selector: 'app-invoice-items-table',
  standalone: true,
  imports: [
    UiTableComponent, UiTableHeaderComponent, UiTableBodyComponent, UiTableRowComponent,
    UiTableHeadComponent, UiTableCellComponent, UiEmptyStateComponent, MobileRecordCardComponent,
  ],
  template: `
    @if (!items().length) {
      <app-ui-empty-state title="No line items" message="This invoice has no items." />
    } @else {
      <div class="space-y-3 md:hidden">
        @for (item of items(); track item.id) {
          <app-mobile-record-card
            [title]="item.description"
            [fields]="[
              { label: 'Qty', value: '' + item.quantity },
              { label: 'Unit price', value: '$' + item.unitPrice.toFixed(2) },
              { label: 'Amount', value: '$' + item.amount.toFixed(2) },
            ]"
          />
        }
      </div>

      <div class="hidden md:block">
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
