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
  ],
  template: `
    @if (!items().length) {
      <app-ui-empty-state title="No medications" message="This prescription has no medication items." />
    } @else {
      <div class="overflow-x-auto rounded-xl border">
        <app-ui-table>
          <app-ui-table-header>
            <app-ui-table-row>
              <app-ui-table-head>Medicine</app-ui-table-head>
              <app-ui-table-head>Dosage</app-ui-table-head>
              <app-ui-table-head>Frequency</app-ui-table-head>
              <app-ui-table-head>Duration</app-ui-table-head>
              <app-ui-table-head class="hidden sm:table-cell">Instructions</app-ui-table-head>
            </app-ui-table-row>
          </app-ui-table-header>
          <app-ui-table-body>
            @for (item of items(); track item.id ?? item.medicineName + $index; let i = $index) {
              <app-ui-table-row>
                <app-ui-table-cell class="font-medium">{{ item.medicineName }}</app-ui-table-cell>
                <app-ui-table-cell>{{ item.dosage }}</app-ui-table-cell>
                <app-ui-table-cell>{{ item.frequency }}</app-ui-table-cell>
                <app-ui-table-cell>{{ item.durationDays }} days</app-ui-table-cell>
                <app-ui-table-cell class="hidden sm:table-cell text-muted-foreground">
                  {{ item.instructions || '—' }}
                </app-ui-table-cell>
              </app-ui-table-row>
            }
          </app-ui-table-body>
        </app-ui-table>
      </div>
    }
  `,
})
export class MedicationTableComponent {
  readonly items = input.required<PrescriptionItemDto[]>();
}
