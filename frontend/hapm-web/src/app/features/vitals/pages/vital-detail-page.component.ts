import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { VitalsApiService } from '../data/vitals-api.service';
import { VitalSignDto } from '../models/vital.models';

@Component({
  selector: 'app-vital-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, UiCardComponent, UiCardContentComponent, UiSkeletonComponent],
  template: `
    <a [routerLink]="basePath() + '/vitals/history'" class="text-xs text-primary hover:underline">← Back to history</a>

    @if (loading()) { <app-ui-skeleton class="mt-4 h-48" /> } @else {
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
export class VitalDetailPageComponent implements OnInit {
  private readonly api = inject(VitalsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly reading = signal<VitalSignDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (r) => { this.reading.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
