import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { BarChartComponent } from '../../dashboard/charts/bar-chart.component';
import { DonutChartComponent } from '../../dashboard/charts/donut-chart.component';
import { ChartDataPoint, DonutSegment } from '../../dashboard/charts/chart.models';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { MobileRecordCardComponent } from '../../../shared/components/mobile-record-card/mobile-record-card.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { BillingApiService } from '../data/billing-api.service';
import { DashboardApiService } from '../../dashboard/data/dashboard-api.service';
import { InvoiceDto } from '../models/billing.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';
import { DASHBOARD_KPI_GRID_CLASS, DASHBOARD_SPLIT_GRID_CLASS, DASHBOARD_STACK_CLASS } from '../../dashboard/widgets/dashboard-layout.component';

@Component({
  selector: 'app-revenue-dashboard-page',
  standalone: true,
  imports: [
    UiEmptyStateComponent,
    RouterLink, UiPageHeaderComponent, UiButtonComponent, UiKpiCardComponent,
    UiCardComponent, UiCardContentComponent, BarChartComponent, DonutChartComponent,
    UiSkeletonComponent, UiStatusBadgeComponent, MobileRecordCardComponent,
  ],
  template: `
    <app-ui-page-header title="Revenue Dashboard" subtitle="Financial overview and billing performance">
      <div actions class="flex flex-wrap gap-2">
        <app-ui-button size="sm" variant="outline" (pressed)="exportReport()">Export Report</app-ui-button>
        <a [routerLink]="basePath() + '/billing'"><app-ui-button size="sm">Invoices</app-ui-button></a>
      </div>
    </app-ui-page-header>

    @if (loading()) {
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /></div>
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      <div class="mt-6" [class]="DASHBOARD_STACK_CLASS">
      <div [class]="DASHBOARD_KPI_GRID_CLASS">
        <app-ui-kpi-card title="Total Revenue" [value]="formatMoney(dashStats()?.totalRevenue ?? stats().collected)" subtitle="lifetime collected" [trend]="monthTrend().trend" [trendValue]="monthTrend().value" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <app-ui-kpi-card title="This Month" [value]="formatMoney(dashStats()?.revenueThisMonth ?? 0)" [subtitle]="'Last month ' + formatMoney(dashStats()?.revenueLastMonth ?? 0)" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <app-ui-kpi-card title="Paid Invoices" [value]="paidRate().paid + ''" [subtitle]="paidRate().rate + '% of active'" [trend]="paidRate().rateNum >= 70 ? 'up' : 'neutral'" iconBg="bg-violet-50" iconColor="text-violet-600" iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <app-ui-kpi-card title="Pending Claims" [value]="formatMoney(stats().pending)" [subtitle]="stats().pendingCount + ' invoices'" iconBg="bg-amber-50" iconColor="text-amber-600" iconPath="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      </div>

      <div [class]="DASHBOARD_SPLIT_GRID_CLASS">
        <app-ui-card class="min-h-0 flex-1 lg:col-span-3">
          <app-ui-card-content class="flex min-h-0 flex-1 flex-col p-5">
            <h2 class="mb-4 font-semibold">Revenue Trends</h2>
            <div class="flex min-h-0 flex-1 flex-col">
              <app-bar-chart [data]="chartData()" valueKey="revenue" color="#1D4ED8" [height]="220" ariaLabel="Revenue trends" />
            </div>
          </app-ui-card-content>
        </app-ui-card>
        <app-ui-card class="min-h-0 flex-1 lg:col-span-1">
          <app-ui-card-content class="flex min-h-0 flex-1 flex-col p-5">
            <h2 class="mb-4 font-semibold">By Department</h2>
            <div class="flex flex-1 items-center justify-center">
              <app-donut-chart [segments]="donutData()" ariaLabel="Revenue by department" />
            </div>
          </app-ui-card-content>
        </app-ui-card>
      </div>

      <app-ui-card>
        <app-ui-card-content class="p-5">
          <h2 class="mb-4 font-semibold">Recent Billing Activity</h2>
          <div class="space-y-3 md:hidden">
            @for (inv of invoices().slice(0, 6); track inv.id) {
              <app-mobile-record-card
                [title]="inv.invoiceNumber"
                [subtitle]="inv.patientName"
                [fields]="[
                  { label: 'Amount', value: formatAmount(inv.totalAmount) },
                  { label: 'Status', value: inv.status },
                ]"
              >
                <span trailing>
                  <app-ui-status-badge [label]="inv.status" [tone]="inv.status === 'Paid' ? 'success' : 'warning'" />
                </span>
              </app-mobile-record-card>
            }
          </div>
          <div class="hidden md:block">
            <table class="w-full text-left text-sm">
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
      </div>
    }
  `,
})
export class RevenueDashboardPageComponent implements OnInit {
  protected readonly DASHBOARD_KPI_GRID_CLASS = DASHBOARD_KPI_GRID_CLASS;
  protected readonly DASHBOARD_SPLIT_GRID_CLASS = DASHBOARD_SPLIT_GRID_CLASS;
  protected readonly DASHBOARD_STACK_CLASS = DASHBOARD_STACK_CLASS;
  private readonly api = inject(BillingApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly invoices = signal<InvoiceDto[]>([]);
  readonly dashStats = signal<import('../../../core/api/models').DashboardStatsDto | null>(null);

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

  readonly monthTrend = computed(() => {
    const s = this.dashStats();
    if (!s) return { trend: 'neutral' as const, value: '—' };
    if (s.revenueLastMonth === 0) return { trend: s.revenueThisMonth > 0 ? 'up' as const : 'neutral' as const, value: s.revenueThisMonth > 0 ? 'new' : '0%' };
    const pct = ((s.revenueThisMonth - s.revenueLastMonth) / s.revenueLastMonth) * 100;
    return pct >= 0
      ? { trend: 'up' as const, value: `+${Math.abs(pct).toFixed(1)}%` }
      : { trend: 'down' as const, value: `-${Math.abs(pct).toFixed(1)}%` };
  });

  readonly paidRate = computed(() => {
    const active = this.invoices().filter((i) => i.status !== 'Cancelled');
    const paid = active.filter((i) => i.status === 'Paid').length;
    const rateNum = active.length ? Math.round((paid / active.length) * 100) : 0;
    return { paid, rate: String(rateNum), rateNum };
  });

  readonly donutData = computed<DonutSegment[]>(() => {
    const items = this.invoices();
    const segments: DonutSegment[] = [
      { label: 'Paid', value: items.filter((i) => i.status === 'Paid').length, color: '#1D4ED8' },
      { label: 'Pending', value: items.filter((i) => i.status === 'Pending').length, color: '#0D9488' },
      { label: 'Partial', value: items.filter((i) => i.status === 'PartiallyPaid').length, color: '#F59E0B' },
    ].filter((s) => s.value > 0);
    return segments.length ? segments : [{ label: 'No invoices', value: 1, color: '#94A3B8' }];
  });

  ngOnInit(): void {
    forkJoin({
      stats: this.dashboardApi.getStats().pipe(catchError(() => of(null))),
      invoices: this.api.list({ page: 1, pageSize: 100 }),
    }).subscribe({
      next: ({ stats, invoices }) => {
        this.dashStats.set(stats);
        this.invoices.set(invoices.items);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError, 'Unable to load revenue dashboard.'),
    });
  }

  avgPerPatient(): number {
    const items = this.invoices();
    if (!items.length) return 0;
    return items.reduce((s, i) => s + i.amountPaid, 0) / new Set(items.map((i) => i.patientId)).size;
  }

  exportReport(): void {
    void this.router.navigate([roleRoute(this.router, 'exports')]);
  }

  formatMoney(v: number): string { return v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(1)}k`; }
  formatAmount(v: number): string { return `$${v.toFixed(2)}`; }
  basePath(): string {
    return roleBase(this.router);
  }

}
