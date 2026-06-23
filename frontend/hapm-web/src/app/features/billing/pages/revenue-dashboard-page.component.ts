import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BarChartComponent } from '../../dashboard/charts/bar-chart.component';
import { DonutChartComponent } from '../../dashboard/charts/donut-chart.component';
import { ChartDataPoint, DonutSegment } from '../../dashboard/charts/chart.models';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { BillingApiService } from '../data/billing-api.service';
import { InvoiceDto } from '../models/billing.models';

@Component({
  selector: 'app-revenue-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, UiPageHeaderComponent, UiButtonComponent, UiKpiCardComponent,
    UiCardComponent, UiCardContentComponent, BarChartComponent, DonutChartComponent,
    UiSkeletonComponent, UiStatusBadgeComponent,
  ],
  template: `
    <app-ui-page-header title="Revenue Dashboard" subtitle="Financial overview and billing performance">
      <div actions class="flex gap-2">
        <app-ui-button size="sm" variant="outline" (pressed)="exportReport()">Export Report</app-ui-button>
        <a [routerLink]="basePath() + '/billing'"><app-ui-button size="sm">Invoices</app-ui-button></a>
      </div>
    </app-ui-page-header>

    @if (loading()) {
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /></div>
    } @else {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-ui-kpi-card title="Total Revenue" [value]="formatMoney(stats().collected)" subtitle="from last month" trend="up" trendValue="+12.5%" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <app-ui-kpi-card title="Avg Rev / Patient" [value]="formatMoney(avgPerPatient())" subtitle="from last month" trend="up" trendValue="+3.2%" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <app-ui-kpi-card title="Claim Success Rate" value="94.2%" subtitle="from last month" trend="down" trendValue="-0.8%" iconBg="bg-violet-50" iconColor="text-violet-600" iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <app-ui-kpi-card title="Pending Claims" [value]="formatMoney(stats().pending)" [subtitle]="stats().pendingCount + ' invoices'" iconBg="bg-amber-50" iconColor="text-amber-600" iconPath="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      </div>

      <div class="mb-6 grid gap-6 lg:grid-cols-3">
        <app-ui-card class="lg:col-span-2">
          <app-ui-card-content class="p-5">
            <h2 class="mb-4 font-semibold">Revenue Trends</h2>
            <app-bar-chart [data]="chartData()" valueKey="revenue" color="#1D4ED8" [height]="220" ariaLabel="Revenue trends" />
          </app-ui-card-content>
        </app-ui-card>
        <app-ui-card>
          <app-ui-card-content class="p-5">
            <h2 class="mb-4 font-semibold">By Department</h2>
            <app-donut-chart [segments]="donutData()" ariaLabel="Revenue by department" />
          </app-ui-card-content>
        </app-ui-card>
      </div>

      <app-ui-card>
        <app-ui-card-content class="p-5">
          <h2 class="mb-4 font-semibold">Recent Billing Activity</h2>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr class="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th class="px-2 py-3">Invoice</th><th class="px-2 py-3">Patient</th><th class="px-2 py-3">Amount</th><th class="px-2 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of invoices().slice(0, 6); track inv.id) {
                  <tr class="border-b border-border/70">
                    <td class="px-2 py-3 font-medium text-primary">{{ inv.invoiceNumber }}</td>
                    <td class="px-2 py-3">{{ inv.patientName }}</td>
                    <td class="px-2 py-3 font-semibold tabular-nums">{{ formatAmount(inv.totalAmount) }}</td>
                    <td class="px-2 py-3"><app-ui-status-badge [label]="inv.status" [tone]="inv.status === 'Paid' ? 'success' : 'warning'" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-ui-card-content>
      </app-ui-card>
    }
  `,
})
export class RevenueDashboardPageComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly invoices = signal<InvoiceDto[]>([]);

  readonly stats = computed(() => {
    const items = this.invoices();
    const collected = items.reduce((s, i) => s + i.amountPaid, 0);
    const pending = items.filter((i) => i.status === 'Pending' || i.status === 'PartiallyPaid').reduce((s, i) => s + i.balanceDue, 0);
    const pendingCount = items.filter((i) => i.status === 'Pending').length;
    return { collected, pending, pendingCount };
  });

  readonly chartData = computed<ChartDataPoint[]>(() => {
    const buckets = new Map<string, number>();
    for (const inv of this.invoices()) {
      const month = new Date(inv.createdAtUtc).toLocaleString('default', { month: 'short' });
      buckets.set(month, (buckets.get(month) ?? 0) + inv.amountPaid);
    }
    return Array.from(buckets.entries()).map(([label, revenue]) => ({ label, revenue }));
  });

  readonly donutData = computed<DonutSegment[]>(() => {
    const items = this.invoices();
    const paid = items.filter((i) => i.status === 'Paid').length;
    const pending = items.filter((i) => i.status === 'Pending').length;
    const partial = items.filter((i) => i.status === 'PartiallyPaid').length;
    return [
      { label: 'Paid', value: paid || 1, color: '#1D4ED8' },
      { label: 'Pending', value: pending || 1, color: '#0D9488' },
      { label: 'Partial', value: partial || 1, color: '#F59E0B' },
    ];
  });

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (r) => { this.invoices.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  avgPerPatient(): number {
    const items = this.invoices();
    if (!items.length) return 0;
    return items.reduce((s, i) => s + i.amountPaid, 0) / new Set(items.map((i) => i.patientId)).size;
  }

  exportReport(): void {
    void this.router.navigate([`${this.basePath()}/exports`]);
  }

  formatMoney(v: number): string { return v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(1)}k`; }
  formatAmount(v: number): string { return `$${v.toFixed(2)}`; }
  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
