import { Component } from '@angular/core';

@Component({
  selector: 'app-ui-table',
  standalone: true,
  template: `
    <div class="relative w-full rounded-xl border bg-card">
      <table class="w-full border-collapse text-left text-sm md:min-w-[720px]">
        <ng-content />
      </table>
    </div>
  `,
})
export class UiTableComponent {}

@Component({
  selector: 'thead[appUiTableHeader]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class: 'border-b bg-muted/50 [&_tr]:border-b',
  },
})
export class UiTableHeaderComponent {}

@Component({
  selector: 'tbody[appUiTableBody]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class: '[&_tr:last-child]:border-0',
  },
})
export class UiTableBodyComponent {}

@Component({
  selector: 'tr[appUiTableRow]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class: 'border-b border-border/70 transition-colors hover:bg-muted/40',
  },
})
export class UiTableRowComponent {}

@Component({
  selector: 'th[appUiTableHead]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class:
      'h-12 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  },
})
export class UiTableHeadComponent {}

@Component({
  selector: 'td[appUiTableCell]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class: 'h-12 px-4 align-middle text-sm',
  },
})
export class UiTableCellComponent {}
