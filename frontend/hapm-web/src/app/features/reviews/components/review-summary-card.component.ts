import { Component, input } from '@angular/core';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { StarRatingComponent } from './star-rating.component';
import { ReviewDto } from '../models/review.models';

@Component({
  selector: 'app-review-summary-card',
  standalone: true,
  imports: [UiCardComponent, UiCardContentComponent, StarRatingComponent],
  template: `
    <app-ui-card>
      <app-ui-card-content class="p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-semibold">{{ review().doctorName }}</p>
            <p class="text-sm text-muted-foreground">{{ review().patientName }} · {{ formatDate(review().createdAtUtc) }}</p>
          </div>
          <app-star-rating [value]="review().rating" />
        </div>
        @if (review().comment) {
          <p class="mt-3 text-sm">{{ review().comment }}</p>
        }
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class ReviewSummaryCardComponent {
  readonly review = input.required<ReviewDto>();

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
  }
}
