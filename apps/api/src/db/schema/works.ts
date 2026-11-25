import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const works = pgTable('works', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  originalTitle: text('original_title'),
  year: integer('year').notNull(),
  originalLanguage: text('original_language').notNull(),
  synopsis: text('synopsis'),
});
