import { Routes } from '@angular/router';

export const AUDIT_LOG_ROUTES: Routes = [
  { path: 'audit-logs', loadComponent: () => import('./pages/audit-dashboard-page.component').then((m) => m.AuditDashboardPageComponent), data: { title: 'Audit Logs' } },
  { path: 'audit-logs/list', loadComponent: () => import('./pages/audit-log-list-page.component').then((m) => m.AuditLogListPageComponent), data: { title: 'Audit Log List' } },
  { path: 'audit-logs/timeline', loadComponent: () => import('./pages/audit-timeline-page.component').then((m) => m.AuditTimelinePageComponent), data: { title: 'Activity Timeline' } },
  { path: 'audit-logs/:id', loadComponent: () => import('./pages/audit-log-detail-page.component').then((m) => m.AuditLogDetailPageComponent), data: { title: 'Log Details' } },
];
