import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFormControlError, markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { DoctorDto } from '../models/doctor.models';
import { DoctorsApiService } from '../data/doctors-api.service';

@Component({
  selector: 'app-doctor-profile-page',
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
    UiEmptyStateComponent,
    UiSkeletonComponent,
  ],
  template: `
    <app-ui-page-header title="My Profile" subtitle="Update your public doctor profile" />

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      @if (doctor(); as d) {
      <app-ui-card>
        <app-ui-card-content class="p-5">
          <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="save()">
            <app-form-field label="Full name" [error]="fieldError('fullName')">
              <app-ui-input formControlName="fullName" />
            </app-form-field>
            <app-form-field label="Phone" [error]="fieldError('phoneNumber')">
              <app-ui-input formControlName="phoneNumber" />
            </app-form-field>
            <app-form-field label="Room" class="sm:col-span-2">
              <app-ui-input formControlName="roomNumber" />
            </app-form-field>
            <app-form-field label="Biography" class="sm:col-span-2">
              <app-ui-textarea formControlName="biography" [rows]="4" />
            </app-form-field>
            <div class="sm:col-span-2 flex items-center gap-3">
              <app-ui-button type="submit" [loading]="saving()">Save profile</app-ui-button>
              @if (success()) {
                <span class="text-sm text-emerald-600">Profile updated.</span>
              }
              @if (error()) {
                <span class="text-sm text-destructive">{{ error() }}</span>
              }
            </div>
          </form>
          <div class="mt-6 grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
            <p><span class="text-muted-foreground">Specialization:</span> {{ d.specialization }}</p>
            <p><span class="text-muted-foreground">Rating:</span> {{ d.averageRating }} ({{ d.reviewCount }} reviews)</p>
          </div>
        </app-ui-card-content>
      </app-ui-card>
      }
    }
  `,
})
export class DoctorProfilePageComponent implements OnInit {
  private readonly toasts = inject(ApiErrorService);

  private readonly api = inject(DoctorsApiService);
  private readonly fb = inject(FormBuilder);

  readonly doctor = signal<DoctorDto | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    roomNumber: [''],
    biography: [''],
  });

  ngOnInit(): void {
    this.api.getCurrentDoctor().subscribe({
      next: (doctor) => {
        this.doctor.set(doctor);
        this.loading.set(false);
        this.form.patchValue({
          fullName: doctor.fullName,
          phoneNumber: doctor.phoneNumber ?? '',
          roomNumber: doctor.roomNumber ?? '',
          biography: doctor.biography ?? '',
        });
      },
      error: () => setPageLoadFailed(this.loading, this.loadError, 'Unable to load your profile.'),
    });
  }

  fieldError(name: 'fullName' | 'phoneNumber'): string | null {
    const c = this.form.controls[name];
    return c.touched && c.errors?.['required'] ? 'Required.' : null;
  }

  save(): void {
    const doctor = this.doctor();
    if (!doctor || this.form.invalid) {
      markFormGroupTouched(this.form);
      return;
    }
    this.saving.set(true);
    this.success.set(false);
    this.error.set(null);
    this.api.updateOwnProfile(doctor.id, this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.doctor.set(updated);
        this.saving.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Unable to update profile.'));
      },
    });
  }
}
