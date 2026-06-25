import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { LabReportStatus } from '../../../shared/models/enums';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { LabReportsApiService } from '../data/lab-reports-api.service';
import { LabReportDto } from '../models/lab-report.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-lab-report-list-page',
  standalone: true,
  imports: [
    RouterLink, FormsModule, UiPageHeaderComponent, UiFilterBarComponent, FormFieldComponent,
    UiSelectComponent, UiButtonComponent, UiCardComponent, UiCardContentComponent, DataTableComponent,
  ],
  template: `
    <app-ui-page-header title="Lab Reports" subtitle="Diagnostic results and file management">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/lab-reports/history'"><app-ui-button size="sm" variant="outline">History</app-ui-button></a>
        @if (canUpload()) {
          <a [routerLink]="basePath() + '/lab-reports/upload'"><app-ui-button size="sm">Upload report</app-ui-button></a>
        }
      </div>
    </app-ui-page-header>

    <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      @for (stat of statusStats(); track stat.label) {
        <app-ui-card>
          <app-ui-card-content class="p-3 text-center">
            <p class="text-xl font-bold tabular-nums" [class]="stat.color">{{ stat.value }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ stat.label }}</p>
          </app-ui-card-content>
        </app-ui-card>
      }
    </div>

    <app-ui-filter-bar searchPlaceholder="Search patient, test, or doctor..." (searchChange)="onSearch($event)">
      <app-form-field label="Status" class="min-w-36">
        <app-ui-select [options]="statusOptions" [ngModel]="status()" (ngModelChange)="onStatus($event)" />
      </app-form-field>
      <app-form-field label="Category" class="min-w-36">
        <app-ui-select [options]="typeOptions" [ngModel]="reportType()" (ngModelChange)="onType($event)" />
      </app-form-field>
    </app-ui-filter-bar>

    <app-data-table [columns]="columns" [rows]="filteredRows()" [loading]="loading()" [page]="page()"
      [pageSize]="pageSize" [totalCount]="totalCount()" [rowLink]="rowLink"
      emptyTitle="No lab reports" emptyMessage="Upload a diagnostic report to get started."
      (pageChange)="onPageChange($event)" />
  `,
})
export class LabReportListPageComponent implements OnInit {
  private readonly api = inject(LabReportsApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<LabReportDto[]>([]);
  readonly filteredRows = signal<LabReportDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly status = signal('');
  readonly reportType = signal('');
  readonly statusStats = signal<{ label: string; value: number; color: string }[]>([]);
  search = '';

  readonly statusOptions = [
    { label: 'All status', value: '' }, { label: 'Uploaded', value: 'Uploaded' }, { label: 'Reviewed', value: 'Reviewed' },
  ];
  readonly typeOptions = [
    { label: 'All categories', value: '' }, { label: 'Hematology', value: 'Hematology' },
    { label: 'Biochemistry', value: 'Biochemistry' }, { label: 'Endocrine', value: 'Endocrine' },
    { label: 'Radiology', value: 'Radiology' },
  ];

  readonly columns: DataTableColumn<LabReportDto>[] = [
    { key: 'id', header: 'ID', cell: (r) => `#${r.id}` },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'title', header: 'Test', cell: (r) => r.title },
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctorName ?? '—' },
    { key: 'type', header: 'Category', cell: (r) => r.reportType },
    { key: 'date', header: 'Date', cell: (r) => new Date(r.uploadedAtUtc).toLocaleDateString() },
    { key: 'status', header: 'Status', cell: (r) => r.status },
  ];

  readonly rowLink = (r: LabReportDto) => roleRoute(this.router, 'lab-reports', String(r.id));
  private readonly debouncedFilter = debounce(() => this.applyFilter(), 200);

  ngOnInit(): void { this.load(); }

  canUpload(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist' || role === 'Doctor';
  }

  onSearch(v: string): void { this.search = v.toLowerCase(); this.debouncedFilter(); }
  onStatus(v: string): void { this.status.set(v); this.page.set(1); this.load(); }
  onType(v: string): void { this.reportType.set(v); this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.list({
      page: this.page(), pageSize: this.pageSize,
      status: (this.status() as LabReportStatus) || undefined,
      reportType: this.reportType() || undefined,
    }).subscribe({
      next: (r) => {
        this.rows.set(r.items);
        this.totalCount.set(r.totalCount);
        this.statusStats.set([
          { label: 'Total Reports', value: r.totalCount, color: 'text-blue-700' },
          { label: 'Uploaded', value: r.items.filter((x) => x.status === 'Uploaded').length, color: 'text-amber-700' },
          { label: 'Reviewed', value: r.items.filter((x) => x.status === 'Reviewed').length, color: 'text-emerald-700' },
          { label: 'This Page', value: r.items.length, color: 'text-slate-700' },
        ]);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private applyFilter(): void {
    const q = this.search;
    this.filteredRows.set(!q ? this.rows() : this.rows().filter((r) =>
      r.patientName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) ||
      (r.doctorName?.toLowerCase().includes(q) ?? false)));
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
