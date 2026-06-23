import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { PrescriptionsApiService } from '../data/prescriptions-api.service';
import { PrescriptionDto } from '../models/prescription.models';

@Component({
  selector: 'app-prescription-list-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    UiPageHeaderComponent,
    UiFilterBarComponent,
    FormFieldComponent,
    UiInputComponent,
    UiButtonComponent,
    DataTableComponent,
  ],
  template: `
    <app-ui-page-header [title]="title()" subtitle="Search and review issued prescriptions">
      @if (isDoctor()) {
        <div actions class="flex gap-2">
          <a [routerLink]="basePath() + '/prescriptions/history'">
            <app-ui-button size="sm" variant="outline">History</app-ui-button>
          </a>
          <a [routerLink]="basePath() + '/prescriptions/create'">
            <app-ui-button size="sm">New prescription</app-ui-button>
          </a>
        </div>
      }
    </app-ui-page-header>

    <app-ui-filter-bar searchPlaceholder="Search patient, doctor, diagnosis..." (searchChange)="onSearch($event)">
      <app-form-field label="From" class="min-w-36">
        <app-ui-input type="date" [ngModel]="fromDate()" (ngModelChange)="onFromDate($event)" />
      </app-form-field>
      <app-form-field label="To" class="min-w-36">
        <app-ui-input type="date" [ngModel]="toDate()" (ngModelChange)="onToDate($event)" />
      </app-form-field>
    </app-ui-filter-bar>

    <app-data-table
      [columns]="columns"
      [rows]="filteredRows()"
      [loading]="loading()"
      [page]="page()"
      [pageSize]="pageSize"
      [totalCount]="totalCount()"
      [rowLink]="rowLink"
      emptyTitle="No prescriptions"
      emptyMessage="Prescriptions will appear here once issued by a doctor."
      (pageChange)="onPageChange($event)"
    />
  `,
})
export class PrescriptionListPageComponent implements OnInit {
  private readonly api = inject(PrescriptionsApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<PrescriptionDto[]>([]);
  readonly filteredRows = signal<PrescriptionDto[]>([]);
  readonly loading = signal(false);
  readonly fromDate = signal('');
  readonly toDate = signal('');

  search = '';

  readonly columns: DataTableColumn<PrescriptionDto>[] = [
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctorName },
    { key: 'diagnosis', header: 'Diagnosis', cell: (r) => r.diagnosis },
    { key: 'date', header: 'Visit date', cell: (r) => r.appointmentDate },
    { key: 'items', header: 'Medicines', cell: (r) => String(r.items.length) },
  ];

  readonly rowLink = (row: PrescriptionDto) => `${this.basePath()}/prescriptions/${row.id}`;

  private readonly debouncedFilter = debounce(() => this.applyClientFilter(), 200);

  ngOnInit(): void {
    this.load();
  }

  title(): string {
    return this.isDoctor() ? 'Prescriptions' : 'My Prescriptions';
  }

  isDoctor(): boolean {
    return this.auth.role() === 'Doctor';
  }

  onSearch(value: string): void {
    this.search = value.toLowerCase();
    this.debouncedFilter();
  }

  onFromDate(value: string): void {
    this.fromDate.set(value);
    this.page.set(1);
    this.load();
  }

  onToDate(value: string): void {
    this.toDate.set(value);
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
        fromDate: this.fromDate() || undefined,
        toDate: this.toDate() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
          this.applyClientFilter();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private applyClientFilter(): void {
    const q = this.search;
    if (!q) {
      this.filteredRows.set(this.rows());
      return;
    }
    this.filteredRows.set(
      this.rows().filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.doctorName.toLowerCase().includes(q) ||
          r.diagnosis.toLowerCase().includes(q) ||
          r.medicalRecordNumber.toLowerCase().includes(q),
      ),
    );
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
