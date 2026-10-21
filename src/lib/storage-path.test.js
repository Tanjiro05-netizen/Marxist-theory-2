import { isSafeStoragePath } from './storage-path';

describe('isSafeStoragePath', () => {
  test('accepts generated filenames and safe folder paths', () => {
    expect(isSafeStoragePath('epub-grundrisse-1710000000000.epub')).toBe(true);
    expect(isSafeStoragePath('library/pdf-Grundrisse der Kritik-1710000000000.pdf')).toBe(true);
    expect(isSafeStoragePath('covers/cover (front)-1710000000000.jpg')).toBe(true);
  });

  test('rejects empty paths, traversal segments, and unsafe control characters', () => {
    expect(isSafeStoragePath('')).toBe(false);
    expect(isSafeStoragePath('../secret.pdf')).toBe(false);
    expect(isSafeStoragePath('library/../secret.pdf')).toBe(false);
    expect(isSafeStoragePath('library\\secret.pdf')).toBe(false);
    expect(isSafeStoragePath('library/bad\nname.pdf')).toBe(false);
  });
});
