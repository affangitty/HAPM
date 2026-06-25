import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AreaChartComponent } from '../../dashboard/charts/area-chart.component';
import { ChartDataPoint } from '../../dashboard/charts/chart.models';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { InvoiceStatus } from '../../../shared/models/enums';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { BillingApiService } from '../data/billing-api.service';
import { InvoiceDto } from '../models/billing.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-invoice-list-page',
  standalone: true,
  imports: [
    RouterLink, FormsModule, UiPageHeaderComponent, UiFilterBarComponent, FormFieldComponent,
    UiInputComponent, UiButtonComponent, UiKpiCardComponent, UiCardComponent, UiCardContentComponent,
    AreaChartComponent, UiSkeletonComponent, DataTableComponent,
  ],
  template: `
    <app-ui-page-header title="Billing & Invoices" subtitle="Payment management and revenue tracking">
      <div actions class="flex gap-2">
        @if (isStaff()) {
          <a [routerLink]="basePath() + '/billing/invoices/new'"><app-ui-button size="sm">New invoice</app-ui-button></a>
          <a [routerLink]="basePath() + '/billing/analytics'"><app-ui-button size="sm" variant="outline">Analytics</app-ui-button></a>
          <app-ui-button size="sm" variant="outline" [loading]="exporting()" (pressed)="exportCsv()">Export</app-ui-button>
        }
        <a [routerLink]="basePath() + '/billing/dashboard'"><app-ui-button size="sm" variant="outline">Dashboard</app-ui-button></a>
      </div>
    </app-ui-page-header>

    @if (summaryLoading()) {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" />
      </div>
    } @else {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-ui-kpi-card title="Total Collected" [value]="formatMoney(stats().collected)" subtitle="all invoices" [trend]="revenueTrend().trend" [trendValue]="revenueTrend().value" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <app-ui-kpi-card title="Pending Amount" [value]="formatMoney(stats().pending)" [subtitle]="stats().pendingCount + ' invoices'" iconBg="bg-amber-50" iconColor="text-amber-600" iconPath="M12 8v4l3 3" />
        <app-ui-kpi-card title="Overdue" [value]="formatMoney(stats().overdue)" [subtitle]="stats().overdueCount + ' overdue'" iconBg="bg-red-50" iconColor="text-red-600" iconPath="M12 9v4M12 17h.01" />
        <app-ui-kpi-card title="Paid Invoices" [value]="formatCount(stats().paidCount)" subtitle="settled" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      </div>

      <app-ui-card class="mb-6">
        <app-ui-card-content class="p-5">
          <h2 class="mb-1 font-semibold">Revenue Trend</h2>
          <p class="mb-4 text-xs text-muted-foreground">Collected payments by month</p>
          <app-area-chart [data]="chartData()" [series]="revenueSeries" [height]="180" ariaLabel="Revenue trend" />
        </app-ui-card-content>
      </app-ui-card>
    }

    <div class="mb-4 flex flex-wrap gap-2">
      @for (tab of statusTabs; track tab.value) {
        <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-medium capitalize"
          [class]="status() === tab.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
          (click)="onStatus(tab.value)">{{ tab.label }}</button>
      }
    </div>

    <app-ui-filter-bar searchPlaceholder="Search patient or invoice..." (searchChange)="onSearch($event)">
      <app-form-field label="From" class="min-w-36"><app-ui-input type="date" [ngModel]="fromDate()" (ngModelChange)="onFrom($event)" /></app-form-field>
      <app-form-field label="To" class="min-w-36"><app-ui-input type="date" [ngModel]="toDate()" (ngModelChange)="onTo($event)" /></app-form-field>
    </app-ui-filter-bar>

    <app-data-table [columns]="columns" [rows]="filteredRows()" [loading]="loading()" [page]="page()"
      [pageSize]="pageSize" [totalCount]="totalCount()" [rowLink]="rowLink"
      emptyTitle="No invoices" emptyMessage="Invoices will appear here once created."
      (pageChange)="onPageChange($event)" />
  `,
})
export class InvoiceListPageComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<InvoiceDto[]>([]);
  readonly filteredRows = signal<InvoiceDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly exporting = signal(false);
  readonly summaryLoading = signal(true);
  readonly summaryInvoices = signal<InvoiceDto[]>([]);
  readonly status = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  search = '';

  readonly statusTabs = [
    { label: 'all', value: '' }, { label: 'paid', value: 'Paid' },
    { label: 'pending', value: 'Pending' }, { label: 'partial', value: 'PartiallyPaid' },
  ];

  readonly columns: DataTableColumn<InvoiceDto>[] = [
    { key: 'invoice', header: 'Invoice', cell: (r) => r.invoiceNumber },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'date', header: 'Date', cell: (r) => new Date(r.createdAtUtc).toLocaleDateString() },
    { key: 'total', header: 'Amount', cell: (r) => `$${r.totalAmount.toFixed(2)}` },
    { key: 'paid', header: 'Paid', cell: (r) => `$${r.amountPaid.toFixed(2)}` },
    { key: 'status', header: 'Status', cell: (r) => r.status },
  ];

  readonly rowLink = (r: InvoiceDto) => roleRoute(this.router, 'billing', 'invoices', String(r.id));
  private readonly debouncedFilter = debounce(() => this.applyFilter(), 200);

  readonly revenueSeries = [{ key: 'revenue', label: 'Revenue', color: '#10B981' }];

  readonly stats = computed(() => {
    const items = this.summaryInvoices();
    const collected = items.reduce((s, i) => s + i.amountPaid, 0);
    const pendingItems = items.filter((i) => i.status === 'Pending' || i.status === 'PartiallyPaid');
    const pending = pendingItems.reduce((s, i) => s + i.balanceDue, 0);
    const overdueItems = items.filter((i) => i.status === 'Pending' && i.balanceDue > 0);
    const overdue = overdueItems.reduce((s, i) => s + i.balanceDue, 0);
    return {
      collected,
      pending,
      pendingCount: pendingItems.length,
      overdue,
      overdueCount: overdueItems.length,
      paidCount: items.filter((i) => i.status === 'Paid').length,
    };
  });

  readonly chartData = computed<ChartDataPoint[]>(() => {
    const buckets = new Map<string, number>();
    for (const inv of this.summaryInvoices()) {
      const month = new Date(inv.createdAtUtc).toLocaleString('default', { month: 'short' });
      buckets.set(month, (buckets.get(month) ?? 0) + inv.amountPaid);
    }
    return Array.from(buckets.entries()).map(([label, revenue]) => ({ label, revenue }));
  });

  readonly revenueTrend = computed(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    let current = 0;
    let previous = 0;
    for (const inv of this.summaryInvoices()) {
      const d = new Date(inv.createdAtUtc);
      const paid = inv.amountPaid;
      if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) current += paid;
      else if (d.getFullYear() === thisYear && d.getMonth() === thisMonth - 1) previous += paid;
      else if (thisMonth === 0 && d.getFullYear() === thisYear - 1 && d.getMonth() === 11) previous += paid;
    }
    if (previous === 0) return { trend: current > 0 ? 'up' as const : 'neutral' as const, value: current > 0 ? 'new' : '0%' };
    const pct = ((current - previous) / previous) * 100;
    return pct >= 0
      ? { trend: 'up' as const, value: `+${Math.abs(pct).toFixed(1)}%` }
      : { trend: 'down' as const, value: `-${Math.abs(pct).toFixed(1)}%` };
  });

  ngOnInit(): void { this.load(); this.loadSummary(); }

  isStaff(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist';
  }

  onSearch(v: string): void { this.search = v.toLowerCase(); this.debouncedFilter(); }
  onStatus(v: string): void { this.status.set(v); this.page.set(1); this.load(); }
  onFrom(v: string): void { this.fromDate.set(v); this.page.set(1); this.load(); }
  onTo(v: string): void { this.toDate.set(v); this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }

  exportCsv(): void {
    this.exporting.set(true);
    this.api.exportInvoices(this.fromDate() || undefined, this.toDate() || undefined).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'invoices.csv';
        a.click();
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.list({
      page: this.page(), pageSize: this.pageSize,
      status: (this.status() as InvoiceStatus) || undefined,
      fromDate: this.fromDate() || undefined, toDate: this.toDate() || undefined,
    }).subscribe({
      next: (r) => { this.rows.set(r.items); this.totalCount.set(r.totalCount); this.applyFilter(); this.loading.set(false); },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private applyFilter(): void {
    const q = this.search;
    this.filteredRows.set(!q ? this.rows() : this.rows().filter((r) =>
      r.patientName.toLowerCase().includes(q) || r.invoiceNumber.toLowerCase().includes(q)));
  }

  formatMoney(v: number): string {
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  }

  formatCount(v: number): string {
    return String(v);
  }

  private loadSummary(): void {
    this.api.list({ page: 1, pageSize: 100, sortDescending: true }).subscribe({
      next: (r) => { this.summaryInvoices.set(r.items); this.summaryLoading.set(false); },
      error: () => this.summaryLoading.set(false),
    });
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
