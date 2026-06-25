import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  { path: 'billing', loadComponent: () => import('./pages/invoice-list-page.component').then((m) => m.InvoiceListPageComponent), data: { title: 'Billing & Invoices' } },
  { path: 'billing/dashboard', loadComponent: () => import('./pages/revenue-dashboard-page.component').then((m) => m.RevenueDashboardPageComponent), data: { title: 'Revenue Dashboard' } },
  { path: 'billing/analytics', loadComponent: () => import('./pages/billing-analytics-page.component').then((m) => m.BillingAnalyticsPageComponent), data: { title: 'Billing Analytics' } },
  { path: 'billing/payments', loadComponent: () => import('./pages/payment-history-page.component').then((m) => m.PaymentHistoryPageComponent), data: { title: 'Payment History' } },
  { path: 'billing/invoices/new', loadComponent: () => import('./pages/invoice-create-page.component').then((m) => m.InvoiceCreatePageComponent), data: { title: 'Create Invoice' } },
  { path: 'billing/invoices/:id', loadComponent: () => import('./pages/invoice-detail-page.component').then((m) => m.InvoiceDetailPageComponent), data: { title: 'Invoice Details' } },
];
