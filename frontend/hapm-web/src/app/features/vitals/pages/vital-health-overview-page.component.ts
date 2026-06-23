import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { VitalReadingCardComponent } from '../components/vital-reading-card.component';
import { VitalTrendChartComponent } from '../components/vital-trend-chart.component';
import { VitalsApiService } from '../data/vitals-api.service';
import { VitalSignDto } from '../models/vital.models';

@Component({
  selector: 'app-vital-health-overview-page',
  standalone: true,
  imports: [
    RouterLink, UiPageHeaderComponent, UiButtonComponent, UiKpiCardComponent,
    UiSkeletonComponent, UiEmptyStateComponent, VitalReadingCardComponent, VitalTrendChartComponent,
  ],
  template: `
    <app-ui-page-header title="Patient Health Overview" subtitle="Latest vitals and clinical trends">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/vitals/trends'"><app-ui-button size="sm" variant="outline">Trends</app-ui-button></a>
        <a [routerLink]="basePath() + '/vitals/history'"><app-ui-button size="sm" variant="outline">History</app-ui-button></a>
        @if (canRecord()) {
          <a [routerLink]="basePath() + '/vitals/record'"><app-ui-button size="sm">Record vitals</app-ui-button></a>
        }
      </div>
    </app-ui-page-header>

    @if (loading()) {
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /></div>
    } @else if (!readings().length) {
      <app-ui-empty-state title="No vital readings" message="Record vitals during an appointment to track patient health." />
    } @else {
      @if (latest(); as l) {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-ui-kpi-card title="Latest pulse" [value]="formatMetric(l.pulseBpm, 'bpm')" iconBg="bg-red-50" iconColor="text-red-600" iconPath="M22 12h-4l-3 9L9 3l-3 9H2" />
        <app-ui-kpi-card title="Blood pressure" [value]="bpLabel()" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <app-ui-kpi-card title="SpO₂" [value]="formatMetric(l.oxygenSaturationPercent, '%')" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <app-ui-kpi-card title="BMI" [value]="formatMetric(l.bmi, '')" iconBg="bg-violet-50" iconColor="text-violet-600" iconPath="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      </div>

      <app-vital-reading-card class="mb-6 block" [reading]="l" />
      }

      <div class="grid gap-6 lg:grid-cols-2">
        <app-vital-trend-chart [readings]="readings()" metric="pulseBpm" color="#EF4444" />
        <app-vital-trend-chart [readings]="readings()" metric="oxygenSaturationPercent" color="#10B981" />
      </div>
    }
  `,
})
export class VitalHealthOverviewPageComponent implements OnInit {
  private readonly api = inject(VitalsApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly readings = signal<VitalSignDto[]>([]);
  readonly latest = computed(() => this.readings()[0] ?? null);

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 20, sortBy: 'recordedAtUtc', sortDescending: true }).subscribe({
      next: (r) => { this.readings.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  canRecord(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Doctor' || role === 'Receptionist';
  }

  bpLabel(): string {
    const l = this.latest();
    if (!l?.systolicBpMmHg) return '—';
    return `${l.systolicBpMmHg}/${l.diastolicBpMmHg ?? '—'}`;
  }

  formatMetric(value: number | undefined | null, suffix: string): string {
    if (value == null) return '—';
    return suffix ? `${value}${suffix === '%' ? '%' : ' ' + suffix}`.trim() : String(value);
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
