import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchWork } from '../api/works.ts';
import Cover from '../components/Cover.tsx';
import GenreList from '../components/GenreList.tsx';
import { useResource } from '../hooks/useResource.ts';

export default function WorkPage() {
  const { slug } = useParams<{ slug: string }>();
  const load = useCallback((signal: AbortSignal) => fetchWork(slug ?? '', signal), [slug]);
  const { state, retry } = useResource(load);

  return (
    <section aria-labelledby="work-heading">
      {state.status === 'loading' && (
        <p role="status" className="mt-6 text-slate-600">
          Loading work…
        </p>
      )}

      {state.status === 'error' && state.code === 'NOT_FOUND' && (
        <>
          <h1 id="work-heading" className="text-3xl font-bold">
            Work not found
          </h1>
          <p className="mt-4 text-slate-600">
            This work is not in the catalog.{' '}
            <Link to="/" className="text-indigo-700 hover:underline">
              Back to the catalog
            </Link>
            .
          </p>
        </>
      )}

      {state.status === 'error' && state.code !== 'NOT_FOUND' && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Could not load the work.</p>
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

      {state.status === 'success' && (
        <>
          <h1 id="work-heading" className="text-3xl font-bold">
            {state.data.title}
            {state.data.originalTitle && ' '}
            {state.data.originalTitle && (
              <span className="ml-2 text-xl font-normal text-slate-500">
                ({state.data.originalTitle})
              </span>
            )}
          </h1>

          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-slate-700">
            <dt className="font-semibold">Year</dt>
            <dd>{state.data.year}</dd>
            <dt className="font-semibold">Original language</dt>
            <dd>{state.data.originalLanguage}</dd>
          </dl>

          <GenreList title={state.data.title} genres={state.data.genres} />

          {state.data.synopsis && (
            <section aria-labelledby="synopsis-heading" className="mt-6">
              <h2 id="synopsis-heading" className="text-xl font-semibold">
                Synopsis
              </h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{state.data.synopsis}</p>
            </section>
          )}

          <section aria-labelledby="authors-heading" className="mt-6">
            <h2 id="authors-heading" className="text-xl font-semibold">
              Authors
            </h2>
            <ul aria-label="Authors" className="mt-2 flex flex-wrap gap-x-2">
              {state.data.authors.map((author, index) => (
                <li key={author.slug}>
                  {index > 0 && ', '}
                  <Link to={`/people/${author.slug}`} className="text-indigo-700 hover:underline">
                    {author.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="editions-heading" className="mt-8">
            <h2 id="editions-heading" className="text-xl font-semibold">
              Editions
            </h2>
            {state.data.editions.length === 0 ? (
              <p className="mt-2 text-slate-600">No editions contain this work yet.</p>
            ) : (
              <ul aria-label="Editions" className="mt-4 space-y-4">
                {state.data.editions.map((edition) => (
                  <li
                    key={edition.slug}
                    className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <Cover isbn={edition.isbn} title={edition.title} />
                    <div>
                      <h3 className="text-lg font-semibold">
                        <Link
                          to={`/editions/${edition.slug}`}
                          className="text-indigo-700 hover:underline"
                        >
                          {edition.title}
                        </Link>
                      </h3>
                      <p className="mt-1 flex flex-wrap gap-x-3 text-slate-700">
                        {edition.publisher && <span>{edition.publisher}</span>}
                        <span>{edition.year}</span>
                        <span>{edition.language}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
