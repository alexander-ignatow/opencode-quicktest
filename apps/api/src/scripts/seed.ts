import { fileURLToPath } from 'node:url';
import { db, pool } from '../db/client.ts';
import {
  creditRoles,
  editionCredits,
  editionWorks,
  editions,
  genres,
  people,
  userRoles,
  users,
  workCredits,
  workGenres,
  works,
} from '../db/schema/index.ts';
import { newId } from '../lib/ids.ts';
import { hashPassword } from '../lib/password.ts';
import { uniqueSlug } from '../lib/slug.ts';
import { loadSeedData, type SeedData } from './seed-data.ts';

const seedPath = fileURLToPath(new URL('../../../../data/seed.json', import.meta.url));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function seedCatalog(data: SeedData): Promise<void> {
  await db.transaction(async (tx) => {
    // The seed describes the whole sample catalog, so the catalog tables are
    // emptied first. Users and sessions are kept; the curator is upserted below.
    await tx.delete(editionCredits);
    await tx.delete(workCredits);
    await tx.delete(editionWorks);
    await tx.delete(workGenres);
    await tx.delete(editions);
    await tx.delete(works);
    await tx.delete(people);
    await tx.delete(genres);
    await tx.delete(creditRoles);

    const genreIds = new Map<string, string>();
    await tx.insert(genres).values(
      data.genres.map((genre) => {
        const id = newId();
        genreIds.set(genre.key, id);
        return { id, key: genre.key, name: genre.name };
      }),
    );

    const roleIds = new Map<string, string>();
    await tx.insert(creditRoles).values(
      data.creditRoles.map((role, position) => {
        const id = newId();
        roleIds.set(role.key, id);
        return { id, key: role.key, level: role.level, name: role.name, position };
      }),
    );

    const personIds = new Map<string, string>();
    const personSlugs = new Set<string>();
    await tx.insert(people).values(
      data.people.map((person) => {
        const id = newId();
        const slug = uniqueSlug(person.name, 'person', personSlugs);
        personSlugs.add(slug);
        personIds.set(person.name, id);
        return {
          id,
          slug,
          name: person.name,
          born: person.born,
          died: person.died,
          bio: person.bio,
          photoUrl: person.photoUrl,
        };
      }),
    );

    const workIds = new Map<string, string>();
    const workSlugs = new Set<string>();
    await tx.insert(works).values(
      data.works.map((work) => {
        const id = newId();
        const slug = uniqueSlug(work.title, 'work', workSlugs);
        workSlugs.add(slug);
        workIds.set(work.title, id);
        return {
          id,
          slug,
          title: work.title,
          originalTitle: work.originalTitle,
          year: work.year,
          originalLanguage: work.originalLanguage,
          synopsis: work.synopsis,
        };
      }),
    );

    const authorRoleId = roleIds.get('author');
    if (!authorRoleId) {
      throw new Error('The seed dictionary has no "author" credit role');
    }

    const workGenreRows = data.works.flatMap((work) =>
      work.genres.map((key) => ({
        workId: workIds.get(work.title) as string,
        genreId: genreIds.get(key) as string,
      })),
    );
    if (workGenreRows.length > 0) {
      await tx.insert(workGenres).values(workGenreRows);
    }

    const workCreditRows = data.works.flatMap((work) =>
      work.authors.map((name) => ({
        workId: workIds.get(work.title) as string,
        personId: personIds.get(name) as string,
        roleId: authorRoleId,
      })),
    );
    if (workCreditRows.length > 0) {
      await tx.insert(workCredits).values(workCreditRows);
    }

    // Two editions may share a title, so their ids are kept by position, not by title.
    const editionIdList: string[] = [];
    const editionSlugs = new Set<string>(['new']);
    await tx.insert(editions).values(
      data.editions.map((edition) => {
        const id = newId();
        const slug = uniqueSlug(edition.title, 'edition', editionSlugs);
        editionSlugs.add(slug);
        editionIdList.push(id);
        return {
          id,
          slug,
          title: edition.title,
          publisher: edition.publisher,
          year: edition.year,
          language: edition.language,
          isbn: edition.isbn,
        };
      }),
    );

    const editionWorkRows = data.editions.flatMap((edition, editionIndex) =>
      edition.works.map((title, index) => ({
        editionId: editionIdList[editionIndex],
        workId: workIds.get(title) as string,
        position: index + 1,
      })),
    );
    if (editionWorkRows.length > 0) {
      await tx.insert(editionWorks).values(editionWorkRows);
    }

    const editionCreditRows = data.editions.flatMap((edition, editionIndex) =>
      edition.credits.map((credit) => ({
        editionId: editionIdList[editionIndex],
        personId: personIds.get(credit.person) as string,
        roleId: roleIds.get(credit.role) as string,
      })),
    );
    if (editionCreditRows.length > 0) {
      await tx.insert(editionCredits).values(editionCreditRows);
    }
  });
}

async function seedCurator(): Promise<void> {
  const email = process.env.CURATOR_EMAIL?.trim().toLowerCase();
  const password = process.env.CURATOR_PASSWORD;

  if (!email || !password) {
    console.warn(
      'Skipping the curator account: set CURATOR_EMAIL and CURATOR_PASSWORD in .env to create it.',
    );
    return;
  }
  if (!emailPattern.test(email)) {
    throw new Error(`CURATOR_EMAIL is not a valid email address: ${email}`);
  }

  await db.transaction(async (tx) => {
    const passwordHash = hashPassword(password);
    const [user] = await tx
      .insert(users)
      .values({ id: newId(), email, passwordHash })
      .onConflictDoUpdate({ target: users.email, set: { passwordHash } })
      .returning({ id: users.id });

    await tx
      .insert(userRoles)
      .values({ userId: user.id, role: 'curator' })
      .onConflictDoNothing();
  });

  console.log(`Curator account ready: ${email}`);
}

async function main(): Promise<void> {
  const data = loadSeedData(seedPath);
  console.log(
    `Seeding ${data.genres.length} genres, ${data.creditRoles.length} credit roles, ` +
      `${data.people.length} people, ${data.works.length} works and ${data.editions.length} editions…`,
  );

  await seedCatalog(data);
  await seedCurator();

  const total = await pool.query<{ editions: string; works: string; people: string }>(
    `select
       (select count(*) from editions)::text as editions,
       (select count(*) from works)::text as works,
       (select count(*) from people)::text as people`,
  );

  console.log(
    `Done: ${total.rows[0].works} works, ${total.rows[0].editions} editions, ` +
      `${total.rows[0].people} people.`,
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);

    if (message.includes('does not exist') || message.includes('relation')) {
      console.error('Hint: run `npm run db:migrate` first to create the tables.');
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
