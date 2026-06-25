import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { VitalTimelineItemComponent } from '../components/vital-timeline-item.component';
import { VitalsApiService } from '../data/vitals-api.service';
import { VitalSignDto } from '../models/vital.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-vital-history-page',
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiButtonComponent, UiSkeletonComponent, UiEmptyStateComponent, VitalTimelineItemComponent],
  template: `
    <app-ui-page-header title="Vital History" subtitle="Timeline of recorded vital sign readings">
      <a actions [routerLink]="basePath() + '/vitals'"><app-ui-button size="sm" variant="outline">Overview</app-ui-button></a>
    </app-ui-page-header>

    @if (loading()) {
      <div class="space-y-3">@for (i of [1,2,3]; track i) { <app-ui-skeleton class="h-24" /> }</div>
    } @else if (!rows().length) {
      <app-ui-empty-state title="No vital history" message="Readings will appear here once recorded." />
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      <div class="space-y-3">
        @for (reading of rows(); track reading.id) {
          <app-vital-timeline-item [reading]="reading" (selected)="openDetail($event)" />
        }
      </div>
    }
  `,
})
export class VitalHistoryPageComponent implements OnInit {
  private readonly api = inject(VitalsApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly rows = signal<VitalSignDto[]>([]);
  readonly pageSize = DEFAULT_PAGE_SIZE;

  ngOnInit(): void { this.load(); }

  openDetail(reading: VitalSignDto): void {
    void this.router.navigate([roleRoute(this.router, 'vitals', String(reading.id))]);
  }

  private load(): void {
    this.api.list({ page: 1, pageSize: this.pageSize, sortBy: 'recordedAtUtc', sortDescending: true }).subscribe({
      next: (r) => { this.rows.set(r.items); this.loading.set(false); },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
