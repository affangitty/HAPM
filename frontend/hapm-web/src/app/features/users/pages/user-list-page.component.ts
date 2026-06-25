import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFormControlError, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UserDto } from '../../../core/auth/auth.models';
import { UiPaginationComponent } from '../../../shared/components/ui/pagination/ui-pagination.component';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent, UiCardHeaderComponent, UiCardTitleComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPasswordInputComponent } from '../../../shared/components/ui/input/ui-password-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { UsersApiService } from '../data/users-api.service';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule, ReactiveFormsModule, UiPageHeaderComponent, UiFilterBarComponent, FormFieldComponent,
    UiSelectComponent, UiInputComponent, UiPasswordInputComponent, UiButtonComponent, UiCardComponent, UiCardHeaderComponent,
    UiCardTitleComponent, UiCardContentComponent, UiPaginationComponent,
  ],
  template: `
    <app-ui-page-header title="User Management" subtitle="Accounts, roles, and access control">
      <app-ui-button actions size="sm" (pressed)="showCreate.set(!showCreate())">
        {{ showCreate() ? 'Cancel' : 'Create receptionist' }}
      </app-ui-button>
    </app-ui-page-header>

    @if (showCreate()) {
      <app-ui-card class="mb-6">
        <app-ui-card-header>
          <app-ui-card-title>New receptionist account</app-ui-card-title>
        </app-ui-card-header>
        <app-ui-card-content>
          <form class="grid gap-4 sm:grid-cols-2" [formGroup]="createForm" (ngSubmit)="createReceptionist()">
            <app-form-field label="Full name"><app-ui-input formControlName="fullName" /></app-form-field>
            <app-form-field label="Email"><app-ui-input type="email" formControlName="email" /></app-form-field>
            <app-form-field label="Phone"><app-ui-input formControlName="phoneNumber" /></app-form-field>
            <app-form-field label="Temporary password"><app-ui-password-input formControlName="password" /></app-form-field>
            <div class="sm:col-span-2 flex gap-2">
              <app-ui-button type="submit" [loading]="creating()">Create account</app-ui-button>
            </div>
          </form>
          @if (createError()) { <p class="mt-2 text-sm text-destructive" role="alert">{{ createError() }}</p> }
          @if (createSuccess()) { <p class="mt-2 text-sm text-emerald-600" role="status">{{ createSuccess() }}</p> }
        </app-ui-card-content>
      </app-ui-card>
    }

    <app-ui-filter-bar searchPlaceholder="Search name or email..." (searchChange)="onSearch($event)">
      <app-form-field label="Role" class="min-w-36">
        <app-ui-select [options]="roleOptions" [ngModel]="role()" (ngModelChange)="onRole($event)" />
      </app-form-field>
      <app-form-field label="Status" class="min-w-36">
        <app-ui-select [options]="statusOptions" [ngModel]="status()" (ngModelChange)="onStatus($event)" />
      </app-form-field>
    </app-ui-filter-bar>

    @if (error()) {
      <p class="mb-4 text-sm text-destructive" role="alert">{{ error() }}</p>
    }

    @if (loading()) {
      <p class="text-sm text-muted-foreground">Loading users…</p>
    } @else if (!rows().length) {
      <p class="text-sm text-muted-foreground">No users found. Adjust filters or create a receptionist account.</p>
    } @else {
      <div class="overflow-x-auto rounded-xl border border-border">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Role</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Created</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of rows(); track user.id) {
              <tr class="border-b border-border/70 align-top">
                <td class="px-4 py-3 font-medium">{{ user.fullName }}</td>
                <td class="px-4 py-3">{{ user.email }}</td>
                <td class="px-4 py-3">{{ user.role }}</td>
                <td class="px-4 py-3">{{ user.isActive ? 'Active' : 'Inactive' }}</td>
                <td class="px-4 py-3">{{ user.createdAtUtc ? (user.createdAtUtc | date: 'mediumDate') : '—' }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-2">
                    <app-ui-button size="sm" variant="outline" [loading]="togglingId() === user.id" (pressed)="toggleActive(user)">
                      {{ user.isActive ? 'Deactivate' : 'Activate' }}
                    </app-ui-button>
                    <app-ui-button size="sm" variant="outline" (pressed)="openReset(user)">Reset password</app-ui-button>
                  </div>
                  @if (resetUserId() === user.id) {
                    <form class="mt-3 space-y-2" [formGroup]="resetForm" (ngSubmit)="submitReset(user.id)">
                      <app-form-field label="New password">
                        <app-ui-password-input formControlName="newPassword" />
                      </app-form-field>
                      <div class="flex gap-2">
                        <app-ui-button size="sm" type="submit" [loading]="resetting()">Save password</app-ui-button>
                        <app-ui-button size="sm" type="button" variant="outline" (pressed)="resetUserId.set(null)">Cancel</app-ui-button>
                      </div>
                    </form>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <app-ui-pagination
        class="mt-4 block"
        [page]="page()"
        [pageSize]="pageSize"
        [totalCount]="totalCount()"
        (pageChange)="onPageChange($event)"
      />
    }
  `,
})
export class UserListPageComponent implements OnInit {
  private readonly api = inject(UsersApiService);
  private readonly toasts = inject(ApiErrorService);
  private readonly fb = inject(FormBuilder);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<UserDto[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly createError = signal<string | null>(null);
  readonly createSuccess = signal<string | null>(null);
  readonly showCreate = signal(false);
  readonly role = signal('');
  readonly status = signal('');
  readonly togglingId = signal<number | null>(null);
  readonly resetUserId = signal<number | null>(null);
  readonly resetting = signal(false);
  search = '';

  readonly resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly createForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly roleOptions = [
    { label: 'All roles', value: '' },
    { label: 'Admin', value: 'Admin' },
    { label: 'Doctor', value: 'Doctor' },
    { label: 'Patient', value: 'Patient' },
    { label: 'Receptionist', value: 'Receptionist' },
  ];

  readonly statusOptions = [
    { label: 'All statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  private readonly debouncedLoad = debounce(() => this.load(), 300);

  ngOnInit(): void {
    this.load();
  }

  onSearch(value: string): void {
    this.search = value;
    this.page.set(1);
    this.debouncedLoad();
  }

  onRole(value: string): void {
    this.role.set(value);
    this.page.set(1);
    this.load();
  }

  onStatus(value: string): void {
    this.status.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  createReceptionist(): void {
    if (!guardFormSubmit(this.createForm, this.toasts, {
      fullName: 'Full name', email: 'Email', phoneNumber: 'Phone', password: 'Password',
    })) return;
    this.creating.set(true);
    this.createError.set(null);
    this.createSuccess.set(null);
    this.api.createReceptionist(this.createForm.getRawValue()).subscribe({
      next: (user) => {
        this.creating.set(false);
        this.createSuccess.set(`Created receptionist account for ${user.fullName}.`);
        this.toasts.show('Receptionist account created.', 'success');
        this.createForm.reset();
        this.showCreate.set(false);
        this.load();
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(extractApiErrorMessage(err, 'Failed to create receptionist.'));
      },
    });
  }

  toggleActive(user: UserDto): void {
    const next = !user.isActive;
    const verb = next ? 'activate' : 'deactivate';
    if (!confirm(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${user.fullName}?`)) return;
    this.togglingId.set(user.id);
    this.api.setActive(user.id, { isActive: next }).subscribe({
      next: () => {
        this.togglingId.set(null);
        this.toasts.show(`User ${next ? 'activated' : 'deactivated'}.`, 'success');
        this.load();
      },
      error: (err) => {
        this.togglingId.set(null);
        this.toasts.show(extractApiErrorMessage(err, `Failed to ${verb} user.`), 'error');
      },
    });
  }

  openReset(user: UserDto): void {
    this.resetUserId.set(user.id);
    this.resetForm.reset();
  }

  submitReset(userId: number): void {
    if (!guardFormSubmit(this.resetForm, this.toasts, { newPassword: 'New password' })) return;
    this.resetting.set(true);
    this.api.resetPassword(userId, this.resetForm.getRawValue()).subscribe({
      next: () => {
        this.resetting.set(false);
        this.resetUserId.set(null);
        this.toasts.show('Password reset successfully.', 'success');
      },
      error: (err) => {
        this.resetting.set(false);
        this.toasts.show(extractApiErrorMessage(err, 'Password reset failed.'), 'error');
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.status();
    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.search || undefined,
        role: (this.role() || undefined) as UserDto['role'] | undefined,
        isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
        sortBy: 'name',
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to load users.'));
          this.loading.set(false);
        },
      });
  }
}
