import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiTabsComponent } from '../../../shared/components/ui/tabs/ui-tabs.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { bindUnsavedChangesProtection, formsAreDirty, markFormsPristine } from '../../../shared/utils/unsaved-changes.util';
import { markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
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
    UiSkeletonComponent,
    UiEmptyStateComponent,
    UiTabsComponent,
    DataTableComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to patients</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Patient not found" message="This patient may have been removed or you may not have access." />
    } @else {
      @if (patient(); as p) {
        <div class="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold">{{ p.fullName }}</h1>
            <p class="text-sm text-muted-foreground">MRN {{ p.medicalRecordNumber }} · {{ p.email }}</p>
          </div>
          @if (canEdit()) {
            <app-ui-button size="sm" [loading]="saving()" (pressed)="save()">Save changes</app-ui-button>
          }
          @if (isAdmin() && p.isActive) {
            <app-ui-button size="sm" variant="destructive" [loading]="deactivating()" (pressed)="deactivatePatient()">
              Deactivate patient
            </app-ui-button>
          }
        </div>

        <app-ui-tabs class="mb-4 block" [tabs]="tabs" [active]="activeTab()" ariaLabel="Patient sections" (tabChange)="setTab($event)" />

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
          <p class="mt-3 text-sm text-destructive" role="alert">{{ error() }}</p>
        }
      }
    }
  `,
})
export class PatientDetailPageComponent implements OnInit, HasUnsavedChanges {
  private readonly toasts = inject(ApiErrorService);

  private readonly api = inject(PatientsApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader(
    'id',
    (id) => this.api.getById(id),
    this.destroyRef,
    {
      onLoaded: (patient) => {
        this.patchForm(patient);
        this.api.getMedicalHistory(patient.id).subscribe({
          next: (h) => this.history.set(h),
          error: () => this.history.set(null),
        });
      },
    },
  );

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly patient = this.routeState.data;
  readonly history = signal<PatientMedicalHistoryDto | null>(null);
  readonly activeTab = signal<PatientDetailTab>('profile');
  readonly saving = signal(false);
  readonly deactivating = signal(false);
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

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
  }

  hasUnsavedChanges(): boolean {
    return this.canEdit() && formsAreDirty(this.form);
  }

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
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = params.get('tab') as PatientDetailTab | null;
      if (tab) this.activeTab.set(tab);
    });
  }

  setTab(tab: PatientDetailTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  canEdit(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist' || role === 'Doctor';
  }

  isAdmin(): boolean {
    return this.auth.role() === 'Admin';
  }

  deactivatePatient(): void {
    const patient = this.patient();
    if (!patient || !confirm(`Deactivate ${patient.fullName}? Their portal access will be revoked.`)) return;
    this.deactivating.set(true);
    this.api.deactivate(patient.id).subscribe({
      next: () => {
        this.deactivating.set(false);
        this.toasts.show('Patient deactivated.', 'success');
        void this.router.navigate([this.listLink()]);
      },
      error: (err) => {
        this.deactivating.set(false);
        this.toasts.show(extractApiErrorMessage(err, 'Failed to deactivate patient.'), 'error');
      },
    });
  }

  save(): void {
    const patient = this.patient();
    if (!patient) return;
    if (!guardFormSubmit(this.form)) return;
    this.saving.set(true);
    this.error.set(null);
    this.api.update(patient.id, this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.patient.set(updated);
        this.patchForm(updated);
        markFormsPristine(this.form);
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Update failed.'));
      },
    });
  }

  listLink(): string {
    return roleRoute(this.router, 'patients');
  }

  private patchForm(patient: PatientDto): void {
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
    else this.form.enable();
    markFormsPristine(this.form);
  }
}
