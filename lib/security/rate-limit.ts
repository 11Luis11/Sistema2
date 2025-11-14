import NodeCache from 'node-cache';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
};

class RateLimiter {
  private cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  check(identifier: string): { allowed: boolean; remaining: number } {
    const key = `ratelimit:${identifier}`;
    let count = this.cache.get<number>(key) || 0;

    if (count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
      };
    }

    count += 1;
    this.cache.set(key, count, Math.ceil(this.config.windowMs / 1000));

    return {
      allowed: true,
      remaining: this.config.maxRequests - count,
    };
  }

  reset(identifier: string): void {
    this.cache.del(`ratelimit:${identifier}`);
  }
}

export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

export const loginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
});
