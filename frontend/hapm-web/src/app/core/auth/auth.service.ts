import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import {
  AuthResponse,
  ChangePasswordRequest,
  CompletePasswordResetRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  ROLE_HOME_ROUTES,
  roleRoutePrefix,
  UserDto,
  UserRole,
} from './auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClientService);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly userSignal = signal<UserDto | null>(this.storage.getUser());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.storage.getAccessToken() && !!this.userSignal());
  readonly role = computed(() => this.userSignal()?.role ?? null);

  login(request: LoginRequest, rememberMe = true): Observable<UserDto> {
    this.storage.setRememberMe(rememberMe);

    return this.api.post<AuthResponse>('/auth/login', request).pipe(
      tap((res) => this.persistSession(res)),
      map((res) => res.user),
    );
  }

  register(request: RegisterRequest, rememberMe = true): Observable<UserDto> {
    this.storage.setRememberMe(rememberMe);

    return this.api.post<AuthResponse>('/auth/register', request).pipe(
      tap((res) => this.persistSession(res)),
      map((res) => res.user),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.storage.getRefreshToken();
    const request$ = refreshToken
      ? this.api.post<void>('/auth/logout', { refreshToken })
      : of(void 0);

    return request$.pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.clearSession();
        void this.router.navigate(['/auth/login']);
      }),
    );
  }

  refreshToken(): Observable<boolean> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      return of(false);
    }

    return this.api.post<AuthResponse>('/auth/refresh', { refreshToken }).pipe(
      tap((res) => this.persistSession(res)),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
    );
  }

  loadCurrentUser(): Observable<UserDto | null> {
    if (!this.storage.getAccessToken()) {
      return of(null);
    }

    return this.api.get<UserDto>('/auth/me').pipe(
      tap((user) => {
        this.userSignal.set(user);
        this.storage.setUser(user);
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.api.post<void>('/auth/change-password', request);
  }

  requestPasswordReset(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.api.post<ForgotPasswordResponse>('/auth/forgot-password', request);
  }

  completePasswordReset(request: CompletePasswordResetRequest): Observable<void> {
    return this.api.post<void>('/auth/reset-password', request);
  }

  getHomeRoute(role?: UserRole | null): string {
    const resolved = role ?? this.role();
    return resolved ? ROLE_HOME_ROUTES[resolved] : '/auth/login';
  }

  getSettingsRoute(role?: UserRole | null): string {
    const resolved = role ?? this.role();
    if (!resolved) return '/auth/login';
    const prefix = roleRoutePrefix(resolved);
    return `/${prefix}/settings`;
  }

  hasRole(...roles: UserRole[]): boolean {
    const current = this.role();
    return !!current && roles.includes(current);
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  private persistSession(response: AuthResponse): void {
    this.storage.setAccessToken(response.accessToken);
    this.storage.setRefreshToken(response.refreshToken);
    this.storage.setUser(response.user);
    this.userSignal.set(response.user);
  }

  private clearSession(): void {
    this.storage.clear();
    this.userSignal.set(null);
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }
}
