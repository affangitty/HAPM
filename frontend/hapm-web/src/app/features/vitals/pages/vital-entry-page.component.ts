import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { VitalEntryFormComponent } from '../components/vital-entry-form.component';
import { VitalsApiService } from '../data/vitals-api.service';
import { roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';
import { AppointmentsApiService } from '../../appointments/data/appointments-api.service';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { toAppointmentSelectOptions } from '../../appointments/utils/appointment-picker.util';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-vital-entry-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, UiPageHeaderComponent, UiCardComponent, UiCardContentComponent, UiButtonComponent, VitalEntryFormComponent],
  template: `
    <app-ui-page-header title="Record Vital Signs" subtitle="Capture readings for a checked-in appointment" />

    <app-ui-card class="max-w-3xl">
      <app-ui-card-content class="p-5">
        <form (ngSubmit)="submit()">
          <app-vital-entry-form [form]="form" [appointmentOptions]="appointmentOptions()" />
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
export class VitalEntryPageComponent implements OnInit {
  private readonly toasts = inject(ApiErrorService);
  private readonly api = inject(VitalsApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly appointmentOptions = signal<{ label: string; value: string }[]>([]);

  readonly form = this.fb.group({
    appointmentId: ['', Validators.required],
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

  ngOnInit(): void {
    const appointmentId = this.route.snapshot.queryParamMap.get('appointmentId');
    if (appointmentId) this.form.controls.appointmentId.setValue(appointmentId);
    this.loadEligibleAppointments();
  }

  submit(): void {
    markFormGroupTouched(this.form);
    if (!guardFormSubmit(this.form, this.toasts)) return;

    const v = this.form.getRawValue();
    const hasMeasurement = [
      v.temperatureCelsius, v.pulseBpm, v.respiratoryRatePerMin,
      v.systolicBpMmHg, v.diastolicBpMmHg, v.oxygenSaturationPercent,
      v.heightCm, v.weightKg,
    ].some((n) => n !== null && n !== undefined);

    if (!hasMeasurement) {
      this.error.set('Enter at least one vital measurement.');
      return;
    }

    this.saving.set(true);
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
      next: () => { this.saving.set(false); void this.router.navigate([roleRoute(this.router, 'vitals')]); },
      error: (err) => { this.error.set(extractApiErrorMessage(err, 'Failed to record vitals.')); this.saving.set(false); },
    });
  }

  basePath(): string {
    return roleBase(this.router);
  }

  private loadEligibleAppointments(): void {
    this.doctorsApi.getCurrentDoctor().subscribe({
      next: (doctor) => {
        forkJoin({
          checkedIn: this.appointmentsApi.list({ page: 1, pageSize: 100, doctorId: doctor.id, status: 'CheckedIn' }),
          completed: this.appointmentsApi.list({ page: 1, pageSize: 100, doctorId: doctor.id, status: 'Completed' }),
        }).subscribe({
          next: ({ checkedIn, completed }) => {
            const options = toAppointmentSelectOptions([...checkedIn.items, ...completed.items]);
            this.appointmentOptions.set(options);
            this.prefillAppointment(options);
          },
        });
      },
      error: () => {
        forkJoin({
          checkedIn: this.appointmentsApi.list({ page: 1, pageSize: 100, status: 'CheckedIn' }),
          completed: this.appointmentsApi.list({ page: 1, pageSize: 100, status: 'Completed' }),
        }).subscribe({
          next: ({ checkedIn, completed }) => {
            const options = toAppointmentSelectOptions([...checkedIn.items, ...completed.items]);
            this.appointmentOptions.set(options);
            this.prefillAppointment(options);
          },
        });
      },
    });
  }

  private prefillAppointment(options: { value: string }[]): void {
    const queryId = this.route.snapshot.queryParamMap.get('appointmentId');
    if (queryId) {
      this.form.controls.appointmentId.setValue(queryId);
    } else if (options.length === 1) {
      this.form.controls.appointmentId.setValue(options[0].value);
    }
  }
}
