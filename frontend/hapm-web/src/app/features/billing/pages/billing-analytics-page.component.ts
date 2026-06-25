import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { BarChartComponent } from '../../dashboard/charts/bar-chart.component';
import { DonutChartComponent } from '../../dashboard/charts/donut-chart.component';
import { ChartDataPoint, DonutSegment } from '../../dashboard/charts/chart.models';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { BillingApiService } from '../data/billing-api.service';
import { InvoiceDto } from '../models/billing.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-billing-analytics-page',
  standalone: true,
  imports: [
    UiEmptyStateComponent,
    RouterLink, UiPageHeaderComponent, UiButtonComponent, UiCardComponent, UiCardContentComponent,
    BarChartComponent, DonutChartComponent, UiSkeletonComponent,
  ],
  template: `
    <app-ui-page-header title="Billing Analytics" subtitle="Operational and financial insights">
      <a actions [routerLink]="basePath() + '/billing/dashboard'"><app-ui-button size="sm" variant="outline">Revenue dashboard</app-ui-button></a>
    </app-ui-page-header>

    @if (loading()) { <app-ui-skeleton class="h-64" /> } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      <div class="grid gap-6 lg:grid-cols-2">
        <app-ui-card>
          <app-ui-card-content class="p-5">
            <h2 class="mb-4 font-semibold">Collections by month</h2>
            <app-bar-chart [data]="barData()" valueKey="amount" color="#1D4ED8" ariaLabel="Monthly collections" />
          </app-ui-card-content>
        </app-ui-card>
        <app-ui-card>
          <app-ui-card-content class="p-5">
            <h2 class="mb-4 font-semibold">Invoice status mix</h2>
            <app-donut-chart [segments]="donutData()" ariaLabel="Invoice status distribution" />
          </app-ui-card-content>
        </app-ui-card>
      </div>
    }
  `,
})
export class BillingAnalyticsPageComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly invoices = signal<InvoiceDto[]>([]);
  readonly barData = signal<ChartDataPoint[]>([]);
  readonly donutData = signal<DonutSegment[]>([]);

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (r) => {
        this.invoices.set(r.items);
        this.buildCharts(r.items);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private buildCharts(items: InvoiceDto[]): void {
    const months = new Map<string, number>();
    const statusCounts = new Map<string, number>();
    for (const inv of items) {
      const m = new Date(inv.createdAtUtc).toLocaleString('default', { month: 'short' });
      months.set(m, (months.get(m) ?? 0) + inv.amountPaid);
      statusCounts.set(inv.status, (statusCounts.get(inv.status) ?? 0) + 1);
    }
    this.barData.set(Array.from(months.entries()).map(([label, amount]) => ({ label, amount })));
    const colors: Record<string, string> = { Paid: '#10B981', Pending: '#F59E0B', PartiallyPaid: '#3B82F6', Cancelled: '#EF4444' };
    this.donutData.set(Array.from(statusCounts.entries()).map(([label, value]) => ({ label, value, color: colors[label] ?? '#94A3B8' })));
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
