import { Component, computed, forwardRef, inject, input, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';
import { FormControlA11yState } from '../../forms/form-field/form-control-a11y.state';
import { FORM_FIELD_LINKABLE } from '../../forms/form-field/form-field-linkable';
import { formFieldAriaDescribedBy, formFieldAriaInvalid } from '../../../utils/form-field-a11y.util';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ui-input-host' },
  providers: [
    FormControlA11yState,
    { provide: FORM_FIELD_LINKABLE, useExisting: FormControlA11yState },
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
      [attr.name]="resolvedName()"
      [type]="type()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled"
      [value]="value"
      [attr.autocomplete]="autocomplete() || null"
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
  private readonly a11y = inject(FormControlA11yState);

  readonly type = input('text');
  readonly placeholder = input('');
  readonly className = input('', { alias: 'class' });
  readonly ariaInvalid = input<boolean | null>(null);
  readonly inputId = input<string | null>(null);
  readonly inputName = input<string | null>(null);
  readonly autocomplete = input('');

  readonly resolvedInputId = computed(() => this.a11y.resolveId(this.inputId()));
  readonly resolvedName = computed(() => this.a11y.resolveName(this.inputName(), this.resolvedInputId()));
  readonly ariaDescribedBy = computed(() => formFieldAriaDescribedBy(this.a11y.fieldHost()));
  readonly ariaInvalidState = computed(() => formFieldAriaInvalid(this.a11y.fieldHost(), this.ariaInvalid()));

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
