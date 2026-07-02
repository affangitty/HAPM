import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const USER_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/user-list-page.component').then((m) => m.UserListPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'User Management' },
  },
];
