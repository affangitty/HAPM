import { Component, computed, input } from '@angular/core';
import { ChartDataPoint, DEFAULT_CHART_PADDING } from './chart.models';

@Component({
  selector: 'app-bar-chart',
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

        @for (bar of bars(); track bar.label) {
          <rect
            [attr.x]="bar.x"
            [attr.y]="bar.y"
            [attr.width]="bar.width"
            [attr.height]="bar.height"
            [attr.fill]="color()"
            rx="4"
          />
          <text
            [attr.x]="bar.x + bar.width / 2"
            [attr.y]="height() - 8"
            text-anchor="middle"
            class="fill-slate-400 text-[10px]"
          >
            {{ bar.label }}
          </text>
        }
      </svg>
    </div>
  `,
})
export class BarChartComponent {
  readonly data = input.required<ChartDataPoint[]>();
  readonly valueKey = input.required<string>();
  readonly color = input('#1D4ED8');
  readonly height = input(160);
  readonly width = input(400);
  readonly ariaLabel = input('Bar chart');

  protected readonly padding = DEFAULT_CHART_PADDING;

  readonly maxValue = computed(() => {
    const values = this.data().map((point) => Number(point[this.valueKey()] ?? 0));
    return Math.max(...values, 1);
  });

  gridLines(): number[] {
    const innerHeight = this.height() - this.padding.top - this.padding.bottom;
    return [0, 1, 2, 3].map((i) => this.padding.top + (innerHeight / 3) * i);
  }

  bars(): { label: string; x: number; y: number; width: number; height: number }[] {
    const points = this.data();
    const innerWidth = this.width() - this.padding.left - this.padding.right;
    const innerHeight = this.height() - this.padding.top - this.padding.bottom;
    const gap = 8;
    const barWidth = Math.max(12, (innerWidth - gap * (points.length + 1)) / points.length);
    const max = this.maxValue();

    return points.map((point, index) => {
      const value = Number(point[this.valueKey()] ?? 0);
      const height = (value / max) * innerHeight;
      const x = this.padding.left + gap + index * (barWidth + gap);
      const y = this.padding.top + innerHeight - height;
      return { label: point.label, x, y, width: barWidth, height };
    });
  }
}
