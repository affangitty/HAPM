import { HttpInterceptorFn } from '@angular/common/http';
import { APP_CONFIG } from '../config/app-config';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/** Endpoints that intentionally mint new state on every call. */
const EXCLUDED_PATH_SUFFIXES = ['/auth/login', '/auth/refresh'];

function shouldAttachIdempotencyKey(method: string, url: string): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return false;
  if (!url.includes(APP_CONFIG.apiUrl)) return false;
  const path = url.slice(url.indexOf(APP_CONFIG.apiUrl) + APP_CONFIG.apiUrl.length);
  return !EXCLUDED_PATH_SUFFIXES.some((suffix) => path.startsWith(suffix));
}

function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Adds `Idempotency-Key` to mutating API requests unless the caller already set one.
 * Retries should reuse the same key by passing `headers: { 'Idempotency-Key': existingKey }`.
 */
export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!shouldAttachIdempotencyKey(req.method, req.url) || req.headers.has('Idempotency-Key')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'Idempotency-Key': createIdempotencyKey() },
    }),
  );
};
