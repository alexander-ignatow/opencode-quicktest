import { describe, expect, it } from 'vitest';
import { normalizeIsbn } from './isbn.ts';

describe('normalizeIsbn', () => {
  it('accepts a valid ISBN-13 and returns its digits', () => {
    expect(normalizeIsbn('9780571364879')).toBe('9780571364879');
  });

  it('strips hyphens and spaces', () => {
    expect(normalizeIsbn('978-0-571-36487-9')).toBe('9780571364879');
    expect(normalizeIsbn('0 306 40615 2')).toBe('0306406152');
  });

  it('accepts a valid ISBN-10 with X as the check digit', () => {
    expect(normalizeIsbn('0-9752298-0-X')).toBe('097522980X');
  });

  it('rejects a wrong check digit', () => {
    expect(normalizeIsbn('9780571364878')).toBeNull();
    expect(normalizeIsbn('0306406153')).toBeNull();
  });

  it('rejects a wrong length and letters', () => {
    expect(normalizeIsbn('123')).toBeNull();
    expect(normalizeIsbn('97805713648AB')).toBeNull();
  });
});
