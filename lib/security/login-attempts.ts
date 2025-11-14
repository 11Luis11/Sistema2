import NodeCache from 'node-cache';

const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 15 * 60; // 15 minutes in seconds
const CACHE_CHECK_PERIOD = 60; // Clean up every 60 seconds

// Using node-cache for in-memory storage (can be replaced with Redis)
const cache = new NodeCache({ stdTTL: LOCKOUT_TIME, checkperiod: CACHE_CHECK_PERIOD });

interface AttemptRecord {
  count: number;
  lastAttempt: number;
  locked: boolean;
}

export function checkLoginAttempts(email: string): {
  allowed: boolean;
  attemptsLeft: number;
  message: string;
  timeToUnlock?: number;
} {
  const normalizedEmail = email.toLowerCase().trim();
  const attempt = cache.get<AttemptRecord>(normalizedEmail);

  if (!attempt) {
    return {
      allowed: true,
      attemptsLeft: MAX_ATTEMPTS,
      message: 'OK',
    };
  }

  if (attempt.locked) {
    const timeLeft = Math.max(0, LOCKOUT_TIME - Math.floor((Date.now() - attempt.lastAttempt) / 1000));
    
    if (timeLeft <= 0) {
      cache.del(normalizedEmail);
      return {
        allowed: true,
        attemptsLeft: MAX_ATTEMPTS,
        message: 'OK',
      };
    }

    return {
      allowed: false,
      attemptsLeft: 0,
      message: `Account temporarily locked. Try again in ${timeLeft} seconds.`,
      timeToUnlock: timeLeft,
    };
  }

  return {
    allowed: true,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempt.count),
    message: 'OK',
  };
}

export function recordFailedAttempt(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  const attempt = cache.get<AttemptRecord>(normalizedEmail) || { count: 0, lastAttempt: Date.now(), locked: false };

  attempt.count += 1;
  attempt.lastAttempt = Date.now();

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.locked = true;
  }

  cache.set(normalizedEmail, attempt, LOCKOUT_TIME);
}

export function clearLoginAttempts(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  cache.del(normalizedEmail);
}

export function isAccountLocked(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const attempt = cache.get<AttemptRecord>(normalizedEmail);
  return attempt?.locked ?? false;
}
