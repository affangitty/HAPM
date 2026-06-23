import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { WaitlistStatus } from '../../../shared/models/enums';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { WaitlistApiService } from '../data/waitlist-api.service';
import { WaitlistEntryDto } from '../models/waitlist.models';

@Component({
  selector: 'app-waitlist-list-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    UiPageHeaderComponent,
    UiFilterBarComponent,
    FormFieldComponent,
    UiSelectComponent,
    UiInputComponent,
    UiButtonComponent,
    DataTableComponent,
  ],
  template: `
    <app-ui-page-header title="Waitlist" subtitle="Search and filter waitlist entries">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/waitlist'">
          <app-ui-button size="sm" variant="outline">Dashboard</app-ui-button>
        </a>
        <a [routerLink]="basePath() + '/waitlist/join'">
          <app-ui-button size="sm">Join waitlist</app-ui-button>
        </a>
      </div>
    </app-ui-page-header>

    <app-ui-filter-bar searchPlaceholder="Search patient or doctor..." (searchChange)="onSearch($event)">
      <app-form-field label="Status" class="min-w-36">
        <app-ui-select [options]="statusOptions" [ngModel]="status()" (ngModelChange)="onStatus($event)" />
      </app-form-field>
      <app-form-field label="Preferred date" class="min-w-36">
        <app-ui-input type="date" [ngModel]="preferredDate()" (ngModelChange)="onDate($event)" />
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
      emptyTitle="No waitlist entries"
      emptyMessage="Try adjusting filters or join the waitlist for a preferred date."
      (pageChange)="onPageChange($event)"
    />
  `,
})
export class WaitlistListPageComponent implements OnInit {
  private readonly api = inject(WaitlistApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<WaitlistEntryDto[]>([]);
  readonly filteredRows = signal<WaitlistEntryDto[]>([]);
  readonly loading = signal(false);
  readonly status = signal('');
  readonly preferredDate = signal('');

  search = '';

  readonly statusOptions = [
    { label: 'All statuses', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Notified', value: 'Notified' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  readonly columns: DataTableColumn<WaitlistEntryDto>[] = [
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctorName },
    { key: 'specialization', header: 'Specialization', cell: (r) => r.specialization },
    { key: 'date', header: 'Preferred date', cell: (r) => r.preferredDate },
    { key: 'status', header: 'Status', cell: (r) => r.status },
    { key: 'created', header: 'Joined', cell: (r) => new Date(r.createdAtUtc).toLocaleDateString() },
  ];

  readonly rowLink = (row: WaitlistEntryDto) => `${this.basePath()}/waitlist/${row.id}`;

  private readonly debouncedFilter = debounce(() => this.applyClientFilter(), 200);

  ngOnInit(): void {
    this.load();
  }

  onSearch(value: string): void {
    this.search = value.toLowerCase();
    this.debouncedFilter();
  }

  onStatus(value: string): void {
    this.status.set(value);
    this.page.set(1);
    this.load();
  }

  onDate(value: string): void {
    this.preferredDate.set(value);
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
        status: (this.status() as WaitlistStatus) || undefined,
        preferredDate: this.preferredDate() || undefined,
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
          r.specialization.toLowerCase().includes(q),
      ),
    );
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
