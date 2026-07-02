import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

const invoiceList = {
  path: 'billing',
  loadComponent: () => import('./pages/invoice-list-page.component').then((m) => m.InvoiceListPageComponent),
  data: { title: 'Billing & Invoices' },
};

const invoiceDetail = {
  path: 'billing/invoices/:id',
  loadComponent: () => import('./pages/invoice-detail-page.component').then((m) => m.InvoiceDetailPageComponent),
  canDeactivate: [unsavedChangesGuard],
  data: { title: 'Invoice Details' },
};

/** Patient billing: own invoices and pay online only. */
export const PATIENT_BILLING_ROUTES: Routes = [invoiceList, invoiceDetail];

/** Staff billing: revenue tools, payment history, invoice creation. */
export const STAFF_BILLING_ROUTES: Routes = [
  invoiceList,
  {
    path: 'billing/dashboard',
    loadComponent: () => import('./pages/revenue-dashboard-page.component').then((m) => m.RevenueDashboardPageComponent),
    data: { title: 'Revenue Dashboard' },
  },
  {
    path: 'billing/analytics',
    loadComponent: () => import('./pages/billing-analytics-page.component').then((m) => m.BillingAnalyticsPageComponent),
    data: { title: 'Billing Analytics' },
  },
  {
    path: 'billing/payments',
    loadComponent: () => import('./pages/payment-history-page.component').then((m) => m.PaymentHistoryPageComponent),
    data: { title: 'Payment History' },
  },
  {
    path: 'billing/invoices/new',
    loadComponent: () => import('./pages/invoice-create-page.component').then((m) => m.InvoiceCreatePageComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { title: 'Create Invoice' },
  },
  invoiceDetail,
];

/** @deprecated Use STAFF_BILLING_ROUTES or PATIENT_BILLING_ROUTES. */
export const BILLING_ROUTES = STAFF_BILLING_ROUTES;
