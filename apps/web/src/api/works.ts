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
