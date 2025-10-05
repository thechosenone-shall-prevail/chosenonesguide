// Redis-based Rate Limiter using Sliding Window Algorithm

import { kv } from "@vercel/kv";
import type {
  RateLimitConfig,
  RateLimitResult,
  SubscriptionTier,
  UsageStats,
} from "./types";
import { TIER_LIMITS } from "./types";

export class RateLimiter {
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.9; // 90%

  /**
   * Check if a request is within rate limits
   */
  async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const key = this.getKey(config.userId, "messages", "hourly");
    const now = Date.now();
    const windowStart = now - config.window * 1000;

    try {
      // Remove old entries outside the window
      await kv.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      const current = await kv.zcount(key, windowStart, now);

      // Check if limit exceeded
      const allowed = current < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - current);

      // Calculate reset time (end of current window)
      const resetAt = new Date(now + config.window * 1000);

      // If not allowed, calculate retry after
      let retryAfter: number | undefined;
      if (!allowed) {
        // Get the oldest entry in the window
        const oldest = await kv.zrange(key, 0, 0, { withScores: true });
        if (oldest.length > 0) {
          const oldestTimestamp = oldest[1] as number;
          retryAfter = Math.ceil((oldestTimestamp + config.window * 1000 - now) / 1000);
        }
      }

      return {
        allowed,
        remaining,
        resetAt,
        retryAfter,
      };
    } catch (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow the request if Redis is down
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.window * 1000),
      };
    }
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(
    userId: string,
    type: "messages" | "uploads" | "projects" = "messages",
    period: "hourly" | "daily" | "monthly" = "hourly"
  ): Promise<void> {
    const key = this.getKey(userId, type, period);
    const now = Date.now();

    try {
      // Add current timestamp to sorted set
      await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });

      // Set expiry based on period
      const expiry = this.getExpiry(period);
      await kv.expire(key, expiry);
    } catch (error) {
      console.error("Increment usage error:", error);
    }
  }

  /**
   * Reset usage for a user
   */
  async resetUsage(userId: string): Promise<void> {
    const patterns = [
      this.getKey(userId, "messages", "hourly"),
      this.getKey(userId, "messages", "daily"),
      this.getKey(userId, "uploads", "daily"),
      this.getKey(userId, "projects", "monthly"),
      this.getKey(userId, "concurrent", "current"),
    ];

    try {
      for (const key of patterns) {
        await kv.del(key);
      }
    } catch (error) {
      console.error("Reset usage error:", error);
    }
  }

  /**
   * Get current usage statistics
   */
  async getUsage(
    userId: string,
    tier: SubscriptionTier,
    type: "messages" | "uploads" | "projects" = "messages",
    period: "hourly" | "daily" | "monthly" = "hourly"
  ): Promise<UsageStats> {
    const key = this.getKey(userId, type, period);
    const now = Date.now();
    const windowStart = now - this.getWindowSize(period) * 1000;

    try {
      // Remove old entries
      await kv.zremrangebyscore(key, 0, windowStart);

      // Count current usage
      const current = await kv.zcount(key, windowStart, now);

      // Get limit for tier
      const limit = this.getLimit(tier, type, period);

      // Calculate reset time
      const resetAt = new Date(now + this.getWindowSize(period) * 1000);

      // Calculate percentage
      const percentage = limit > 0 ? (current / limit) * 100 : 0;

      return {
        current,
        limit,
        resetAt,
        percentage,
      };
    } catch (error) {
      console.error("Get usage error:", error);
      return {
        current: 0,
        limit: this.getLimit(tier, type, period),
        resetAt: new Date(now + this.getWindowSize(period) * 1000),
        percentage: 0,
      };
    }
  }

  /**
   * Check if user should receive a warning
   */
  async shouldWarn(
    userId: string,
    tier: SubscriptionTier,
    type: "messages" | "uploads" | "projects" = "messages",
    period: "hourly" | "daily" | "monthly" = "hourly"
  ): Promise<{ warn: boolean; critical: boolean; percentage: number }> {
    const usage = await this.getUsage(userId, tier, type, period);

    return {
      warn: usage.percentage >= this.WARNING_THRESHOLD * 100,
      critical: usage.percentage >= this.CRITICAL_THRESHOLD * 100,
      percentage: usage.percentage,
    };
  }

  /**
   * Track concurrent sessions
   */
  async trackConcurrent(
    userId: string,
    sessionId: string,
    action: "add" | "remove"
  ): Promise<number> {
    const key = this.getKey(userId, "concurrent", "current");

    try {
      if (action === "add") {
        await kv.sadd(key, sessionId);
        await kv.expire(key, 86400); // 24 hours
      } else {
        await kv.srem(key, sessionId);
      }

      const count = await kv.scard(key);
      return count || 0;
    } catch (error) {
      console.error("Track concurrent error:", error);
      return 0;
    }
  }

  // Private helper methods

  private getKey(
    userId: string,
    type: string,
    period: string
  ): string {
    return `ratelimit:${userId}:${type}:${period}`;
  }

  private getWindowSize(period: "hourly" | "daily" | "monthly"): number {
    switch (period) {
      case "hourly":
        return 3600; // 1 hour
      case "daily":
        return 86400; // 24 hours
      case "monthly":
        return 2592000; // 30 days
      default:
        return 3600;
    }
  }

  private getExpiry(period: "hourly" | "daily" | "monthly"): number {
    // Set expiry to 2x the window size to ensure cleanup
    return this.getWindowSize(period) * 2;
  }

  private getLimit(
    tier: SubscriptionTier,
    type: "messages" | "uploads" | "projects",
    period: "hourly" | "daily" | "monthly"
  ): number {
    const limits = TIER_LIMITS[tier];

    if (type === "messages") {
      return period === "hourly" ? limits.messagesPerHour : limits.messagesPerDay;
    } else if (type === "uploads") {
      return limits.uploadsPerDay;
    } else if (type === "projects") {
      return limits.projectsPerMonth;
    }

    return 0;
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

export * from "./types";
