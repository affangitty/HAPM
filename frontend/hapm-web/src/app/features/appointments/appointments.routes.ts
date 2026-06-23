import { Routes } from '@angular/router';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: 'appointments',
    loadComponent: () =>
      import('./pages/appointment-list-page.component').then((m) => m.AppointmentListPageComponent),
    data: { title: 'Appointments' },
  },
  {
    path: 'appointments/book',
    loadComponent: () =>
      import('./pages/appointment-book-page.component').then((m) => m.AppointmentBookPageComponent),
    data: { title: 'Book Appointment' },
  },
  {
    path: 'appointments/:id',
    loadComponent: () =>
      import('./pages/appointment-detail-page.component').then((m) => m.AppointmentDetailPageComponent),
    data: { title: 'Appointment Details' },
  },
];
