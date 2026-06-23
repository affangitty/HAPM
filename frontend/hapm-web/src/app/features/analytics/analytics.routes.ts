import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/admin-analytics-page.component').then((m) => m.AdminAnalyticsPageComponent),
    data: { title: 'Analytics' },
  },
];
