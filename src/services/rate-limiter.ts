interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id: string): string => `rate_limit:${id}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval((): void => {
      this.cleanup();
    }, 60000);
  }

  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();

    let entry = this.store.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    // Check if limit is exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  recordRequest(identifier: string, success: boolean = true): void {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();

    let entry = this.store.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    // Only count requests based on configuration
    const shouldCount = (success && !this.config.skipSuccessfulRequests) || 
                       (!success && !this.config.skipFailedRequests);

    if (shouldCount) {
      entry.count++;
    }

    this.store.set(key, entry);
  }

  reset(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    this.store.delete(key);
  }

  getStats(identifier: string): { count: number; remaining: number; resetTime: number } | null {
    const key = this.config.keyGenerator!(identifier);
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.resetTime <= now) {
      return null; // Window has expired
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Pre-configured rate limiters for different use cases
export const sessionRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30, // 30 requests per minute per session
  keyGenerator: (sessionId: string): string => `session:${sessionId}`
});

export const globalRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute globally
  keyGenerator: (): string => 'global'
});

export const analysisRateLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 10, // 10 analysis requests per 5 minutes per session
  keyGenerator: (sessionId: string): string => `analysis:${sessionId}`
});

// Rate limiting middleware for MCP tools
export function createRateLimitMiddleware(rateLimiter: RateLimiter): (identifier: string) => { allowed: boolean; remaining: number; resetTime: number } {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const result = rateLimiter.isAllowed(identifier);
    
    if (!result.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`);
    }
    
    return result;
  };
}
