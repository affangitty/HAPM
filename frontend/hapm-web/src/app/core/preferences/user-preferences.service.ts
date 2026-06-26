import { Injectable, signal } from '@angular/core';

export type ThemePreference = 'Light' | 'Dark' | 'System';
export type DensityPreference = 'Compact' | 'Default' | 'Comfortable';

export interface NotificationPreferences {
  appointmentReminders: boolean;
  labResultsReady: boolean;
  billingAlerts: boolean;
  systemAnnouncements: boolean;
}

const STORAGE_KEY = 'hapm_user_preferences';

interface StoredPreferences {
  theme: ThemePreference;
  density: DensityPreference;
  notifications: NotificationPreferences;
}

const DEFAULTS: StoredPreferences = {
  theme: 'Light',
  density: 'Default',
  notifications: {
    appointmentReminders: true,
    labResultsReady: true,
    billingAlerts: true,
    systemAnnouncements: true,
  },
};

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly stored = signal<StoredPreferences>(this.load());
  private systemMediaQuery: MediaQueryList | null = null;
  private readonly onSystemThemeChange = () => {
    if (this.theme() === 'System') this.applyTheme('System');
  };

  readonly theme = signal<ThemePreference>(this.stored().theme);
  readonly density = signal<DensityPreference>(this.stored().density);
  readonly notifications = signal<NotificationPreferences>({ ...this.stored().notifications });

  /** Apply saved theme and density on app startup. */
  initialize(): void {
    this.applyTheme(this.theme());
    this.applyDensity(this.density());
    this.bindSystemThemeListener();
  }

  setTheme(theme: ThemePreference): void {
    this.theme.set(theme);
    this.persist();
    this.applyTheme(theme);
  }

  setDensity(density: DensityPreference): void {
    this.density.set(density);
    this.persist();
    this.applyDensity(density);
  }

  setNotification<K extends keyof NotificationPreferences>(key: K, enabled: boolean): void {
    this.notifications.update((n) => ({ ...n, [key]: enabled }));
    this.persist();
  }

  private persist(): void {
    const next: StoredPreferences = {
      theme: this.theme(),
      density: this.density(),
      notifications: { ...this.notifications() },
    };
    this.stored.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private load(): StoredPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications } };
      const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
      return {
        theme: parsed.theme ?? DEFAULTS.theme,
        density: parsed.density ?? DEFAULTS.density,
        notifications: { ...DEFAULTS.notifications, ...parsed.notifications },
      };
    } catch {
      return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications } };
    }
  }

  private applyTheme(theme: ThemePreference): void {
    document.documentElement.dataset['theme'] = theme.toLowerCase();
  }

  private applyDensity(density: DensityPreference): void {
    document.documentElement.dataset['density'] = density.toLowerCase();
  }

  private bindSystemThemeListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.systemMediaQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
    this.systemMediaQuery.removeEventListener('change', this.onSystemThemeChange);
    this.systemMediaQuery.addEventListener('change', this.onSystemThemeChange);
  }
}
