import { Routes } from '@angular/router';

export const STAFF_MESSAGE_ROUTES: Routes = [
  {
    path: 'messages',
    loadComponent: () => import('./pages/messaging-dashboard-page.component').then((m) => m.MessagingDashboardPageComponent),
    data: { title: 'Staff Messaging' },
  },
];
