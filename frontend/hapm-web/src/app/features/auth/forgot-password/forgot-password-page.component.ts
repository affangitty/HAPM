import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthPageShellComponent } from '../components/auth-page-shell.component';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';

@Component({
  selector: 'app-forgot-password-page',
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
        <h2 class="text-2xl font-bold text-foreground">Reset password</h2>
        <p class="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
      </div>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-form-field label="Work email address" [error]="fieldError('email')">
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="m22 6-10 7L2 6" />
              </svg>
            </span>
            <app-ui-input
              type="email"
              formControlName="email"
              placeholder="your@hapm.local"
              class="h-10 rounded-xl pl-10"
            />
          </div>
        </app-form-field>

        @if (errorMessage()) {
          <p class="text-sm text-destructive">{{ errorMessage() }}</p>
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
            Sending...
          } @else {
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
            Send reset link
          }
        </button>
      </form>
    </app-auth-page-shell>
  `,
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  fieldError(controlName: 'email'): string | null {
    const control = this.form.controls[controlName];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['email']) return 'Enter a valid email address.';
    return 'Invalid value.';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.value;
    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.requestPasswordReset({ email }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/auth/reset-password/sent'], {
          queryParams: { email },
        });
      },
      error: () => {
        // API endpoint not available — preserve UX flow for design demo.
        this.loading.set(false);
        void this.router.navigate(['/auth/reset-password/sent'], {
          queryParams: { email },
        });
      },
    });
  }
}
