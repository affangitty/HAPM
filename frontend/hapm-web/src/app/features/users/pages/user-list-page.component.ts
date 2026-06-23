import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UserDto } from '../../../core/auth/auth.models';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent, UiCardHeaderComponent, UiCardTitleComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { UsersApiService } from '../data/users-api.service';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, UiPageHeaderComponent, UiFilterBarComponent, FormFieldComponent,
    UiSelectComponent, UiInputComponent, UiButtonComponent, UiCardComponent, UiCardHeaderComponent,
    UiCardTitleComponent, UiCardContentComponent, DataTableComponent,
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
            <app-form-field label="Temporary password"><app-ui-input type="password" formControlName="password" /></app-form-field>
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

    <app-data-table
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      [page]="page()"
      [pageSize]="pageSize"
      [totalCount]="totalCount()"
      emptyTitle="No users found"
      emptyMessage="Adjust filters or create a receptionist account."
      (pageChange)="onPageChange($event)"
    />
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
  search = '';

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

  readonly columns: DataTableColumn<UserDto>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.fullName },
    { key: 'email', header: 'Email', cell: (r) => r.email },
    { key: 'role', header: 'Role', cell: (r) => r.role },
    { key: 'status', header: 'Status', cell: (r) => (r.isActive ? 'Active' : 'Inactive') },
    { key: 'created', header: 'Created', cell: (r) => (r.createdAtUtc ? new Date(r.createdAtUtc).toLocaleDateString() : '—') },
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
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
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
