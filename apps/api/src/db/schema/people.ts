import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const people = pgTable('people', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  born: integer('born'),
  died: integer('died'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
});
