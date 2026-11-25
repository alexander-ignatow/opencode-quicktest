/**
 * Normalize an ISBN-10 or ISBN-13 to digits (`X` for ISBN-10), dropping hyphens
 * and spaces. Returns `null` when the value is not a valid ISBN with a correct
 * check digit. See docs/requirements.md §6.
 */
export function normalizeIsbn(input: string): string | null {
  const value = input.replace(/[-\s]/g, '').toUpperCase();

  if (/^\d{9}[\dX]$/.test(value)) {
    let sum = 0;
    for (let index = 0; index < 9; index += 1) {
      sum += (10 - index) * Number(value[index]);
    }
    sum += value[9] === 'X' ? 10 : Number(value[9]);
    return sum % 11 === 0 ? value : null;
  }

  if (/^\d{13}$/.test(value)) {
    let sum = 0;
    for (let index = 0; index < 12; index += 1) {
      sum += (index % 2 === 0 ? 1 : 3) * Number(value[index]);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === Number(value[12]) ? value : null;
  }

  return null;
}
