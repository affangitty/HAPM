import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '../ui/table/ui-table.component';
import { UiEmptyStateComponent } from '../ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../ui/skeleton/ui-skeleton.component';
import { UiPaginationComponent } from '../ui/pagination/ui-pagination.component';
import { DataTableColumn } from './data-table.models';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    UiTableComponent,
    UiTableHeaderComponent,
    UiTableBodyComponent,
    UiTableRowComponent,
    UiTableHeadComponent,
    UiTableCellComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    UiPaginationComponent,
  ],
  template: `
    @if (loading()) {
      <div class="space-y-3">
        @for (row of skeletonRows; track row) {
          <app-ui-skeleton class="h-12" />
        }
      </div>
    } @else if (!rows().length) {
      <app-ui-empty-state [title]="emptyTitle()" [message]="emptyMessage()" />
    } @else {
      <div class="-mx-1 overflow-x-auto">
      <app-ui-table>
        <thead appUiTableHeader>
          <tr appUiTableRow>
            @for (col of columns(); track col.key) {
              <th appUiTableHead [class]="col.headerClassName ?? ''">{{ col.header }}</th>
            }
          </tr>
        </thead>
        <tbody appUiTableBody>
          @for (row of rows(); track trackBy(row)) {
            <tr
              appUiTableRow
              [class]="rowLink() ? 'cursor-pointer hover:bg-muted/50' : ''"
              [attr.tabindex]="rowLink() ? 0 : null"
              [attr.role]="rowLink() ? 'button' : null"
              (click)="onRowActivate(row)"
              (keydown.enter)="onRowActivate(row)"
              (keydown.space)="$event.preventDefault(); onRowActivate(row)"
            >
              @for (col of columns(); track col.key) {
                <td appUiTableCell [class]="col.className ?? ''">{{ col.cell(row) }}</td>
              }
            </tr>
          }
        </tbody>
      </app-ui-table>
      </div>

      @if (showPagination()) {
        <app-ui-pagination
          class="mt-4"
          [page]="page()"
          [pageSize]="pageSize()"
          [totalCount]="totalCount()"
          (pageChange)="pageChange.emit($event)"
        />
      }
    }
  `,
})
export class DataTableComponent<T extends object> {
  private readonly router = inject(Router);

  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input<T[]>([]);
  readonly loading = input(false);
  readonly page = input(1);
  readonly pageSize = input(20);
  readonly totalCount = input(0);
  readonly showPagination = input(true);
  readonly emptyTitle = input('No records found');
  readonly emptyMessage = input('Try adjusting your filters or add a new record.');
  readonly trackByKey = input<string>('id');
  readonly rowLink = input<((row: T) => string | null) | null>(null);
  readonly pageChange = output<number>();
  readonly rowClick = output<T>();

  protected readonly skeletonRows = [1, 2, 3, 4, 5];

  trackBy(row: T): unknown {
    return (row as Record<string, unknown>)[this.trackByKey()];
  }

  onRowActivate(row: T): void {
    this.rowClick.emit(row);
    const link = this.rowLink()?.(row);
    if (link) {
      void this.router.navigateByUrl(link);
    }
  }
}
