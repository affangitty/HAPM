import { Component, input, output } from '@angular/core';
import { UiButtonComponent } from '../button/ui-button.component';

@Component({
  selector: 'app-ui-empty-state',
  standalone: true,
  imports: [UiButtonComponent],
  template: `
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ng-content select="[icon]" />
      </div>
      <h3 class="text-lg font-semibold">{{ title() }}</h3>
      <p class="mt-2 max-w-sm text-sm text-muted-foreground">{{ message() }}</p>
      @if (actionLabel()) {
        <app-ui-button class="mt-6" (pressed)="actionClick.emit()">{{ actionLabel() }}</app-ui-button>
      }
    </div>
  `,
})
export class UiEmptyStateComponent {
  readonly title = input('No data yet');
  readonly message = input('Content will appear here once the module is implemented.');
  readonly actionLabel = input<string | null>(null);
  readonly actionClick = output<void>();
}
