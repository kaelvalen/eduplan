import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with null copiedText', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copiedText).toBeNull();
  });

  it('should copy text to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean;
    await act(async () => {
      success = await result.current.copy('hello world');
    });

    expect(success!).toBe(true);
    expect(result.current.copiedText).toBe('hello world');
    expect(writeTextMock).toHaveBeenCalledWith('hello world');
  });

  it('should return false when clipboard is not supported', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Remove clipboard
    Object.assign(navigator, { clipboard: undefined });

    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean;
    await act(async () => {
      success = await result.current.copy('test');
    });

    expect(success!).toBe(false);
    expect(result.current.copiedText).toBeNull();
    warnSpy.mockRestore();
  });

  it('should return false when copy fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean;
    await act(async () => {
      success = await result.current.copy('test');
    });

    expect(success!).toBe(false);
    expect(result.current.copiedText).toBeNull();
    warnSpy.mockRestore();
  });

  it('should reset copiedText', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('copied');
    });
    expect(result.current.copiedText).toBe('copied');

    act(() => {
      result.current.reset();
    });
    expect(result.current.copiedText).toBeNull();
  });
});
