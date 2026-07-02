import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { getFormControlError, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { bindUnsavedChangesProtection, formsAreDirty, markFormsPristine } from '../../../shared/utils/unsaved-changes.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { DoctorsApiService } from '../data/doctors-api.service';

@Component({
  selector: 'app-doctor-edit-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, UiPageHeaderComponent, UiCardComponent, UiCardContentComponent,
    FormFieldComponent, UiInputComponent, UiSelectComponent, UiTextareaComponent, UiButtonComponent,
    UiEmptyStateComponent, UiSkeletonComponent,
  ],
  template: `
    <app-ui-page-header title="Edit Doctor" [subtitle]="doctor()?.fullName ?? 'Update doctor profile'" />

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Doctor not found" />
    } @else {
      @if (doctor(); as d) {
      <app-ui-card class="max-w-3xl">
        <app-ui-card-content class="p-5">
          <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()">
            <app-form-field label="Full name" [error]="err('fullName')" class="sm:col-span-2">
              <app-ui-input formControlName="fullName" />
            </app-form-field>
            <app-form-field label="Phone" [error]="err('phoneNumber')">
              <app-ui-input formControlName="phoneNumber" />
            </app-form-field>
            <app-form-field label="Available for booking">
              <app-ui-select formControlName="isAvailable" [options]="availabilityOptions" />
            </app-form-field>
            <app-form-field label="Specialization" [error]="err('specialization')">
              <app-ui-input formControlName="specialization" />
            </app-form-field>
            <app-form-field label="Qualification" [error]="err('qualification')">
              <app-ui-input formControlName="qualification" />
            </app-form-field>
            <app-form-field label="Experience (years)" [error]="err('experienceYears')">
              <app-ui-input type="number" formControlName="experienceYears" min="0" max="80" />
            </app-form-field>
            <app-form-field label="Consultation fee" [error]="err('consultationFee')">
              <app-ui-input type="number" formControlName="consultationFee" min="0" step="0.01" />
            </app-form-field>
            <app-form-field label="Room number">
              <app-ui-input formControlName="roomNumber" />
            </app-form-field>
            <app-form-field label="Biography" class="sm:col-span-2">
              <app-ui-textarea formControlName="biography" [rows]="3" />
            </app-form-field>

            @if (error()) {
              <p class="text-sm text-destructive sm:col-span-2">{{ error() }}</p>
            }

            <div class="flex gap-2 sm:col-span-2">
              <app-ui-button type="submit" [loading]="saving()">Save changes</app-ui-button>
              <a [routerLink]="detailLink(d.id)"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
            </div>
          </form>
        </app-ui-card-content>
      </app-ui-card>
      }
    }
  `,
})
export class DoctorEditPageComponent implements HasUnsavedChanges {
  private readonly api = inject(DoctorsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasts = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader('id', (id) => this.api.getById(id), this.destroyRef, {
    onLoaded: (d) => {
      this.form.patchValue({
      fullName: d.fullName,
      phoneNumber: d.phoneNumber ?? '',
      specialization: d.specialization,
      qualification: d.qualification,
      experienceYears: d.experienceYears,
      consultationFee: d.consultationFee,
      roomNumber: d.roomNumber ?? '',
      biography: d.biography ?? '',
      isAvailable: d.isAvailable ? 'true' : 'false',
    });
      markFormsPristine(this.form);
    },
  });

  readonly doctor = this.routeState.data;
  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly availabilityOptions = [
    { label: 'Available', value: 'true' },
    { label: 'Unavailable', value: 'false' },
  ];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    specialization: ['', Validators.required],
    qualification: ['', Validators.required],
    experienceYears: [0, [Validators.required, Validators.min(0)]],
    consultationFee: [0, [Validators.required, Validators.min(0)]],
    roomNumber: [''],
    biography: [''],
    isAvailable: ['true', Validators.required],
  });

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
  }

  hasUnsavedChanges(): boolean {
    return formsAreDirty(this.form);
  }

  submit(): void {
    const d = this.doctor();
    if (!d || !guardFormSubmit(this.form)) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.api.update(d.id, {
      fullName: v.fullName,
      phoneNumber: v.phoneNumber,
      specialization: v.specialization,
      qualification: v.qualification,
      experienceYears: v.experienceYears,
      consultationFee: v.consultationFee,
      roomNumber: v.roomNumber || undefined,
      biography: v.biography || undefined,
      isAvailable: v.isAvailable === 'true',
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toasts.show('Doctor profile updated.', 'success');
        markFormsPristine(this.form);
        void this.router.navigate([this.detailLink(d.id)]);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Failed to update doctor.'));
      },
    });
  }

  err(field: 'fullName' | 'phoneNumber' | 'specialization' | 'qualification' | 'experienceYears' | 'consultationFee'): string | null {
    return getFormControlError(this.form, field);
  }

  detailLink(id: number): string {
    return roleRoute(this.router, 'doctors', String(id));
  }
}
