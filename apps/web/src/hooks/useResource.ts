import { useCallback, useEffect, useState } from 'react';
import { ApiError, type ApiErrorCode } from '../api/client.ts';

export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; code: ApiErrorCode | 'UNKNOWN' };

export interface Resource<T> {
  state: ResourceState<T>;
  retry: () => void;
}

/**
 * Loads one resource and gives the page its three states. The request is
 * aborted on unmount; retrying starts from a visible loading state.
 * `load` must be stable (wrap it in `useCallback`), otherwise every render
 * would refetch.
 */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>): Resource<T> {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data });
        }
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : 'Unknown error';
        const code = error instanceof ApiError ? error.code : 'UNKNOWN';
        setState({ status: 'error', message, code });
      },
    );

    return () => controller.abort();
  }, [load, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}
