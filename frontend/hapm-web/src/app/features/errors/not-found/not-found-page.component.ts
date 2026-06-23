import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, UiButtonComponent],
  template: `
    <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p class="text-6xl font-bold text-primary">404</p>
      <h1 class="mt-4 text-2xl font-semibold">Page not found</h1>
      <p class="mt-2 max-w-md text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
      <a routerLink="/" class="mt-6"><app-ui-button>Go home</app-ui-button></a>
    </div>
  `,
})
export class NotFoundPageComponent {}
