import { Routes } from '@angular/router';

export const LAB_REPORT_ROUTES: Routes = [
  { path: 'lab-reports', loadComponent: () => import('./pages/lab-report-list-page.component').then((m) => m.LabReportListPageComponent), data: { title: 'Lab Reports' } },
  { path: 'lab-reports/upload', loadComponent: () => import('./pages/lab-report-upload-page.component').then((m) => m.LabReportUploadPageComponent), data: { title: 'Upload Report' } },
  { path: 'lab-reports/history', loadComponent: () => import('./pages/lab-report-history-page.component').then((m) => m.LabReportHistoryPageComponent), data: { title: 'Report History' } },
  { path: 'lab-reports/:id/view', loadComponent: () => import('./pages/lab-report-viewer-page.component').then((m) => m.LabReportViewerPageComponent), data: { title: 'Report Viewer' } },
  { path: 'lab-reports/:id', loadComponent: () => import('./pages/lab-report-detail-page.component').then((m) => m.LabReportDetailPageComponent), data: { title: 'Report Details' } },
];
