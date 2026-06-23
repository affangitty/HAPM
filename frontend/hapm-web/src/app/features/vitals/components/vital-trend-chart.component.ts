import { Component, computed, input } from '@angular/core';
import { AreaChartComponent } from '../../dashboard/charts/area-chart.component';
import { ChartDataPoint, ChartSeries } from '../../dashboard/charts/chart.models';
import { VITAL_METRIC_LABELS, VitalMetricKey, VitalSignDto } from '../models/vital.models';

@Component({
  selector: 'app-vital-trend-chart',
  standalone: true,
  imports: [AreaChartComponent],
  template: `
    <div>
      <p class="mb-3 text-sm font-semibold">{{ title() }}</p>
      @if (chartData().length) {
        <app-area-chart [data]="chartData()" [series]="series()" [ariaLabel]="title()" />
      } @else {
        <p class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Not enough data for this trend.</p>
      }
    </div>
  `,
})
export class VitalTrendChartComponent {
  readonly readings = input.required<VitalSignDto[]>();
  readonly metric = input<VitalMetricKey>('pulseBpm');
  readonly color = input('#1D4ED8');

  readonly title = computed(() => VITAL_METRIC_LABELS[this.metric()]);

  readonly chartData = computed<ChartDataPoint[]>(() =>
    [...this.readings()]
      .sort((a, b) => a.recordedAtUtc.localeCompare(b.recordedAtUtc))
      .map((r) => ({
        label: new Date(r.recordedAtUtc).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        [this.metric()]: Number(r[this.metric()] ?? 0),
      }))
      .filter((p) => Number(p[this.metric()]) > 0),
  );

  readonly series = computed<ChartSeries[]>(() => [{ key: this.metric(), label: this.title(), color: this.color() }]);
}
