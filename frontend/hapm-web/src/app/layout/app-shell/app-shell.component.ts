import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { API_ROLE_TO_KEY } from '../../core/auth/auth.models';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopNavComponent } from './top-nav/top-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopNavComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">
      <div class="hidden lg:block">
        <app-sidebar
          [collapsed]="sidebarCollapsed()"
          (toggleCollapsed)="sidebarCollapsed.set(!sidebarCollapsed())"
          (logout)="onLogout()"
        />
      </div>

      @if (mobileOpen()) {
        <div class="fixed inset-0 z-40 lg:hidden">
          <div class="absolute inset-0 bg-black/40" (click)="mobileOpen.set(false)"></div>
          <div class="relative z-50 h-full w-sidebar max-w-[85vw] shadow-xl">
            <app-sidebar [collapsed]="false" (logout)="onLogout()" />
          </div>
        </div>
      }

      <div class="flex min-w-0 flex-1 flex-col">
        <app-top-nav
          [rolePrefix]="rolePrefix()"
          (menuToggle)="mobileOpen.set(true)"
        />
        <main class="flex-1 overflow-y-auto p-6 scrollbar-none">
          <div class="mx-auto max-w-content">
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

  readonly sidebarCollapsed = signal(false);
  readonly mobileOpen = signal(false);

  ngOnInit(): void {
    void this.realtime.connect();
  }

  rolePrefix(): string {
    const role = this.auth.role();
    return role ? API_ROLE_TO_KEY[role] : 'admin';
  }

  onLogout(): void {
    void this.realtime.disconnect();
    this.auth.logout().subscribe();
  }
}
