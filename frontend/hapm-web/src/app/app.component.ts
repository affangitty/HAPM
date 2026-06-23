import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiToastHostComponent } from './shared/components/api-toast-host/api-toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ApiToastHostComponent],
  template: `
    <router-outlet />
    <app-api-toast-host />
  `,
})
export class AppComponent {}
