import { prefetchQuery, peekQuery, invalidateQuery, getCached } from './queryCache';

describe('queryCache', () => {
  beforeEach(() => {
    invalidateQuery();
  });

  test('prefetchQuery stores data and returns it', async () => {
    const result = await prefetchQuery('k1', async () => 42);
    expect(result).toBe(42);
    expect(peekQuery('k1').data).toBe(42);
    expect(peekQuery('k1').isStale).toBe(false);
  });

  test('concurrent callers share one fetch (in-flight dedup)', async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      await new Promise(r => setTimeout(r, 20));
      return 'v';
    };
    const [a, b] = await Promise.all([
      prefetchQuery('k2', fetcher),
      prefetchQuery('k2', fetcher),
    ]);
    expect(calls).toBe(1);
    expect(a).toBe('v');
    expect(b).toBe('v');
  });

  test('fresh entries skip the fetcher entirely', async () => {
    let calls = 0;
    await prefetchQuery('k3', async () => { calls += 1; return 1; });
    const again = await prefetchQuery('k3', async () => { calls += 1; return 2; });
    expect(calls).toBe(1);
    expect(again).toBe(1);
  });

  test('invalidateQuery removes the entry', async () => {
    await prefetchQuery('k4', async () => 'x');
    invalidateQuery('k4');
    expect(getCached('k4')).toBeUndefined();
    expect(peekQuery('k4')).toBeNull();
  });
});
