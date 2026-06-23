import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BarChartComponent } from '../../dashboard/charts/bar-chart.component';
import { DonutChartComponent } from '../../dashboard/charts/donut-chart.component';
import { ChartDataPoint, DonutSegment } from '../../dashboard/charts/chart.models';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { ReviewsApiService } from '../data/reviews-api.service';
import { ReviewDto } from '../models/review.models';

@Component({
  selector: 'app-review-analytics-page',
  standalone: true,
  imports: [
    RouterLink, UiPageHeaderComponent, UiButtonComponent, UiCardComponent, UiCardContentComponent,
    BarChartComponent, DonutChartComponent, UiSkeletonComponent,
  ],
  template: `
    <app-ui-page-header title="Review Analytics" subtitle="Rating distribution and feedback trends">
      <a actions [routerLink]="basePath() + '/performance'"><app-ui-button size="sm" variant="outline">Dashboard</app-ui-button></a>
    </app-ui-page-header>

    @if (loading()) { <app-ui-skeleton class="h-64" /> } @else {
      <div class="grid gap-6 lg:grid-cols-2">
        <app-ui-card>
          <app-ui-card-content class="p-5">
            <h2 class="mb-4 font-semibold">Rating distribution</h2>
            <app-bar-chart [data]="barData()" valueKey="count" color="#F59E0B" ariaLabel="Rating distribution" />
          </app-ui-card-content>
        </app-ui-card>
        <app-ui-card>
          <app-ui-card-content class="p-5">
            <h2 class="mb-4 font-semibold">Star mix</h2>
            <app-donut-chart [segments]="donutData()" ariaLabel="Star rating mix" />
          </app-ui-card-content>
        </app-ui-card>
      </div>
    }
  `,
})
export class ReviewAnalyticsPageComponent implements OnInit {
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly reviewsApi = inject(ReviewsApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly barData = signal<ChartDataPoint[]>([]);
  readonly donutData = signal<DonutSegment[]>([]);

  ngOnInit(): void {
    this.doctorsApi.getCurrentDoctor().subscribe({
      next: (doctor) => {
        this.reviewsApi.list({ doctorId: doctor.id, page: 1, pageSize: 100 }).subscribe({
          next: (r) => { this.buildCharts(r.items); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private buildCharts(reviews: ReviewDto[]): void {
    const counts = new Map<number, number>();
    for (let i = 1; i <= 5; i++) counts.set(i, 0);
    for (const r of reviews) counts.set(r.rating, (counts.get(r.rating) ?? 0) + 1);
    const colors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981'];
    this.barData.set(Array.from(counts.entries()).map(([label, count]) => ({ label: `${label}★`, count })));
    this.donutData.set(Array.from(counts.entries()).map(([label, value], i) => ({
      label: `${label} stars`, value, color: colors[i],
    })));
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
