import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import {
  STRONG_PASSWORD_MESSAGE,
  strongPasswordValidator,
} from '../../auth/validators/password.validators';
import { PatientsApiService } from '../data/patients-api.service';
import { Gender } from '../models/patient.models';

@Component({
  selector: 'app-patient-register-page',
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
  ],
  template: `
    <app-ui-page-header title="Register Patient" subtitle="Create a walk-in patient account" />

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
          <app-form-field label="Password" [error]="err('password')">
            <app-ui-input type="password" formControlName="password" />
          </app-form-field>
          <app-form-field label="Date of birth" [error]="err('dateOfBirth')">
            <app-ui-input type="date" formControlName="dateOfBirth" />
          </app-form-field>
          <app-form-field label="Gender" [error]="err('gender')">
            <app-ui-select formControlName="gender" [options]="genderOptions" />
          </app-form-field>
          <app-form-field label="Blood group">
            <app-ui-input formControlName="bloodGroup" placeholder="A+" />
          </app-form-field>
          <app-form-field label="Address" class="sm:col-span-2">
            <app-ui-textarea formControlName="address" [rows]="2" />
          </app-form-field>
          <app-form-field label="Emergency contact name">
            <app-ui-input formControlName="emergencyContactName" />
          </app-form-field>
          <app-form-field label="Emergency contact phone">
            <app-ui-input formControlName="emergencyContactPhone" />
          </app-form-field>
          <app-form-field label="Allergies" class="sm:col-span-2">
            <app-ui-textarea formControlName="allergies" [rows]="2" />
          </app-form-field>
          <app-form-field label="Chronic conditions" class="sm:col-span-2">
            <app-ui-textarea formControlName="chronicConditions" [rows]="2" />
          </app-form-field>

          @if (error()) {
            <p class="text-sm text-destructive sm:col-span-2">{{ error() }}</p>
          }

          <div class="flex gap-2 sm:col-span-2">
            <app-ui-button type="submit" [loading]="saving()">Create patient</app-ui-button>
            <a [routerLink]="listLink()"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class PatientRegisterPageComponent {
  private readonly api = inject(PatientsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [Validators.required, strongPasswordValidator()]],
    dateOfBirth: ['', Validators.required],
    gender: ['Male' as Gender, Validators.required],
    bloodGroup: [''],
    address: [''],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
    allergies: [''],
    chronicConditions: [''],
  });

  err(name: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[name];
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Required.';
    if (c.errors['email']) return 'Invalid email.';
    if (c.errors['strongPassword']) return STRONG_PASSWORD_MESSAGE;
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.create(this.form.getRawValue()).subscribe({
      next: (patient) => {
        this.saving.set(false);
        void this.router.navigateByUrl(`${this.basePath()}/patients/${patient.id}`);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Registration failed.'));
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
