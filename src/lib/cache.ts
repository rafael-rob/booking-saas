import { Redis } from '@upstash/redis';

import { env, features } from '@/lib/env';
import { logError } from '@/lib/errors';

// Cache configuration
const CACHE_CONFIG = {
  // Default TTL in seconds
  defaultTTL: 5 * 60, // 5 minutes
  
  // TTL for different data types
  ttl: {
    user: 15 * 60, // 15 minutes
    services: 10 * 60, // 10 minutes
    bookings: 2 * 60, // 2 minutes (frequently changing)
    availability: 5 * 60, // 5 minutes
    stats: 30 * 60, // 30 minutes
    dashboard: 5 * 60, // 5 minutes
    search: 10 * 60, // 10 minutes
  },
  
  // Key prefixes
  prefixes: {
    user: 'user:',
    services: 'services:',
    bookings: 'bookings:',
    availability: 'availability:',
    stats: 'stats:',
    dashboard: 'dashboard:',
    search: 'search:',
    lock: 'lock:',
  },
} as const;

// Redis client initialization
const redis = features.rateLimit && env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Fallback in-memory cache for development
const memoryCache = new Map<string, { value: any; expires: number }>();

// Cache interface
export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string | string[]): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  getMany<T>(keys: string[]): Promise<(T | null)[]>;
  setMany<T>(pairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  flush(): Promise<void>;
  lock(key: string, ttl?: number): Promise<boolean>;
  unlock(key: string): Promise<void>;
}

// Redis-based cache implementation
class RedisCacheManager implements CacheManager {
  constructor(private client: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.client.get<T>(key);
      return result;
    } catch (error) {
      logError(error as Error, { operation: 'cache.get', key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.defaultTTL): Promise<void> {
    try {
      if (ttl > 0) {
        await this.client.set(key, value, { ex: ttl });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logError(error as Error, { operation: 'cache.set', key, ttl });
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        if (key.length > 0) {
          await this.client.del(...key);
        }
      } else {
        await this.client.del(key);
      }
    } catch (error) {
      logError(error as Error, { operation: 'cache.del', key });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logError(error as Error, { operation: 'cache.exists', key });
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      logError(error as Error, { operation: 'cache.expire', key, ttl });
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      const pipeline = this.client.pipeline();
      keys.forEach(key => pipeline.get<T>(key));
      const results = await pipeline.exec();
      return results;
    } catch (error) {
      logError(error as Error, { operation: 'cache.getMany', keys: keys.length });
      return keys.map(() => null);
    }
  }

  async setMany<T>(pairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      if (pairs.length === 0) return;
      const pipeline = this.client.pipeline();
      pairs.forEach(({ key, value, ttl }) => {
        if (ttl && ttl > 0) {
          pipeline.set(key, value, { ex: ttl });
        } else {
          pipeline.set(key, value, { ex: CACHE_CONFIG.defaultTTL });
        }
      });
      await pipeline.exec();
    } catch (error) {
      logError(error as Error, { operation: 'cache.setMany', count: pairs.length });
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      logError(error as Error, { operation: 'cache.flush' });
    }
  }

  async lock(key: string, ttl: number = 30): Promise<boolean> {
    try {
      const lockKey = CACHE_CONFIG.prefixes.lock + key;
      const result = await this.client.set(lockKey, '1', { nx: true, ex: ttl });
      return result === 'OK';
    } catch (error) {
      logError(error as Error, { operation: 'cache.lock', key, ttl });
      return false;
    }
  }

  async unlock(key: string): Promise<void> {
    try {
      const lockKey = CACHE_CONFIG.prefixes.lock + key;
      await this.client.del(lockKey);
    } catch (error) {
      logError(error as Error, { operation: 'cache.unlock', key });
    }
  }
}

// Memory-based fallback cache implementation
class MemoryCacheManager implements CacheManager {
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      memoryCache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.defaultTTL): Promise<void> {
    const expires = Date.now() + (ttl * 1000);
    memoryCache.set(key, { value, expires });
  }

  async del(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      key.forEach(k => memoryCache.delete(k));
    } else {
      memoryCache.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    const entry = memoryCache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expires) {
      memoryCache.delete(key);
      return false;
    }
    
