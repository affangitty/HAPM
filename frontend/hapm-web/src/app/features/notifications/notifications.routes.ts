import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [
  { path: 'notifications', loadComponent: () => import('./pages/notification-center-page.component').then((m) => m.NotificationCenterPageComponent), data: { title: 'Notification Center' } },
  { path: 'notifications/:id', loadComponent: () => import('./pages/notification-detail-page.component').then((m) => m.NotificationDetailPageComponent), data: { title: 'Notification Details' } },
];
