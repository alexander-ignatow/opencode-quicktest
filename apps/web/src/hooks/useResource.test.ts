import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client.ts';
import { useResource } from './useResource.ts';

describe('useResource', () => {
  it('starts in loading and exposes the loaded data', async () => {
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string[]>>()
      .mockResolvedValue(['a']);

    const { result } = renderHook(() => useResource(load));

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: ['a'] }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('exposes an error and retries from a visible loading state', async () => {
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string[]>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(['a']);

    const { result } = renderHook(() => useResource(load));

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'error',
        message: 'boom',
        code: 'UNKNOWN',
      }),
    );

    act(() => result.current.retry());

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: ['a'] }));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('exposes an API error code so pages can distinguish not found from a failure', async () => {
    const load = vi.fn<(signal: AbortSignal) => Promise<string[]>>().mockRejectedValue(
      new ApiError(404, 'NOT_FOUND', 'Work not found'),
    );

    const { result } = renderHook(() => useResource(load));

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'error',
        message: 'Work not found',
        code: 'NOT_FOUND',
      }),
    );
  });

  it('aborts the in-flight request on unmount', () => {
    let signal: AbortSignal | undefined;
    const load = vi.fn((nextSignal: AbortSignal) => {
      signal = nextSignal;
      return new Promise<string[]>(() => {});
    });

    const { unmount } = renderHook(() => useResource(load));

    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
