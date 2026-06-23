import { Component, input } from '@angular/core';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <div [class]="cn('flex flex-col gap-1.5', className())">
      @if (label()) {
        <label class="text-sm font-medium text-foreground">
          {{ label() }}
          @if (required()) {
            <span class="text-destructive">*</span>
          }
        </label>
      }
      <ng-content />
      @if (hint() && !error()) {
        <p class="text-xs text-muted-foreground">{{ hint() }}</p>
      }
      @if (error()) {
        <p class="text-xs text-destructive">{{ error() }}</p>
      }
    </div>
  `,
})
export class FormFieldComponent {
  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false);
  readonly className = input('', { alias: 'class' });
  protected readonly cn = cn;
}
