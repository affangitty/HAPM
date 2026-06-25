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
import { DoctorsApiService } from '../data/doctors-api.service';
import { DoctorDto } from '../models/doctor.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-doctor-list-page',
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
    <app-ui-page-header title="Medical Staff" subtitle="Search doctors by name, specialization, or qualification">
      @if (isAdmin()) {
        <a actions [routerLink]="newDoctorLink()">
          <app-ui-button size="sm">Add Doctor</app-ui-button>
        </a>
      }
    </app-ui-page-header>

    <app-ui-filter-bar searchPlaceholder="Search doctors..." (searchChange)="onSearch($event)">
      <app-form-field label="Specialization" class="min-w-40">
        <app-ui-select
          [options]="specializationOptions()"
          [ngModel]="specialization()"
          (ngModelChange)="onSpecialization($event)"
        />
      </app-form-field>
      <app-form-field label="Availability" class="min-w-36">
        <app-ui-select
          [options]="availabilityOptions"
          [ngModel]="availability()"
          (ngModelChange)="onAvailability($event)"
        />
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
export class DoctorListPageComponent implements OnInit {
  private readonly api = inject(DoctorsApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<DoctorDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly specializationOptions = signal<{ label: string; value: string }[]>([{ label: 'All', value: '' }]);
  readonly specialization = signal('');
  readonly availability = signal('');

  search = '';

  readonly availabilityOptions = [
    { label: 'All', value: '' },
    { label: 'Available', value: 'true' },
    { label: 'Unavailable', value: 'false' },
  ];

  readonly columns: DataTableColumn<DoctorDto>[] = [
    { key: 'name', header: 'Doctor', cell: (r) => r.fullName },
    { key: 'specialization', header: 'Specialization', cell: (r) => r.specialization },
    { key: 'fee', header: 'Fee', cell: (r) => `$${r.consultationFee}` },
    { key: 'rating', header: 'Rating', cell: (r) => `${r.averageRating.toFixed(1)} (${r.reviewCount})` },
    { key: 'status', header: 'Status', cell: (r) => (r.isAvailable ? 'Available' : 'Unavailable') },
  ];

  readonly rowLink = (row: DoctorDto) => roleRoute(this.router, 'doctors', String(row.id));

  private readonly debouncedLoad = debounce(() => this.load(), 300);

  ngOnInit(): void {
    this.api.getSpecializations().subscribe({
      next: (items) =>
        this.specializationOptions.set([
          { label: 'All', value: '' },
          ...items.map((s) => ({ label: s, value: s })),
        ]),
    });
    this.load();
  }

  isAdmin(): boolean {
    return getRolePrefix(this.router) === 'admin';
  }

  newDoctorLink(): string {
    return roleRoute(this.router, 'doctors', 'new');
  }

  onSearch(value: string): void {
    this.search = value;
    this.page.set(1);
    this.debouncedLoad();
  }

  onSpecialization(value: string): void {
    this.specialization.set(value);
    this.page.set(1);
    this.load();
  }

  onAvailability(value: string): void {
    this.availability.set(value);
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
        specialization: this.specialization() || undefined,
        isAvailable: this.availability() === '' ? undefined : this.availability() === 'true',
        sortBy: 'name',
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
