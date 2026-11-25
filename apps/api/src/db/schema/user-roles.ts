import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { users } from './users.ts';

export const userRoles = pgTable(
  'user_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.role] })],
);
