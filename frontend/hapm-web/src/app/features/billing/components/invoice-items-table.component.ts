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
          <app-ui-table-header>
            <app-ui-table-row>
              <app-ui-table-head>Description</app-ui-table-head>
              <app-ui-table-head>Qty</app-ui-table-head>
              <app-ui-table-head>Unit price</app-ui-table-head>
              <app-ui-table-head>Amount</app-ui-table-head>
            </app-ui-table-row>
          </app-ui-table-header>
          <app-ui-table-body>
            @for (item of items(); track item.id) {
              <app-ui-table-row>
                <app-ui-table-cell>{{ item.description }}</app-ui-table-cell>
                <app-ui-table-cell>{{ item.quantity }}</app-ui-table-cell>
                <app-ui-table-cell>{{ '$' + item.unitPrice.toFixed(2) }}</app-ui-table-cell>
                <app-ui-table-cell class="font-medium">{{ '$' + item.amount.toFixed(2) }}</app-ui-table-cell>
              </app-ui-table-row>
            }
          </app-ui-table-body>
        </app-ui-table>
      </div>
    }
  `,
})
export class InvoiceItemsTableComponent {
  readonly items = input.required<InvoiceItemDto[]>();
}
