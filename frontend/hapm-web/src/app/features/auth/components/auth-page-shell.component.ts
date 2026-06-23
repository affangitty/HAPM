import { Component } from '@angular/core';
import { AuthBrandPanelComponent } from './auth-brand-panel.component';

@Component({
  selector: 'app-auth-page-shell',
  standalone: true,
  imports: [AuthBrandPanelComponent],
  template: `
    <div class="flex min-h-screen bg-background">
      <app-auth-brand-panel class="hidden lg:block lg:w-[52%]" />
      <div class="flex flex-1 items-center justify-center p-8">
        <div class="w-full max-w-sm">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class AuthPageShellComponent {}
