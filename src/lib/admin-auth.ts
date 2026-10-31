export const ADMIN_SESSION_STORAGE_KEY = 'aerothor_admin_session_token_v1';
export const ADMIN_EMAIL_STORAGE_KEY = 'aerothor_admin_email_v1';

export interface AdminSession {
  isAuthenticated: boolean;
  token: string;
  email: string;
}

export function getAdminSession(): AdminSession {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, token: '', email: '' };
  }
  try {
    const token =
      sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
      localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
      '';
    const email =
      sessionStorage.getItem(ADMIN_EMAIL_STORAGE_KEY) ||
      localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY) ||
      '';
    return {
      isAuthenticated: Boolean(token.trim()),
      token: token.trim(),
      email: email.trim() || 'codernestwebsolution@gmail.com',
    };
  } catch {
    return { isAuthenticated: false, token: '', email: '' };
  }
}

export function getAdminToken(): string {
  return getAdminSession().token;
}

export function getAdminAuthHeaders(
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export function saveAdminSession(token: string, email: string, rememberDevice = false): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token.trim());
    sessionStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, email.trim());
    if (rememberDevice) {
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token.trim());
      localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, email.trim());
    } else {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
    }
  } catch {
    // ignore storage quota errors
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
  } catch {
    // ignore
  }
}
