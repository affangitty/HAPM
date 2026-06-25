import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { VitalsApiService } from '../data/vitals-api.service';
import { VitalSignDto } from '../models/vital.models';

@Component({
  selector: 'app-vital-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, UiCardComponent, UiCardContentComponent, UiSkeletonComponent, UiEmptyStateComponent],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to history</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-48" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Vital reading not found" message="This record may have been removed." />
    } @else {
      @if (reading(); as r) {
      <div class="mt-2 mb-4">
        <h1 class="text-xl font-bold">Vital reading</h1>
        <p class="text-sm text-muted-foreground">{{ r.patientName }} · {{ r.recordedAtUtc | date: 'medium' }}</p>
      </div>
      <app-ui-card>
        <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2">
          <div><p class="text-xs text-muted-foreground">Blood pressure</p><p>{{ r.systolicBpMmHg ?? '—' }}/{{ r.diastolicBpMmHg ?? '—' }} mmHg</p></div>
          <div><p class="text-xs text-muted-foreground">Pulse</p><p>{{ r.pulseBpm ?? '—' }} bpm</p></div>
          <div><p class="text-xs text-muted-foreground">SpO₂</p><p>{{ r.oxygenSaturationPercent ?? '—' }}%</p></div>
          <div><p class="text-xs text-muted-foreground">Temperature</p><p>{{ r.temperatureCelsius ?? '—' }}°C</p></div>
          <div><p class="text-xs text-muted-foreground">Respiratory rate</p><p>{{ r.respiratoryRatePerMin ?? '—' }}/min</p></div>
          <div><p class="text-xs text-muted-foreground">BMI</p><p>{{ r.bmi?.toFixed(1) ?? '—' }}</p></div>
          @if (r.notes) { <div class="sm:col-span-2"><p class="text-xs text-muted-foreground">Notes</p><p>{{ r.notes }}</p></div> }
        </app-ui-card-content>
      </app-ui-card>
      }
    }
  `,
})
export class VitalDetailPageComponent {
  private readonly api = inject(VitalsApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader('id', (id) => this.api.getById(id), this.destroyRef);

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly reading = this.routeState.data;

  listLink(): string {
    return roleRoute(this.router, 'vitals', 'history');
  }
}
