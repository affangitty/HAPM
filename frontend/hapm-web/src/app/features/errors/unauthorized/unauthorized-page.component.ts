import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [RouterLink, UiButtonComponent],
  template: `
    <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p class="text-6xl font-bold text-destructive">403</p>
      <h1 class="mt-4 text-2xl font-semibold">Access denied</h1>
      <p class="mt-2 max-w-md text-muted-foreground">You do not have permission to view this page.</p>
      <a [routerLink]="homeRoute" class="mt-6"><app-ui-button>Go to dashboard</app-ui-button></a>
    </div>
  `,
})
export class UnauthorizedPageComponent {
  private readonly auth = inject(AuthService);

  readonly homeRoute = (() => {
    const role = this.auth.role();
    return this.auth.isAuthenticated() && role ? this.auth.getHomeRoute(role) : '/auth/login';
  })();
}
