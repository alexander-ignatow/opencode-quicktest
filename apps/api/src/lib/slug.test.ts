import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slug.ts';

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('Klara and the Sun', 'work')).toBe('klara-and-the-sun');
  });

  it('keeps digits and turns punctuation runs into one hyphen', () => {
    expect(slugify('2001: A Space Odyssey', 'work')).toBe('2001-a-space-odyssey');
    expect(slugify('R.U.R.', 'work')).toBe('r-u-r');
  });

  it('keeps Unicode letters, including Cyrillic', () => {
    expect(slugify('Ганна Лелів', 'person')).toBe('ганна-лелів');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  —Hello,   World!— ', 'work')).toBe('hello-world');
  });

  it('falls back when nothing is left', () => {
    expect(slugify('!!!', 'edition')).toBe('edition');
    expect(slugify('', 'person')).toBe('person');
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when it is free', () => {
    expect(uniqueSlug('Solaris', 'work', new Set())).toBe('solaris');
  });

  it('appends the first free numeric suffix', () => {
    expect(uniqueSlug('Solaris', 'work', new Set(['solaris']))).toBe('solaris-2');
    expect(uniqueSlug('Solaris', 'work', new Set(['solaris', 'solaris-2']))).toBe('solaris-3');
  });

  it('avoids the reserved edition slug "new"', () => {
    expect(uniqueSlug('New', 'edition', new Set(['new']))).toBe('new-2');
  });
});
