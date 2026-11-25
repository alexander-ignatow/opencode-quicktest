import { expect, test } from '@playwright/test';

interface CatalogWork {
  slug: string;
  title: string;
  year: number;
  authors: { slug: string; name: string }[];
  genres: { key: string; name: string }[];
  editionCount: number;
}

// `<`/`>` compare UTF-16 code units, which matches character-code order for
// this catalog and does not depend on a machine locale like localeCompare.
function compareCharacterCodes(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

test('the works catalog lists every work in lowercased title order with its row details', async ({
  page,
  request,
}) => {
  const response = await request.get('/api/works');
  expect(response.ok()).toBe(true);

  const works = (await response.json()) as CatalogWork[];
  expect(works.length).toBeGreaterThan(0);

  // Independent oracle: sorted in the test, not taken from the API order.
  const expected = [...works].sort(
    (a, b) =>
      compareCharacterCodes(a.title.toLowerCase(), b.title.toLowerCase()) ||
      compareCharacterCodes(a.slug, b.slug),
  );

  expect(works.map((work) => work.title)).toEqual(expected.map((work) => work.title));

  await page.goto('/');

  const rows = page.locator('main ul[aria-label="Works"] > li');
  await expect(rows).toHaveCount(expected.length);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    expected.map((work) => work.title),
  );

  for (const [index, work] of expected.entries()) {
    const row = rows.nth(index);

    await expect(row.getByRole('heading', { level: 2 }).getByRole('link')).toHaveAttribute(
      'href',
      `/works/${work.slug}`,
    );
    await expect(row.getByText(String(work.year), { exact: true })).toBeVisible();

    for (const author of work.authors) {
      await expect(row.getByRole('link', { name: author.name, exact: true })).toHaveAttribute(
        'href',
        `/people/${author.slug}`,
      );
    }

    for (const genre of work.genres) {
      await expect(row.getByText(genre.name, { exact: true })).toBeVisible();
    }

    const editionCount = work.editionCount === 1 ? '1 edition' : `${work.editionCount} editions`;
    await expect(row.getByText(editionCount, { exact: true })).toBeVisible();
  }
});
