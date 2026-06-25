import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { GlobalSearchResult, GlobalSearchService } from '../../../core/search/global-search.service';
import { NotificationsApiService } from '../../../features/notifications/data/notifications-api.service';
import { NotificationsHubService } from '../../../core/realtime/notifications-hub.service';
import { NotificationDto } from '../../../features/notifications/models/notification.models';
import { NotificationDrawerComponent } from '../../../features/notifications/components/notification-drawer.component';
import { UiSearchInputComponent } from '../../../shared/components/ui/search-input/ui-search-input.component';
import { PAGE_TITLES } from '../sidebar/nav-config';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, UiSearchInputComponent, NotificationDrawerComponent],
  template: `
    <header class="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4">
      <button
        type="button"
        class="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open navigation menu"
        (click)="menuToggle.emit()"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      <div class="hidden items-center gap-1.5 text-sm sm:flex">
        <a routerLink="/" class="text-muted-foreground hover:text-foreground">HAPM</a>
        <span class="text-muted-foreground">/</span>
        <span class="font-medium text-foreground">{{ pageTitle() }}</span>
      </div>

      <div class="relative mx-auto hidden max-w-md flex-1 md:block">
        <app-ui-search-input
          placeholder="Search patients, doctors, appointments, billing..."
          (searchChange)="onSearch($event)"
        />
        @if (searchOpen() && searchResults().length) {
          <div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-card shadow-lg">
            @for (result of searchResults(); track result.type + result.id) {
              <button
                type="button"
                class="flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                (click)="openResult(result)"
                [attr.aria-label]="result.label + ', ' + result.subtitle"
              >
                <span class="font-medium">{{ result.label }}</span>
                <span class="text-xs text-muted-foreground">{{ result.subtitle }}</span>
              </button>
            }
          </div>
        }
      </div>

      <div class="relative flex-1 md:hidden">
        <app-ui-search-input
          placeholder="Search..."
          (searchChange)="onSearch($event)"
        />
        @if (searchOpen() && searchResults().length) {
          <div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-card shadow-lg">
            @for (result of searchResults(); track result.type + result.id) {
              <button
                type="button"
                class="flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                (click)="openResult(result)"
              >
                <span class="font-medium">{{ result.label }}</span>
                <span class="text-xs text-muted-foreground">{{ result.subtitle }}</span>
              </button>
            }
          </div>
        }
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open notifications"
          (click)="drawerOpen.set(true)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          @if (unreadCount() > 0) {
            <span class="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{{ unreadCount() }}</span>
          }
        </button>
      </div>
    </header>

    <app-notification-drawer
      [open]="drawerOpen()"
      [rolePrefix]="rolePrefix()"
      (close)="onDrawerClose()"
      (selectNotification)="openNotification($event)"
    />
  `,
})
export class TopNavComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly notificationsApi = inject(NotificationsApiService);
  private readonly notificationsHub = inject(NotificationsHubService);
  private readonly searchService = inject(GlobalSearchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly rolePrefix = input('admin');
  readonly menuToggle = output<void>();

  readonly drawerOpen = signal(false);
  readonly unreadCount = signal(0);
  readonly searchOpen = signal(false);
  readonly searchResults = signal<GlobalSearchResult[]>([]);

  private readonly searchInput$ = new Subject<string>();

  ngOnInit(): void {
    this.refreshUnread();
    this.notificationsHub.received$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.unreadCount.update((c) => c + 1);
    });
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.trim().length < 2) return of<GlobalSearchResult[]>([]);
        return this.searchService.search(query, this.rolePrefix());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.searchOpen.set(results.length > 0);
      },
      error: () => {
        this.searchResults.set([]);
        this.searchOpen.set(false);
      },
    });
  }

  readonly pageTitle = () => {
    const segments = this.router.url.split('/').filter(Boolean);
    const last = segments[segments.length - 1] ?? 'dashboard';
    return PAGE_TITLES[last] ?? 'Dashboard';
  };

  onSearch(query: string): void {
    if (query.trim().length < 2) {
      this.searchOpen.set(false);
      this.searchResults.set([]);
    }
    this.searchInput$.next(query);
  }

  openResult(result: GlobalSearchResult): void {
    this.searchOpen.set(false);
    this.searchResults.set([]);
    void this.router.navigate([result.route]);
  }

  openNotification(n: NotificationDto): void {
    this.drawerOpen.set(false);
    void this.router.navigate([`/${this.rolePrefix()}/notifications/${n.id}`]);
  }

  onDrawerClose(): void {
    this.drawerOpen.set(false);
    this.refreshUnread();
  }

  private refreshUnread(): void {
    this.notificationsApi.getUnreadCount().subscribe({ next: (c) => this.unreadCount.set(c) });
  }
}
