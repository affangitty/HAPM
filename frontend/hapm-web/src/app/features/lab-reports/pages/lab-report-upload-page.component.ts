import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFormControlError, markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { PatientsApiService } from '../../patients/data/patients-api.service';
import { FileUploadZoneComponent } from '../components/file-upload-zone.component';
import { LabReportsApiService } from '../data/lab-reports-api.service';
import { roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';
import { AppointmentsApiService } from '../../appointments/data/appointments-api.service';
import { toAppointmentSelectOptions } from '../../appointments/utils/appointment-picker.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-lab-report-upload-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, UiPageHeaderComponent, UiCardComponent, UiCardContentComponent,
    FormFieldComponent, UiSelectComponent, UiInputComponent, UiButtonComponent, FileUploadZoneComponent,
  ],
  template: `
    <app-ui-page-header title="Upload Lab Report" subtitle="Attach diagnostic results for a patient" />

    <app-ui-card class="max-w-2xl">
      <app-ui-card-content class="space-y-4 p-5">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <app-form-field label="Patient" [error]="err('patientId')">
            <app-ui-select formControlName="patientId" [options]="patientOptions()" placeholder="Select patient" />
          </app-form-field>
          <app-form-field label="Linked appointment (optional)">
            <app-ui-select formControlName="appointmentId" [options]="appointmentOptions()" placeholder="Optional visit link" />
          </app-form-field>
          <app-form-field label="Ordering doctor">
            <app-ui-select formControlName="doctorId" [options]="doctorOptions()" placeholder="Optional" />
          </app-form-field>
          <app-form-field label="Test name" [error]="err('title')">
            <app-ui-input formControlName="title" placeholder="e.g. Complete Blood Count" />
          </app-form-field>
          <app-form-field label="Category" [error]="err('reportType')">
            <app-ui-select formControlName="reportType" [options]="categoryOptions" />
          </app-form-field>

          <app-file-upload-zone [uploading]="uploading()" [progress]="progress()" (fileSelected)="onFile($event)" />

          @if (error()) { <p class="text-sm text-destructive">{{ error() }}</p> }

          <div class="flex gap-2 pt-2">
            <app-ui-button type="submit" [loading]="uploading()">Upload report</app-ui-button>
            <a [routerLink]="basePath() + '/lab-reports'"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class LabReportUploadPageComponent implements OnInit {
  private readonly toasts = inject(ApiErrorService);
  private readonly api = inject(LabReportsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly patientOptions = signal<{ label: string; value: string }[]>([]);
  readonly doctorOptions = signal<{ label: string; value: string }[]>([{ label: 'None', value: '' }]);
  readonly appointmentOptions = signal<{ label: string; value: string }[]>([{ label: 'None', value: '' }]);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);
  private file: File | null = null;

  readonly categoryOptions = [
    'Hematology', 'Biochemistry', 'Endocrine', 'Cardiovascular', 'Respiratory', 'Microbiology', 'Radiology',
  ].map((c) => ({ label: c, value: c }));

  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    appointmentId: [''],
    doctorId: [''],
    reportType: ['Hematology', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.patientsApi.list({ page: 1, pageSize: 100, sortBy: 'name' }).subscribe({
      next: (r) => this.patientOptions.set(r.items.map((p) => ({ label: `${p.fullName} (${p.medicalRecordNumber})`, value: String(p.id) }))),
    });
    this.doctorsApi.list({ page: 1, pageSize: 100, sortBy: 'name' }).subscribe({
      next: (r) => this.doctorOptions.set([{ label: 'None', value: '' }, ...r.items.map((d) => ({ label: d.fullName, value: String(d.id) }))]),
    });

    const appointmentId = this.route.snapshot.queryParamMap.get('appointmentId');
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) this.form.controls.patientId.setValue(patientId);
    if (appointmentId) this.form.controls.appointmentId.setValue(appointmentId);

    this.form.controls.patientId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      if (!appointmentId) this.form.controls.appointmentId.setValue('');
      this.loadAppointmentsForPatient(id);
    });

    if (patientId) this.loadAppointmentsForPatient(patientId);
  }

  onFile(file: File): void { this.file = file; }

  submit(): void {
    markFormGroupTouched(this.form);
    if (this.form.invalid || !this.file) {
      if (!this.file) this.error.set('Please select a file.');
      return;
    }
    this.uploading.set(true);
    this.progress.set(20);
    const v = this.form.getRawValue();
    const timer = setInterval(() => this.progress.update((p) => Math.min(p + 15, 90)), 200);

    this.api.upload({
      patientId: Number(v.patientId),
      appointmentId: v.appointmentId ? Number(v.appointmentId) : undefined,
      doctorId: v.doctorId ? Number(v.doctorId) : undefined,
      reportType: v.reportType,
      title: v.title,
      file: this.file,
    }).subscribe({
      next: (report) => {
        clearInterval(timer);
        this.progress.set(100);
        this.uploading.set(false);
        void this.router.navigate([roleRoute(this.router, 'lab-reports', String(report.id))]);
      },
      error: (err) => {
        clearInterval(timer);
        this.uploading.set(false);
        this.error.set(extractApiErrorMessage(err, 'Upload failed.'));
      },
    });
  }

  err(field: string): string | null {
    const c = this.form.get(field);
    return c?.touched && c.invalid ? 'Required' : null;
  }

  basePath(): string {
    return roleBase(this.router);
  }

  private loadAppointmentsForPatient(patientId: string): void {
    if (!patientId) {
      this.appointmentOptions.set([{ label: 'None', value: '' }]);
      return;
    }

    this.appointmentsApi.list({ page: 1, pageSize: 100, patientId: Number(patientId) }).subscribe({
      next: (r) => {
        this.appointmentOptions.set(
          toAppointmentSelectOptions(r.items, { patientId: Number(patientId) }, true),
        );
      },
    });
  }
}
