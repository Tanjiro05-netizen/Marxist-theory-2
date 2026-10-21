import { parseScienceMarkdown } from './scienceMarkdownImporter';

describe('parseScienceMarkdown', () => {
  it('parses a course with modules, lessons, blocks, and inline questions', () => {
    const parsed = parseScienceMarkdown(`# Course: Intro Physics
Subject: Physics
Level: Beginner
Estimated Hours: 2
Outcome: Explain force.

## Module: Forces
Description: Newtonian basics.

### Lesson: Net Force
Summary: Learn F = ma.

:::block type=math
F = ma
:::

:::question type=multiple_choice answer="F = ma" difficulty="beginner"
Which equation is Newton's second law?
- F = ma
- E = mc^2
:::
`);

    expect(parsed.errors).toEqual([]);
    expect(parsed.course.title).toBe('Intro Physics');
    expect(parsed.course.estimatedMinutes).toBe(120);
    expect(parsed.modules).toHaveLength(1);
    expect(parsed.modules[0].lessons).toHaveLength(1);
    expect(parsed.modules[0].lessons[0].blocks).toHaveLength(2);
    expect(parsed.questions[0].correct_answer).toBe('F = ma');
  });

  it('reports missing course and module data', () => {
    const parsed = parseScienceMarkdown('### Lesson: Lonely lesson');

    expect(parsed.errors.some((error) => error.message.includes('Missing'))).toBe(true);
    expect(parsed.errors.some((error) => error.message.includes('before any module'))).toBe(true);
  });
});
