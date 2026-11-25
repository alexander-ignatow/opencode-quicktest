import { describe, expect, it, vi } from 'vitest';
import { ApiError, getJson } from './client.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('getJson', () => {
  it('returns the parsed body and forwards the abort signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const data = await getJson<{ ok: boolean }>('/api/example', controller.signal);

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/example', { signal: controller.signal });
  });

  it('turns a JSON error body into a typed ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Some fields are invalid',
              fields: { title: 'Required' },
            },
          },
          400,
        ),
      ),
    );

    const error = await getJson('/api/example').then(
      () => {
        throw new Error('Expected the request to fail');
      },
      (caught: unknown) => caught,
    );

    if (!(error instanceof ApiError)) {
      throw new Error('Expected an ApiError');
    }

    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.message).toBe('Some fields are invalid');
    expect(error.fields).toEqual({ title: 'Required' });
  });

  it('falls back to a status message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>Bad gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    const error = await getJson('/api/example').then(
      () => {
        throw new Error('Expected the request to fail');
      },
      (caught: unknown) => caught,
    );

    if (!(error instanceof ApiError)) {
      throw new Error('Expected an ApiError');
    }

    expect(error.status).toBe(502);
    expect(error.code).toBe('UNKNOWN');
    expect(error.message).toBe('Request failed with status 502');
  });
});
