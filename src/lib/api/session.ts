const TOKEN_KEY = "dental-voi-office-token";
const EXPIRES_KEY = "dental-voi-office-expires";

export function getStoredToken(): string | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const exp = sessionStorage.getItem(EXPIRES_KEY);
    if (!token || !exp) return null;
    if (new Date(exp).getTime() <= Date.now()) {
      clearStoredToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function storeToken(token: string, expiresAt: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(EXPIRES_KEY, expiresAt);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRES_KEY);
}
