import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFormControlError, markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { PrescriptionTemplatesApiService } from '../../prescription-templates/data/prescription-templates-api.service';
import { PrescriptionFormComponent } from '../components/prescription-form.component';
import { createMedicationGroup, medicationItemsToRequest } from '../components/medication-form.util';
import { PrescriptionsApiService } from '../data/prescriptions-api.service';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';
import { AppointmentsApiService } from '../../appointments/data/appointments-api.service';
import { toAppointmentSelectOptions } from '../../appointments/utils/appointment-picker.util';
import { AppointmentDto } from '../../appointments/models/appointment.models';
import { AuthService } from '../../../core/auth/auth.service';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-prescription-create-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiSelectComponent,
    UiButtonComponent,
    PrescriptionFormComponent,
  ],
  template: `
    <app-ui-page-header title="Create Prescription" subtitle="Issue a prescription for a completed appointment" />

    <app-ui-card class="max-w-4xl">
      <app-ui-card-content class="space-y-5 p-5">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <app-form-field label="Appointment" [error]="err('appointmentId')">
            @if (appointmentOptions().length > 0) {
              <app-ui-select
                formControlName="appointmentId"
                [options]="appointmentOptions()"
                placeholder="Select a completed visit"
              />
            } @else {
              <p class="mt-2 text-sm text-amber-700">No completed appointments are available to link. Complete a visit first.</p>
            }
          </app-form-field>

          <app-form-field label="Load from template">
            <app-ui-select
              [options]="templateOptions()"
              [ngModel]="selectedTemplate()"
              (ngModelChange)="loadTemplate($event)"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Optional template"
            />
          </app-form-field>

          <app-prescription-form [form]="form" />

          @if (error()) {
            <p class="mt-4 text-sm text-destructive">{{ error() }}</p>
          }

          <div class="mt-6 flex gap-2">
            <app-ui-button type="submit" [loading]="saving()">Create prescription</app-ui-button>
            <a [routerLink]="basePath() + '/prescriptions'"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class PrescriptionCreatePageComponent implements OnInit {
  private readonly toasts = inject(ApiErrorService);

  private readonly api = inject(PrescriptionsApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly auth = inject(AuthService);
  private readonly templatesApi = inject(PrescriptionTemplatesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly templateOptions = signal<{ label: string; value: string }[]>([{ label: 'None', value: '' }]);
  readonly appointmentOptions = signal<{ label: string; value: string }[]>([]);
  readonly selectedTemplate = signal('');

  readonly form = this.fb.nonNullable.group({
    appointmentId: ['', Validators.required],
    diagnosis: ['', [Validators.required, Validators.maxLength(1000)]],
    notes: ['', Validators.maxLength(2000)],
    followUpDate: [''],
    items: this.fb.array([createMedicationGroup(this.fb)]),
  });

  ngOnInit(): void {
    const appointmentId = this.route.snapshot.queryParamMap.get('appointmentId');
    if (appointmentId) {
      this.form.controls.appointmentId.setValue(appointmentId);
    }

    this.templatesApi.list().subscribe({
      next: (templates) =>
        this.templateOptions.set([
          { label: 'None', value: '' },
          ...templates.map((t) => ({ label: t.name, value: String(t.id) })),
        ]),
    });

    this.loadEligibleAppointments();
  }

  private loadEligibleAppointments(): void {
    const role = this.auth.role();

    if (role === 'Doctor') {
      this.doctorsApi.getCurrentDoctor().subscribe({
        next: (doctor) => {
          forkJoin({
            completed: this.appointmentsApi.list({ page: 1, pageSize: 100, doctorId: doctor.id, status: 'Completed' }),
            checkedIn: this.appointmentsApi.list({ page: 1, pageSize: 100, doctorId: doctor.id, status: 'CheckedIn' }),
          }).subscribe({
            next: ({ completed, checkedIn }) => this.setAppointmentOptions([...completed.items, ...checkedIn.items]),
          });
        },
      });
    } else if (role === 'Admin' || role === 'Receptionist') {
      forkJoin({
        completed: this.appointmentsApi.list({ page: 1, pageSize: 100, status: 'Completed' }),
        checkedIn: this.appointmentsApi.list({ page: 1, pageSize: 100, status: 'CheckedIn' }),
      }).subscribe({
        next: ({ completed, checkedIn }) => this.setAppointmentOptions([...completed.items, ...checkedIn.items]),
      });
    }
  }

  private setAppointmentOptions(appointments: AppointmentDto[]): void {
    const options = toAppointmentSelectOptions(appointments, {
      excludeWithPrescription: true,
      statuses: ['Completed', 'CheckedIn'],
    });
    this.appointmentOptions.set(options);

    const queryId = this.route.snapshot.queryParamMap.get('appointmentId');
    if (queryId) {
      this.form.controls.appointmentId.setValue(queryId);
    } else if (options.length === 1) {
      this.form.controls.appointmentId.setValue(options[0].value);
    }
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  loadTemplate(id: string): void {
    this.selectedTemplate.set(id);
    if (!id) return;

    this.templatesApi.getById(Number(id)).subscribe({
      next: (template) => {
        this.form.patchValue({
          diagnosis: template.diagnosis,
          notes: template.notes ?? '',
        });
        this.items.clear();
        for (const item of template.items) {
          this.items.push(createMedicationGroup(this.fb, item));
        }
        if (!template.items.length) {
          this.items.push(createMedicationGroup(this.fb));
        }
      },
    });
  }

  submit(): void {
    markFormGroupTouched(this.form);
    if (!guardFormSubmit(this.form, this.toasts)) return;

    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();

    this.api
      .create({
        appointmentId: Number(v.appointmentId),
        diagnosis: v.diagnosis,
        notes: v.notes || undefined,
        followUpDate: v.followUpDate || undefined,
        items: medicationItemsToRequest(this.items.controls as FormGroup[]),
      })
      .subscribe({
        next: (rx) => {
          this.saving.set(false);
          void this.router.navigate([roleRoute(this.router, 'prescriptions', String(rx.id))]);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to create prescription.'));
          this.saving.set(false);
        },
      });
  }

  err(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.touched || !ctrl.invalid) return null;
    return 'Required';
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
