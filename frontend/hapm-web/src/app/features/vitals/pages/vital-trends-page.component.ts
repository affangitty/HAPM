import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { VitalTrendChartComponent } from '../components/vital-trend-chart.component';
import { VitalsApiService } from '../data/vitals-api.service';
import { VITAL_METRIC_LABELS, VitalMetricKey, VitalSignDto } from '../models/vital.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-vital-trends-page',
  standalone: true,
  imports: [
    UiEmptyStateComponent,
    RouterLink, UiPageHeaderComponent, UiButtonComponent, UiSkeletonComponent, VitalTrendChartComponent,
  ],
  template: `
    <app-ui-page-header title="30-Day Trends" subtitle="Continuous monitoring and clinical history review">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/vitals'"><app-ui-button size="sm" variant="outline">Overview</app-ui-button></a>
        <a [routerLink]="basePath() + '/vitals/history'"><app-ui-button size="sm" variant="outline">History</app-ui-button></a>
      </div>
    </app-ui-page-header>

  <div class="mb-4 flex flex-wrap gap-2">
    @for (option of metricOptions; track option.value) {
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-medium"
        [class]="metric() === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
        (click)="metric.set(option.value)"
      >
        {{ option.short }}
      </button>
    }
  </div>

    @if (loading()) {
      <app-ui-skeleton class="h-80" />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
        <app-vital-trend-chart [readings]="readings()" [metric]="metric()" />
        <div class="rounded-xl border border-border bg-card p-4">
          <h3 class="mb-3 font-semibold">Latest readings</h3>
          <div class="space-y-3 text-sm">
            @for (reading of readings().slice(-5).reverse(); track reading.id) {
              <div class="rounded-lg border border-border p-3">
                <p class="text-xs text-muted-foreground">{{ formatDate(reading.recordedAtUtc) }}</p>
                <p class="mt-1 font-medium">{{ metricLabel() }}: {{ metricValue(reading) }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class VitalTrendsPageComponent implements OnInit {
  private readonly api = inject(VitalsApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly readings = signal<VitalSignDto[]>([]);
  readonly metric = signal<VitalMetricKey>('systolicBpMmHg');

  readonly metricOptions: { value: VitalMetricKey; short: string }[] = [
    { value: 'systolicBpMmHg', short: 'BP' },
    { value: 'pulseBpm', short: 'HR' },
    { value: 'temperatureCelsius', short: 'Temp' },
    { value: 'oxygenSaturationPercent', short: 'SpO₂' },
  ];

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 50, sortDescending: false }).subscribe({
      next: (r) => {
        this.readings.set(r.items);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  metricLabel(): string {
    return VITAL_METRIC_LABELS[this.metric()];
  }

  metricValue(reading: VitalSignDto): string {
    const key = this.metric();
    const value = reading[key];
    return value === undefined || value === null ? '—' : String(value);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
