import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { DonutChartComponent } from '../../dashboard/charts/donut-chart.component';
import { DonutSegment } from '../../dashboard/charts/chart.models';
import { AuditLogsApiService } from '../data/audit-logs-api.service';
import { AuditLogDto } from '../models/audit-log.models';

@Component({
  selector: 'app-audit-dashboard-page',
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiButtonComponent, UiKpiCardComponent, UiSkeletonComponent, DonutChartComponent],
  template: `
    <app-ui-page-header title="Audit Dashboard" subtitle="Compliance overview and activity summary">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/audit-logs/list'"><app-ui-button size="sm" variant="outline">View list</app-ui-button></a>
        <a [routerLink]="basePath() + '/audit-logs/timeline'"><app-ui-button size="sm" variant="outline">Timeline</app-ui-button></a>
      </div>
    </app-ui-page-header>

    @if (loading()) {
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /></div>
    } @else {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-ui-kpi-card title="Total events" [value]="formatCount(stats().total)" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <app-ui-kpi-card title="Created" [value]="formatCount(stats().created)" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M12 5v14M5 12h14" />
        <app-ui-kpi-card title="Updated" [value]="formatCount(stats().updated)" iconBg="bg-amber-50" iconColor="text-amber-600" iconPath="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        <app-ui-kpi-card title="Deleted" [value]="formatCount(stats().deleted)" iconBg="bg-red-50" iconColor="text-red-600" iconPath="M18 6 6 18M6 6l12 12" />
      </div>
      <div class="max-w-md rounded-xl border bg-card p-5">
        <h2 class="mb-4 font-semibold">Action distribution</h2>
        <app-donut-chart [segments]="donutData()" ariaLabel="Audit action distribution" />
      </div>
    }
  `,
})
export class AuditDashboardPageComponent implements OnInit {
  private readonly api = inject(AuditLogsApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly logs = signal<AuditLogDto[]>([]);

  readonly stats = computed(() => {
    const items = this.logs();
    return {
      total: items.length,
      created: items.filter((l) => l.action === 'Created').length,
      updated: items.filter((l) => l.action === 'Updated').length,
      deleted: items.filter((l) => l.action === 'Deleted').length,
    };
  });

  readonly donutData = computed<DonutSegment[]>(() => {
    const s = this.stats();
    return [
      { label: 'Created', value: s.created, color: '#10B981' },
      { label: 'Updated', value: s.updated, color: '#3B82F6' },
      { label: 'Deleted', value: s.deleted, color: '#EF4444' },
    ];
  });

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (r) => { this.logs.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatCount(v: number): string { return String(v); }
  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
