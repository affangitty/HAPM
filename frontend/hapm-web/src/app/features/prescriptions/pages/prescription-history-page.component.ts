import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { PrescriptionsApiService } from '../data/prescriptions-api.service';
import { PrescriptionDto } from '../models/prescription.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-prescription-history-page',
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiButtonComponent, DataTableComponent],
  template: `
    <app-ui-page-header title="Prescription History" subtitle="Chronological record of all issued prescriptions">
      <a actions [routerLink]="basePath() + '/prescriptions'">
        <app-ui-button size="sm" variant="outline">Back to list</app-ui-button>
      </a>
    </app-ui-page-header>

    <app-data-table
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      [page]="page()"
      [pageSize]="pageSize"
      [totalCount]="totalCount()"
      [rowLink]="rowLink"
      emptyTitle="No prescription history"
      emptyMessage="Issued prescriptions will appear here over time."
      (pageChange)="onPageChange($event)"
    />
  `,
})
export class PrescriptionHistoryPageComponent implements OnInit {
  private readonly api = inject(PrescriptionsApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<PrescriptionDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly columns: DataTableColumn<PrescriptionDto>[] = [
    { key: 'issued', header: 'Issued', cell: (r) => new Date(r.createdAtUtc).toLocaleDateString() },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'diagnosis', header: 'Diagnosis', cell: (r) => r.diagnosis },
    { key: 'visit', header: 'Visit date', cell: (r) => r.appointmentDate },
    { key: 'medicines', header: 'Medicines', cell: (r) => String(r.items.length) },
  ];

  readonly rowLink = (row: PrescriptionDto) => roleRoute(this.router, 'prescriptions', String(row.id));

  ngOnInit(): void {
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list({ page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (result) => {
        this.rows.set([...result.items].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)));
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
