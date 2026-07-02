import { DestroyRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';

export const UNSAVED_CHANGES_MESSAGE = 'You have unsaved changes. Leave this page without saving?';

export function confirmDiscardUnsavedChanges(): boolean {
  return confirm(UNSAVED_CHANGES_MESSAGE);
}

export function formsAreDirty(...forms: (AbstractControl | null | undefined)[]): boolean {
  return forms.some((form) => form?.dirty);
}

export function markFormsPristine(...forms: (AbstractControl | null | undefined)[]): void {
  for (const form of forms) {
    form?.markAsPristine();
  }
}

export function registerUnsavedChangesUnloadWarning(destroyRef: DestroyRef, hasUnsaved: () => boolean): void {
  const handler = (event: BeforeUnloadEvent) => {
    if (hasUnsaved()) {
      event.preventDefault();
    }
  };

  window.addEventListener('beforeunload', handler);
  destroyRef.onDestroy(() => window.removeEventListener('beforeunload', handler));
}

export function bindUnsavedChangesProtection(destroyRef: DestroyRef, hasUnsaved: () => boolean): void {
  registerUnsavedChangesUnloadWarning(destroyRef, hasUnsaved);
}
