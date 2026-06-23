import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthPageShellComponent } from '../components/auth-page-shell.component';

@Component({
  selector: 'app-reset-password-sent-page',
  standalone: true,
  imports: [RouterLink, AuthPageShellComponent],
  template: `
    <app-auth-page-shell>
      <div class="mb-8">
        <div class="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-50">
          <svg class="size-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-foreground">Check your email</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          @if (email) {
            If an account exists for <span class="font-medium text-foreground">{{ email }}</span>, a password reset
            link has been sent.
          } @else {
            Password reset link sent to your email address.
          }
        </p>
      </div>

      <div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p class="text-xs text-amber-800">
          Email delivery is not configured on this API yet. Use
          <a routerLink="/auth/reset-password" class="font-medium text-primary hover:underline">Set new password</a>
          if you already have a reset token, or contact your hospital administrator.
        </p>
      </div>

      <a
        routerLink="/auth/login"
        class="block w-full rounded-xl border border-border bg-card py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        Back to login
      </a>
    </app-auth-page-shell>
  `,
})
export class ResetPasswordSentPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly email = this.route.snapshot.queryParamMap.get('email');
}
