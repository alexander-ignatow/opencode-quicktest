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

function workRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'w1',
    slug: 'solaris',
    title: 'Solaris',
    originalTitle: 'Solaris',
    year: 1961,
    originalLanguage: 'pl',
    synopsis: 'A novel about an alien ocean.',
    ...overrides,
  };
}

describe('GET /api/works/:slug', () => {
  it('responds with the work, its authors, genres and editions', async () => {
    selectMock
      .mockReturnValueOnce(queryResult([workRow()]))
      .mockReturnValueOnce(
        queryResult([
          { slug: 'stanislaw-lem', name: 'Stanisław Lem' },
          { slug: 'second-author', name: 'Second Author' },
        ]),
      )
      .mockReturnValueOnce(
        queryResult([{ key: 'science-fiction', name: 'Science fiction' }]),
      )
      .mockReturnValueOnce(
        queryResult([
          {
            slug: 'solaris-1961',
            title: 'Solaris',
            publisher: 'MON',
            year: 1961,
            language: 'pl',
            isbn: '9788301000000',
          },
          {
            slug: 'sol-jar-1',
            title: 'Соляріс',
            publisher: null,
            year: 2017,
            language: 'uk',
            isbn: null,
          },
        ]),
      );

    const response = await request(app).get('/api/works/solaris');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      slug: 'solaris',
      title: 'Solaris',
      originalTitle: 'Solaris',
      year: 1961,
      originalLanguage: 'pl',
      synopsis: 'A novel about an alien ocean.',
      authors: [
        { slug: 'stanislaw-lem', name: 'Stanisław Lem' },
        { slug: 'second-author', name: 'Second Author' },
      ],
      genres: [{ key: 'science-fiction', name: 'Science fiction' }],
      editions: [
        {
          slug: 'solaris-1961',
          title: 'Solaris',
          publisher: 'MON',
          year: 1961,
          language: 'pl',
          isbn: '9788301000000',
        },
        { slug: 'sol-jar-1', title: 'Соляріс', year: 2017, language: 'uk' },
      ],
    });
  });

  it('omits empty optional fields instead of sending null', async () => {
    selectMock
      .mockReturnValueOnce(queryResult([workRow({ originalTitle: null, synopsis: null })]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(
        queryResult([
          {
            slug: 'solaris-1961',
            title: 'Solaris',
            publisher: null,
            year: 1961,
            language: 'pl',
            isbn: null,
          },
        ]),
      );

    const response = await request(app).get('/api/works/solaris');

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('originalTitle');
    expect(response.body).not.toHaveProperty('synopsis');
    expect(response.body.editions[0]).not.toHaveProperty('publisher');
    expect(response.body.editions[0]).not.toHaveProperty('isbn');
  });

  it('responds with an empty editions list when no edition contains the work', async () => {
    selectMock
      .mockReturnValueOnce(queryResult([workRow({ originalTitle: null, synopsis: null })]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]));

    const response = await request(app).get('/api/works/solaris');

    expect(response.status).toBe(200);
    expect(response.body.editions).toEqual([]);
  });

  it('answers with a JSON 404 when the slug is unknown', async () => {
    selectMock.mockReturnValueOnce(queryResult([]));

    const response = await request(app).get('/api/works/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Work not found' },
    });
    expect(selectMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an overlong slug without querying the database', async () => {
    const response = await request(app).get(`/api/works/${'a'.repeat(301)}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: 'VALIDATION_FAILED', message: 'Invalid slug' },
    });
    expect(selectMock).not.toHaveBeenCalled();
  });

  it('answers with a JSON 500 when the query fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    selectMock.mockImplementationOnce(() => {
      throw new Error('database is down');
    });

    const response = await request(app).get('/api/works/solaris');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL', message: 'Something went wrong' },
    });
    expect(response.text).not.toContain('database is down');
    consoleError.mockRestore();
  });
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
