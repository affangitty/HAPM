import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { BillingApiService } from '../data/billing-api.service';
import { InvoiceDto, PaymentDto } from '../models/billing.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

interface PaymentRow extends PaymentDto {
  invoiceNumber: string;
  patientName: string;
}

@Component({
  selector: 'app-payment-history-page',
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiButtonComponent, DataTableComponent],
  template: `
    <app-ui-page-header title="Payment History" subtitle="All recorded payments across invoices">
      <a actions [routerLink]="basePath() + '/billing'"><app-ui-button size="sm" variant="outline">Back to invoices</app-ui-button></a>
    </app-ui-page-header>

    <app-data-table [columns]="columns" [rows]="rows()" [loading]="loading()" [page]="page()"
      [pageSize]="pageSize" [totalCount]="totalCount()" [showPagination]="false"
      emptyTitle="No payments" emptyMessage="Payments will appear as invoices are settled." />
  `,
})
export class PaymentHistoryPageComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<PaymentRow[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly columns: DataTableColumn<PaymentRow>[] = [
    { key: 'receipt', header: 'Receipt', cell: (r) => r.receiptNumber },
    { key: 'invoice', header: 'Invoice', cell: (r) => r.invoiceNumber },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'amount', header: 'Amount', cell: (r) => `$${r.amount.toFixed(2)}` },
    { key: 'method', header: 'Method', cell: (r) => r.method },
    { key: 'date', header: 'Date', cell: (r) => new Date(r.paidAtUtc).toLocaleDateString() },
  ];

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        const payments: PaymentRow[] = [];
        for (const inv of result.items) {
          for (const p of inv.payments) {
            payments.push({ ...p, invoiceNumber: inv.invoiceNumber, patientName: inv.patientName });
          }
        }
        payments.sort((a, b) => b.paidAtUtc.localeCompare(a.paidAtUtc));
        this.rows.set(payments);
        this.totalCount.set(payments.length);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
