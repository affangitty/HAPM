import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

const doctorList = {
  path: 'doctors',
  loadComponent: () =>
    import('./pages/doctor-list-page.component').then((m) => m.DoctorListPageComponent),
  data: { title: 'Medical Staff Directory' },
};

const doctorDetail = {
  path: 'doctors/:id',
  loadComponent: () =>
    import('./pages/doctor-detail-page.component').then((m) => m.DoctorDetailPageComponent),
  data: { title: 'Doctor Details' },
};

/** Directory browsing for patients and receptionists. */
export const DOCTOR_BROWSE_ROUTES: Routes = [doctorList, doctorDetail];

/** Admin-only doctor management routes. */
export const DOCTOR_ADMIN_ROUTES: Routes = [
  {
    path: 'doctors/new',
    loadComponent: () =>
      import('./pages/doctor-register-page.component').then((m) => m.DoctorRegisterPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Register Doctor' },
  },
  {
    path: 'doctors/:id/edit',
    loadComponent: () =>
      import('./pages/doctor-edit-page.component').then((m) => m.DoctorEditPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Edit Doctor' },
  },
];

/** Static paths (new, edit) must come before `doctors/:id` so "new" is not parsed as an id. */
export const DOCTOR_DIRECTORY_ROUTES: Routes = [doctorList, ...DOCTOR_ADMIN_ROUTES, doctorDetail];

export const DOCTOR_SELF_ROUTES: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/doctor-profile-page.component').then((m) => m.DoctorProfilePageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'My Profile' },
  },
  {
    path: 'leaves',
    loadComponent: () =>
      import('./pages/doctor-leaves-page.component').then((m) => m.DoctorLeavesPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Leave Management' },
  },
];
