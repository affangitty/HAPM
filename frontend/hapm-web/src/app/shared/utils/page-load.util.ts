import { WritableSignal } from '@angular/core';

/** Standard handler for page/list/dashboard load failures. */
export function setPageLoadFailed(
  loading: WritableSignal<boolean>,
  loadError: WritableSignal<string | null>,
  message = 'Unable to load data. Please try again.',
): void {
  loading.set(false);
  loadError.set(message);
}
