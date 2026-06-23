import { Component, input, output } from '@angular/core';
import { AuditActionBadgeComponent } from './audit-action-badge.component';
import { AuditLogDto } from '../models/audit-log.models';

@Component({
  selector: 'app-audit-timeline-item',
  standalone: true,
  imports: [AuditActionBadgeComponent],
  template: `
    <button type="button" class="flex w-full gap-4 rounded-xl border bg-card p-4 text-left hover:bg-muted/40" (click)="selected.emit(log())">
      <div class="flex flex-col items-center pt-1">
        <div class="size-3 rounded-full" [class]="dotClass()"></div>
        <div class="mt-1 w-px flex-1 bg-border"></div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <app-audit-action-badge [action]="log().action" />
          <span class="text-sm font-medium">{{ log().entityName }}</span>
          <span class="font-mono text-xs text-muted-foreground">#{{ log().entityId }}</span>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">{{ log().userEmail || 'System' }} · {{ formatDate(log().timestampUtc) }}</p>
      </div>
    </button>
  `,
})
export class AuditTimelineItemComponent {
  readonly log = input.required<AuditLogDto>();
  readonly selected = output<AuditLogDto>();

  dotClass(): string {
    const map = { Created: 'bg-emerald-500', Updated: 'bg-blue-500', Deleted: 'bg-red-500' };
    return map[this.log().action];
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }
}
