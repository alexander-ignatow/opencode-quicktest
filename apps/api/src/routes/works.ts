import { Router } from 'express';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import {
  creditRoles,
  editionWorks,
  genres,
  people,
  workCredits,
  workGenres,
  works,
} from '../db/schema/index.ts';

interface AuthorRef {
  slug: string;
  name: string;
}

interface GenreRef {
  key: string;
  name: string;
}

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
      .orderBy(sql`lower(${works.title}) collate "C"`, works.slug);

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
      .where(and(inArray(workCredits.workId, workIds), eq(creditRoles.level, 'work')))
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
