import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { genres } from './genres.ts';
import { works } from './works.ts';

export const workGenres = pgTable(
  'work_genres',
  {
    workId: text('work_id')
      .notNull()
      .references(() => works.id),
    genreId: text('genre_id')
      .notNull()
      .references(() => genres.id),
  },
  (table) => [primaryKey({ columns: [table.workId, table.genreId] })],
);
