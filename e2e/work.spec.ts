import { expect, test } from '@playwright/test';

interface AuthorRef {
  slug: string;
  name: string;
}

interface GenreRef {
  key: string;
  name: string;
}

interface CatalogWork {
  slug: string;
  title: string;
  year: number;
  authors: AuthorRef[];
  genres: GenreRef[];
  editionCount: number;
}

interface WorkEdition {
  slug: string;
  title: string;
  publisher?: string;
  year: number;
  language: string;
  isbn?: string;
}

interface WorkDetail {
  slug: string;
  title: string;
  originalTitle?: string;
  year: number;
  originalLanguage: string;
  synopsis?: string;
  authors: AuthorRef[];
  genres: GenreRef[];
  editions: WorkEdition[];
}

// `<`/`>` compare UTF-16 code units, matching character-code order without a locale.
function compareCharacterCodes(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// Independent oracle for the work page's edition order: year, title, publisher,
// with an edition that has no publisher last.
function compareEditions(a: WorkEdition, b: WorkEdition): number {
  if (a.year !== b.year) return a.year - b.year;
  const byTitle = compareCharacterCodes(a.title, b.title);
  if (byTitle !== 0) return byTitle;
  if (!a.publisher && !b.publisher) return compareCharacterCodes(a.slug, b.slug);
  if (!a.publisher) return 1;
  if (!b.publisher) return -1;
  return compareCharacterCodes(a.publisher, b.publisher);
}

test('a work page shows its details and every edition from a direct link', async ({
  page,
  request,
}) => {
  const catalogResponse = await request.get('/api/works');
  expect(catalogResponse.ok()).toBe(true);

  const catalog = (await catalogResponse.json()) as CatalogWork[];
  expect(catalog.length).toBeGreaterThan(0);
  const work = catalog.find((item) => item.editionCount > 1) ?? catalog[0];

  const detailResponse = await request.get(`/api/works/${work.slug}`);
  expect(detailResponse.ok()).toBe(true);
  const detail = (await detailResponse.json()) as WorkDetail;

  // The API order is part of the contract, so check it against the test's own comparator.
  const expected = [...detail.editions].sort(compareEditions);
  expect(detail.editions.map((edition) => edition.slug)).toEqual(
    expected.map((edition) => edition.slug),
  );

  await page.goto(`/works/${work.slug}`);

  await expect(page.getByRole('heading', { level: 1 })).toContainText(detail.title);
  await expect(page.locator('dd').first()).toHaveText(String(detail.year));
  await expect(page.locator('dd').last()).toHaveText(detail.originalLanguage);

  if (detail.originalTitle) {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(detail.originalTitle);
  }
  if (detail.synopsis) {
    await expect(page.getByRole('heading', { name: 'Synopsis' })).toBeVisible();
    await expect(page.getByText(detail.synopsis, { exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { name: 'Synopsis' })).toHaveCount(0);
  }

  const genreList = page.getByRole('list', { name: `Genres of ${detail.title}` });
  for (const genre of detail.genres) {
    await expect(genreList.getByText(genre.name, { exact: true })).toBeVisible();
  }
  for (const author of detail.authors) {
    await expect(page.getByRole('link', { name: author.name, exact: true })).toHaveAttribute(
      'href',
      `/people/${author.slug}`,
    );
  }

  const rows = page.locator('main ul[aria-label="Editions"] > li');
  await expect(rows).toHaveCount(expected.length);
  for (const [index, edition] of expected.entries()) {
    const row = rows.nth(index);
    await expect(row.getByRole('link', { name: edition.title, exact: true })).toHaveAttribute(
      'href',
      `/editions/${edition.slug}`,
    );
    if (edition.publisher) {
      await expect(row.getByText(edition.publisher, { exact: true })).toBeVisible();
    }
    await expect(row.getByText(String(edition.year), { exact: true })).toBeVisible();
    await expect(row.getByText(edition.language, { exact: true })).toBeVisible();
  }

  // Every shape in the seed has an edition without an ISBN; its placeholder is deterministic.
  const withoutIsbn = expected.find((edition) => !edition.isbn);
  expect(withoutIsbn).toBeDefined();
  await expect(
    page.getByRole('img', { name: `No cover for ${withoutIsbn?.title}` }),
  ).toBeVisible();
});

test('an unknown work slug shows a not-found page with a link back to the catalog', async ({
  page,
}) => {
  await page.goto('/works/this-work-does-not-exist');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Work not found');
  await expect(page.getByRole('link', { name: 'Back to the catalog' })).toHaveAttribute(
    'href',
    '/',
  );
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
});
