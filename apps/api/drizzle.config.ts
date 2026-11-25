import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit does not read .env itself. Load the repository root .env so that
// `npm run db:migrate` uses DATABASE_URL from the same place as the app.
const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env in the repository root and fill in the connection string.',
  );
}

export default defineConfig({
  schema: fileURLToPath(new URL('./src/db/schema/index.ts', import.meta.url)),
  out: fileURLToPath(new URL('./drizzle', import.meta.url)),
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
