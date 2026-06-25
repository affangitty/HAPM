import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { StarRatingComponent } from '../components/star-rating.component';
import { ReviewsApiService } from '../data/reviews-api.service';

@Component({
  selector: 'app-review-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    UiCardComponent,
    UiCardContentComponent,
    UiButtonComponent,
    UiSkeletonComponent,
    UiEmptyStateComponent,
    StarRatingComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to reviews</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-40" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Review not found" message="This review may have been removed." />
    } @else {
      @if (review(); as r) {
        <div class="mt-2 mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold">{{ r.doctorName }}</h1>
            <p class="text-sm text-muted-foreground">Review by {{ r.patientName }}</p>
          </div>
          <app-star-rating [value]="r.rating" [showValue]="true" />
        </div>
        <app-ui-card>
          <app-ui-card-content class="space-y-4 p-5">
            <p class="text-sm text-muted-foreground">{{ r.createdAtUtc | date: 'medium' }} · Appointment #{{ r.appointmentId }}</p>
            <p>{{ r.comment || 'No written comment.' }}</p>
            @if (canDelete()) {
              <app-ui-button size="sm" variant="destructive" [loading]="deleting()" (pressed)="remove()">Delete review</app-ui-button>
            }
          </app-ui-card-content>
        </app-ui-card>
      }
    }
  `,
})
export class ReviewDetailPageComponent {
  private readonly api = inject(ReviewsApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader('id', (id) => this.api.getById(id), this.destroyRef);

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly review = this.routeState.data;
  readonly deleting = signal(false);

  canDelete(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Patient';
  }

  remove(): void {
    const r = this.review();
    if (!r || !confirm('Delete this review?')) return;
    this.deleting.set(true);
    this.api.delete(r.id).subscribe({
      next: () => void this.router.navigate([this.listLink()]),
      error: () => this.deleting.set(false),
    });
  }

  listLink(): string {
    const segment = this.auth.role() === 'Doctor' ? 'performance/reviews' : 'reviews';
    return roleRoute(this.router, ...segment.split('/'));
  }
}
