/**
 * Base Service class with common CRUD operations
 * All services should extend this class
 */

import { cache } from '@/lib/cache';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class BaseService<T, _CreateInput, _UpdateInput> {
  protected abstract modelName: string;
  protected abstract cacheKeyPrefix: string;
  protected cacheTTL: number = 300; // 5 minutes default

  /**
   * Get cache key for entity
   */
  protected getCacheKey(id: string | number): string {
    return `${this.cacheKeyPrefix}:${id}`;
  }

  /**
   * Get cache key for list queries
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getListCacheKey(filters?: any): string {
    const filterKey = filters ? JSON.stringify(filters) : 'all';
    return `${this.cacheKeyPrefix}:list:${filterKey}`;
  }

  /**
   * Invalidate cache for entity
   */
  protected invalidateCache(id?: string | number): void {
    if (id) {
      cache.delete(this.getCacheKey(id));
    }
    cache.invalidate(this.cacheKeyPrefix);
  }

  /**
   * Get cached or fetch data
   */
  protected async getCached<R>(
    key: string,
    fetcher: () => Promise<R>,
    ttl?: number
  ): Promise<R> {
    const cached = cache.get<R>(key);
    if (cached) return cached;

    const data = await fetcher();
    cache.set(key, data, ttl || this.cacheTTL);
    return data;
  }
}
