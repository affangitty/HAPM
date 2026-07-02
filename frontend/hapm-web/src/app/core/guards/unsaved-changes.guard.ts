import { CanDeactivateFn } from '@angular/router';
import { confirmDiscardUnsavedChanges } from '../../shared/utils/unsaved-changes.util';
import { HasUnsavedChanges } from './has-unsaved-changes';

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges?.()) {
    return true;
  }
  return confirmDiscardUnsavedChanges();
};
