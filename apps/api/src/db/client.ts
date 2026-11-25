import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { requireDatabaseUrl } from '../lib/env.ts';
import * as schema from './schema/index.ts';

export const pool = new Pool({ connectionString: requireDatabaseUrl() });

export const db = drizzle(pool, { schema });
