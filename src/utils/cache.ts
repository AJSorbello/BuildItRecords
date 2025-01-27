interface CacheItem<T> {
  value: T;
  timestamp: number;
}

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize?: number;
  maxAge?: number;
  cleanupInterval?: number;
}

export class Cache<T> {
  private cache: Map<string, CacheItem<T>>;
  private options: CacheOptions;

  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.options = options;
    this.maxSize = options.maxSize ?? 1000;
    this.maxAge = options.maxAge ?? 3600000; // 1 hour in milliseconds
    this.cleanupInterval = options.cleanupInterval ?? 300000; // 5 minutes in milliseconds
  }

  set(key: string, value: T): void {
    // Store without size limits
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > this.options.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all valid (non-expired) items
  getAll(): T[] {
    const now = Date.now();
    const validItems: T[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp <= this.options.ttl) {
        validItems.push(item.value);
      } else {
        this.cache.delete(key);
      }
    });

    return validItems;
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > this.options.ttl) {
        this.cache.delete(key);
      }
    });
  }
}

// Rate limiting utility
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(
      timestamp => now - timestamp <= this.windowMs
    );

    if (this.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    this.timestamps.push(now);
  }
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      retries++;

      if (retries === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, retries - 1), maxDelay);
      
      // Add some randomness to prevent thundering herd
      const jitter = Math.random() * 100;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError || new Error('Operation failed after max retries');
}
