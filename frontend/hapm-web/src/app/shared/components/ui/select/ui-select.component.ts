import { Component, computed, forwardRef, inject, input, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';
import { FORM_FIELD_CONTROL_ID } from '../../forms/form-field/form-field.tokens';
import { FormFieldA11yHost } from '../../forms/form-field/form-field-a11y.host';
import { formFieldAriaDescribedBy, formFieldAriaInvalid } from '../../../utils/form-field-a11y.util';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ui-select-host' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
  template: `
    <select
      class="ui-select-control"
      [id]="resolvedInputId()"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-invalid]="ariaInvalidState()"
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
  styles: [
    `
      .ui-select-host {
        display: block;
        width: 100%;
      }

      .ui-select-control {
        display: block;
        width: 100%;
        min-height: 2.5rem;
        box-sizing: border-box;
      }
    `,
  ],
})
export class UiSelectComponent implements ControlValueAccessor {
  private readonly formFieldId = inject(FORM_FIELD_CONTROL_ID, { optional: true });
  private readonly formFieldA11y = inject(FormFieldA11yHost, { optional: true });

  readonly placeholder = input('');
  readonly options = input<{ label: string; value: string }[]>([]);
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
      'block h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50',
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
