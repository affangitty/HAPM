import { Component, input, output } from '@angular/core';
import { UiSearchInputComponent } from '../search-input/ui-search-input.component';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-filter-bar',
  standalone: true,
  imports: [UiSearchInputComponent],
  template: `
    <div [class]="cn('mb-4 flex flex-col gap-3 rounded-xl border bg-card p-4 lg:flex-row lg:items-center', className())">
      <app-ui-search-input
        class="flex-1"
        [placeholder]="searchPlaceholder()"
        (searchChange)="searchChange.emit($event)"
      />
      <div class="flex flex-wrap items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class UiFilterBarComponent {
  readonly searchPlaceholder = input('Search...');
  readonly className = input('', { alias: 'class' });
  readonly searchChange = output<string>();
  protected readonly cn = cn;
}
