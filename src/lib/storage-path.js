const UNSAFE_STORAGE_SEGMENT_RE = /[\x00-\x1F\x7F\\]/;
const MAX_STORAGE_PATH_LENGTH = 240;
const MAX_STORAGE_PATH_SEGMENT_LENGTH = 120;

export const isSafeStoragePath = (path) => {
  if (typeof path !== 'string' || !path || path.length > MAX_STORAGE_PATH_LENGTH) {
    return false;
  }

  return path.split('/').every((segment) =>
    segment &&
    segment.length <= MAX_STORAGE_PATH_SEGMENT_LENGTH &&
    segment !== '.' &&
    segment !== '..' &&
    !UNSAFE_STORAGE_SEGMENT_RE.test(segment)
  );
};
