import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { UserRole } from '../../../core/auth/auth.models';
import { AuthPageShellComponent } from '../components/auth-page-shell.component';
import { PatientRegisterFormComponent } from '../components/patient-register-form.component';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPasswordInputComponent } from '../../../shared/components/ui/input/ui-password-input.component';
import { getFormControlError, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { environment } from '../../../../environments/environment';
import { DEMO_ROLES, DemoRole } from './login-demo.constants';

type AuthPanel = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthPageShellComponent,
    PatientRegisterFormComponent,
    FormFieldComponent,
    UiInputComponent,
    UiPasswordInputComponent,
  ],
  template: `
    <app-auth-page-shell [wide]="panel() === 'register'">
      @if (panel() === 'login') {
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-foreground">Welcome back</h2>
          <p class="mt-1 text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        @if (!isProduction) {
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
        }

        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <app-form-field label="Email address" [error]="fieldError('email')">
            <app-ui-input
              type="email"
              formControlName="email"
              autocomplete="email"
              [placeholder]="isProduction ? 'you@example.com' : 'admin@hapm.local'"
            />
          </app-form-field>

          <app-form-field label="Password" [error]="fieldError('password')">
            <app-ui-password-input
              formControlName="password"
              placeholder="Enter your password"
            />
          </app-form-field>

          <div class="flex items-center justify-between">
            <label class="flex cursor-pointer items-center gap-2" for="rememberMe">
              <input
                id="rememberMe"
                name="rememberMe"
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
              Sign in@if (!isProduction) { as {{ roleLabel() }} }
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            }
          </button>
        </form>

        @if (!isProduction) {
          <div class="mt-6 space-y-3 rounded-xl bg-muted p-3">
            <p class="text-center text-[11px] text-muted-foreground">
              <span class="font-medium text-foreground">Demo mode</span> — Pick a role above, then sign in. Use the
              <span class="font-medium text-foreground">show password</span> control to reveal the seeded password.
            </p>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              @for (item of demoRoles; track item.role) {
                <div class="text-muted-foreground">{{ item.label }}</div>
                <div class="font-mono text-foreground">{{ item.password }}</div>
              }
            </dl>
          </div>

          <p class="mt-4 text-center text-sm text-muted-foreground">
            <button type="button" class="font-medium text-primary hover:underline" (click)="showRegister()">
              Create a patient account
            </button>
          </p>
        }
      } @else {
        <app-patient-register-form (backToLogin)="showLogin()" />
      }
    </app-auth-page-shell>
  `,
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ApiErrorService);

  readonly demoRoles = environment.production ? [] : DEMO_ROLES;
  readonly isProduction = environment.production;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedRole = signal<DemoRole>('Admin');
  readonly panel = signal<AuthPanel>('login');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('passwordReset') === 'success') {
      this.successMessage.set('Your password has been updated. Sign in with your new credentials.');
    }
    if (!this.isProduction && DEMO_ROLES.length) {
      this.selectRole(DEMO_ROLES[0]);
    }
  }

  showRegister(): void {
    this.panel.set('register');
  }

  showLogin(): void {
    this.panel.set('login');
  }

  roleLabel(): string {
    return DEMO_ROLES.find((r) => r.role === this.selectedRole())?.label ?? 'User';
  }

  selectRole(item: (typeof DEMO_ROLES)[number]): void {
    this.selectedRole.set(item.role);
    this.form.patchValue({ email: item.email, password: item.password });
  }

  fieldError(controlName: 'email' | 'password'): string | null {
    return getFormControlError(this.form, controlName);
  }

  submit(): void {
    if (!guardFormSubmit(this.form)) return;

    const { rememberMe, ...credentials } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.login(credentials, rememberMe).subscribe({
      next: (user) => {
        void this.router.navigateByUrl(this.auth.getHomeRoute(user.role as UserRole));
      },
      error: (err) => {
        this.loading.set(false);
        const msg = extractApiErrorMessage(err, 'Login failed. Check your credentials.');
        this.errorMessage.set(msg);
        this.toasts.show(msg, 'error');
      },
    });
  }
}
