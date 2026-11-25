import { useState } from 'react';

interface CoverProps {
  isbn?: string;
  title: string;
}

function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** A cover is never stored: it is built from the ISBN, or replaced by a placeholder. */
export default function Cover({ isbn, title }: CoverProps) {
  const [failedIsbn, setFailedIsbn] = useState<string | null>(null);
  const showPlaceholder = !isbn || failedIsbn === isbn;

  if (showPlaceholder) {
    return (
      <div
        role="img"
        aria-label={`No cover for ${title}`}
        className="flex h-32 w-20 shrink-0 items-center justify-center rounded border border-slate-300 bg-slate-100 text-sm font-semibold text-slate-500"
      >
        {initials(title)}
      </div>
    );
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`}
      alt={`Cover of ${title}`}
      onError={() => setFailedIsbn(isbn)}
      className="h-32 w-20 shrink-0 rounded border border-slate-200 object-cover"
    />
  );
}
