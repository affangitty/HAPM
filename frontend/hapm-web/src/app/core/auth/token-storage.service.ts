import { Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { UserDto } from './auth.models';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private usePersistentStorage = this.readRememberMePreference();

  getAccessToken(): string | null {
    return this.getFromActiveStorage(APP_CONFIG.tokenStorageKey);
  }

  setAccessToken(token: string): void {
    this.setInActiveStorage(APP_CONFIG.tokenStorageKey, token);
  }

  getRefreshToken(): string | null {
    return this.getFromActiveStorage(APP_CONFIG.refreshStorageKey);
  }

  setRefreshToken(token: string): void {
    this.setInActiveStorage(APP_CONFIG.refreshStorageKey, token);
  }

  getUser(): UserDto | null {
    const raw = this.getFromActiveStorage(APP_CONFIG.userStorageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserDto;
    } catch {
      return null;
    }
  }

  setUser(user: UserDto): void {
    this.setInActiveStorage(APP_CONFIG.userStorageKey, JSON.stringify(user));
  }

  setRememberMe(remember: boolean): void {
    this.usePersistentStorage = remember;
    localStorage.setItem(APP_CONFIG.rememberMeKey, remember ? '1' : '0');

    if (!remember) {
      this.migrateToSessionStorage();
      return;
    }

    this.migrateToLocalStorage();
  }

  clear(): void {
    for (const key of [
      APP_CONFIG.tokenStorageKey,
      APP_CONFIG.refreshStorageKey,
      APP_CONFIG.userStorageKey,
    ]) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }

  private readRememberMePreference(): boolean {
    const stored = localStorage.getItem(APP_CONFIG.rememberMeKey);
    return stored !== '0';
  }

  private getActiveStorage(): Storage {
    return this.usePersistentStorage ? localStorage : sessionStorage;
  }

  private getFromActiveStorage(key: string): string | null {
    return (
      this.getActiveStorage().getItem(key) ??
      localStorage.getItem(key) ??
      sessionStorage.getItem(key)
    );
  }

  private setInActiveStorage(key: string, value: string): void {
    const active = this.getActiveStorage();
    const inactive = active === localStorage ? sessionStorage : localStorage;
    active.setItem(key, value);
    inactive.removeItem(key);
  }

  private migrateToSessionStorage(): void {
    for (const key of [
      APP_CONFIG.tokenStorageKey,
      APP_CONFIG.refreshStorageKey,
      APP_CONFIG.userStorageKey,
    ]) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    }
  }

  private migrateToLocalStorage(): void {
    for (const key of [
      APP_CONFIG.tokenStorageKey,
      APP_CONFIG.refreshStorageKey,
      APP_CONFIG.userStorageKey,
    ]) {
      const value = sessionStorage.getItem(key);
      if (value !== null) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      }
    }
  }
}