    return true;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = memoryCache.get(key);
    if (entry) {
      entry.expires = Date.now() + (ttl * 1000);
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async setMany<T>(pairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    pairs.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl);
    });
  }

  async flush(): Promise<void> {
    memoryCache.clear();
  }

  async lock(key: string, ttl: number = 30): Promise<boolean> {
    const lockKey = CACHE_CONFIG.prefixes.lock + key;
    const exists = await this.exists(lockKey);
    if (exists) return false;
    
    await this.set(lockKey, '1', ttl);
    return true;
  }

  async unlock(key: string): Promise<void> {
    const lockKey = CACHE_CONFIG.prefixes.lock + key;
    await this.del(lockKey);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if (now > entry.expires) {
        memoryCache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Cache manager instance
export const cache: CacheManager = redis 
  ? new RedisCacheManager(redis)
  : new MemoryCacheManager();

// Cache key builders
export const cacheKeys = {
  user: (userId: string) => `${CACHE_CONFIG.prefixes.user}${userId}`,
  userServices: (userId: string, filters?: string) => 
    `${CACHE_CONFIG.prefixes.services}user:${userId}${filters ? `:${filters}` : ''}`,
  service: (serviceId: string) => `${CACHE_CONFIG.prefixes.services}${serviceId}`,
  serviceStats: (serviceId: string) => `${CACHE_CONFIG.prefixes.stats}service:${serviceId}`,
  userBookings: (userId: string, filters?: string) => 
    `${CACHE_CONFIG.prefixes.bookings}user:${userId}${filters ? `:${filters}` : ''}`,
  booking: (bookingId: string) => `${CACHE_CONFIG.prefixes.bookings}${bookingId}`,
  availability: (userId: string, date: string) => 
    `${CACHE_CONFIG.prefixes.availability}${userId}:${date}`,
  dashboard: (userId: string, timeframe: string) => 
    `${CACHE_CONFIG.prefixes.dashboard}${userId}:${timeframe}`,
  userStats: (userId: string) => `${CACHE_CONFIG.prefixes.stats}user:${userId}`,
  search: (userId: string, query: string, filters?: string) => 
    `${CACHE_CONFIG.prefixes.search}${userId}:${Buffer.from(query).toString('base64')}${filters ? `:${filters}` : ''}`,
};

// Cache utilities
export class CacheUtils {
  // Cached function decorator
  static cached<Args extends any[], Return>(
    keyGenerator: (...args: Args) => string,
    ttl?: number
  ) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) {
      const method = descriptor.value;
      
      descriptor.value = async function (...args: Args): Promise<Return> {
        const cacheKey = keyGenerator(...args);
        
        // Try to get from cache first
        const cached = await cache.get<Return>(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        // Execute the original method
        const result = await method.apply(this, args);
        
        // Cache the result
        await cache.set(cacheKey, result, ttl);
        
        return result;
      };
    };
  }

  // Cache invalidation patterns
  static async invalidatePattern(pattern: string): Promise<void> {
    if (redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await cache.del(keys);
        }
      } catch (error) {
        logError(error as Error, { operation: 'cache.invalidatePattern', pattern });
      }
    } else {
      // For memory cache, we need to iterate through all keys
      const keysToDelete: string[] = [];
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          keysToDelete.push(key);
        }
      }
      await cache.del(keysToDelete);
    }
  }

  // Warm up cache with common queries
  static async warmUpUserCache(userId: string): Promise<void> {
    // This would typically be called after user login
    // to pre-populate frequently accessed data
    const lockKey = `warmup:${userId}`;
    
    if (!(await cache.lock(lockKey, 300))) { // 5 minute lock
      return; // Another process is already warming up
    }

    try {
      // Pre-cache user's active services, upcoming bookings, etc.
      // Implementation would depend on your specific use cases
    } finally {
      await cache.unlock(lockKey);
    }
  }

  // Cache health check
  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    const start = Date.now();
    const testKey = 'health:check';
    const testValue = Date.now().toString();
    
    try {
      await cache.set(testKey, testValue, 10);
      const retrieved = await cache.get(testKey);
      await cache.del(testKey);
      
      if (retrieved === testValue) {
        return { status: 'healthy', latency: Date.now() - start };
      }
      
      return { status: 'unhealthy' };
    } catch (error) {
      logError(error as Error, { operation: 'cache.healthCheck' });
      return { status: 'unhealthy' };
    }
  }
}

// Export cache configuration for reference
export { CACHE_CONFIG };

// Cleanup function for graceful shutdown
export function shutdownCache(): void {
  if (cache instanceof MemoryCacheManager) {
    (cache as any).destroy();
  }
}