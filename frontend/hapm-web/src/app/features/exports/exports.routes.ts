import { Routes } from '@angular/router';

export const EXPORT_ROUTES: Routes = [
  {
    path: 'exports',
    loadComponent: () =>
      import('./pages/exports-page.component').then((m) => m.ExportsPageComponent),
    data: { title: 'CSV Exports' },
  },
];
