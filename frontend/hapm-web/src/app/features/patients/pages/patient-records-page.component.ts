import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { bindUnsavedChangesProtection, formsAreDirty, markFormsPristine } from '../../../shared/utils/unsaved-changes.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
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
  selector: 'app-patient-records-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiInputComponent,
    UiTextareaComponent,
    UiButtonComponent,
    DataTableComponent,
  ],
  template: `
    <app-ui-page-header title="Medical Records" subtitle="Your profile, history, and clinical information" />

    @if (patient(); as p) {
      <div class="mb-4 flex flex-wrap gap-2">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="rounded-xl px-3 py-2 text-sm font-medium"
            [class]="activeTab() === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
            (click)="activeTab.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @switch (activeTab()) {
        @case ('profile') {
          <app-ui-card><app-ui-card-content class="grid gap-3 p-5 sm:grid-cols-2 text-sm">
            <p><span class="text-muted-foreground">MRN:</span> {{ p.medicalRecordNumber }}</p>
            <p><span class="text-muted-foreground">Age:</span> {{ p.age }}</p>
            <p><span class="text-muted-foreground">Gender:</span> {{ p.gender }}</p>
            <p><span class="text-muted-foreground">Blood group:</span> {{ p.bloodGroup ?? '—' }}</p>
          </app-ui-card-content></app-ui-card>
        }
        @case ('medical-history') {
          <app-data-table [columns]="apptColumns" [rows]="history()?.appointments ?? []" [showPagination]="false" />
        }
        @case ('emergency') {
          <app-ui-card><app-ui-card-content class="p-5 text-sm" [formGroup]="form">
            <app-form-field label="Emergency contact name"><app-ui-input formControlName="emergencyContactName" /></app-form-field>
            <app-form-field label="Emergency contact phone"><app-ui-input formControlName="emergencyContactPhone" /></app-form-field>
            <app-ui-button class="mt-3" [loading]="saving()" (pressed)="save()">Save</app-ui-button>
          </app-ui-card-content></app-ui-card>
        }
        @case ('allergies') {
          <app-ui-card><app-ui-card-content class="p-5" [formGroup]="form">
            <app-form-field label="Allergies"><app-ui-textarea formControlName="allergies" [rows]="4" /></app-form-field>
            <app-ui-button class="mt-3" [loading]="saving()" (pressed)="save()">Save</app-ui-button>
          </app-ui-card-content></app-ui-card>
        }
        @case ('conditions') {
          <app-ui-card><app-ui-card-content class="p-5" [formGroup]="form">
            <app-form-field label="Chronic conditions"><app-ui-textarea formControlName="chronicConditions" [rows]="4" /></app-form-field>
            <app-ui-button class="mt-3" [loading]="saving()" (pressed)="save()">Save</app-ui-button>
          </app-ui-card-content></app-ui-card>
        }
      }
      @if (error()) { <p class="mt-2 text-sm text-destructive">{{ error() }}</p> }
    }
  `,
})
export class PatientRecordsPageComponent implements OnInit, HasUnsavedChanges {
  private readonly api = inject(PatientsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

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

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
  }

  hasUnsavedChanges(): boolean {
    return formsAreDirty(this.form);
  }

  readonly form = this.fb.group({
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

  ngOnInit(): void {
    this.api.getMyProfile().subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.form.patchValue({
          emergencyContactName: patient.emergencyContactName ?? '',
          emergencyContactPhone: patient.emergencyContactPhone ?? '',
          allergies: patient.allergies ?? '',
          chronicConditions: patient.chronicConditions ?? '',
        });
        markFormsPristine(this.form);
        this.api.getMedicalHistory(patient.id).subscribe({ next: (h) => this.history.set(h) });
      },
    });
  }

  save(): void {
    const patient = this.patient();
    if (!patient || !this.form.valid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .update(patient.id, {
        fullName: patient.fullName,
        phoneNumber: patient.phoneNumber ?? '',
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender as Gender,
        bloodGroup: patient.bloodGroup ?? undefined,
        address: patient.address ?? undefined,
        emergencyContactName: v.emergencyContactName ?? undefined,
        emergencyContactPhone: v.emergencyContactPhone ?? undefined,
        allergies: v.allergies ?? undefined,
        chronicConditions: v.chronicConditions ?? undefined,
      })
      .subscribe({
        next: (updated) => {
          this.patient.set(updated);
          markFormsPristine(this.form);
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(extractApiErrorMessage(err, 'Save failed.'));
        },
      });
  }
}
