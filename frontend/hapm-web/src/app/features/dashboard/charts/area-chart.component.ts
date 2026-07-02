import { Component, computed, input } from '@angular/core';
import { ChartDataPoint, ChartSeries, DEFAULT_CHART_PADDING } from './chart.models';

@Component({
  selector: 'app-area-chart',
  standalone: true,
  template: `
    <div class="w-full min-w-0">
      <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height()" class="w-full" role="img" [attr.aria-label]="ariaLabel()">
        @for (line of gridLines(); track line) {
          <line
            [attr.x1]="padding.left"
            [attr.x2]="width() - padding.right"
            [attr.y1]="line"
            [attr.y2]="line"
            stroke="rgba(148,163,184,0.15)"
            stroke-dasharray="3 3"
          />
        }

        @for (series of seriesList(); track series.key) {
          <path [attr.d]="areaPath(series.key)" [attr.fill]="series.color" fill-opacity="0.12" />
          <path
            [attr.d]="linePath(series.key)"
            fill="none"
            [attr.stroke]="series.color"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        }

        @for (tick of xTicks(); track tick.label) {
          <text
            [attr.x]="tick.x"
            [attr.y]="height() - 8"
            text-anchor="middle"
            class="fill-slate-400 text-[10px]"
          >
            {{ tick.label }}
          </text>
        }

        @for (tick of yTicks(); track tick.value) {
          <text [attr.x]="8" [attr.y]="tick.y + 3" class="fill-slate-400 text-[10px]">{{ tick.value }}</text>
        }
      </svg>

      <div class="mt-2 flex flex-wrap gap-3">
        @for (series of seriesList(); track series.key) {
          <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span class="size-2 rounded-full" [style.background-color]="series.color"></span>
            {{ series.label }}
          </div>
        }
      </div>
    </div>
  `,
})
export class AreaChartComponent {
  readonly data = input.required<ChartDataPoint[]>();
  readonly series = input.required<ChartSeries[]>();
  readonly height = input(200);
  readonly width = input(560);
  readonly ariaLabel = input('Area chart');

  protected readonly padding = DEFAULT_CHART_PADDING;

  readonly seriesList = computed(() => this.series());
  readonly maxValue = computed(() => {
    const keys = this.series().map((s) => s.key);
    const values = this.data().flatMap((point) => keys.map((key) => Number(point[key] ?? 0)));
    return Math.max(...values, 1);
  });

  gridLines(): number[] {
    const innerHeight = this.height() - this.padding.top - this.padding.bottom;
    return [0, 1, 2, 3].map((i) => this.padding.top + (innerHeight / 3) * i);
  }

  yTicks(): { value: number; y: number }[] {
    const max = this.maxValue();
    const innerHeight = this.height() - this.padding.top - this.padding.bottom;
    return [0, 1, 2, 3].map((i) => {
      const value = Math.round((max / 3) * (3 - i));
      return { value, y: this.padding.top + (innerHeight / 3) * i };
    });
  }

  xTicks(): { label: string; x: number }[] {
    const points = this.data();
    const innerWidth = this.width() - this.padding.left - this.padding.right;
    const step = points.length <= 1 ? innerWidth : innerWidth / (points.length - 1);
    return points.map((point, index) => ({
      label: point.label,
      x: this.padding.left + step * index,
    }));
  }

  linePath(key: string): string {
    const coords = this.pointCoords(key);
    if (!coords.length) return '';
    return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  }

  areaPath(key: string): string {
    const coords = this.pointCoords(key);
    if (!coords.length) return '';
    const baseY = this.height() - this.padding.bottom;
    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  }

  private pointCoords(key: string): { x: number; y: number }[] {
    const points = this.data();
    const innerWidth = this.width() - this.padding.left - this.padding.right;
    const innerHeight = this.height() - this.padding.top - this.padding.bottom;
    const max = this.maxValue();
    const step = points.length <= 1 ? innerWidth : innerWidth / (points.length - 1);

    return points.map((point, index) => {
      const value = Number(point[key] ?? 0);
      const ratio = value / max;
      return {
        x: this.padding.left + step * index,
        y: this.padding.top + innerHeight * (1 - ratio),
      };
    });
  }
}
