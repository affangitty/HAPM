import { Component, computed, input } from '@angular/core';
import { DonutSegment } from './chart.models';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  template: `
    <div class="flex flex-col items-center gap-3">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 100 100" role="img" [attr.aria-label]="ariaLabel()">
        @for (arc of arcs(); track arc.label) {
          <path [attr.d]="arc.path" [attr.fill]="arc.color" />
        }
        <circle cx="50" cy="50" [attr.r]="innerRadius()" fill="var(--card)" />
      </svg>

      <div class="w-full space-y-2">
        @for (segment of segments(); track segment.label) {
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <span class="size-2 shrink-0 rounded-full" [style.background-color]="segment.color"></span>
              <span class="truncate text-xs text-muted-foreground">{{ segment.label }}</span>
            </div>
            <span class="text-xs font-semibold text-foreground">{{ segment.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class DonutChartComponent {
  readonly segments = input.required<DonutSegment[]>();
  readonly size = input(180);
  readonly innerRadius = input(28);
  readonly ariaLabel = input('Donut chart');

  readonly arcs = computed(() => {
    const total = this.segments().reduce((sum, s) => sum + s.value, 0) || 1;
    const outer = 42;
    const inner = this.innerRadius() * (42 / 50);
    let cursor = -90;

    return this.segments().map((segment) => {
      const angle = (segment.value / total) * 360;
      const path = this.describeArc(50, 50, outer, inner, cursor, cursor + angle);
      cursor += angle;
      return { label: segment.label, color: segment.color, path };
    });
  });

  private describeArc(
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    startAngle: number,
    endAngle: number,
  ): string {
    const startOuter = this.polar(cx, cy, outerR, endAngle);
    const endOuter = this.polar(cx, cy, outerR, startAngle);
    const startInner = this.polar(cx, cy, innerR, startAngle);
    const endInner = this.polar(cx, cy, innerR, endAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  }

  private polar(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }
}
