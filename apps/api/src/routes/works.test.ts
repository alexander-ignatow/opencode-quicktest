import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }));

vi.mock('../db/client.ts', () => ({ db: { select: selectMock } }));

import { app } from '../server.ts';

/**
 * Drizzle builds its queries as a chain of methods ending in a thenable.
 * The route awaits the chain, so the mock only needs to return the rows.
 */
function queryResult(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const method of ['from', 'innerJoin', 'where', 'orderBy', 'groupBy']) {
    chain[method] = () => chain;
  }
  chain.then = (
    onFulfilled: (value: unknown[]) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(rows).then(onFulfilled, onRejected);
  return chain;
}

beforeEach(() => {
  selectMock.mockReset();
});

describe('GET /api/works', () => {
  it('responds with every work, its authors, genres and edition count', async () => {
    selectMock
      .mockReturnValueOnce(
        queryResult([
          { id: 'w1', slug: 'solaris', title: 'Solaris', year: 1961 },
          { id: 'w2', slug: 'the-invincible', title: 'The Invincible', year: 1964 },
        ]),
      )
      .mockReturnValueOnce(
        queryResult([
          { workId: 'w1', slug: 'stanislaw-lem', name: 'Stanisław Lem' },
          { workId: 'w2', slug: 'stanislaw-lem', name: 'Stanisław Lem' },
          { workId: 'w2', slug: 'another-author', name: 'Another Author' },
        ]),
      )
      .mockReturnValueOnce(
        queryResult([{ workId: 'w1', key: 'science-fiction', name: 'Science fiction' }]),
      )
      .mockReturnValueOnce(queryResult([{ workId: 'w1', editionCount: 4 }]));

    const response = await request(app).get('/api/works');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual([
      {
        slug: 'solaris',
        title: 'Solaris',
        year: 1961,
        authors: [{ slug: 'stanislaw-lem', name: 'Stanisław Lem' }],
        genres: [{ key: 'science-fiction', name: 'Science fiction' }],
        editionCount: 4,
      },
      {
        slug: 'the-invincible',
        title: 'The Invincible',
        year: 1964,
        authors: [
          { slug: 'stanislaw-lem', name: 'Stanisław Lem' },
          { slug: 'another-author', name: 'Another Author' },
        ],
        genres: [],
        editionCount: 0,
      },
    ]);
  });

  it('responds with an empty array when the catalog has no works', async () => {
    selectMock.mockReturnValueOnce(queryResult([]));

    const response = await request(app).get('/api/works');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(selectMock).toHaveBeenCalledTimes(1);
  });

  it('answers with a JSON 500 when the query fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    selectMock.mockImplementationOnce(() => {
      throw new Error('database is down');
    });

    const response = await request(app).get('/api/works');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL', message: 'Something went wrong' },
    });
    expect(response.text).not.toContain('database is down');
    consoleError.mockRestore();
  });
});
