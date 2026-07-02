import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="h-[100dvh] overflow-hidden bg-background">
      <router-outlet />
    </div>
  `,
})
export class AuthLayoutComponent {}
