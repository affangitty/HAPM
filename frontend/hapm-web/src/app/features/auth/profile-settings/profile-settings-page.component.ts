import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFormControlError, markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { AuthService } from '../../../core/auth/auth.service';
import { UserPreferencesService } from '../../../core/preferences/user-preferences.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UserDto } from '../../../core/auth/auth.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiPasswordInputComponent } from '../../../shared/components/ui/input/ui-password-input.component';
import {
  UiCardComponent,
  UiCardContentComponent,
} from '../../../shared/components/ui/card/ui-card.component';
import {
  passwordMatchValidator,
  STRONG_PASSWORD_MESSAGE,
  strongPasswordValidator,
} from '../validators/password.validators';

type SettingsSection = 'profile' | 'security' | 'notifications' | 'appearance';

@Component({
  selector: 'app-profile-settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    UiPasswordInputComponent,
    UiCardComponent,
    UiCardContentComponent,
  ],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <h1 class="text-xl font-bold text-foreground">Profile &amp; Settings</h1>

      <div class="flex gap-4">
        <nav class="w-44 shrink-0 space-y-1">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
            [class]="activeSection() === 'profile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
            (click)="activeSection.set('profile')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
            [class]="activeSection() === 'security' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
            (click)="activeSection.set('security')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Security
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
            [class]="
              activeSection() === 'notifications' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
            "
            (click)="activeSection.set('notifications')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Notifications
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all"
            [class]="
              activeSection() === 'appearance' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
            "
            (click)="activeSection.set('appearance')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            Appearance
          </button>
        </nav>

        <div class="min-w-0 flex-1 space-y-4">
          @if (activeSection() === 'profile') {
            <app-ui-card>
              <app-ui-card-content class="p-5">
                <h2 class="mb-4 text-sm font-semibold text-foreground">Profile Information</h2>

                <div class="mb-5 flex items-center gap-4">
                  <div
                    class="flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                    [class]="avatarColor()"
                  >
                    {{ initials() }}
                  </div>
                </div>

                @if (user(); as currentUser) {
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <app-form-field label="First name">
                      <div class="flex h-10 items-center rounded-xl border bg-muted/40 px-3 text-sm">{{ firstName() }}</div>
                    </app-form-field>
                    <app-form-field label="Last name">
                      <div class="flex h-10 items-center rounded-xl border bg-muted/40 px-3 text-sm">{{ lastName() }}</div>
                    </app-form-field>
                    <app-form-field label="Email address">
                      <div class="flex h-10 items-center rounded-xl border bg-muted/40 px-3 text-sm">{{ currentUser.email }}</div>
                    </app-form-field>
                    <app-form-field label="Phone">
                      <div class="flex h-10 items-center rounded-xl border bg-muted/40 px-3 text-sm">
                        {{ currentUser.phoneNumber ?? '—' }}
                      </div>
                    </app-form-field>
                    <app-form-field label="Title / Role" class="sm:col-span-2">
                      <div class="flex h-10 items-center rounded-xl border bg-muted/40 px-3 text-sm">{{ currentUser.role }}</div>
                    </app-form-field>
                  </div>

                  <p class="mt-4 text-xs text-muted-foreground">
                    Profile updates are managed by your hospital administrator. Contact admin to change your name or phone
                    number.
                  </p>
                }
              </app-ui-card-content>
            </app-ui-card>
          }

          @if (activeSection() === 'security') {
            <app-ui-card>
              <app-ui-card-content class="p-5">
                <h2 class="mb-4 text-sm font-semibold text-foreground">Security Settings</h2>

                <form class="space-y-4" [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
                  <app-form-field label="Current password" [error]="passwordFieldError('currentPassword')">
                    <app-ui-password-input formControlName="currentPassword" class="h-10 rounded-xl" />
                  </app-form-field>
                  <app-form-field label="New password" [error]="passwordFieldError('newPassword')">
                    <app-ui-password-input formControlName="newPassword" class="h-10 rounded-xl" />
                  </app-form-field>
                  <app-form-field label="Confirm new password" [error]="passwordFieldError('confirmNewPassword')">
                    <app-ui-password-input formControlName="confirmNewPassword" class="h-10 rounded-xl" />
                  </app-form-field>

                  <div class="rounded-xl bg-blue-50 p-3">
                    <p class="mb-1 text-xs font-medium text-primary">Password requirements</p>
                    <ul class="space-y-0.5 text-xs text-blue-600">
                      <li>• At least 8 characters</li>
                      <li>• Include uppercase, lowercase, numbers, and symbols</li>
                    </ul>
                  </div>

                  @if (passwordSuccess()) {
                    <p class="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ passwordSuccess() }}</p>
                  }
                  @if (passwordError()) {
                    <p class="text-sm text-destructive">{{ passwordError() }}</p>
                  }

                  <div class="flex justify-end">
                    <button
                      type="submit"
                      class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-60"
                      [disabled]="passwordLoading()"
                    >
                      {{ passwordLoading() ? 'Updating...' : 'Update Password' }}
                    </button>
                  </div>
                </form>
              </app-ui-card-content>
            </app-ui-card>
          }

          @if (activeSection() === 'notifications') {
            <app-ui-card>
              <app-ui-card-content class="p-5">
                <h2 class="mb-4 text-sm font-semibold text-foreground">Notification Preferences</h2>
                <div class="space-y-4">
                  @for (pref of notificationPrefs; track pref.key) {
                    <div class="flex items-center justify-between border-b border-border py-2 last:border-0">
                      <div>
                        <p class="text-sm font-medium text-foreground">{{ pref.label }}</p>
                        <p class="text-xs text-muted-foreground">{{ pref.desc }}</p>
                      </div>
                      <button
                        type="button"
                        class="relative h-6 w-10 rounded-full transition-colors"
                        [class]="pref.enabled() ? 'bg-primary' : 'bg-muted'"
                        (click)="toggleNotification(pref.key)"
                        [attr.aria-pressed]="pref.enabled()"
                        [attr.aria-label]="pref.label"
                      >
                        <span
                          class="absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all"
                          [class]="pref.enabled() ? 'left-5' : 'left-1'"
                        ></span>
                      </button>
                    </div>
                  }
                </div>
              </app-ui-card-content>
            </app-ui-card>
          }

          @if (activeSection() === 'appearance') {
            <app-ui-card>
              <app-ui-card-content class="p-5">
                <h2 class="mb-4 text-sm font-semibold text-foreground">Appearance</h2>
                <div class="space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">Theme</label>
                    <div class="grid grid-cols-3 gap-2">
                      @for (theme of themes; track theme) {
                        <button
                          type="button"
                          class="rounded-xl border p-3 text-center text-xs font-medium transition-all"
                          [class]="
                            selectedTheme() === theme
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          "
                          (click)="preferences.setTheme(theme)"
                        >
                          {{ theme }}
                        </button>
                      }
                    </div>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">Interface Density</label>
                    <div class="grid grid-cols-3 gap-2">
                      @for (density of densities; track density) {
                        <button
                          type="button"
                          class="rounded-xl border p-3 text-center text-xs font-medium transition-all"
                          [class]="
                            selectedDensity() === density
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          "
                          (click)="preferences.setDensity(density)"
                        >
                          {{ density }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </app-ui-card-content>
            </app-ui-card>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProfileSettingsPageComponent implements OnInit {
  private readonly toasts = inject(ApiErrorService);

  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  protected readonly preferences = inject(UserPreferencesService);

  readonly user = this.auth.user;
  readonly activeSection = signal<SettingsSection>('profile');
  readonly passwordLoading = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly selectedTheme = this.preferences.theme;
  readonly selectedDensity = this.preferences.density;

  readonly themes = ['Light', 'Dark', 'System'] as const;
  readonly densities = ['Compact', 'Default', 'Comfortable'] as const;

  readonly notificationPrefs = [
    { key: 'appointmentReminders' as const, label: 'Appointment Reminders', desc: 'Get notified 30 minutes before appointments', enabled: signal(true) },
    { key: 'labResultsReady' as const, label: 'Lab Results Ready', desc: 'When patient lab results are available for review', enabled: signal(true) },
    { key: 'billingAlerts' as const, label: 'Billing Updates', desc: 'Payment confirmations and overdue alerts', enabled: signal(true) },
    { key: 'systemAnnouncements' as const, label: 'System Announcements', desc: 'Platform updates and maintenance notices', enabled: signal(true) },
  ];

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, strongPasswordValidator()]],
    confirmNewPassword: ['', [Validators.required, passwordMatchValidator('newPassword')]],
  });

  readonly firstName = computed(() => this.splitName(this.user()).first);
  readonly lastName = computed(() => this.splitName(this.user()).last);
  readonly initials = computed(() => this.buildInitials(this.user()?.fullName ?? ''));

  readonly avatarColor = computed(() => {
    const colors = [
      'bg-blue-500',
      'bg-teal-500',
      'bg-violet-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-emerald-500',
    ];
    const name = this.user()?.fullName ?? '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  });

  ngOnInit(): void {
    this.auth.loadCurrentUser().subscribe();
    this.preferences.initialize();
    const saved = this.preferences.notifications();
    for (const pref of this.notificationPrefs) {
      pref.enabled.set(saved[pref.key]);
    }
    this.preferences.setTheme(this.preferences.theme());
    this.preferences.setDensity(this.preferences.density());
  }

  toggleNotification(key: (typeof this.notificationPrefs)[number]['key']): void {
    const pref = this.notificationPrefs.find((p) => p.key === key);
    if (!pref) return;
    const next = !pref.enabled();
    pref.enabled.set(next);
    this.preferences.setNotification(key, next);
  }

  passwordFieldError(controlName: 'currentPassword' | 'newPassword' | 'confirmNewPassword'): string | null {
    const control = this.passwordForm.controls[controlName];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['strongPassword']) return STRONG_PASSWORD_MESSAGE;
    if (control.errors['passwordMismatch']) return 'Passwords do not match.';
    return 'Invalid value.';
  }

  updatePassword(): void {
    if (!guardFormSubmit(this.passwordForm, this.toasts)) return;

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.passwordLoading.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.passwordSuccess.set('Your password has been updated successfully.');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.passwordLoading.set(false);
        this.passwordError.set(extractApiErrorMessage(err, 'Unable to update password.'));
      },
    });
  }

  private splitName(user: UserDto | null): { first: string; last: string } {
    if (!user?.fullName) return { first: '', last: '' };
    const parts = user.fullName.trim().split(/\s+/);
    return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
  }

  private buildInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
