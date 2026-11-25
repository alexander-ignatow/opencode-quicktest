import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./db/client.ts', () => ({ db: {} }));

import { app } from './server.ts';

describe('GET /api/version', () => {
  it('responds with the API name and a semantic version', async () => {
    const response = await request(app).get('/api/version');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      name: 'api',
      version: expect.stringMatching(/^\d+\.\d+\.\d+/),
    });
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
});
