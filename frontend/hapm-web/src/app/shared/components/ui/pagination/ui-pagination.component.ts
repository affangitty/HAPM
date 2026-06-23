import { Component, input, output } from '@angular/core';
import { UiButtonComponent } from '../button/ui-button.component';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-pagination',
  standalone: true,
  imports: [UiButtonComponent],
  template: `
    <div [class]="cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className())">
      <p class="text-sm text-muted-foreground">{{ summary() }}</p>
      <div class="flex items-center gap-2">
        <app-ui-button
          variant="outline"
          size="sm"
          [disabled]="page() <= 1"
          (pressed)="pageChange.emit(page() - 1)"
        >
          Previous
        </app-ui-button>
        <span class="text-sm tabular-nums">Page {{ page() }} / {{ totalPages() }}</span>
        <app-ui-button
          variant="outline"
          size="sm"
          [disabled]="page() >= totalPages()"
          (pressed)="pageChange.emit(page() + 1)"
        >
          Next
        </app-ui-button>
      </div>
    </div>
  `,
})
export class UiPaginationComponent {
  readonly page = input(1);
  readonly pageSize = input(20);
  readonly totalCount = input(0);
  readonly className = input('', { alias: 'class' });
  readonly pageChange = output<number>();
  protected readonly cn = cn;

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  }

  summary(): string {
    if (this.totalCount() === 0) return 'Showing 0 results';
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), this.totalCount());
    return `Showing ${start}–${end} of ${this.totalCount()}`;
  }
}
