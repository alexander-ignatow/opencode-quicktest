import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let loaded = false;

/**
 * Load the repository root `.env` once. Variables already present in the
 * environment win over the file, so CI and production can set them directly.
 */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  // src/lib/env.ts → ../../../../ is the repository root.
  const envPath = fileURLToPath(new URL('../../../../.env', import.meta.url));
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

export function requireDatabaseUrl(): string {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env in the repository root and fill in the connection string.',
    );
  }
  return url;
}
