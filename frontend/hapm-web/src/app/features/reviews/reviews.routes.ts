import { Routes } from '@angular/router';

export const REVIEW_ROUTES: Routes = [
  { path: 'reviews', loadComponent: () => import('./pages/review-list-page.component').then((m) => m.ReviewListPageComponent), data: { title: 'Reviews' } },
  { path: 'reviews/:id', loadComponent: () => import('./pages/review-detail-page.component').then((m) => m.ReviewDetailPageComponent), data: { title: 'Review Details' } },
];

export const DOCTOR_PERFORMANCE_ROUTES: Routes = [
  { path: 'performance', loadComponent: () => import('./pages/ratings-dashboard-page.component').then((m) => m.RatingsDashboardPageComponent), data: { title: 'Performance' } },
  { path: 'performance/reviews', loadComponent: () => import('./pages/review-list-page.component').then((m) => m.ReviewListPageComponent), data: { title: 'Reviews' } },
  { path: 'performance/reviews/:id', loadComponent: () => import('./pages/review-detail-page.component').then((m) => m.ReviewDetailPageComponent), data: { title: 'Review Details' } },
  { path: 'performance/analytics', loadComponent: () => import('./pages/review-analytics-page.component').then((m) => m.ReviewAnalyticsPageComponent), data: { title: 'Review Analytics' } },
];
