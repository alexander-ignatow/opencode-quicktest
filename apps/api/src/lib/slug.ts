/**
 * Turn a title or a name into the public slug described in docs/requirements.md §6:
 * lowercase, Unicode letters and digits kept, every other run becomes one hyphen,
 * no leading or trailing hyphen, fallback when nothing is left.
 */
export function slugify(source: string, fallback: string): string {
  const slug = source
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

/**
 * A slug that is not in `taken` yet: the base slug, or the first free `-2`, `-3`, …
 * The caller adds the returned slug to `taken`.
 */
export function uniqueSlug(source: string, fallback: string, taken: Set<string>): string {
  const base = slugify(source, fallback);
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
