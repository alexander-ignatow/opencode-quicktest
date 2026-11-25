import { pgTable, text } from 'drizzle-orm/pg-core';

// Fixed dictionary, seeded from data/seed.json. Not editable in the MVP.
export const genres = pgTable('genres', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull().unique(),
});
