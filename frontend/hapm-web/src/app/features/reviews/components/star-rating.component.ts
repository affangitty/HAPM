import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div class="inline-flex items-center gap-0.5" [attr.aria-label]="'Rating ' + value() + ' of 5'">
      @for (star of stars; track star) {
        <button
          type="button"
          class="text-lg leading-none transition-colors"
          [class]="star <= value() ? 'text-amber-400' : 'text-muted-foreground/40'"
          [disabled]="!interactive()"
          (click)="interactive() && setRating(star)"
        >★</button>
      }
      @if (showValue()) {
        <span class="ml-1 text-sm text-muted-foreground">{{ value().toFixed(1) }}</span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  readonly value = input(0);
  readonly interactive = input(false);
  readonly showValue = input(false);
  readonly valueChange = output<number>();

  readonly stars = [1, 2, 3, 4, 5];

  setRating(star: number): void {
    this.valueChange.emit(star);
  }
}
