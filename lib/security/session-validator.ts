/**
 * Client-side session validation
 * Checks localStorage for valid session data
 */

export interface SessionData {
  sessionToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleId: number;
  };
  expiresAt: string;
}

export function getSessionData(): SessionData | null {
  try {
    const token = localStorage.getItem('sessionToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      return null;
    }

    const user = JSON.parse(userStr);
    const expiresAt = localStorage.getItem('expiresAt') || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Check if session is expired
    if (new Date(expiresAt) < new Date()) {
      clearSession();
      return null;
    }

    return {
      sessionToken: token,
      user,
      expiresAt
    };
  } catch (error) {
    console.error('[v0] Session validation error:', error);
    clearSession();
    return null;
  }
}

export function saveSessionData(sessionToken: string, user: any, expiresAt: string): void {
  localStorage.setItem('sessionToken', sessionToken);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('expiresAt', expiresAt);
}

export function clearSession(): void {
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
  localStorage.removeItem('userEmail');
}

export function isSessionValid(): boolean {
  return getSessionData() !== null;
}

export function getAuthHeaders(): { Authorization: string; 'X-User-Role': string } | null {
  const session = getSessionData();
  
  if (!session) {
    return null;
  }

  return {
    'Authorization': `Bearer ${session.sessionToken}`,
    'X-User-Role': session.user.role
  };
}
