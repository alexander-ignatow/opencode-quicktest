import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { creditRoles } from './credit-roles.ts';
import { people } from './people.ts';
import { works } from './works.ts';

export const workCredits = pgTable(
  'work_credits',
  {
    workId: text('work_id')
      .notNull()
      .references(() => works.id),
    personId: text('person_id')
      .notNull()
      .references(() => people.id),
    roleId: text('role_id')
      .notNull()
      .references(() => creditRoles.id),
  },
  (table) => [primaryKey({ columns: [table.workId, table.personId, table.roleId] })],
);
