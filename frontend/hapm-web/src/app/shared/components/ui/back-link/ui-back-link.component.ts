import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ui-back-link',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="route()"
      class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      {{ label() }}
    </a>
  `,
})
export class UiBackLinkComponent {
  readonly route = input.required<string>();
  readonly label = input('Back');
}
