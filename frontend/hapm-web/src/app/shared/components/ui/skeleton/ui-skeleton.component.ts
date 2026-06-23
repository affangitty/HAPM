import { Component, input } from '@angular/core';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  template: `<div [class]="cn('animate-pulse rounded-md bg-muted', className())"></div>`,
})
export class UiSkeletonComponent {
  readonly className = input('h-4 w-full', { alias: 'class' });
  protected readonly cn = cn;
}
