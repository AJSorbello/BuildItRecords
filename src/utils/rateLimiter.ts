/**
 * Simple rate limiter implementation for API requests
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly timeWindow: number;
  private readonly maxRequests: number;
  private requests: Map<number, number>;

  constructor(maxRequests = 100, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(time => now - time < this.timeWindow);

    if (this.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.timestamps[0];
      const waitTime = this.timeWindow - (now - oldestTimestamp);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.timestamps.push(now);
  }

  reset(): void {
    this.timestamps = [];
  }
}
