import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';

vi.mock('./db/client.ts', () => ({ db: {} }));

import { notFoundHandler } from './lib/errors.ts';
import { serveFrontend } from './server.ts';

// A fake frontend build: one index.html and one static file.
const distDir = mkdtempSync(path.join(tmpdir(), 'web-dist-'));
writeFileSync(path.join(distDir, 'index.html'), '<!doctype html><title>App</title>');
writeFileSync(path.join(distDir, 'robots.txt'), 'User-agent: *');

afterAll(() => rmSync(distDir, { recursive: true, force: true }));

function createApp() {
  const testApp = express();
  testApp.get('/api/ping', (_request, response) => {
    response.json({ ok: true });
  });
  // Same composition as server.ts: the API 404 handler sits before the frontend.
  testApp.use('/api', notFoundHandler);
  serveFrontend(testApp, distDir);
  return testApp;
}

describe('serveFrontend', () => {
  it('serves index.html at the root', async () => {
    const response = await request(createApp()).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>App</title>');
  });

  it('serves static files from the build folder', async () => {
    const response = await request(createApp()).get('/robots.txt');

    expect(response.status).toBe(200);
    expect(response.text).toBe('User-agent: *');
  });

  it('returns index.html for client-side routes', async () => {
    const response = await request(createApp()).get('/some/page');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>App</title>');
  });

  it('keeps API routes working and unknown API routes as a JSON 404', async () => {
    const app = createApp();

    expect((await request(app).get('/api/ping')).body).toEqual({ ok: true });

    const notFound = await request(app).get('/api/does-not-exist');
    expect(notFound.status).toBe(404);
    expect(notFound.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
});
