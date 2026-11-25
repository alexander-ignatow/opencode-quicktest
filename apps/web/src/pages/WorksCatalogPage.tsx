import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCatalog } from '../api/works.ts';
import GenreList from '../components/GenreList.tsx';
import { useResource } from '../hooks/useResource.ts';

function editionCountLabel(count: number): string {
  return count === 1 ? '1 edition' : `${count} editions`;
}

export default function WorksCatalogPage() {
  const load = useCallback((signal: AbortSignal) => fetchCatalog(signal), []);
  const { state, retry } = useResource(load);

  return (
    <section aria-labelledby="catalog-heading">
      <h1 id="catalog-heading" className="text-3xl font-bold">
        Works
      </h1>

      {state.status === 'loading' && (
        <p role="status" className="mt-6 text-slate-600">
          Loading works…
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Could not load the works.</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-md bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === 'success' && state.data.length === 0 && (
        <p className="mt-6 text-slate-600">No works in the catalog yet.</p>
      )}

      {state.status === 'success' && state.data.length > 0 && (
        <ul aria-label="Works" className="mt-6 divide-y divide-slate-200">
          {state.data.map((work) => (
            <li key={work.slug} className="py-5">
              <h2 className="text-xl font-semibold">
                <Link to={`/works/${work.slug}`} className="text-indigo-700 hover:underline">
                  {work.title}
                </Link>
              </h2>

              <p className="mt-1 text-slate-700">
                {work.authors.map((author, index) => (
                  <span key={author.slug}>
                    {index > 0 && ', '}
                    <Link to={`/people/${author.slug}`} className="hover:underline">
                      {author.name}
                    </Link>
                  </span>
                ))}
              </p>

              <p className="mt-1 text-sm text-slate-500">{work.year}</p>

              <GenreList title={work.title} genres={work.genres} />

              <p className="mt-2 text-sm text-slate-600">
                {editionCountLabel(work.editionCount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
