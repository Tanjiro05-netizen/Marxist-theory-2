import fs from 'fs';
import path from 'path';

const helperPathCandidates = [
  path.join(process.cwd(), 'supabase/functions/_shared/aiProviders.ts'),
  path.join(process.cwd(), '../supabase/functions/_shared/aiProviders.ts'),
];
const helperPath = helperPathCandidates.find((candidate) => fs.existsSync(candidate));

describe('Supabase AI provider helper', () => {
  test('uses the current DeepSeek and Kimi provider defaults in the intended order', () => {
    const helperSource = fs.readFileSync(helperPath, 'utf8');
    const deepSeekIndex = helperSource.indexOf("name: 'DeepSeek'");
    const kimiIndex = helperSource.indexOf("name: 'Kimi'");

    expect(deepSeekIndex).toBeGreaterThanOrEqual(0);
    expect(kimiIndex).toBeGreaterThan(deepSeekIndex);
    expect(helperSource).toContain("model: 'deepseek-v4-pro'");
    expect(helperSource).toContain("baseUrl: 'https://api.deepseek.com'");
    expect(helperSource).toContain("model: 'kimi-k2.6'");
    expect(helperSource).toContain("baseUrl: 'https://api.moonshot.ai/v1'");
    expect(helperSource).not.toContain('qwen-turbo');
    expect(helperSource).not.toContain('moonshot-v1-8k');
  });
});
