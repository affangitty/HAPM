import {
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';
import { FormControlA11yState } from '../../forms/form-field/form-control-a11y.state';
import { FORM_FIELD_LINKABLE } from '../../forms/form-field/form-field-linkable';
import { formFieldAriaDescribedBy, formFieldAriaInvalid } from '../../../utils/form-field-a11y.util';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ui-select-host' },
  providers: [
    FormControlA11yState,
    { provide: FORM_FIELD_LINKABLE, useExisting: FormControlA11yState },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
  template: `
    <select
      #selectEl
      class="ui-select-control"
      [id]="resolvedInputId()"
      [attr.name]="resolvedName()"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-invalid]="ariaInvalidState()"
      [disabled]="isDisabled"
      [class]="classes"
      (change)="onChangeSelect($event)"
      (blur)="onTouched()"
    >
      @if (placeholder()) {
        <option value="">{{ placeholder() }}</option>
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
  private readonly a11y = inject(FormControlA11yState);
  private readonly selectRef = viewChild<ElementRef<HTMLSelectElement>>('selectEl');

  readonly placeholder = input('');
  readonly options = input<{ label: string; value: string }[]>([]);
  readonly className = input('', { alias: 'class' });
  readonly ariaInvalid = input<boolean | null>(null);
  readonly inputId = input<string | null>(null);
  readonly inputName = input<string | null>(null);

  readonly resolvedInputId = computed(() => this.a11y.resolveId(this.inputId()));
  readonly resolvedName = computed(() => this.a11y.resolveName(this.inputName(), this.resolvedInputId()));
  readonly ariaDescribedBy = computed(() => formFieldAriaDescribedBy(this.a11y.fieldHost()));
  readonly ariaInvalidState = computed(() => formFieldAriaInvalid(this.a11y.fieldHost(), this.ariaInvalid()));

  value = '';
  isDisabled = false;
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.options();
      this.syncNativeSelect();
    });
  }

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

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.syncNativeSelect();
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

  /** Keep the native select element in sync when options load after writeValue. */
  private syncNativeSelect(): void {
    queueMicrotask(() => {
      const el = this.selectRef()?.nativeElement;
      if (!el) return;

      const optionValues = Array.from(el.options).map((o) => o.value);
      if (this.value === '' || optionValues.includes(this.value)) {
        el.value = this.value;
      }
    });
  }
}
