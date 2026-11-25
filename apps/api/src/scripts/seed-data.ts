import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { normalizeIsbn } from '../lib/isbn.ts';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_YEAR = CURRENT_YEAR + 1;
const languageCode = z
  .string()
  .regex(/^[a-z]{2}$/, 'must be a two-letter lowercase language code (ISO 639-1)');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value ? value : null));

const personSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    born: z.number().int().min(1000).max(CURRENT_YEAR).nullable(),
    died: z.number().int().min(1000).max(CURRENT_YEAR).nullable(),
    bio: optionalText(2000),
    photoUrl: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .transform((value) => (value ? value : null))
      .refine((value) => value === null || (URL.canParse(value) && /^https?:\/\//.test(value)), {
        message: 'must be an absolute http or https URL',
      }),
  })
  .refine((person) => person.born === null || person.died === null || person.born <= person.died, {
    message: 'born must not be later than died',
    path: ['born'],
  });

const workSchema = z.object({
  title: z.string().trim().min(1).max(300),
  originalTitle: optionalText(300),
  year: z.number().int().min(1000).max(MAX_YEAR),
  originalLanguage: languageCode,
  authors: z.array(z.string().trim().min(1)).min(1),
  genres: z.array(z.string().trim().min(1)).min(1),
  synopsis: optionalText(2000),
});

const editionCreditSchema = z.object({
  person: z.string().trim().min(1),
  role: z.string().trim().min(1),
});

const editionSchema = z.object({
  title: z.string().trim().min(1).max(300),
  publisher: optionalText(200),
  year: z.number().int().min(1000).max(MAX_YEAR),
  language: languageCode,
  isbn: z
    .string()
    .trim()
    .nullable()
    .transform((value, context) => {
      if (!value) return null;
      const normalized = normalizeIsbn(value);
      if (!normalized) {
        context.addIssue({
          code: 'custom',
          message: 'must be a valid ISBN-10 or ISBN-13 with a correct check digit',
        });
        return z.NEVER;
      }
      return normalized;
    }),
  works: z.array(z.string().trim().min(1)).min(1),
  credits: z.array(editionCreditSchema),
});

const seedFileSchema = z.object({
  genres: z
    .array(z.object({ key: z.string().trim().min(1), name: z.string().trim().min(1) }))
    .min(1),
  creditRoles: z
    .array(
      z.object({
        key: z.string().trim().min(1),
        level: z.enum(['work', 'edition']),
        name: z.string().trim().min(1),
      }),
    )
    .min(1),
  people: z.array(personSchema).min(1),
  works: z.array(workSchema).min(1),
  editions: z.array(editionSchema).min(1),
});

export type SeedGenre = z.infer<typeof seedFileSchema>['genres'][number];
export type SeedCreditRole = z.infer<typeof seedFileSchema>['creditRoles'][number];
export type SeedPerson = z.infer<typeof personSchema>;
export type SeedWork = z.infer<typeof workSchema>;
export type SeedEdition = z.infer<typeof editionSchema>;
export type SeedData = z.infer<typeof seedFileSchema>;

export class SeedDataError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid seed data:\n- ${issues.join('\n- ')}`);
    this.name = 'SeedDataError';
    this.issues = issues;
  }
}

export function loadSeedData(filePath: string): SeedData {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new SeedDataError([`cannot read ${filePath}: ${(error as Error).message}`]);
  }

  const parsed = seedFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SeedDataError(
      parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `${path}: ${issue.message}`;
      }),
    );
  }

  const problems = findReferenceProblems(parsed.data);
  if (problems.length > 0) {
    throw new SeedDataError(problems);
  }

  return parsed.data;
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function findReferenceProblems(data: SeedData): string[] {
  const problems: string[] = [];

  for (const [label, values] of [
    ['genres[].key', data.genres.map((genre) => genre.key)],
    ['genres[].name', data.genres.map((genre) => genre.name)],
    ['creditRoles[].key', data.creditRoles.map((role) => role.key)],
    ['people[].name', data.people.map((person) => person.name)],
    ['works[].title', data.works.map((work) => work.title)],
  ] as const) {
    for (const value of duplicates([...values])) {
      problems.push(`${label}: duplicate "${value}"`);
    }
  }

  const genreKeys = new Set(data.genres.map((genre) => genre.key));
  const personNames = new Set(data.people.map((person) => person.name));
  const workTitles = new Set(data.works.map((work) => work.title));
  const roleByKey = new Map(data.creditRoles.map((role) => [role.key, role]));

  const authorRole = roleByKey.get('author');
  if (!authorRole || authorRole.level !== 'work') {
    problems.push('creditRoles: the dictionary needs a work-level "author" role');
  }

  data.works.forEach((work, index) => {
    const label = `works[${index}] "${work.title}"`;
    for (const name of duplicates(work.authors)) {
      problems.push(`${label}: author "${name}" is listed twice`);
    }
    for (const key of duplicates(work.genres)) {
      problems.push(`${label}: genre "${key}" is listed twice`);
    }
    for (const author of work.authors) {
      if (!personNames.has(author)) {
        problems.push(`${label}: unknown author "${author}"`);
      }
    }
    for (const key of work.genres) {
      if (!genreKeys.has(key)) {
        problems.push(`${label}: unknown genre "${key}"`);
      }
    }
  });

  const editionKeys = new Set<string>();
  data.editions.forEach((edition, index) => {
    const label = `editions[${index}] "${edition.title}"`;

    const naturalKey = [edition.title, edition.publisher ?? '', edition.year].join('\u0000');
    if (editionKeys.has(naturalKey)) {
      problems.push(
        `${label}: duplicate edition (same title, publisher and year as an earlier entry)`,
      );
    }
    editionKeys.add(naturalKey);

    for (const title of duplicates(edition.works)) {
      problems.push(`${label}: work "${title}" is listed twice`);
    }
    for (const title of edition.works) {
      if (!workTitles.has(title)) {
        problems.push(`${label}: unknown work "${title}"`);
      }
    }

    const creditKeys = new Set<string>();
    for (const credit of edition.credits) {
      if (!personNames.has(credit.person)) {
        problems.push(`${label}: unknown person "${credit.person}"`);
      }
      const role = roleByKey.get(credit.role);
      if (!role) {
        problems.push(`${label}: unknown credit role "${credit.role}"`);
      } else if (role.level !== 'edition') {
        problems.push(`${label}: role "${credit.role}" is not an edition-level role`);
      }
      const creditKey = `${credit.person}\u0000${credit.role}`;
      if (creditKeys.has(creditKey)) {
        problems.push(`${label}: duplicate credit "${credit.person}" as "${credit.role}"`);
      }
      creditKeys.add(creditKey);
    }
  });

  return problems;
}
