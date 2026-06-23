import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
  template: `
    <select
      [disabled]="isDisabled"
      [value]="value"
      [class]="classes"
      (change)="onChangeSelect($event)"
      (blur)="onTouched()"
    >
      @if (placeholder()) {
        <option value="" disabled>{{ placeholder() }}</option>
      }
      @for (opt of options(); track opt.value) {
        <option [value]="opt.value">{{ opt.label }}</option>
      }
    </select>
  `,
})
export class UiSelectComponent implements ControlValueAccessor {
  readonly placeholder = input('');
  readonly options = input<{ label: string; value: string }[]>([]);
  readonly className = input('', { alias: 'class' });

  value = '';
  isDisabled = false;
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get classes(): string {
    return cn(
      'flex h-9 w-full rounded-md border bg-input-background px-3 py-1 text-sm focus-ring disabled:opacity-50',
      this.className(),
    );
  }

  onChangeSelect(event: Event): void {
    const next = (event.target as HTMLSelectElement).value;
    this.value = next;
    this.onChange(next);
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
