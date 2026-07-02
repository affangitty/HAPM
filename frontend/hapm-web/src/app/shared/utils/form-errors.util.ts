import { AbstractControl, FormGroup } from '@angular/forms';

const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  minlength: 'Value is too short.',
  maxlength: 'Value is too long.',
  pattern: 'Invalid format.',
  passwordMismatch: 'Passwords do not match.',
  strongPassword: 'Password must include upper, lower, number, and special character.',
};

function humanizeField(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function getControlError(
  control: AbstractControl | null | undefined,
  messages: Record<string, string> = {},
): string | null {
  if (!control?.touched || !control.errors) return null;
  const merged = { ...DEFAULT_MESSAGES, ...messages };
  const key = Object.keys(control.errors)[0];
  const err = control.errors[key];
  if (key === 'minlength' && err?.requiredLength) {
    return `Minimum ${err.requiredLength} characters required.`;
  }
  return merged[key] ?? 'Invalid value.';
}

export function getFormControlError<T extends string>(
  form: FormGroup,
  controlName: T,
  messages?: Record<string, string>,
): string | null {
  return getControlError(form.get(controlName), messages);
}

export function markFormGroupTouched(form: FormGroup): void {
  form.markAllAsTouched();
}

/** Collect human-readable validation messages from touched invalid controls. */
export function collectFormErrors(
  form: FormGroup,
  labels: Record<string, string> = {},
  messages: Record<string, string> = {},
): string[] {
  const items: string[] = [];
  for (const [name, control] of Object.entries(form.controls)) {
    const msg = getControlError(control, messages);
    if (msg) {
      const label = labels[name] ?? humanizeField(name);
      items.push(`${label}: ${msg}`);
    }
  }
  return items;
}

/**
 * Marks the form touched so inline field errors appear. Returns true when the form can be submitted.
 */
export function guardFormSubmit(form: FormGroup): boolean {
  if (form.valid) return true;
  markFormGroupTouched(form);
  return false;
}
