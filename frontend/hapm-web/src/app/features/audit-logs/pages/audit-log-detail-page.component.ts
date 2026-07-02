import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { loadByRouteParam } from '../../../shared/utils/route-param.util';
import { AuditActionBadgeComponent } from '../components/audit-action-badge.component';
import { AuditLogsApiService } from '../data/audit-logs-api.service';
import { AuditLogDto } from '../models/audit-log.models';
import { roleBase } from '../../../shared/utils/role-prefix.util';

type FieldChange = { old: unknown; new: unknown };

@Component({
  selector: 'app-audit-log-detail-page',
  standalone: true,
  imports: [
    DatePipe, RouterLink, UiCardComponent, UiCardContentComponent,
    UiSkeletonComponent, UiEmptyStateComponent, AuditActionBadgeComponent,
  ],
  template: `
    <a [routerLink]="basePath() + '/audit-logs/list'" class="text-xs text-primary hover:underline">← Back to audit logs</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-48" />
    } @else if (!log()) {
      <app-ui-empty-state class="mt-6 block" title="Audit log not found" message="This entry may have been archived or removed." />
    } @else {
      @if (log(); as l) {
        <div class="mt-2 mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold">{{ l.entityName }} #{{ l.entityId }}</h1>
            <p class="text-sm text-muted-foreground">{{ l.timestampUtc | date: 'medium' }}</p>
          </div>
          <app-audit-action-badge [action]="l.action" />
        </div>
        <app-ui-card>
          <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2">
            <div><p class="text-xs text-muted-foreground">User</p><p class="font-medium">{{ l.userEmail ?? 'System' }}</p></div>
            <div><p class="text-xs text-muted-foreground">User ID</p><p>{{ l.userId ?? '—' }}</p></div>
            <div class="sm:col-span-2">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Field changes</p>
              @if (fieldChanges(l.changesJson).length) {
                <div class="overflow-x-auto rounded-lg border">
                  <table class="w-full text-sm">
                    <thead class="bg-muted/60 text-left text-xs text-muted-foreground">
                      <tr>
                        <th class="px-3 py-2 font-medium">Field</th>
                        <th class="px-3 py-2 font-medium">Old value</th>
                        <th class="px-3 py-2 font-medium">New value</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of fieldChanges(l.changesJson); track row.field) {
                        <tr class="border-t">
                          <td class="px-3 py-2 font-medium">{{ row.field }}</td>
                          <td class="px-3 py-2 text-muted-foreground">{{ formatValue(row.old) }}</td>
                          <td class="px-3 py-2">{{ formatValue(row.new) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <pre class="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{{ formatJson(l.changesJson) }}</pre>
              }
            </div>
          </app-ui-card-content>
        </app-ui-card>
      }
    }
  `,
})
export class AuditLogDetailPageComponent implements OnInit {
  private readonly api = inject(AuditLogsApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly log = signal<AuditLogDto | null>(null);

  ngOnInit(): void {
    loadByRouteParam(
      'id',
      (id) => this.api.getById(id),
      {
        onStart: () => { this.loading.set(true); this.log.set(null); },
        onData: (entry) => { this.log.set(entry); this.loading.set(false); },
        onError: () => this.loading.set(false),
      },
      { destroyRef: this.destroyRef },
    );
  }

  fieldChanges(raw: string): { field: string; old: unknown; new: unknown }[] {
    try {
      const parsed = JSON.parse(raw) as Record<string, FieldChange>;
      if (parsed['old'] && parsed['new'] && typeof parsed['old'] === 'object') {
        return this.legacyChanges(parsed);
      }
      return Object.entries(parsed).map(([field, change]) => ({
        field,
        old: (change as FieldChange)?.old,
        new: (change as FieldChange)?.new,
      }));
    } catch {
      return [];
    }
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  formatJson(raw: string): string {
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
  }

  basePath(): string {
    return roleBase(this.router);
  }

  private legacyChanges(parsed: Record<string, unknown>): { field: string; old: unknown; new: unknown }[] {
    const oldValues = (parsed['old'] ?? {}) as Record<string, unknown>;
    const newValues = (parsed['new'] ?? {}) as Record<string, unknown>;
    const fields = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    return [...fields].map((field) => ({
      field,
      old: oldValues[field],
      new: newValues[field],
    }));
  }
}
