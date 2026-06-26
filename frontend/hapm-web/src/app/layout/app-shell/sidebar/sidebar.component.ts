import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { API_ROLE_TO_KEY } from '../../../core/auth/auth.models';
import { UiAvatarComponent } from '../../../shared/components/ui/avatar/ui-avatar.component';
import { cn } from '../../../shared/utils/cn';
import { NAV_CONFIG } from './nav-config';
import { NavIconComponent } from './nav-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UiAvatarComponent, NavIconComponent],
  template: `
    <aside
      [class]="cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
        collapsed() ? 'w-sidebar-collapsed' : 'w-sidebar'
      )"
    >
      <div
        [class]="cn(
          'flex items-center border-b border-sidebar-border',
          collapsed() ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-4'
        )"
      >
        @if (!collapsed()) {
          <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-foreground">HAPM System</p>
            <p class="truncate text-[11px] text-muted-foreground">Clinical Portal</p>
          </div>
        }
        <button
          type="button"
          class="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          [class.ml-auto]="!collapsed()"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          (click)="toggleCollapsed.emit()"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            @if (collapsed()) {
              <path d="m9 18 6-6-6-6" />
            } @else {
              <path d="m15 18-6-6 6-6" />
            }
          </svg>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-3 scrollbar-none">
        @for (group of navGroups(); track group.label) {
          <div class="mb-2">
            @if (!collapsed()) {
              <p class="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {{ group.label }}
              </p>
            }
            @for (item of group.items; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]"
                [routerLinkActiveOptions]="{ exact: item.route.endsWith('/dashboard') }"
                [class]="cn(
                  'mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted',
                  collapsed() ? 'justify-center px-2' : ''
                )"
                [title]="collapsed() ? item.label : ''"
              >
                <app-nav-icon [name]="item.icon" />
                @if (!collapsed()) {
                  <span class="truncate">{{ item.label }}</span>
                }
              </a>
            }
          </div>
        }
      </nav>

      <div class="border-t border-sidebar-border p-3">
        <div [class]="cn('flex items-center gap-2', collapsed() ? 'justify-center' : '')">
          <app-ui-avatar size="sm" [name]="userName()" />
          @if (!collapsed()) {
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold">{{ userName() }}</p>
              <p class="truncate text-[10px] text-muted-foreground">{{ userRole() }}</p>
            </div>
            <button type="button" class="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Log out" (click)="logout.emit()">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          }
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  readonly collapsed = input(false);
  readonly toggleCollapsed = output<void>();
  readonly logout = output<void>();

  protected readonly cn = cn;

  navGroups() {
    const role = this.auth.role();
    if (!role) return [];
    return NAV_CONFIG[API_ROLE_TO_KEY[role]];
  }

  userName(): string {
    return this.auth.user()?.fullName ?? 'User';
  }

  userRole(): string {
    return this.auth.role() ?? '';
  }
}
