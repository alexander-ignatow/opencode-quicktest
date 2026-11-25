import { integer, pgTable, primaryKey, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { editions } from './editions.ts';
import { works } from './works.ts';

export const editionWorks = pgTable(
  'edition_works',
  {
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id),
    workId: text('work_id')
      .notNull()
      .references(() => works.id),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.editionId, table.workId] }),
    uniqueIndex('edition_works_position_unique').on(table.editionId, table.position),
  ],
);
