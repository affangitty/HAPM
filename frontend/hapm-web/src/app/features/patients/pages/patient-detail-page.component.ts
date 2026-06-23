import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { PatientsApiService } from '../data/patients-api.service';
import {
  AppointmentSummaryDto,
  Gender,
  PatientDetailTab,
  PatientDto,
  PatientMedicalHistoryDto,
} from '../models/patient.models';

@Component({
  selector: 'app-patient-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiInputComponent,
    UiSelectComponent,
    UiTextareaComponent,
    UiButtonComponent,
    DataTableComponent,
  ],
  template: `
    @if (patient(); as p) {
      <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to patients</a>
      <div class="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold">{{ p.fullName }}</h1>
          <p class="text-sm text-muted-foreground">MRN {{ p.medicalRecordNumber }} · {{ p.email }}</p>
        </div>
        @if (canEdit()) {
          <app-ui-button size="sm" [loading]="saving()" (pressed)="save()">Save changes</app-ui-button>
        }
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="rounded-xl px-3 py-2 text-sm font-medium"
            [class]="activeTab() === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
            (click)="setTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (activeTab() === 'profile') {
        <app-ui-card>
          <app-ui-card-content class="p-5">
            <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form">
              <app-form-field label="Full name"><app-ui-input formControlName="fullName" /></app-form-field>
              <app-form-field label="Phone"><app-ui-input formControlName="phoneNumber" /></app-form-field>
              <app-form-field label="Date of birth"><app-ui-input type="date" formControlName="dateOfBirth" /></app-form-field>
              <app-form-field label="Gender"><app-ui-select formControlName="gender" [options]="genderOptions" /></app-form-field>
              <app-form-field label="Blood group"><app-ui-input formControlName="bloodGroup" /></app-form-field>
              <app-form-field label="Address" class="sm:col-span-2"><app-ui-textarea formControlName="address" [rows]="2" /></app-form-field>
            </form>
          </app-ui-card-content>
        </app-ui-card>
      }

      @if (activeTab() === 'emergency') {
        <app-ui-card>
          <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2" [formGroup]="form">
            <app-form-field label="Emergency contact name"><app-ui-input formControlName="emergencyContactName" /></app-form-field>
            <app-form-field label="Emergency contact phone"><app-ui-input formControlName="emergencyContactPhone" /></app-form-field>
          </app-ui-card-content>
        </app-ui-card>
      }

      @if (activeTab() === 'allergies') {
        <app-ui-card>
          <app-ui-card-content class="p-5" [formGroup]="form">
            <app-form-field label="Known allergies"><app-ui-textarea formControlName="allergies" [rows]="5" /></app-form-field>
          </app-ui-card-content>
        </app-ui-card>
      }

      @if (activeTab() === 'conditions') {
        <app-ui-card>
          <app-ui-card-content class="p-5" [formGroup]="form">
            <app-form-field label="Chronic conditions"><app-ui-textarea formControlName="chronicConditions" [rows]="5" /></app-form-field>
          </app-ui-card-content>
        </app-ui-card>
      }

      @if (activeTab() === 'medical-history') {
        <div class="grid gap-4 lg:grid-cols-2">
          <app-data-table [columns]="apptColumns" [rows]="history()?.appointments ?? []" [showPagination]="false" />
          <app-data-table [columns]="rxColumns" [rows]="history()?.prescriptions ?? []" [showPagination]="false" />
          <app-data-table class="lg:col-span-2" [columns]="labColumns" [rows]="history()?.labReports ?? []" [showPagination]="false" />
        </div>
      }

      @if (error()) {
        <p class="mt-3 text-sm text-destructive">{{ error() }}</p>
      }
    }
  `,
})
export class PatientDetailPageComponent implements OnInit {
  private readonly api = inject(PatientsApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly patient = signal<PatientDto | null>(null);
  readonly history = signal<PatientMedicalHistoryDto | null>(null);
  readonly activeTab = signal<PatientDetailTab>('profile');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly tabs = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'medical-history' as const, label: 'Medical History' },
    { id: 'emergency' as const, label: 'Emergency Contacts' },
    { id: 'allergies' as const, label: 'Allergies' },
    { id: 'conditions' as const, label: 'Chronic Conditions' },
  ];

  readonly genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    gender: ['Male' as Gender, Validators.required],
    bloodGroup: [''],
    address: [''],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
    allergies: [''],
    chronicConditions: [''],
  });

  readonly apptColumns: DataTableColumn<AppointmentSummaryDto>[] = [
    { key: 'date', header: 'Date', cell: (r) => r.appointmentDate },
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctorName },
    { key: 'status', header: 'Status', cell: (r) => r.status },
  ];

  readonly rxColumns: DataTableColumn<PatientMedicalHistoryDto['prescriptions'][number]>[] = [
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctorName },
    { key: 'status', header: 'Status', cell: (r) => r.status },
    { key: 'date', header: 'Issued', cell: (r) => new Date(r.issuedAtUtc).toLocaleDateString() },
  ];

  readonly labColumns: DataTableColumn<PatientMedicalHistoryDto['labReports'][number]>[] = [
    { key: 'test', header: 'Test', cell: (r) => r.testName },
    { key: 'status', header: 'Status', cell: (r) => r.status },
    { key: 'result', header: 'Result', cell: (r) => r.resultSummary ?? '—' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const tab = this.route.snapshot.queryParamMap.get('tab') as PatientDetailTab | null;
    if (tab) this.activeTab.set(tab);

    this.api.getById(id).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.form.patchValue({
          fullName: patient.fullName,
          phoneNumber: patient.phoneNumber ?? '',
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup ?? '',
          address: patient.address ?? '',
          emergencyContactName: patient.emergencyContactName ?? '',
          emergencyContactPhone: patient.emergencyContactPhone ?? '',
          allergies: patient.allergies ?? '',
          chronicConditions: patient.chronicConditions ?? '',
        });
        if (!this.canEdit()) this.form.disable();
      },
    });

    this.api.getMedicalHistory(id).subscribe({ next: (h) => this.history.set(h) });
  }

  setTab(tab: PatientDetailTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  canEdit(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist' || role === 'Doctor';
  }

  save(): void {
    const patient = this.patient();
    if (!patient || this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.api.update(patient.id, this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.patient.set(updated);
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Update failed.'));
      },
    });
  }

  listLink(): string {
    return `${this.basePath()}/patients`;
  }

  private basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
