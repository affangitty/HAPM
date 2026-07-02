import { Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { roleRoutePrefix } from '../../core/auth/auth.models';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { VIEWPORT } from '../../shared/utils/viewport.util';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopNavComponent } from './top-nav/top-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopNavComponent],
  template: `
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      Skip to main content
    </a>

    <div class="flex h-[100dvh] overflow-hidden bg-background">
      <div class="hidden md:block">
        <app-sidebar
          [collapsed]="sidebarCollapsed()"
          (toggleCollapsed)="onSidebarToggle()"
          (logout)="onLogout()"
        />
      </div>

      @if (mobileOpen()) {
        <div class="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div class="absolute inset-0 bg-black/40" (click)="mobileOpen.set(false)"></div>
          <div class="relative z-50 h-full w-sidebar max-w-[85vw] shadow-xl">
            <app-sidebar
              [collapsed]="false"
              [drawerMode]="true"
              (toggleCollapsed)="mobileOpen.set(false)"
              (logout)="onLogout()"
            />
          </div>
        </div>
      }

      <div class="flex min-w-0 flex-1 flex-col">
        <app-top-nav
          [rolePrefix]="rolePrefix()"
          (menuToggle)="mobileOpen.set(true)"
        />
        <main id="main-content" class="flex-1 overflow-y-auto p-4 scrollbar-none sm:p-6" tabindex="-1">
          <div class="mx-auto w-full max-w-content">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class AppShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly sidebarCollapsed = signal(this.readInitialSidebarCollapsed());
  readonly mobileOpen = signal(false);
  readonly isLargeScreen = signal(this.readLargeScreen());

  ngOnInit(): void {
    void this.realtime.connect();
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.mobileOpen.set(false));
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasLarge = this.isLargeScreen();
    const nowLarge = this.readLargeScreen();
    this.isLargeScreen.set(nowLarge);

    if (wasLarge && !nowLarge) {
      this.sidebarCollapsed.set(true);
    }

    if (window.innerWidth >= VIEWPORT.md) {
      this.mobileOpen.set(false);
    }
  }

  onSidebarToggle(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileOpen()) this.mobileOpen.set(false);
  }

  rolePrefix(): string {
    const role = this.auth.role();
    return role ? roleRoutePrefix(role) : 'admin';
  }

  onLogout(): void {
    void this.realtime.disconnect();
    this.auth.logout().subscribe();
  }

  private readLargeScreen(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= VIEWPORT.lg;
  }

  private readInitialSidebarCollapsed(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= VIEWPORT.md && window.innerWidth < VIEWPORT.lg;
  }
}
