import { Router } from 'express';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.ts';
import {
  creditRoles,
  editions,
  editionWorks,
  genres,
  people,
  workCredits,
  workGenres,
  works,
} from '../db/schema/index.ts';
import { ApiError } from '../lib/errors.ts';

interface AuthorRef {
  slug: string;
  name: string;
}

interface GenreRef {
  key: string;
  name: string;
}

interface EditionRef {
  slug: string;
  title: string;
  publisher?: string;
  year: number;
  language: string;
  isbn?: string;
}

const slugParam = z.string().min(1).max(300);

export const worksRouter = Router();

// Catalog rows for the works page. The order is decided here, not in the browser:
// lowercased title in character-code order, then slug as a tie-breaker.
worksRouter.get('/', async (_request, response, next) => {
  try {
    const workRows = await db
      .select({
        id: works.id,
        slug: works.slug,
        title: works.title,
        year: works.year,
      })
      .from(works)
      .orderBy(sql`lower(${works.title}) collate "C"`, sql`${works.slug} collate "C"`);

    if (workRows.length === 0) {
      response.json([]);
      return;
    }

    const workIds = workRows.map((work) => work.id);

    const authorRows = await db
      .select({
        workId: workCredits.workId,
        slug: people.slug,
        name: people.name,
      })
      .from(workCredits)
      .innerJoin(people, eq(people.id, workCredits.personId))
      .innerJoin(creditRoles, eq(creditRoles.id, workCredits.roleId))
      // Authors are work credits with the `author` role — not every work-level role.
      .where(and(inArray(workCredits.workId, workIds), eq(creditRoles.key, 'author')))
      .orderBy(sql`${people.name} collate "C"`);

    const genreRows = await db
      .select({
        workId: workGenres.workId,
        key: genres.key,
        name: genres.name,
      })
      .from(workGenres)
      .innerJoin(genres, eq(genres.id, workGenres.genreId))
      .where(inArray(workGenres.workId, workIds))
      .orderBy(sql`${genres.name} collate "C"`);

    const countRows = await db
      .select({
        workId: editionWorks.workId,
        editionCount: sql<number>`count(*)::int`,
      })
      .from(editionWorks)
      .where(inArray(editionWorks.workId, workIds))
      .groupBy(editionWorks.workId);

    const authorsByWork = new Map<string, AuthorRef[]>();
    for (const row of authorRows) {
      const authors = authorsByWork.get(row.workId) ?? [];
      authors.push({ slug: row.slug, name: row.name });
      authorsByWork.set(row.workId, authors);
    }

    const genresByWork = new Map<string, GenreRef[]>();
    for (const row of genreRows) {
      const workGenresList = genresByWork.get(row.workId) ?? [];
      workGenresList.push({ key: row.key, name: row.name });
      genresByWork.set(row.workId, workGenresList);
    }

    const editionCounts = new Map<string, number>();
    for (const row of countRows) {
      editionCounts.set(row.workId, row.editionCount);
    }

    response.json(
      workRows.map((work) => ({
        slug: work.slug,
        title: work.title,
        year: work.year,
        authors: authorsByWork.get(work.id) ?? [],
        genres: genresByWork.get(work.id) ?? [],
        editionCount: editionCounts.get(work.id) ?? 0,
      })),
    );
  } catch (error) {
    next(error);
  }
});

// One work page: the work, its authors and genres, and every edition containing it.
// The edition order is decided here — year, then title, then publisher, all in
// character-code order with a missing publisher last.
worksRouter.get('/:slug', async (request, response, next) => {
  try {
    const parsedSlug = slugParam.safeParse(request.params.slug);
    if (!parsedSlug.success) {
      throw new ApiError(400, 'VALIDATION_FAILED', 'Invalid slug');
    }

    const workRows = await db
      .select({
        id: works.id,
        slug: works.slug,
        title: works.title,
        originalTitle: works.originalTitle,
        year: works.year,
        originalLanguage: works.originalLanguage,
        synopsis: works.synopsis,
      })
      .from(works)
      .where(eq(works.slug, parsedSlug.data));

    const work = workRows[0];
    if (!work) {
      throw new ApiError(404, 'NOT_FOUND', 'Work not found');
    }

    const authorRows = await db
      .select({ slug: people.slug, name: people.name })
      .from(workCredits)
      .innerJoin(people, eq(people.id, workCredits.personId))
      .innerJoin(creditRoles, eq(creditRoles.id, workCredits.roleId))
      // Authors are work credits with the `author` role — not every work-level role.
      .where(and(eq(workCredits.workId, work.id), eq(creditRoles.key, 'author')))
      .orderBy(sql`${people.name} collate "C"`);

    const genreRows = await db
      .select({ key: genres.key, name: genres.name })
      .from(workGenres)
      .innerJoin(genres, eq(genres.id, workGenres.genreId))
      .where(eq(workGenres.workId, work.id))
      .orderBy(sql`${genres.name} collate "C"`);

    const editionRows = await db
      .select({
        slug: editions.slug,
        title: editions.title,
        publisher: editions.publisher,
        year: editions.year,
        language: editions.language,
        isbn: editions.isbn,
      })
      .from(editionWorks)
      .innerJoin(editions, eq(editions.id, editionWorks.editionId))
      .where(eq(editionWorks.workId, work.id))
      .orderBy(
        sql`${editions.year} asc`,
        sql`${editions.title} collate "C"`,
        sql`${editions.publisher} collate "C" nulls last`,
      );

    const editionsOfWork: EditionRef[] = editionRows.map((edition) => ({
      slug: edition.slug,
      title: edition.title,
      ...(edition.publisher === null ? {} : { publisher: edition.publisher }),
      year: edition.year,
      language: edition.language,
      ...(edition.isbn === null ? {} : { isbn: edition.isbn }),
    }));

    response.json({
      slug: work.slug,
      title: work.title,
      ...(work.originalTitle === null ? {} : { originalTitle: work.originalTitle }),
      year: work.year,
      originalLanguage: work.originalLanguage,
      ...(work.synopsis === null ? {} : { synopsis: work.synopsis }),
      authors: authorRows.map((author) => ({ slug: author.slug, name: author.name })),
      genres: genreRows.map((genre) => ({ key: genre.key, name: genre.name })),
      editions: editionsOfWork,
    });
  } catch (error) {
    next(error);
  }
});
