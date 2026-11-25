import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadSeedData, SeedDataError, type SeedData } from './seed-data.ts';

const seedPath = fileURLToPath(new URL('../../../../data/seed.json', import.meta.url));
const baseSeed = JSON.parse(readFileSync(seedPath, 'utf8')) as SeedData;

function expectInvalid(mutate: (data: SeedData) => void, expected: string): void {
  const data = structuredClone(baseSeed);
  mutate(data);

  const directory = mkdtempSync(join(tmpdir(), 'bookcast-seed-'));
  const file = join(directory, 'seed.json');
  writeFileSync(file, JSON.stringify(data));

  try {
    expect(() => loadSeedData(file)).toThrowError(expected);
    expect(() => loadSeedData(file)).toThrow(SeedDataError);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('loadSeedData', () => {
  it('accepts data/seed.json without a validation error', () => {
    const data = loadSeedData(seedPath);

    expect(data.genres).toHaveLength(9);
    expect(data.creditRoles).toHaveLength(9);
    expect(data.people).toHaveLength(31);
    expect(data.works).toHaveLength(23);
    expect(data.editions).toHaveLength(31);
  });

  it('normalizes an ISBN written with hyphens', () => {
    const data = structuredClone(baseSeed);
    data.editions[0].isbn = '978-0-571-36487-9';

    const directory = mkdtempSync(join(tmpdir(), 'bookcast-seed-'));
    const file = join(directory, 'seed.json');
    writeFileSync(file, JSON.stringify(data));

    try {
      expect(loadSeedData(file).editions[0].isbn).toBe('9780571364879');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects an unknown author', () => {
    expectInvalid((data) => {
      data.works[0].authors = ['Nobody At All'];
    }, 'unknown author "Nobody At All"');
  });

  it('rejects an unknown genre', () => {
    expectInvalid((data) => {
      data.works[0].genres = ['unknown-genre'];
    }, 'unknown genre "unknown-genre"');
  });

  it('rejects an edition with a work that is not in the catalog', () => {
    expectInvalid((data) => {
      data.editions[0].works = ['Missing Work'];
    }, 'unknown work "Missing Work"');
  });

  it('rejects a work-level role used as an edition credit', () => {
    expectInvalid((data) => {
      data.editions[0].credits = [{ person: data.people[0].name, role: 'author' }];
    }, 'is not an edition-level role');
  });

  it('rejects an invalid ISBN', () => {
    expectInvalid((data) => {
      data.editions[0].isbn = '9780571364878';
    }, 'valid ISBN-10 or ISBN-13');
  });

  it('rejects duplicate people by name', () => {
    expectInvalid((data) => {
      data.people[1].name = data.people[0].name;
    }, 'people[].name: duplicate');
  });

  it('rejects two editions with the same title, publisher and year', () => {
    expectInvalid((data) => {
      data.editions[1] = structuredClone(data.editions[0]);
    }, 'duplicate edition');
  });

  it('rejects a person credited twice with the same role', () => {
    expectInvalid((data) => {
      data.editions[0].credits = [
        { person: data.people[0].name, role: 'translator' },
        { person: data.people[0].name, role: 'translator' },
      ];
    }, 'duplicate credit');
  });
});
