import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-checkbox',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label [class]="cn('inline-flex items-center gap-2 text-sm', className())">
      <input
        type="checkbox"
        [checked]="value"
        [disabled]="isDisabled"
        class="size-4 rounded border-border text-primary focus-ring"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <ng-content />
    </label>
  `,
})
export class UiCheckboxComponent implements ControlValueAccessor {
  readonly className = input('', { alias: 'class' });

  value = false;
  isDisabled = false;
  onChange: (value: boolean) => void = () => undefined;
  onTouched: () => void = () => undefined;
  protected readonly cn = cn;

  onToggle(event: Event): void {
    this.value = (event.target as HTMLInputElement).checked;
    this.onChange(this.value);
  }

  writeValue(value: boolean): void {
    this.value = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
