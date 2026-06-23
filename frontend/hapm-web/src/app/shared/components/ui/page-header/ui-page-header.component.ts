import { Component, input } from '@angular/core';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-page-header',
  standalone: true,
  template: `
    <div [class]="cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className())">
      <div>
        <h1 class="text-headline-md text-foreground">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-muted-foreground">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <ng-content select="[actions]" />
      </div>
    </div>
  `,
})
export class UiPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;
}
