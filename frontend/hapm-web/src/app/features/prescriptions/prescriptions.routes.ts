import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const PRESCRIPTION_ROUTES: Routes = [
  {
    path: 'prescriptions',
    loadComponent: () =>
      import('./pages/prescription-list-page.component').then((m) => m.PrescriptionListPageComponent),
    data: { title: 'Prescriptions' },
  },
  {
    path: 'prescriptions/history',
    loadComponent: () =>
      import('./pages/prescription-history-page.component').then((m) => m.PrescriptionHistoryPageComponent),
    data: { title: 'Prescription History' },
  },
  {
    path: 'prescriptions/create',
    loadComponent: () =>
      import('./pages/prescription-create-page.component').then((m) => m.PrescriptionCreatePageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Create Prescription' },
  },
  {
    path: 'prescriptions/:id',
    loadComponent: () =>
      import('./pages/prescription-detail-page.component').then((m) => m.PrescriptionDetailPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Prescription Details' },
  },
];
