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
import { AuditAction } from '../../../shared/models/enums';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { AuditLogsApiService } from '../data/audit-logs-api.service';
import { AuditLogDto } from '../models/audit-log.models';

@Component({
  selector: 'app-audit-log-list-page',
  standalone: true,
  imports: [
    RouterLink, FormsModule, UiPageHeaderComponent, UiFilterBarComponent, FormFieldComponent,
    UiSelectComponent, UiInputComponent, UiButtonComponent, DataTableComponent,
  ],
  template: `
    <app-ui-page-header title="Audit Logs" subtitle="Data-change audit trail">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/audit-logs'"><app-ui-button size="sm" variant="outline">Dashboard</app-ui-button></a>
        <app-ui-button size="sm" variant="outline" (pressed)="exportCsv()">Export CSV</app-ui-button>
      </div>
    </app-ui-page-header>

    <app-ui-filter-bar searchPlaceholder="Search entity, user, or ID..." (searchChange)="onSearch($event)">
      <app-form-field label="Entity" class="min-w-36"><app-ui-input [ngModel]="entityName()" (ngModelChange)="onEntity($event)" placeholder="e.g. Patient" /></app-form-field>
      <app-form-field label="Action" class="min-w-36"><app-ui-select [options]="actionOptions" [ngModel]="action()" (ngModelChange)="onAction($event)" /></app-form-field>
      <app-form-field label="From" class="min-w-36"><app-ui-input type="date" [ngModel]="fromDate()" (ngModelChange)="onFrom($event)" /></app-form-field>
      <app-form-field label="To" class="min-w-36"><app-ui-input type="date" [ngModel]="toDate()" (ngModelChange)="onTo($event)" /></app-form-field>
    </app-ui-filter-bar>

    <app-data-table [columns]="columns" [rows]="filteredRows()" [loading]="loading()" [page]="page()"
      [pageSize]="pageSize" [totalCount]="totalCount()" [rowLink]="rowLink"
      emptyTitle="No audit logs" emptyMessage="System activity will appear here."
      (pageChange)="onPageChange($event)" />
  `,
})
export class AuditLogListPageComponent implements OnInit {
  private readonly api = inject(AuditLogsApiService);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<AuditLogDto[]>([]);
  readonly filteredRows = signal<AuditLogDto[]>([]);
  readonly loading = signal(false);
  readonly entityName = signal('');
  readonly action = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  search = '';

  readonly actionOptions = [
    { label: 'All actions', value: '' }, { label: 'Created', value: 'Created' },
    { label: 'Updated', value: 'Updated' }, { label: 'Deleted', value: 'Deleted' },
  ];

  readonly columns: DataTableColumn<AuditLogDto>[] = [
    { key: 'time', header: 'Timestamp', cell: (r) => new Date(r.timestampUtc).toLocaleString() },
    { key: 'user', header: 'User', cell: (r) => r.userEmail ?? 'System' },
    { key: 'entity', header: 'Entity', cell: (r) => r.entityName },
    { key: 'id', header: 'Entity ID', cell: (r) => r.entityId },
    { key: 'action', header: 'Action', cell: (r) => r.action },
  ];

  readonly rowLink = (r: AuditLogDto) => `${this.basePath()}/audit-logs/${r.id}`;
  private readonly debouncedFilter = debounce(() => this.applyFilter(), 200);

  ngOnInit(): void { this.load(); }

  onSearch(v: string): void { this.search = v.toLowerCase(); this.debouncedFilter(); }
  onEntity(v: string): void { this.entityName.set(v); this.page.set(1); this.load(); }
  onAction(v: string): void { this.action.set(v); this.page.set(1); this.load(); }
  onFrom(v: string): void { this.fromDate.set(v); this.page.set(1); this.load(); }
  onTo(v: string): void { this.toDate.set(v); this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }

  exportCsv(): void {
    const header = 'id,userEmail,entityName,entityId,action,timestampUtc\n';
    const body = this.filteredRows().map((r) =>
      [r.id, r.userEmail ?? '', r.entityName, r.entityId, r.action, r.timestampUtc].join(','),
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'audit-logs.csv';
    a.click();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list({
      page: this.page(), pageSize: this.pageSize,
      entityName: this.entityName() || undefined,
      action: (this.action() as AuditAction) || undefined,
      fromDate: this.fromDate() || undefined,
      toDate: this.toDate() || undefined,
    }).subscribe({
      next: (r) => { this.rows.set(r.items); this.totalCount.set(r.totalCount); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private applyFilter(): void {
    const q = this.search;
    this.filteredRows.set(!q ? this.rows() : this.rows().filter((r) =>
      r.entityName.toLowerCase().includes(q) || (r.userEmail?.toLowerCase().includes(q) ?? false) ||
      r.entityId.toLowerCase().includes(q)));
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
