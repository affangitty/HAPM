import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { PrescriptionTemplatesApiService } from '../data/prescription-templates-api.service';
import { PrescriptionTemplateDto } from '../models/prescription-template.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-template-list-page',
  standalone: true,
  imports: [
    RouterLink,
    UiPageHeaderComponent,
    UiFilterBarComponent,
    UiButtonComponent,
    DataTableComponent,
  ],
  template: `
    <app-ui-page-header title="Prescription Templates" subtitle="Reusable diagnosis and medication sets">
      <a actions [routerLink]="basePath() + '/templates/create'">
        <app-ui-button size="sm">New template</app-ui-button>
      </a>
    </app-ui-page-header>

    <app-ui-filter-bar searchPlaceholder="Search templates..." (searchChange)="onSearch($event)" />

    <app-data-table
      [columns]="columns"
      [rows]="pagedRows()"
      [loading]="loading()"
      [page]="page()"
      [pageSize]="pageSize"
      [totalCount]="filteredRows().length"
      [rowLink]="rowLink"
      emptyTitle="No templates"
      emptyMessage="Create a template to speed up prescription writing."
      (pageChange)="onPageChange($event)"
    />
  `,
})
export class TemplateListPageComponent implements OnInit {
  private readonly api = inject(PrescriptionTemplatesApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly allRows = signal<PrescriptionTemplateDto[]>([]);
  readonly filteredRows = signal<PrescriptionTemplateDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  search = '';

  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  readonly columns: DataTableColumn<PrescriptionTemplateDto>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'diagnosis', header: 'Diagnosis', cell: (r) => r.diagnosis },
    { key: 'items', header: 'Medicines', cell: (r) => String(r.items.length) },
    { key: 'updated', header: 'Updated', cell: (r) => (r.updatedAtUtc ? new Date(r.updatedAtUtc).toLocaleDateString() : '—') },
  ];

  readonly rowLink = (row: PrescriptionTemplateDto) => roleRoute(this.router, 'templates', String(row.id));

  private readonly debouncedFilter = debounce(() => this.applyFilter(), 200);

  ngOnInit(): void {
    this.load();
  }

  onSearch(value: string): void {
    this.search = value.toLowerCase();
    this.page.set(1);
    this.debouncedFilter();
  }

  onPageChange(page: number): void {
    this.page.set(page);
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (items) => {
        this.allRows.set(items);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private applyFilter(): void {
    const q = this.search;
    if (!q) {
      this.filteredRows.set(this.allRows());
      return;
    }
    this.filteredRows.set(
      this.allRows().filter(
        (r) => r.name.toLowerCase().includes(q) || r.diagnosis.toLowerCase().includes(q),
      ),
    );
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
