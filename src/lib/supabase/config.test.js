describe('Supabase public env config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('accepts the Next public env contract', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const { assertSupabaseConfig } = require('./config.js');

    expect(() => assertSupabaseConfig()).not.toThrow();
  });

  test('rejects missing Next public env values', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { assertSupabaseConfig } = require('./config.js');

    expect(() => assertSupabaseConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
