import { inject } from '@angular/core';
import { FormFieldA11yHost } from '../components/forms/form-field/form-field-a11y.host';

export function injectFormFieldA11y(): FormFieldA11yHost | null {
  return inject(FormFieldA11yHost, { optional: true, skipSelf: true });
}

export function formFieldAriaDescribedBy(a11y: FormFieldA11yHost | null): string | null {
  return a11y?.describedBy ?? null;
}

export function formFieldAriaInvalid(a11y: FormFieldA11yHost | null, explicit: boolean | null): boolean | null {
  if (explicit !== null) return explicit;
  return a11y?.invalid ? true : null;
}
