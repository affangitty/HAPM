import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const PATIENT_DIRECTORY_ROUTES: Routes = [
  {
    path: 'patients',
    loadComponent: () =>
      import('./pages/patient-list-page.component').then((m) => m.PatientListPageComponent),
    data: { title: 'Patient Directory' },
  },
  {
    path: 'patients/new',
    loadComponent: () =>
      import('./pages/patient-register-page.component').then((m) => m.PatientRegisterPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Register Patient' },
  },
  {
    path: 'patients/:id',
    loadComponent: () =>
      import('./pages/patient-detail-page.component').then((m) => m.PatientDetailPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Patient Profile' },
  },
];

export const PATIENT_SELF_ROUTES: Routes = [
  {
    path: 'records',
    loadComponent: () =>
      import('./pages/patient-records-page.component').then((m) => m.PatientRecordsPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Medical Records' },
  },
];
