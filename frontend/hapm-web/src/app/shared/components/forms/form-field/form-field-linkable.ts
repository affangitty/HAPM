import { InjectionToken } from '@angular/core';
import { FormFieldA11yHost } from './form-field-a11y.host';

export interface FormFieldLinkable {
  linkFormField(host: FormFieldA11yHost): void;
}

export const FORM_FIELD_LINKABLE = new InjectionToken<FormFieldLinkable>('FORM_FIELD_LINKABLE');
