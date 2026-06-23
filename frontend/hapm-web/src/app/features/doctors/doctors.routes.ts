import { Routes } from '@angular/router';

export const DOCTOR_DIRECTORY_ROUTES: Routes = [
  {
    path: 'doctors',
    loadComponent: () =>
      import('./pages/doctor-list-page.component').then((m) => m.DoctorListPageComponent),
    data: { title: 'Medical Staff Directory' },
  },
  {
    path: 'doctors/:id',
    loadComponent: () =>
      import('./pages/doctor-detail-page.component').then((m) => m.DoctorDetailPageComponent),
    data: { title: 'Doctor Details' },
  },
];

export const DOCTOR_SELF_ROUTES: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/doctor-profile-page.component').then((m) => m.DoctorProfilePageComponent),
    data: { title: 'My Profile' },
  },
  {
    path: 'leaves',
    loadComponent: () =>
      import('./pages/doctor-leaves-page.component').then((m) => m.DoctorLeavesPageComponent),
    data: { title: 'Leave Management' },
  },
];
