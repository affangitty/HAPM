import { Component, input } from '@angular/core';
import { AuthBrandPanelComponent } from './auth-brand-panel.component';
import { ThemeToggleButtonComponent } from '../../../shared/components/ui/theme-toggle/theme-toggle-button.component';

@Component({
  selector: 'app-auth-page-shell',
  standalone: true,
  imports: [AuthBrandPanelComponent, ThemeToggleButtonComponent],
  template: `
    <div class="relative flex h-full overflow-hidden bg-background">
      <div class="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <app-theme-toggle-button />
      </div>
      <app-auth-brand-panel class="hidden h-full shrink-0 lg:block lg:w-[52%]" />
      <div class="flex min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
        <div class="m-auto w-full" [class]="wide() ? 'max-w-lg' : 'max-w-sm'">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class AuthPageShellComponent {
  /** Wider right panel for multi-field forms (e.g. patient registration). */
  readonly wide = input(false);
}
