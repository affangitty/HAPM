import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const VITAL_ROUTES: Routes = [
  { path: 'vitals', loadComponent: () => import('./pages/vital-health-overview-page.component').then((m) => m.VitalHealthOverviewPageComponent), data: { title: 'Vital Signs' } },
  { path: 'vitals/history', loadComponent: () => import('./pages/vital-history-page.component').then((m) => m.VitalHistoryPageComponent), data: { title: 'Vital History' } },
  {
    path: 'vitals/record',
    loadComponent: () => import('./pages/vital-entry-page.component').then((m) => m.VitalEntryPageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Record Vitals' },
  },
  { path: 'vitals/trends', loadComponent: () => import('./pages/vital-trends-page.component').then((m) => m.VitalTrendsPageComponent), data: { title: 'Vital Trends' } },
  { path: 'vitals/:id', loadComponent: () => import('./pages/vital-detail-page.component').then((m) => m.VitalDetailPageComponent), data: { title: 'Vital Details' } },
];
