import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UserRole } from '../../../core/auth/auth.models';
import { AuthPageShellComponent } from '../components/auth-page-shell.component';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';

type DemoRole = 'Admin' | 'Doctor' | 'Patient' | 'Receptionist';

const DEMO_ROLES: { role: DemoRole; label: string; email: string }[] = [
  { role: 'Admin', label: 'Admin', email: 'admin@hapm.local' },
  { role: 'Doctor', label: 'Doctor', email: 'dr.sharma@hapm.local' },
  { role: 'Patient', label: 'Patient', email: 'patient@hapm.local' },
  { role: 'Receptionist', label: 'Receptionist', email: 'reception@hapm.local' },
];

@Component({
  selector: 'app-login-page',
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
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-foreground">Welcome back</h2>
        <p class="mt-1 text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <div class="mb-6 grid grid-cols-2 gap-2">
        @for (item of demoRoles; track item.role) {
          <button
            type="button"
            class="rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
            [class]="
              selectedRole() === item.role
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30'
            "
            (click)="selectRole(item)"
          >
            {{ item.label }}
          </button>
        }
      </div>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-form-field label="Email address" [error]="fieldError('email')">
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 4h16v16H4z" opacity="0" />
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="m22 6-10 7L2 6" />
              </svg>
            </span>
            <app-ui-input
              type="email"
              formControlName="email"
              placeholder="admin@hapm.local"
              class="h-10 rounded-xl pl-10"
            />
          </div>
        </app-form-field>

        <app-form-field label="Password" [error]="fieldError('password')">
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <app-ui-input
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="h-10 rounded-xl pl-10"
            />
          </div>
        </app-form-field>

        <div class="flex items-center justify-between">
          <label class="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              formControlName="rememberMe"
              class="size-3.5 rounded accent-blue-600"
            />
            <span class="text-xs text-muted-foreground">Remember me</span>
          </label>
          <a routerLink="/auth/forgot-password" class="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        @if (successMessage()) {
          <p class="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ successMessage() }}</p>
        }
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
            Signing in...
          } @else {
            Sign in as {{ roleLabel() }}
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          }
        </button>
      </form>

      <div class="mt-6 rounded-xl bg-muted p-3">
        <p class="text-center text-[11px] text-muted-foreground">
          <span class="font-medium text-foreground">Demo mode</span> — Select a role above and sign in with the
          seeded credentials from the README.
        </p>
      </div>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        <a routerLink="/auth/register" class="font-medium text-primary hover:underline">Create a patient account</a>
      </p>
    </app-auth-page-shell>
  `,
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly demoRoles = DEMO_ROLES;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedRole = signal<DemoRole>('Admin');

  readonly form = this.fb.nonNullable.group({
    email: ['admin@hapm.local', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true],
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('passwordReset') === 'success') {
      this.successMessage.set('Your password has been updated. Sign in with your new credentials.');
    }
  }

  roleLabel(): string {
    return DEMO_ROLES.find((r) => r.role === this.selectedRole())?.label ?? 'User';
  }

  selectRole(item: (typeof DEMO_ROLES)[number]): void {
    this.selectedRole.set(item.role);
    this.form.patchValue({ email: item.email });
  }

  fieldError(controlName: 'email' | 'password'): string | null {
    const control = this.form.controls[controlName];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['email']) return 'Enter a valid email address.';
    if (control.errors['minlength']) return 'Password must be at least 8 characters.';
    return 'Invalid value.';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { rememberMe, ...credentials } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.login(credentials, rememberMe).subscribe({
      next: (user) => {
        this.loading.set(false);
        void this.router.navigateByUrl(this.auth.getHomeRoute(user.role as UserRole));
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(extractApiErrorMessage(err, 'Login failed. Check your credentials.'));
      },
    });
  }
}
