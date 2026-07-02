import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { bindUnsavedChangesProtection, formsAreDirty, markFormsPristine } from '../../../shared/utils/unsaved-changes.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import {
  getFormControlError,
  guardFormSubmit,
} from '../../../shared/utils/form-errors.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import {
  STRONG_PASSWORD_MESSAGE,
  strongPasswordValidator,
} from '../../auth/validators/password.validators';
import { DoctorsApiService } from '../data/doctors-api.service';

@Component({
  selector: 'app-doctor-register-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiInputComponent,
    UiTextareaComponent,
    UiButtonComponent,
  ],
  template: `
    <app-ui-page-header title="Register Doctor" subtitle="Create a new doctor account and profile" />

    <app-ui-card class="max-w-3xl">
      <app-ui-card-content class="p-5">
        <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()">
          <app-form-field label="Full name" [error]="err('fullName')" class="sm:col-span-2">
            <app-ui-input formControlName="fullName" />
          </app-form-field>
          <app-form-field label="Email" [error]="err('email')">
            <app-ui-input type="email" formControlName="email" />
          </app-form-field>
          <app-form-field label="Phone" [error]="err('phoneNumber')">
            <app-ui-input formControlName="phoneNumber" />
          </app-form-field>
          <app-form-field label="Password" [error]="err('password')" class="sm:col-span-2">
            <app-ui-input type="password" formControlName="password" />
          </app-form-field>
          <app-form-field label="Specialization" [error]="err('specialization')">
            <app-ui-input formControlName="specialization" placeholder="e.g. Cardiology" />
          </app-form-field>
          <app-form-field label="Qualification" [error]="err('qualification')">
            <app-ui-input formControlName="qualification" placeholder="e.g. MD" />
          </app-form-field>
          <app-form-field label="License number" [error]="err('licenseNumber')">
            <app-ui-input formControlName="licenseNumber" />
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
            <p class="text-sm text-destructive sm:col-span-2" role="alert">{{ error() }}</p>
          }

          <div class="flex gap-2 sm:col-span-2">
            <app-ui-button type="submit" [loading]="saving()">Create doctor</app-ui-button>
            <a [routerLink]="listLink()"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class DoctorRegisterPageComponent implements HasUnsavedChanges {
  private readonly api = inject(DoctorsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasts = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
  }

  hasUnsavedChanges(): boolean {
    return formsAreDirty(this.form);
  }

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [Validators.required, strongPasswordValidator()]],
    specialization: ['', Validators.required],
    qualification: ['', Validators.required],
    licenseNumber: ['', Validators.required],
    experienceYears: [0, [Validators.required, Validators.min(0), Validators.max(80)]],
    consultationFee: [0, [Validators.required, Validators.min(0)]],
    roomNumber: [''],
    biography: [''],
  });

  private readonly fieldLabels: Record<string, string> = {
    fullName: 'Full name',
    email: 'Email',
    phoneNumber: 'Phone',
    password: 'Password',
    specialization: 'Specialization',
    qualification: 'Qualification',
    licenseNumber: 'License number',
    experienceYears: 'Experience',
    consultationFee: 'Consultation fee',
  };

  err(name: keyof typeof this.form.controls): string | null {
    const extra = name === 'password' ? { strongPassword: STRONG_PASSWORD_MESSAGE } : undefined;
    return getFormControlError(this.form, name, extra);
  }

  submit(): void {
    if (!guardFormSubmit(this.form)) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.api.create(this.form.getRawValue()).subscribe({
      next: (doctor) => {
        this.saving.set(false);
        this.toasts.showSuccess(`Doctor ${doctor.fullName} registered successfully.`);
        markFormsPristine(this.form);
        void this.router.navigateByUrl(roleRoute(this.router, 'doctors', String(doctor.id)));
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Failed to register doctor.'));
      },
    });
  }

  listLink(): string {
    return roleRoute(this.router, 'doctors');
  }
}
