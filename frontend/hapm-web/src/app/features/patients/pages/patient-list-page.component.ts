import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { Router, RouterLink } from '@angular/router';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { PatientsApiService } from '../data/patients-api.service';
import { Gender, PatientDto } from '../models/patient.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-patient-list-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    UiPageHeaderComponent,
    UiFilterBarComponent,
    UiSelectComponent,
    FormFieldComponent,
    UiButtonComponent,
    DataTableComponent,
  ],
  template: `
    <app-ui-page-header [title]="title()" [subtitle]="subtitle()">
      @if (canRegister()) {
        <a actions [routerLink]="registerLink()">
          <app-ui-button size="sm">Register Patient</app-ui-button>
        </a>
      }
    </app-ui-page-header>

    <app-ui-filter-bar searchPlaceholder="Search by name, MRN, email, or phone..." (searchChange)="onSearch($event)">
      <app-form-field label="Gender" class="min-w-32">
        <app-ui-select [options]="genderOptions" [ngModel]="gender()" (ngModelChange)="onGender($event)" />
      </app-form-field>
      <app-form-field label="Blood group" class="min-w-32">
        <app-ui-select [options]="bloodOptions" [ngModel]="bloodGroup()" (ngModelChange)="onBlood($event)" />
      </app-form-field>
    </app-ui-filter-bar>

    <app-data-table
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      [page]="page()"
      [pageSize]="pageSize"
      [totalCount]="totalCount()"
      [rowLink]="rowLink"
      (pageChange)="onPageChange($event)"
    />
  `,
})
export class PatientListPageComponent implements OnInit {
  private readonly api = inject(PatientsApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<PatientDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly gender = signal('');
  readonly bloodGroup = signal('');
  search = '';

  readonly genderOptions = [
    { label: 'All', value: '' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  readonly bloodOptions = [
    { label: 'All', value: '' },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  readonly columns: DataTableColumn<PatientDto>[] = [
    { key: 'mrn', header: 'MRN', cell: (r) => r.medicalRecordNumber },
    { key: 'name', header: 'Patient', cell: (r) => r.fullName },
    { key: 'gender', header: 'Gender', cell: (r) => r.gender },
    { key: 'blood', header: 'Blood', cell: (r) => r.bloodGroup ?? '—' },
    { key: 'phone', header: 'Phone', cell: (r) => r.phoneNumber ?? '—' },
    { key: 'age', header: 'Age', cell: (r) => r.age },
  ];

  readonly rowLink = (row: PatientDto) => roleRoute(this.router, 'patients', String(row.id));

  private readonly debouncedLoad = debounce(() => this.load(), 300);

  ngOnInit(): void {
    this.load();
  }

  title(): string {
    return getRolePrefix(this.router) === 'reception' ? 'Patient Search' : 'Patient Directory';
  }

  subtitle(): string {
    return 'Search, filter, and open patient records';
  }

  canRegister(): boolean {
    const base = roleBase(this.router);
    return base === '/admin' || base === '/reception';
  }

  registerLink(): string {
    return roleRoute(this.router, 'patients', 'new');
  }

  onSearch(value: string): void {
    this.search = value;
    this.page.set(1);
    this.debouncedLoad();
  }

  onGender(value: string): void {
    this.gender.set(value);
    this.page.set(1);
    this.load();
  }

  onBlood(value: string): void {
    this.bloodGroup.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.search || undefined,
        gender: (this.gender() || undefined) as Gender | undefined,
        bloodGroup: this.bloodGroup() || undefined,
        sortBy: 'registeredAt',
        sortDescending: true,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => setPageLoadFailed(this.loading, this.loadError),
      });
  }
}
