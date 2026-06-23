import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '../../../shared/components/ui/card/ui-card.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FormFieldComponent,
    UiButtonComponent,
    UiInputComponent,
    UiSelectComponent,
    UiCardComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiCardDescriptionComponent,
    UiCardContentComponent,
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center p-6">
      <app-ui-card class="w-full max-w-lg">
        <app-ui-card-header>
          <app-ui-card-title>Patient registration</app-ui-card-title>
          <app-ui-card-description>Create a patient account to book appointments and view records.</app-ui-card-description>
        </app-ui-card-header>
        <app-ui-card-content>
          <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()">
            <app-form-field class="sm:col-span-2" label="Full name" [error]="fieldError('fullName')">
              <app-ui-input formControlName="fullName" />
            </app-form-field>
            <app-form-field label="Email" [error]="fieldError('email')">
              <app-ui-input type="email" formControlName="email" />
            </app-form-field>
            <app-form-field label="Phone" [error]="fieldError('phoneNumber')">
              <app-ui-input formControlName="phoneNumber" />
            </app-form-field>
            <app-form-field label="Date of birth" [error]="fieldError('dateOfBirth')">
              <app-ui-input type="date" formControlName="dateOfBirth" />
            </app-form-field>
            <app-form-field label="Gender" [error]="fieldError('gender')">
              <app-ui-select formControlName="gender" [options]="genderOptions" placeholder="Select gender" />
            </app-form-field>
            <app-form-field class="sm:col-span-2" label="Password" [error]="fieldError('password')">
              <app-ui-input type="password" formControlName="password" />
            </app-form-field>
            @if (errorMessage()) {
              <p class="sm:col-span-2 text-sm text-destructive">{{ errorMessage() }}</p>
            }
            <div class="sm:col-span-2 flex flex-col gap-3">
              <app-ui-button type="submit" [loading]="loading()">Create account</app-ui-button>
              <a routerLink="/auth/login" class="text-center text-sm text-primary hover:underline">Already have an account? Sign in</a>
            </div>
          </form>
        </app-ui-card-content>
      </app-ui-card>
    </div>
  `,
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    gender: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  fieldError(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    return 'This field is required.';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/patient/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Registration failed.');
      },
    });
  }
}
