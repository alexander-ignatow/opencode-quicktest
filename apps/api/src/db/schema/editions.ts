import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const editions = pgTable('editions', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  publisher: text('publisher'),
  year: integer('year').notNull(),
  language: text('language').notNull(),
  isbn: text('isbn'),
});
