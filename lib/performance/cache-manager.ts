// Cache Management Service

import { kv } from "@vercel/kv";

export class CacheManager {
  private readonly DEFAULT_TTL = 3600; // 1 hour

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await kv.get(key);
      return value as T | null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await kv.set(key, value, {
        ex: ttl || this.DEFAULT_TTL,
      });
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await kv.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  /**
   * Cache user subscription
   */
  async cacheUserSubscription(userId: string, subscription: any): Promise<void> {
    await this.set(`subscription:${userId}`, subscription, 1800); // 30 minutes
  }

  /**
   * Get cached user subscription
   */
  async getCachedUserSubscription(userId: string): Promise<any | null> {
    return this.get(`subscription:${userId}`);
  }

  /**
   * Cache model metadata
   */
  async cacheModelMetadata(modelId: string, metadata: any): Promise<void> {
    await this.set(`model:${modelId}`, metadata, 86400); // 24 hours
  }

  /**
   * Get cached model metadata
   */
  async getCachedModelMetadata(modelId: string): Promise<any | null> {
    return this.get(`model:${modelId}`);
  }

  /**
   * Cache theme configuration
   */
  async cacheTheme(themeId: string, theme: any): Promise<void> {
    await this.set(`theme:${themeId}`, theme, 3600); // 1 hour
  }

  /**
   * Get cached theme
   */
  async getCachedTheme(themeId: string): Promise<any | null> {
    return this.get(`theme:${themeId}`);
  }

  /**
   * Cache room data
   */
  async cacheRoom(roomId: string, room: any): Promise<void> {
    await this.set(`room:${roomId}`, room, 300); // 5 minutes
  }

  /**
   * Get cached room
   */
  async getCachedRoom(roomId: string): Promise<any | null> {
    return this.get(`room:${roomId}`);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.delete(`subscription:${userId}`);
    await this.delete(`user:${userId}:stats`);
  }

  /**
   * Invalidate room cache
   */
  async invalidateRoomCache(roomId: string): Promise<void> {
    await this.delete(`room:${roomId}`);
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      await kv.flushdb();
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}
