import { getJson } from './client.ts';

export interface CatalogAuthor {
  slug: string;
  name: string;
}

export interface CatalogGenre {
  key: string;
  name: string;
}

/** One row of the works catalog, as returned by `GET /api/works`. */
export interface CatalogWork {
  slug: string;
  title: string;
  year: number;
  authors: CatalogAuthor[];
  genres: CatalogGenre[];
  editionCount: number;
}

export function fetchCatalog(signal?: AbortSignal): Promise<CatalogWork[]> {
  return getJson<CatalogWork[]>('/api/works', signal);
}

/** One edition shown in the Editions list of a work page. */
export interface WorkEdition {
  slug: string;
  title: string;
  publisher?: string;
  year: number;
  language: string;
  isbn?: string;
}

/** `GET /api/works/:slug` — one work with its authors, genres and editions. */
export interface WorkDetail {
  slug: string;
  title: string;
  originalTitle?: string;
  year: number;
  originalLanguage: string;
  synopsis?: string;
  authors: CatalogAuthor[];
  genres: CatalogGenre[];
  editions: WorkEdition[];
}

export function fetchWork(slug: string, signal?: AbortSignal): Promise<WorkDetail> {
  return getJson<WorkDetail>(`/api/works/${encodeURIComponent(slug)}`, signal);
}
