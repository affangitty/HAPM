import { Component } from '@angular/core';

@Component({
  selector: 'app-ui-table',
  standalone: true,
  template: `
    <div class="relative w-full overflow-x-auto rounded-xl border bg-card">
      <table class="w-full caption-bottom text-sm">
        <ng-content />
      </table>
    </div>
  `,
})
export class UiTableComponent {}

@Component({
  selector: 'app-ui-table-header',
  standalone: true,
  template: `<thead class="[&_tr]:border-b bg-muted/50"><ng-content /></thead>`,
})
export class UiTableHeaderComponent {}

@Component({
  selector: 'app-ui-table-body',
  standalone: true,
  template: `<tbody class="[&_tr:last-child]:border-0"><ng-content /></tbody>`,
})
export class UiTableBodyComponent {}

@Component({
  selector: 'app-ui-table-row',
  standalone: true,
  template: `<tr class="border-b transition-colors hover:bg-muted/50"><ng-content /></tr>`,
})
export class UiTableRowComponent {}

@Component({
  selector: 'app-ui-table-head',
  standalone: true,
  template: `
    <th class="h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <ng-content />
    </th>
  `,
})
export class UiTableHeadComponent {}

@Component({
  selector: 'app-ui-table-cell',
  standalone: true,
  template: `<td class="h-12 px-4 align-middle text-sm tabular-nums"><ng-content /></td>`,
})
export class UiTableCellComponent {}
