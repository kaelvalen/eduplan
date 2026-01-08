import { describe, it, expect, beforeEach } from 'vitest';
import { cache } from '@/lib/cache';

describe('Cache', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('should store and retrieve values', () => {
    cache.set('test-key', { data: 'test' });
    const result = cache.get('test-key');
    expect(result).toEqual({ data: 'test' });
  });

  it('should return null for non-existent keys', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should expire values after TTL', async () => {
    cache.set('test-key', 'value', 1); // 1 second TTL
    
    // Should exist immediately
    expect(cache.get('test-key')).toBe('value');
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be expired
    expect(cache.get('test-key')).toBeNull();
  });

  it('should check if key exists', () => {
    cache.set('test-key', 'value');
    expect(cache.has('test-key')).toBe(true);
    expect(cache.has('non-existent')).toBe(false);
  });

  it('should delete specific keys', () => {
    cache.set('test-key', 'value');
    cache.delete('test-key');
    expect(cache.get('test-key')).toBeNull();
  });

  it('should invalidate keys by pattern', () => {
    cache.set('users:all', [1, 2, 3]);
    cache.set('users:1', { id: 1 });
    cache.set('courses:all', [1, 2]);
    
    cache.invalidate('users');
    
    expect(cache.get('users:all')).toBeNull();
    expect(cache.get('users:1')).toBeNull();
    expect(cache.get('courses:all')).toEqual([1, 2]);
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    cache.clear();
    
    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });
});
