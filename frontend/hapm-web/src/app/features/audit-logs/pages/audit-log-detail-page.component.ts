import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { AuditActionBadgeComponent } from '../components/audit-action-badge.component';
import { AuditLogsApiService } from '../data/audit-logs-api.service';
import { AuditLogDto } from '../models/audit-log.models';

@Component({
  selector: 'app-audit-log-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, UiCardComponent, UiCardContentComponent, UiSkeletonComponent, AuditActionBadgeComponent],
  template: `
    <a [routerLink]="basePath() + '/audit-logs/list'" class="text-xs text-primary hover:underline">← Back to audit logs</a>

    @if (loading()) { <app-ui-skeleton class="mt-4 h-48" /> } @else {
      @if (log(); as l) {
        <div class="mt-2 mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold">{{ l.entityName }} #{{ l.entityId }}</h1>
            <p class="text-sm text-muted-foreground">{{ l.timestampUtc | date: 'medium' }}</p>
          </div>
          <app-audit-action-badge [action]="l.action" />
        </div>
        <app-ui-card>
          <app-ui-card-content class="grid gap-4 p-5">
            <div><p class="text-xs text-muted-foreground">User</p><p>{{ l.userEmail ?? 'System' }}</p></div>
            <div><p class="text-xs text-muted-foreground">User ID</p><p>{{ l.userId ?? '—' }}</p></div>
            <div class="sm:col-span-2">
              <p class="mb-2 text-xs text-muted-foreground">Changes (JSON)</p>
              <pre class="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{{ formatJson(l.changesJson) }}</pre>
            </div>
          </app-ui-card-content>
        </app-ui-card>
      }
    }
  `,
})
export class AuditLogDetailPageComponent implements OnInit {
  private readonly api = inject(AuditLogsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly log = signal<AuditLogDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (r) => {
        this.log.set(r.items.find((item) => item.id === id) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatJson(raw: string): string {
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
