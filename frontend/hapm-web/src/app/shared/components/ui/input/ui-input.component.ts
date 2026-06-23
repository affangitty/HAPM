import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      [type]="type()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled"
      [value]="value"
      [class]="classes"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
})
export class UiInputComponent implements ControlValueAccessor {
  readonly type = input('text');
  readonly placeholder = input('');
  readonly className = input('', { alias: 'class' });

  value = '';
  isDisabled = false;
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get classes(): string {
    return cn(
      'flex h-9 w-full min-w-0 rounded-md border bg-input-background px-3 py-1 text-sm',
      'placeholder:text-muted-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-50',
      this.className(),
    );
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
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
