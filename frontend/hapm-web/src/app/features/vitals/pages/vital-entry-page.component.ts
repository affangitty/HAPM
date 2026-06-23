import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { VitalEntryFormComponent } from '../components/vital-entry-form.component';
import { VitalsApiService } from '../data/vitals-api.service';

@Component({
  selector: 'app-vital-entry-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, UiPageHeaderComponent, UiCardComponent, UiCardContentComponent, UiButtonComponent, VitalEntryFormComponent],
  template: `
    <app-ui-page-header title="Record Vital Signs" subtitle="Capture readings for a checked-in appointment" />

    <app-ui-card class="max-w-3xl">
      <app-ui-card-content class="p-5">
        <form (ngSubmit)="submit()">
          <app-vital-entry-form [form]="form" />
          @if (error()) { <p class="mt-4 text-sm text-destructive">{{ error() }}</p> }
          <div class="mt-6 flex gap-2">
            <app-ui-button type="submit" [loading]="saving()">Save vitals</app-ui-button>
            <a [routerLink]="basePath() + '/vitals'"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class VitalEntryPageComponent {
  private readonly api = inject(VitalsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    appointmentId: [null as number | null, [Validators.required, Validators.min(1)]],
    temperatureCelsius: [null as number | null],
    pulseBpm: [null as number | null],
    respiratoryRatePerMin: [null as number | null],
    systolicBpMmHg: [null as number | null],
    diastolicBpMmHg: [null as number | null],
    oxygenSaturationPercent: [null as number | null],
    heightCm: [null as number | null],
    weightKg: [null as number | null],
    notes: [''],
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.api.record({
      appointmentId: Number(v.appointmentId),
      temperatureCelsius: v.temperatureCelsius ?? undefined,
      pulseBpm: v.pulseBpm ?? undefined,
      respiratoryRatePerMin: v.respiratoryRatePerMin ?? undefined,
      systolicBpMmHg: v.systolicBpMmHg ?? undefined,
      diastolicBpMmHg: v.diastolicBpMmHg ?? undefined,
      oxygenSaturationPercent: v.oxygenSaturationPercent ?? undefined,
      heightCm: v.heightCm ?? undefined,
      weightKg: v.weightKg ?? undefined,
      notes: v.notes || undefined,
    }).subscribe({
      next: () => { this.saving.set(false); void this.router.navigate([`${this.basePath()}/vitals`]); },
      error: (err) => { this.error.set(extractApiErrorMessage(err, 'Failed to record vitals.')); this.saving.set(false); },
    });
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
