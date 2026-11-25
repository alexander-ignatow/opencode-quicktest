import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { creditRoles } from './credit-roles.ts';
import { editions } from './editions.ts';
import { people } from './people.ts';

export const editionCredits = pgTable(
  'edition_credits',
  {
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id),
    personId: text('person_id')
      .notNull()
      .references(() => people.id),
    roleId: text('role_id')
      .notNull()
      .references(() => creditRoles.id),
  },
  (table) => [primaryKey({ columns: [table.editionId, table.personId, table.roleId] })],
);
