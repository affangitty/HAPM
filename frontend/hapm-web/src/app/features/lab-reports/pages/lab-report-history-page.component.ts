import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { LabReportsApiService } from '../data/lab-reports-api.service';
import { LabReportDto } from '../models/lab-report.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-lab-report-history-page',
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiButtonComponent, DataTableComponent],
  template: `
    <app-ui-page-header title="Report History" subtitle="Chronological diagnostic report archive">
      <a actions [routerLink]="basePath() + '/lab-reports'"><app-ui-button size="sm" variant="outline">Back to list</app-ui-button></a>
    </app-ui-page-header>

    <app-data-table [columns]="columns" [rows]="rows()" [loading]="loading()" [page]="page()"
      [pageSize]="pageSize" [totalCount]="totalCount()" [rowLink]="rowLink"
      emptyTitle="No report history" emptyMessage="Uploaded reports will appear here."
      (pageChange)="onPageChange($event)" />
  `,
})
export class LabReportHistoryPageComponent implements OnInit {
  private readonly api = inject(LabReportsApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<LabReportDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly columns: DataTableColumn<LabReportDto>[] = [
    { key: 'date', header: 'Uploaded', cell: (r) => new Date(r.uploadedAtUtc).toLocaleDateString() },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'title', header: 'Test', cell: (r) => r.title },
    { key: 'type', header: 'Category', cell: (r) => r.reportType },
    { key: 'status', header: 'Status', cell: (r) => r.status },
  ];

  readonly rowLink = (r: LabReportDto) => roleRoute(this.router, 'lab-reports', String(r.id));

  ngOnInit(): void { this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.list({ page: this.page(), pageSize: this.pageSize, sortBy: 'uploadedAtUtc', sortDescending: true }).subscribe({
      next: (r) => {
        this.rows.set([...r.items].sort((a, b) => b.uploadedAtUtc.localeCompare(a.uploadedAtUtc)));
        this.totalCount.set(r.totalCount);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
