import { Component, computed, inject } from '@angular/core';
import { UserPreferencesService } from '../../../../core/preferences/user-preferences.service';

@Component({
  selector: 'app-theme-toggle-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      (click)="preferences.toggleTheme()"
    >
      @if (isDark()) {
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      } @else {
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      }
    </button>
  `,
})
export class ThemeToggleButtonComponent {
  protected readonly preferences = inject(UserPreferencesService);

  readonly isDark = computed(() => {
    this.preferences.theme();
    return this.preferences.isDarkMode();
  });

  readonly label = computed(() =>
    this.isDark() ? 'Switch to light mode' : 'Switch to dark mode',
  );
}
