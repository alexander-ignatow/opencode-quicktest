import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App.tsx';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('renders the works catalog at the root URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    renderAt('/');

    expect(screen.getByRole('link', { name: 'BookCast' })).toHaveAttribute('href', '/');
    expect(await screen.findByText('No works in the catalog yet.')).toBeInTheDocument();
  });

  it('renders the not-found page with a link back to the catalog for unknown URLs', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
    expect(screen.getByRole('link', { name: 'Back to the catalog' })).toHaveAttribute('href', '/');
  });
});
