import { Routes } from '@angular/router';
import { devOnlyGuard } from '../../core/auth/dev-only.guard';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    canActivate: [devOnlyGuard],
    loadComponent: () => import('./register/register-page.component').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password-page.component').then((m) => m.ForgotPasswordPageComponent),
  },
  {
    path: 'reset-password/sent',
    loadComponent: () =>
      import('./reset-password-sent/reset-password-sent-page.component').then(
        (m) => m.ResetPasswordSentPageComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password-page.component').then((m) => m.ResetPasswordPageComponent),
  },
];
