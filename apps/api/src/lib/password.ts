import { randomBytes, scryptSync } from 'node:crypto';

// Password hash format: scrypt$<salt in hex>$<hash in hex>. The salt is stored
// with the hash; see docs/architecture/decisions.md ("Authentication").
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}
