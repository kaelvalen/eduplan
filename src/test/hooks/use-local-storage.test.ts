import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Shared store for localStorage mock
let store: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { store = {}; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useLocalStorage', () => {
  beforeEach(() => {
    store = {};
    // Reset all mock call counts and any mockReturnValue overrides
    localStorageMock.getItem.mockReset().mockImplementation((key: string) => store[key] ?? null);
    localStorageMock.setItem.mockReset().mockImplementation((key: string, value: string) => { store[key] = value; });
    localStorageMock.removeItem.mockReset().mockImplementation((key: string) => { delete store[key]; });
    localStorageMock.clear.mockReset().mockImplementation(() => { store = {}; });
  });

  it('should return initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should read stored value from localStorage on mount', async () => {
    store['test-key'] = JSON.stringify('stored');

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    // After mount effect runs
    await vi.waitFor(() => {
      expect(result.current[0]).toBe('stored');
    });
  });

  it('should set value and persist to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'));
  });

  it('should accept function updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', JSON.stringify(1));
  });

  it('should remove value from localStorage', async () => {
    store['test-key'] = JSON.stringify('to-remove');

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    await vi.waitFor(() => {
      expect(result.current[0]).toBe('to-remove');
    });

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe('default');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('should work with object values', () => {
    const initial = { theme: 'dark', lang: 'tr' };
    const { result } = renderHook(() => useLocalStorage('settings', initial));

    act(() => {
      result.current[1]({ theme: 'light', lang: 'en' });
    });

    expect(result.current[0]).toEqual({ theme: 'light', lang: 'en' });
  });

  it('should work with array values', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('items', []));

    act(() => {
      result.current[1](['a', 'b', 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('should handle localStorage errors gracefully on read', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    // Should still return initial value on error
    expect(result.current[0]).toBe('fallback');
    warnSpy.mockRestore();
  });

  it('should handle localStorage errors gracefully on write', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage full');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('should-not-crash');
    });

    // State updates even if localStorage fails
    expect(result.current[0]).toBe('should-not-crash');
    warnSpy.mockRestore();
  });
});
