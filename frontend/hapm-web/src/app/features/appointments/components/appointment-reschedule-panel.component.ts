import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { AvailableSlotDto } from '../../doctors/models/doctor.models';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { AppointmentDto } from '../models/appointment.models';
import { SlotPickerComponent } from './slot-picker.component';

@Component({
  selector: 'app-appointment-reschedule-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule, UiCardComponent, UiCardContentComponent, FormFieldComponent,
    UiInputComponent, UiButtonComponent, SlotPickerComponent,
  ],
  template: `
    @if (canReschedule()) {
      <app-ui-card class="mt-4">
        <app-ui-card-content class="space-y-4 p-5">
          <h3 class="font-semibold">Reschedule</h3>
          <p class="text-sm text-muted-foreground">Move this appointment to a new date and time. Status will reset to Pending.</p>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <app-form-field label="New date">
              <app-ui-input type="date" formControlName="appointmentDate" />
            </app-form-field>
            <app-slot-picker
              [date]="form.controls.appointmentDate.value"
              [slots]="slots()"
              [loading]="slotsLoading()"
              [selectedTime]="form.controls.startTime.value"
              (slotSelected)="form.controls.startTime.setValue($event)"
            />
            @if (error()) {
              <p class="text-sm text-destructive">{{ error() }}</p>
            }
            <app-ui-button type="submit" class="mt-3" [loading]="saving()" [disabled]="!form.controls.startTime.value">
              Reschedule appointment
            </app-ui-button>
          </form>
        </app-ui-card-content>
      </app-ui-card>
    }
  `,
})
export class AppointmentReschedulePanelComponent implements OnInit {
  private readonly api = inject(AppointmentsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly appointment = input.required<AppointmentDto>();
  readonly updated = output<AppointmentDto>();

  readonly slots = signal<AvailableSlotDto[]>([]);
  readonly slotsLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    appointmentDate: [this.todayIso(), Validators.required],
    startTime: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadSlots();
    this.form.controls.appointmentDate.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadSlots());
  }

  canReschedule(): boolean {
    const status = this.appointment().status;
    if (!['Pending', 'Confirmed'].includes(status)) return false;
    const role = this.auth.role();
    return role === 'Admin' || role === 'Doctor' || role === 'Receptionist' || role === 'Patient';
  }

  loadSlots(): void {
    const date = this.form.controls.appointmentDate.value;
    if (!date) return;
    this.slotsLoading.set(true);
    this.doctorsApi.getAvailableSlots(this.appointment().doctorId, date).subscribe({
      next: (s) => { this.slots.set(s); this.slotsLoading.set(false); },
      error: () => this.slotsLoading.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.api.reschedule(this.appointment().id, v).subscribe({
      next: (apt) => { this.saving.set(false); this.updated.emit(apt); },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Reschedule failed.'));
      },
    });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
