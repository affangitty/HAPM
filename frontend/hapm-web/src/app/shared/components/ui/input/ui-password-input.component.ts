import { Component, computed, forwardRef, inject, input, signal, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';
import { FormControlA11yState } from '../../forms/form-field/form-control-a11y.state';
import { FORM_FIELD_LINKABLE } from '../../forms/form-field/form-field-linkable';
import { formFieldAriaDescribedBy, formFieldAriaInvalid } from '../../../utils/form-field-a11y.util';

@Component({
  selector: 'app-ui-password-input',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ui-password-input-host' },
  providers: [
    FormControlA11yState,
    { provide: FORM_FIELD_LINKABLE, useExisting: FormControlA11yState },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiPasswordInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative">
      <input
        class="ui-password-input-control"
        [id]="resolvedInputId()"
        [attr.name]="resolvedName()"
        [type]="visible() ? 'text' : 'password'"
        [placeholder]="placeholder()"
        [disabled]="isDisabled"
        [value]="value"
        autocomplete="current-password"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-invalid]="ariaInvalidState()"
        [class]="classes"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
        [attr.aria-pressed]="visible()"
        (click)="toggleVisible()"
      >
        @if (visible()) {
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M1 1l22 22" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          </svg>
        } @else {
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      </button>
    </div>
  `,
  styles: [
    `
      .ui-password-input-host {
        display: block;
        width: 100%;
      }

      .ui-password-input-control {
        display: block;
        width: 100%;
        min-height: 2.5rem;
        box-sizing: border-box;
      }
    `,
  ],
})
export class UiPasswordInputComponent implements ControlValueAccessor {
  private readonly a11y = inject(FormControlA11yState);

  readonly placeholder = input('');
  readonly className = input('', { alias: 'class' });
  readonly ariaInvalid = input<boolean | null>(null);
  readonly inputId = input<string | null>(null);
  readonly inputName = input<string | null>(null);

  readonly resolvedInputId = computed(() => this.a11y.resolveId(this.inputId()));
  readonly resolvedName = computed(() => this.a11y.resolveName(this.inputName(), this.resolvedInputId()));
  readonly ariaDescribedBy = computed(() => formFieldAriaDescribedBy(this.a11y.fieldHost()));
  readonly ariaInvalidState = computed(() => formFieldAriaInvalid(this.a11y.fieldHost(), this.ariaInvalid()));

  readonly visible = signal(false);

  value = '';
  isDisabled = false;
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get classes(): string {
    return cn(
      'block h-10 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 shadow-sm',
      'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
      'disabled:cursor-not-allowed disabled:opacity-50',
      this.className(),
    );
  }

  toggleVisible(): void {
    this.visible.update((v) => !v);
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
