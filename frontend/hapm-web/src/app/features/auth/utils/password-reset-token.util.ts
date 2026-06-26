export const PASSWORD_RESET_TOKEN_KEY = 'hapm_password_reset_token';
export const PASSWORD_RESET_TOKEN_QUERY = 'token';

export function storePasswordResetToken(token: string): void {
  sessionStorage.setItem(PASSWORD_RESET_TOKEN_KEY, token);
}

export function consumePasswordResetToken(): string | null {
  const token = sessionStorage.getItem(PASSWORD_RESET_TOKEN_KEY);
  if (token) sessionStorage.removeItem(PASSWORD_RESET_TOKEN_KEY);
  return token;
}

export function peekPasswordResetToken(): string | null {
  return sessionStorage.getItem(PASSWORD_RESET_TOKEN_KEY);
}

/** Resolve reset token from sessionStorage or `?token=` query param (production email links). */
export function resolvePasswordResetToken(queryToken: string | null | undefined): string | null {
  const fromQuery = queryToken?.trim();
  if (fromQuery) {
    storePasswordResetToken(fromQuery);
    return fromQuery;
  }
  return peekPasswordResetToken();
}
