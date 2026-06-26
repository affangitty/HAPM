import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserPreferencesService } from './core/preferences/user-preferences.service';
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
export class AppComponent implements OnInit {
  private readonly preferences = inject(UserPreferencesService);

  ngOnInit(): void {
    this.preferences.initialize();
  }
}
