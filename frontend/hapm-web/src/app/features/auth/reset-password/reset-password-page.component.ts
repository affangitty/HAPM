import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthPageShellComponent } from '../components/auth-page-shell.component';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import {
  passwordMatchValidator,
  STRONG_PASSWORD_MESSAGE,
  strongPasswordValidator,
} from '../validators/password.validators';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthPageShellComponent,
    FormFieldComponent,
    UiInputComponent,
  ],
  template: `
    <app-auth-page-shell>
      <a
        routerLink="/auth/login"
        class="mb-6 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to login
      </a>

      <div class="mb-8">
        <div class="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50">
          <svg class="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-foreground">Set new password</h2>
        <p class="mt-1 text-sm text-muted-foreground">Choose a strong password for your HAPM account.</p>
      </div>

      @if (!token && !isAuthenticated()) {
        <div class="mb-4 rounded-xl border border-border bg-muted p-3">
          <p class="text-xs text-muted-foreground">
            Open this page from the reset link in your email. If you are already signed in, update your password under
            <a [routerLink]="settingsRoute" class="font-medium text-primary hover:underline">Profile &amp; Settings</a>.
          </p>
        </div>
      }

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-form-field label="New password" [error]="fieldError('newPassword')">
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <app-ui-input
              type="password"
              formControlName="newPassword"
              placeholder="••••••••"
              class="h-10 rounded-xl pl-10"
            />
          </div>
        </app-form-field>

        <app-form-field label="Confirm new password" [error]="fieldError('confirmPassword')">
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <app-ui-input
              type="password"
              formControlName="confirmPassword"
              placeholder="••••••••"
              class="h-10 rounded-xl pl-10"
            />
          </div>
        </app-form-field>

        <div class="rounded-xl bg-blue-50 p-3">
          <p class="mb-1 text-xs font-medium text-primary">Password requirements</p>
          <ul class="space-y-0.5 text-xs text-blue-600">
            <li>• At least 8 characters</li>
            <li>• Include uppercase, lowercase, numbers, and symbols</li>
          </ul>
        </div>

        @if (errorMessage()) {
          <p class="text-sm text-destructive">{{ errorMessage() }}</p>
        }

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-blue-700 disabled:opacity-60"
          [disabled]="loading()"
        >
          @if (loading()) {
            Updating...
          } @else {
            Update password
          }
        </button>
      </form>
    </app-auth-page-shell>
  `,
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly token = this.route.snapshot.queryParamMap.get('token');
  readonly settingsRoute = this.auth.getSettingsRoute();
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, strongPasswordValidator()]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator('newPassword')]],
  });

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.auth.getSettingsRoute());
    }
  }

  fieldError(controlName: 'newPassword' | 'confirmPassword'): string | null {
    const control = this.form.controls[controlName];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['strongPassword']) return STRONG_PASSWORD_MESSAGE;
    if (control.errors['passwordMismatch']) return 'Passwords do not match.';
    return 'Invalid value.';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessage.set(
        'No reset token was provided. Request a new link or sign in and change your password under Profile & Settings.',
      );
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    // Placeholder until POST /api/auth/reset-password is available.
    this.loading.set(false);
    this.errorMessage.set(
      'Token-based password reset is not enabled on the server yet. Sign in and use Profile & Settings → Security to change your password.',
    );
  }
}
