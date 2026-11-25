import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text } from 'drizzle-orm/pg-core';

// Fixed dictionary, seeded from data/seed.json. `position` is the array order in
// the seed file and defines the order in which roles are shown (dictionary order).
export const creditRoles = pgTable(
  'credit_roles',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    level: text('level').notNull(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [check('credit_roles_level_check', sql`${table.level} in ('work', 'edition')`)],
);
