import { Component, computed, forwardRef, inject, input, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';
import { FORM_FIELD_CONTROL_ID } from '../../forms/form-field/form-field.tokens';
import { FormFieldA11yHost } from '../../forms/form-field/form-field-a11y.host';
import { formFieldAriaDescribedBy, formFieldAriaInvalid } from '../../../utils/form-field-a11y.util';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ui-input-host' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      class="ui-input-control"
      [id]="resolvedInputId()"
      [type]="type()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled"
      [value]="value"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-invalid]="ariaInvalidState()"
      [class]="classes"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
  styles: [
    `
      .ui-input-host {
        display: block;
        width: 100%;
      }

      .ui-input-control {
        display: block;
        width: 100%;
        min-height: 2.5rem;
        box-sizing: border-box;
      }
    `,
  ],
})
export class UiInputComponent implements ControlValueAccessor {
  private readonly formFieldId = inject(FORM_FIELD_CONTROL_ID, { optional: true });
  private readonly formFieldA11y = inject(FormFieldA11yHost, { optional: true });

  readonly type = input('text');
  readonly placeholder = input('');
  readonly className = input('', { alias: 'class' });
  readonly ariaInvalid = input<boolean | null>(null);
  readonly inputId = input<string | null>(null);

  readonly resolvedInputId = computed(() => this.inputId() ?? this.formFieldId ?? null);
  readonly ariaDescribedBy = computed(() => formFieldAriaDescribedBy(this.formFieldA11y));
  readonly ariaInvalidState = computed(() => formFieldAriaInvalid(this.formFieldA11y, this.ariaInvalid()));

  value = '';
  isDisabled = false;
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get classes(): string {
    return cn(
      'block h-10 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
      'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
      'disabled:cursor-not-allowed disabled:opacity-50',
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
