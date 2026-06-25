import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { DoctorPerformanceDto } from '../../doctors/models/doctor.models';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { StarRatingComponent } from '../components/star-rating.component';
import { ReviewsApiService } from '../data/reviews-api.service';
import { ReviewDto } from '../models/review.models';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-ratings-dashboard-page',
  standalone: true,
  imports: [
    UiEmptyStateComponent,
    RouterLink, UiPageHeaderComponent, UiButtonComponent, UiKpiCardComponent,
    UiCardComponent, UiCardContentComponent, UiSkeletonComponent, StarRatingComponent,
  ],
  template: `
    <app-ui-page-header title="Ratings Dashboard" subtitle="Patient satisfaction and performance metrics">
      <div actions class="flex gap-2">
        <a [routerLink]="basePath() + '/performance/reviews'"><app-ui-button size="sm" variant="outline">All reviews</app-ui-button></a>
        <a [routerLink]="basePath() + '/performance/analytics'"><app-ui-button size="sm" variant="outline">Analytics</app-ui-button></a>
      </div>
    </app-ui-page-header>

    @if (loading()) {
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" /></div>
    } @else if (loadError()) {
      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />
    } @else {
      @if (performance(); as p) {
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <app-star-rating [value]="p.averageRating" [showValue]="true" />
        <p class="text-sm text-muted-foreground">{{ p.reviewCount }} reviews · {{ p.completedAppointments }} completed appointments</p>
      </div>

      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-ui-kpi-card title="Average rating" [value]="p.averageRating.toFixed(1)" subtitle="out of 5" iconBg="bg-amber-50" iconColor="text-amber-500" iconPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        <app-ui-kpi-card title="Total reviews" [value]="formatCount(p.reviewCount)" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <app-ui-kpi-card title="Distinct patients" [value]="formatCount(p.distinctPatients)" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <app-ui-kpi-card title="No-show rate" [value]="p.noShowRatePercent.toFixed(1) + '%'" iconBg="bg-red-50" iconColor="text-red-600" iconPath="M18 6 6 18M6 6l12 12" />
      </div>

      <app-ui-card>
        <app-ui-card-content class="p-5">
          <h2 class="mb-4 font-semibold">Recent reviews</h2>
          <div class="space-y-3">
            @for (review of recentReviews(); track review.id) {
              <div class="flex items-start justify-between gap-3 rounded-xl border p-3">
                <div>
                  <p class="font-medium">{{ review.patientName }}</p>
                  <p class="text-sm text-muted-foreground">{{ review.comment || 'No comment' }}</p>
                </div>
                <app-star-rating [value]="review.rating" />
              </div>
            } @empty {
              <p class="text-sm text-muted-foreground">No reviews yet.</p>
            }
          </div>
        </app-ui-card-content>
      </app-ui-card>
      }
    }
  `,
})
export class RatingsDashboardPageComponent implements OnInit {
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly reviewsApi = inject(ReviewsApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly performance = signal<DoctorPerformanceDto | null>(null);
  readonly reviews = signal<ReviewDto[]>([]);
  readonly recentReviews = computed(() => this.reviews().slice(0, 5));

  ngOnInit(): void {
    this.doctorsApi.getCurrentDoctor().subscribe({
      next: (doctor) => {
        this.doctorsApi.getPerformance(doctor.id).subscribe({
          next: (p) => { this.performance.set(p); this.loading.set(false); },
          error: () => setPageLoadFailed(this.loading, this.loadError),
        });
        this.reviewsApi.list({ doctorId: doctor.id, page: 1, pageSize: 10 }).subscribe({
          next: (r) => this.reviews.set(r.items),
        });
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  formatCount(v: number): string { return String(v); }
  basePath(): string {
    return roleBase(this.router);
  }

}
