import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/user-list-page.component').then((m) => m.UserListPageComponent),
    data: { title: 'User Management' },
  },
];
