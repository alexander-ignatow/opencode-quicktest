import type { CatalogGenre } from '../api/works.ts';

interface GenreListProps {
  title: string;
  genres: CatalogGenre[];
}

export default function GenreList({ title, genres }: GenreListProps) {
  return (
    <ul aria-label={`Genres of ${title}`} className="mt-2 flex flex-wrap gap-2">
      {genres.map((genre) => (
        <li
          key={genre.key}
          className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs text-slate-700"
        >
          {genre.name}
        </li>
      ))}
    </ul>
  );
}
