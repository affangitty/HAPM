import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPasswordInputComponent } from '../../../shared/components/ui/input/ui-password-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { getFormControlError, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { STRONG_PASSWORD_MESSAGE, strongPasswordValidator } from '../validators/password.validators';

@Component({
  selector: 'app-patient-register-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    UiInputComponent,
    UiPasswordInputComponent,
    UiSelectComponent,
  ],
  template: `
    <button
      type="button"
      class="mb-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      (click)="backToLogin.emit()"
    >
      <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to sign in
    </button>

    <div class="mb-4">
      <div class="mb-3 flex size-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
        <svg class="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-foreground">Create patient account</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Book appointments, view records, and manage your care in one place.
      </p>
    </div>

    <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
      <fieldset class="space-y-3">
        <legend class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal details</legend>
        <app-form-field label="Full name" [error]="fieldError('fullName')">
          <app-ui-input formControlName="fullName" autocomplete="name" placeholder="Your full name" />
        </app-form-field>
        <div class="grid gap-4 sm:grid-cols-2">
          <app-form-field label="Email" [error]="fieldError('email')">
            <app-ui-input type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" />
          </app-form-field>
          <app-form-field label="Phone" [error]="fieldError('phoneNumber')">
            <app-ui-input formControlName="phoneNumber" autocomplete="tel" placeholder="+91 98765 43210" />
          </app-form-field>
          <app-form-field label="Date of birth" [error]="fieldError('dateOfBirth')">
            <app-ui-input type="date" formControlName="dateOfBirth" autocomplete="bday" />
          </app-form-field>
          <app-form-field label="Gender" [error]="fieldError('gender')">
            <app-ui-select formControlName="gender" [options]="genderOptions" placeholder="Select gender" />
          </app-form-field>
        </div>
      </fieldset>

      <fieldset class="space-y-3">
        <legend class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account security</legend>
        <app-form-field label="Password" [error]="fieldError('password')" hint="At least 8 characters with upper, lower, and a number">
          <app-ui-password-input formControlName="password" autocomplete="new-password" placeholder="Create a password" />
        </app-form-field>
      </fieldset>

      @if (errorMessage()) {
        <p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{{ errorMessage() }}</p>
      }

      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-blue-700 disabled:opacity-60"
        [disabled]="loading()"
      >
        @if (loading()) {
          <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Creating account...
        } @else {
          Create account
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        }
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-muted-foreground">
      Already registered?
      <button type="button" class="font-medium text-primary hover:underline" (click)="backToLogin.emit()">
        Sign in
      </button>
    </p>
  `,
})
export class PatientRegisterFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ApiErrorService);

  readonly navigateOnSuccess = input(true);
  readonly backToLogin = output<void>();
  readonly registered = output<void>();

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
    password: ['', [Validators.required, strongPasswordValidator()]],
  });

  fieldError(name: keyof typeof this.form.controls): string | null {
    return getFormControlError(this.form, name, {
      strongPassword: STRONG_PASSWORD_MESSAGE,
    });
  }

  submit(): void {
    if (!guardFormSubmit(this.form)) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.registered.emit();
        if (this.navigateOnSuccess()) {
          void this.router.navigateByUrl('/patient/dashboard');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = (err as { error?: { detail?: string } })?.error?.detail ?? 'Registration failed.';
        this.errorMessage.set(msg);
        this.toasts.showFromError(err, 'Registration failed.');
      },
    });
  }
}
