import { Component, input } from '@angular/core';
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '../../../shared/components/ui/table/ui-table.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { MobileRecordCardComponent } from '../../../shared/components/mobile-record-card/mobile-record-card.component';
import { PrescriptionItemDto } from '../models/prescription.models';

@Component({
  selector: 'app-medication-table',
  standalone: true,
  imports: [
    UiTableComponent,
    UiTableHeaderComponent,
    UiTableBodyComponent,
    UiTableRowComponent,
    UiTableHeadComponent,
    UiTableCellComponent,
    UiEmptyStateComponent,
    MobileRecordCardComponent,
  ],
  template: `
    @if (!items().length) {
      <app-ui-empty-state title="No medications" message="This prescription has no medication items." />
    } @else {
      <div class="space-y-3 md:hidden">
        @for (item of items(); track item.id ?? item.medicineName + $index; let i = $index) {
          <app-mobile-record-card
            [title]="item.medicineName"
            [subtitle]="item.dosage"
            [fields]="[
              { label: 'Frequency', value: item.frequency },
              { label: 'Duration', value: item.durationDays + ' days' },
              { label: 'Instructions', value: item.instructions || '—' },
            ]"
          />
        }
      </div>

      <div class="hidden md:block">
        <app-ui-table>
          <thead appUiTableHeader>
            <tr appUiTableRow>
              <th appUiTableHead>Medicine</th>
              <th appUiTableHead>Dosage</th>
              <th appUiTableHead>Frequency</th>
              <th appUiTableHead>Duration</th>
              <th appUiTableHead>Instructions</th>
            </tr>
          </thead>
          <tbody appUiTableBody>
            @for (item of items(); track item.id ?? item.medicineName + $index; let i = $index) {
              <tr appUiTableRow>
                <td appUiTableCell class="font-medium">{{ item.medicineName }}</td>
                <td appUiTableCell>{{ item.dosage }}</td>
                <td appUiTableCell>{{ item.frequency }}</td>
                <td appUiTableCell>{{ item.durationDays }} days</td>
                <td appUiTableCell class="text-muted-foreground">{{ item.instructions || '—' }}</td>
              </tr>
            }
          </tbody>
        </app-ui-table>
      </div>
    }
  `,
})
export class MedicationTableComponent {
  readonly items = input.required<PrescriptionItemDto[]>();
}
