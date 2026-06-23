import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiPageHeaderComponent } from '../components/ui/page-header/ui-page-header.component';
import { UiEmptyStateComponent } from '../components/ui/empty-state/ui-empty-state.component';
import { UiKpiCardComponent } from '../components/ui/kpi-card/ui-kpi-card.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [UiPageHeaderComponent, UiEmptyStateComponent, UiKpiCardComponent],
  template: `
    <app-ui-page-header [title]="title" [subtitle]="subtitle" />

    @if (showSampleKpis) {
      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-ui-kpi-card title="Sample metric" value="—" subtitle="Module not implemented" />
        <app-ui-kpi-card title="Sample metric" value="—" subtitle="Module not implemented" />
        <app-ui-kpi-card title="Sample metric" value="—" subtitle="Module not implemented" />
        <app-ui-kpi-card title="Sample metric" value="—" subtitle="Module not implemented" />
      </div>
    }

    <app-ui-empty-state
      title="Foundation ready"
      message="This route is wired with navigation, guards, and layout. Business features will be implemented in the next phase."
    />
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.data['title'] as string;
  readonly subtitle = (this.route.snapshot.data['subtitle'] as string | undefined) ?? 'Placeholder screen';
  readonly showSampleKpis = !!this.route.snapshot.data['showKpis'];
}
