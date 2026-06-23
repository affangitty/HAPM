import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'app-ui-textarea',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextareaComponent),
      multi: true,
    },
  ],
  template: `
    <textarea
      [rows]="rows()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled"
      [value]="value"
      [class]="classes"
      (input)="onInput($event)"
      (blur)="onTouched()"
    ></textarea>
  `,
})
export class UiTextareaComponent implements ControlValueAccessor {
  readonly rows = input(3);
  readonly placeholder = input('');
  readonly className = input('', { alias: 'class' });

  value = '';
  isDisabled = false;
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get classes(): string {
    return cn(
      'flex min-h-[80px] w-full rounded-md border bg-input-background px-3 py-2 text-sm',
      'placeholder:text-muted-foreground focus-ring disabled:opacity-50',
      this.className(),
    );
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLTextAreaElement).value;
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
