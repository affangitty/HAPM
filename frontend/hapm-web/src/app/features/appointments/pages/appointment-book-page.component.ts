import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getControlError, getFormControlError, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { AvailableSlotDto } from '../../doctors/models/doctor.models';
import { PatientsApiService } from '../../patients/data/patients-api.service';
import { SlotPickerComponent } from '../components/slot-picker.component';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-appointment-book-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiInputComponent,
    UiSelectComponent,
    UiTextareaComponent,
    UiButtonComponent,
    SlotPickerComponent,
  ],
  template: `
    <app-ui-page-header title="Book Appointment" subtitle="Select doctor, date, and available slot" />

    <app-ui-card class="max-w-3xl">
      <app-ui-card-content class="space-y-4 p-5">
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <app-form-field label="Doctor" [error]="err('doctorId')">
            <app-ui-select formControlName="doctorId" [options]="doctorOptions()" placeholder="Select doctor" />
          </app-form-field>

          @if (isStaff()) {
            <app-form-field label="Patient" [error]="err('patientId')">
              <app-ui-select formControlName="patientId" [options]="patientOptions()" placeholder="Select patient" />
            </app-form-field>
          }

          <app-form-field label="Date" [error]="err('appointmentDate')">
            <app-ui-input type="date" formControlName="appointmentDate" />
          </app-form-field>

          <app-slot-picker
            [date]="form.controls.appointmentDate.value"
            [slots]="slots()"
            [loading]="slotsLoading()"
            [selectedTime]="form.controls.startTime.value"
            (slotSelected)="form.controls.startTime.setValue($event)"
          />

          <app-form-field label="Reason" [error]="err('reason')">
            <app-ui-textarea formControlName="reason" [rows]="3" />
          </app-form-field>

          @if (error()) {
            <p class="text-sm text-destructive">{{ error() }}</p>
          }

          <div class="flex gap-2">
            <app-ui-button type="submit" [loading]="saving()">Book appointment</app-ui-button>
            <a [routerLink]="listLink()"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class AppointmentBookPageComponent implements OnInit {
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasts = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly doctorOptions = signal<{ label: string; value: string }[]>([]);
  readonly patientOptions = signal<{ label: string; value: string }[]>([]);
  readonly slots = signal<AvailableSlotDto[]>([]);
  readonly slotsLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    doctorId: ['', Validators.required],
    patientId: [''],
    appointmentDate: [new Date().toISOString().slice(0, 10), Validators.required],
    startTime: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.doctorsApi.list({ page: 1, pageSize: 100, isAvailable: true, sortBy: 'name' }).subscribe({
      next: (result) =>
        this.doctorOptions.set(result.items.map((d) => ({ label: `${d.fullName} · ${d.specialization}`, value: String(d.id) }))),
    });

    if (this.isStaff()) {
      this.form.controls.patientId.addValidators(Validators.required);
      this.patientsApi.list({ page: 1, pageSize: 100, sortBy: 'name' }).subscribe({
        next: (result) =>
          this.patientOptions.set(result.items.map((p) => ({ label: `${p.fullName} (${p.medicalRecordNumber})`, value: String(p.id) }))),
      });
    }

    this.form.controls.doctorId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadSlots());
    this.form.controls.appointmentDate.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadSlots());

    const doctorId = this.route.snapshot.queryParamMap.get('doctorId');
    const date = this.route.snapshot.queryParamMap.get('date');
    if (doctorId) this.form.controls.doctorId.setValue(doctorId);
    if (date) this.form.controls.appointmentDate.setValue(date);

    this.loadSlots();
  }

  isStaff(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist';
  }

  err(name: 'doctorId' | 'patientId' | 'appointmentDate' | 'startTime' | 'reason'): string | null {
    return getControlError(this.form.controls[name]);
  }

  submit(): void {
    if (!guardFormSubmit(this.form, this.toasts, {
      doctorId: 'Doctor', patientId: 'Patient', appointmentDate: 'Date',
      startTime: 'Time slot', reason: 'Reason',
    })) return;
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.appointmentsApi
      .book({
        doctorId: Number(raw.doctorId),
        patientId: raw.patientId ? Number(raw.patientId) : undefined,
        appointmentDate: raw.appointmentDate,
        startTime: raw.startTime,
        reason: raw.reason,
      })
      .subscribe({
        next: (apt) => {
          this.saving.set(false);
          this.toasts.showSuccess('Appointment booked successfully.');
          void this.router.navigateByUrl(roleRoute(this.router, 'appointments', String(apt.id)));
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(extractApiErrorMessage(err, 'Booking failed.'));
        },
      });
  }

  listLink(): string {
    return roleRoute(this.router, 'appointments');
  }

  private loadSlots(): void {
    const doctorId = Number(this.form.controls.doctorId.value);
    const date = this.form.controls.appointmentDate.value;
    if (!doctorId || !date) {
      this.slots.set([]);
      return;
    }
    this.slotsLoading.set(true);
    this.doctorsApi.getAvailableSlots(doctorId, date).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.slotsLoading.set(false);
      },
      error: () => this.slotsLoading.set(false),
    });
  }
}
