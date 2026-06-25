import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { AuditTimelineItemComponent } from '../components/audit-timeline-item.component';
import { AuditLogsApiService } from '../data/audit-logs-api.service';
import { AuditLogDto } from '../models/audit-log.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-audit-timeline-page',
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiButtonComponent, UiSkeletonComponent, UiEmptyStateComponent, AuditTimelineItemComponent],
  template: `
    <app-ui-page-header title="Activity Timeline" subtitle="Chronological audit trail">
      <a actions [routerLink]="basePath() + '/audit-logs/list'"><app-ui-button size="sm" variant="outline">List view</app-ui-button></a>
    </app-ui-page-header>

    @if (loading()) {
      <div class="space-y-3">@for (i of [1,2,3,4]; track i) { <app-ui-skeleton class="h-20" /> }</div>
    } @else if (!rows().length) {
      <app-ui-empty-state title="No activity" message="Audit events will appear on the timeline." />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      <div class="space-y-3">
        @for (log of rows(); track log.id) {
          <app-audit-timeline-item [log]="log" (selected)="openDetail($event)" />
        }
      </div>
    }
  `,
})
export class AuditTimelinePageComponent implements OnInit {
  private readonly api = inject(AuditLogsApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly rows = signal<AuditLogDto[]>([]);

  ngOnInit(): void {
    this.api.list({ page: 1, pageSize: 50, sortBy: 'timestampUtc', sortDescending: true }).subscribe({
      next: (r) => { this.rows.set(r.items); this.loading.set(false); },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  openDetail(log: AuditLogDto): void {
    void this.router.navigate([roleRoute(this.router, 'audit-logs', String(log.id))]);
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
