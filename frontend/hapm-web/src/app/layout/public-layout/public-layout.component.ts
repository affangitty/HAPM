import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-background">
      <header class="border-b bg-card px-4 py-4 sm:px-6">
        <div class="mx-auto flex max-w-content items-center gap-3">
          <div class="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div>
            <p class="text-sm font-bold">HAPM System</p>
            <p class="text-xs text-muted-foreground">Hospital Appointment & Patient Management</p>
          </div>
        </div>
      </header>
      <main class="mx-auto w-full max-w-content p-4 sm:p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PublicLayoutComponent {}
