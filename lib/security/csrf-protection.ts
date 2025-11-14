import * as crypto from 'crypto';

const csrfTokens = new Map<string, { token: string; createdAt: number }>();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createCsrfToken(sessionId: string): string {
  const token = generateCsrfToken();
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now(),
  });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) {
    return false;
  }

  const isExpired = Date.now() - stored.createdAt > TOKEN_EXPIRY;
  if (isExpired) {
    csrfTokens.delete(sessionId);
    return false;
  }

  const isValid = stored.token === token;
  
  // Consume token after validation
  if (isValid) {
    csrfTokens.delete(sessionId);
  }

  return isValid;
}

export function clearCsrfToken(sessionId: string): void {
  csrfTokens.delete(sessionId);
}
