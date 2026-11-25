import { expect, test } from '@playwright/test';

interface CatalogWork {
  slug: string;
  title: string;
  authors: { slug: string; name: string }[];
}

test('the works catalog shows every work returned by the API, in API order', async ({
  page,
  request,
}) => {
  const response = await request.get('/api/works');
  expect(response.ok()).toBe(true);

  const works = (await response.json()) as CatalogWork[];
  expect(works.length).toBeGreaterThan(0);

  await page.goto('/');

  const headings = page.getByRole('heading', { level: 2 });
  await expect(headings).toHaveCount(works.length);
  await expect(headings).toHaveText(works.map((work) => work.title));

  for (const work of works) {
    await expect(
      page.getByRole('link', { name: work.title, exact: true }).first(),
    ).toHaveAttribute('href', `/works/${work.slug}`);
  }

  const firstWork = works[0];
  if (firstWork && firstWork.authors[0]) {
    await expect(
      page.getByRole('link', { name: firstWork.authors[0].name, exact: true }).first(),
    ).toHaveAttribute('href', `/people/${firstWork.authors[0].slug}`);
  }
});
