import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const WAITLIST_ROUTES: Routes = [
  {
    path: 'waitlist',
    loadComponent: () =>
      import('./pages/waitlist-dashboard-page.component').then((m) => m.WaitlistDashboardPageComponent),
    data: { title: 'Waitlist Dashboard' },
  },
  {
    path: 'waitlist/list',
    loadComponent: () =>
      import('./pages/waitlist-list-page.component').then((m) => m.WaitlistListPageComponent),
    data: { title: 'Waitlist' },
  },
  {
    path: 'waitlist/join',
    loadComponent: () =>
      import('./pages/waitlist-join-page.component').then((m) => m.WaitlistJoinPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Join Waitlist' },
  },
  {
    path: 'waitlist/:id/promotion',
    loadComponent: () =>
      import('./pages/waitlist-promotion-page.component').then((m) => m.WaitlistPromotionPageComponent),
    data: { title: 'Promotion Workflow' },
  },
  {
    path: 'waitlist/:id',
    loadComponent: () =>
      import('./pages/waitlist-detail-page.component').then((m) => m.WaitlistDetailPageComponent),
    data: { title: 'Waitlist Details' },
  },
];
