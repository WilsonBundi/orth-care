import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis client configuration
 * Used for caching, session storage, and rate limiting
 */
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('⚠️  Redis connection failed after 3 attempts. Running without Redis.');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 1,
  lazyConnect: true, // Don't connect immediately
});

// Try to connect but don't fail if it doesn't work
redis.connect().catch(() => {
  console.warn('⚠️  Redis not available. Running without caching.');
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  // Silently ignore Redis errors in development
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Redis error:', err.message);
  }
});

redis.on('ready', () => {
  console.log('✅ Redis ready');
});

/**
 * Cache service with common operations
 */
export class CacheService {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Store session data
   */
  async setSession(sessionId: string, data: any, ttlSeconds: number = 1800): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, ttlSeconds);
  }

  /**
   * Get session data
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return this.delete(`session:${sessionId}`);
  }

  /**
   * Store user profile in cache
   */
  async setUserProfile(userId: string, profile: any, ttlSeconds: number = 3600): Promise<boolean> {
    return this.set(`user:profile:${userId}`, profile, ttlSeconds);
  }

  /**
   * Get user profile from cache
   */
  async getUserProfile<T>(userId: string): Promise<T | null> {
    return this.get<T>(`user:profile:${userId}`);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<number> {
    return this.deletePattern(`user:*:${userId}`);
  }

  /**
   * Store permissions in cache
   */
  async setPermissions(userId: string, permissions: string[], ttlSeconds: number = 86400): Promise<boolean> {
    return this.set(`user:permissions:${userId}`, permissions, ttlSeconds);
  }

  /**
   * Get permissions from cache
   */
  async getPermissions(userId: string): Promise<string[] | null> {
    return this.get<string[]>(`user:permissions:${userId}`);
  }

  /**
   * Rate limiting: increment counter
   */
  async incrementRateLimit(identifier: string, endpoint: string, windowSeconds: number): Promise<number> {
    const key = `ratelimit:${identifier}:${endpoint}`;
    const count = await this.increment(key);
    
    if (count === 1) {
      // First request in window, set expiration
      await this.expire(key, windowSeconds);
    }
    
    return count;
  }

  /**
   * Rate limiting: get current count
   */
  async getRateLimitCount(identifier: string, endpoint: string): Promise<number> {
    const key = `ratelimit:${identifier}:${endpoint}`;
    const value = await redis.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Rate limiting: block identifier
   */
  async blockIdentifier(identifier: string, durationSeconds: number): Promise<boolean> {
    const key = `blocked:${identifier}`;
    return this.set(key, true, durationSeconds);
  }

  /**
   * Rate limiting: check if blocked
   */
  async isBlocked(identifier: string): Promise<boolean> {
    const key = `blocked:${identifier}`;
    return this.exists(key);
  }

  /**
   * Cache warming: preload frequently accessed data
   */
  async warmCache(userId: string, data: { profile?: any; permissions?: string[] }): Promise<void> {
    const promises: Promise<any>[] = [];
    
    if (data.profile) {
      promises.push(this.setUserProfile(userId, data.profile));
    }
    
    if (data.permissions) {
      promises.push(this.setPermissions(userId, data.permissions));
    }
    
    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await redis.info('stats');
      const keyspace = await redis.info('keyspace');
      
      return {
        info,
        keyspace,
        connected: redis.status === 'ready',
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    try {
      await redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
}

export const cacheService = new CacheService();

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  await redis.quit();
  console.log('Redis connection closed');
}
