import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import WorkPage from './WorkPage.tsx';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const work = {
  slug: 'solaris',
  title: 'Solaris',
  originalTitle: 'Соляріс',
  year: 1961,
  originalLanguage: 'pl',
  synopsis: 'A novel about an alien ocean.',
  authors: [
    { slug: 'stanislaw-lem', name: 'Stanisław Lem' },
    { slug: 'second-author', name: 'Second Author' },
  ],
  genres: [
    { key: 'science-fiction', name: 'Science fiction' },
    { key: 'philosophical-fiction', name: 'Philosophical fiction' },
  ],
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
};

function renderPage(path = '/works/solaris') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/works/:slug" element={<WorkPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WorkPage', () => {
  it('shows a loading state while the work is requested', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading work…');
  });

  it('shows the work details, linked authors and every edition with its cover', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(work)));

    renderPage();

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Solaris (Соляріс)',
    );
    expect(screen.getByText('Original language')).toBeInTheDocument();
    expect(screen.getAllByText('1961')[0]).toBeInTheDocument();
    expect(screen.getAllByText('pl')[0]).toBeInTheDocument();

    const genres = screen.getByRole('list', { name: 'Genres of Solaris' });
    expect(genres).toHaveTextContent('Science fiction');
    expect(genres).toHaveTextContent('Philosophical fiction');

    expect(screen.getByRole('heading', { name: 'Synopsis' })).toBeInTheDocument();
    expect(screen.getByText(work.synopsis)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Stanisław Lem' })).toHaveAttribute(
      'href',
      '/people/stanislaw-lem',
    );
    expect(screen.getByRole('link', { name: 'Second Author' })).toHaveAttribute(
      'href',
      '/people/second-author',
    );

    const editions = screen.getByRole('list', { name: 'Editions' });
    expect(editions.children).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Solaris' })).toHaveAttribute(
      'href',
      '/editions/solaris-1961',
    );
    expect(screen.getByRole('link', { name: 'Соляріс' })).toHaveAttribute(
      'href',
      '/editions/sol-jar-1',
    );
    expect(screen.getByText('MON')).toBeInTheDocument();
    expect(screen.getByText('2017')).toBeInTheDocument();
    expect(screen.getByText('uk')).toBeInTheDocument();

    expect(screen.getByRole('img', { name: 'Cover of Solaris' })).toHaveAttribute(
      'src',
      'https://covers.openlibrary.org/b/isbn/9788301000000-M.jpg?default=false',
    );
  });

  it('shows no synopsis heading or original title when they are absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...work,
          originalTitle: undefined,
          synopsis: undefined,
          editions: [],
        }),
      ),
    );

    renderPage();

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Solaris');
    expect(heading).not.toHaveTextContent('Соляріс');
    expect(screen.queryByRole('heading', { name: 'Synopsis' })).not.toBeInTheDocument();
  });

  it('shows a placeholder for an edition without an ISBN', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(work)));

    renderPage();

    expect(
      await screen.findByRole('img', { name: 'No cover for Соляріс' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Cover of Соляріс' })).not.toBeInTheDocument();
  });

  it('swaps to the placeholder when a cover image fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(work)));

    renderPage();

    const image = await screen.findByRole('img', { name: 'Cover of Solaris' });
    fireEvent.error(image);

    expect(screen.getByRole('img', { name: 'No cover for Solaris' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Cover of Solaris' })).not.toBeInTheDocument();
  });

  it('shows an explanatory message when the work has no editions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ...work, editions: [] })));

    renderPage();

    expect(await screen.findByText('No editions contain this work yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Editions' })).not.toBeInTheDocument();
  });

  it('shows an error with a retry that requests the work again', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(work));
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the work.');
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByRole('status')).toHaveTextContent('Loading work…');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Solaris');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows a not-found page for an unknown slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: 'NOT_FOUND', message: 'Work not found' } }, 404),
      ),
    );

    renderPage('/works/does-not-exist');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Work not found');
    expect(screen.getByRole('link', { name: 'Back to the catalog' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
