import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    loadChildren: () =>
      import('./layout/app-shell/shell.routes').then((m) => m.SHELL_CHILD_ROUTES),
  },
  {
    path: 'errors/unauthorized',
    loadComponent: () =>
      import('./features/errors/unauthorized/unauthorized-page.component').then(
        (m) => m.UnauthorizedPageComponent,
      ),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/pages/redirect-home.component').then((m) => m.RedirectHomeComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];
