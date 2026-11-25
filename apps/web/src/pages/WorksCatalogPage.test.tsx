import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import WorksCatalogPage from './WorksCatalogPage.tsx';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const solaris = {
  slug: 'solaris',
  title: 'Solaris',
  year: 1961,
  authors: [{ slug: 'stanislaw-lem', name: 'Stanisław Lem' }],
  genres: [{ key: 'science-fiction', name: 'Science fiction' }],
  editionCount: 4,
};

const exhalation = {
  slug: 'exhalation',
  title: 'Exhalation',
  year: 2019,
  authors: [
    { slug: 'ted-chiang', name: 'Ted Chiang' },
    { slug: 'another-author', name: 'Another Author' },
  ],
  genres: [
    { key: 'science-fiction', name: 'Science fiction' },
    { key: 'drama', name: 'Drama' },
  ],
  editionCount: 1,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <WorksCatalogPage />
    </MemoryRouter>,
  );
}

describe('WorksCatalogPage', () => {
  it('shows a loading state while the catalog is requested', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading works…');
  });

  it('shows every work with linked title and authors, year, genres and edition count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([solaris, exhalation])));

    renderPage();

    const solarisLink = await screen.findByRole('link', { name: 'Solaris' });
    expect(solarisLink).toHaveAttribute('href', '/works/solaris');

    expect(screen.getByRole('link', { name: 'Stanisław Lem' })).toHaveAttribute(
      'href',
      '/people/stanislaw-lem',
    );
    expect(screen.getByText('1961')).toBeInTheDocument();
    expect(screen.getAllByText('Science fiction')).toHaveLength(2);
    expect(screen.getByText('4 editions')).toBeInTheDocument();

    // A work with several authors shows all of them.
    expect(screen.getByRole('link', { name: 'Ted Chiang' })).toHaveAttribute(
      'href',
      '/people/ted-chiang',
    );
    expect(screen.getByRole('link', { name: 'Another Author' })).toHaveAttribute(
      'href',
      '/people/another-author',
    );
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('1 edition')).toBeInTheDocument();
  });

  it('shows an explanatory message and no list when the catalog is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    renderPage();

    expect(await screen.findByText('No works in the catalog yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows an error with a retry that requests the catalog again', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse([solaris]));
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the works.');
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByRole('status')).toHaveTextContent('Loading works…');
    expect(await screen.findByRole('link', { name: 'Solaris' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
