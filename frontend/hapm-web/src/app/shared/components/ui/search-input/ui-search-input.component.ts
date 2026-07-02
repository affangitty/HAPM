import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-search-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div [class]="cn('relative', className())">
      <svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        id="global-search"
        name="search"
        type="search"
        [placeholder]="placeholder()"
        aria-label="Search patients, doctors, appointments, and billing"
        [(ngModel)]="query"
        (ngModelChange)="searchChange.emit($event)"
        class="h-9 w-full rounded-lg border bg-muted pl-9 pr-3 text-sm focus-ring"
      />
    </div>
  `,
})
export class UiSearchInputComponent {
  readonly placeholder = input('Search...');
  readonly className = input('', { alias: 'class' });
  readonly searchChange = output<string>();
  protected readonly cn = cn;
  query = '';
}
