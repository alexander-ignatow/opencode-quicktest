import { customAlphabet } from 'nanoid';

// 12 characters, lowercase base36: the internal id shape from docs/architecture/data-model.md.
const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export function newId(): string {
  return generateId();
}
