import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { StarRatingComponent } from '../components/star-rating.component';
import { ReviewsApiService } from '../data/reviews-api.service';
import { ReviewDto } from '../models/review.models';

@Component({
  selector: 'app-review-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, UiCardComponent, UiCardContentComponent, UiButtonComponent, UiSkeletonComponent, StarRatingComponent],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to reviews</a>

    @if (loading()) { <app-ui-skeleton class="mt-4 h-40" /> } @else {
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
export class ReviewDetailPageComponent implements OnInit {
  private readonly api = inject(ReviewsApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly deleting = signal(false);
  readonly review = signal<ReviewDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.list({ page: 1, pageSize: 100 }).subscribe({
      next: (r) => {
        this.review.set(r.items.find((item) => item.id === id) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

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
    const prefix = this.basePath();
    return this.auth.role() === 'Doctor' ? `${prefix}/performance/reviews` : `${prefix}/reviews`;
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
