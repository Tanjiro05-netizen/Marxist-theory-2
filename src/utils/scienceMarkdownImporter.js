export const scienceSlugify = (value) => {
  const slug = `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
};

const parseAttributes = (raw = '') => {
  const attrs = {};
  const pattern = /(\w+)=("[^"]*"|'[^']*'|[^\s]+)/g;
  let match = pattern.exec(raw);

  while (match) {
    const [, key, value] = match;
    attrs[key] = value.replace(/^['"]|['"]$/g, '');
    match = pattern.exec(raw);
  }

  return attrs;
};

const parseMetadataLine = (line) => {
  const match = line.match(/^([A-Za-z][A-Za-z\s]+):\s*(.+)$/);
  if (!match) return null;
  return {
    key: match[1].trim().toLowerCase().replace(/\s+/g, '_'),
    value: match[2].trim(),
  };
};

const defaultCourse = () => ({
  title: '',
  slug: '',
  subtitle: '',
  subjectName: '',
  level: 'beginner',
  estimatedMinutes: null,
  language: 'en',
  description: '',
  outcomes: [],
  prerequisites: [],
});

const createBlockFromRaw = (type, attrs, rawContent, lineNumber) => {
  const content = rawContent.trim();
  const block = {
    block_type: type || 'rich_text',
    title: attrs.title || '',
    content_json: {},
    config_json: { source_line: lineNumber },
  };

  if (block.block_type === 'worked_example') {
    const steps = [];
    let problem = '';
    let answer = '';

    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (/^problem:/i.test(trimmed)) {
        problem = trimmed.replace(/^problem:\s*/i, '');
      } else if (/^answer:/i.test(trimmed)) {
        answer = trimmed.replace(/^answer:\s*/i, '');
      } else if (/^step\s*\d*:/i.test(trimmed)) {
        steps.push(trimmed.replace(/^step\s*\d*:\s*/i, ''));
      } else if (trimmed) {
        steps.push(trimmed);
      }
    });

    block.content_json = { problem, steps, answer, raw: content };
    return block;
  }

  if (block.block_type === 'video') {
    block.content_json = {
      url: attrs.url || content,
      transcript: attrs.transcript || '',
    };
    block.config_json.duration_seconds = attrs.duration ? Number(attrs.duration) : null;
    return block;
  }

  if (block.block_type === 'simulation_embed') {
    block.content_json = {
      url: attrs.url || content,
      caption: attrs.caption || '',
    };
    return block;
  }

  if (block.block_type === 'image') {
    block.content_json = {
      url: attrs.url || content,
      caption: attrs.caption || '',
      alt: attrs.alt || attrs.caption || '',
    };
    return block;
  }

  if (block.block_type === 'callout') {
    block.content_json = {
      body: content,
      variant: attrs.variant || 'intuition',
    };
    return block;
  }

  block.content_json = { body: content };
  return block;
};

const createQuestionFromRaw = (attrs, rawContent, lineNumber) => {
  const lines = rawContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const options = lines
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s*/, ''));
  const prompt = lines.filter((line) => !line.startsWith('- ')).join('\n').trim();
  const questionType = attrs.type || attrs.question_type || 'multiple_choice';

  return {
    question_type: questionType,
    prompt,
    options: questionType === 'multiple_choice' ? options : null,
    correct_answer: attrs.answer || attrs.correct || '',
    tolerance: attrs.tolerance ? Number(attrs.tolerance) : null,
    explanation: attrs.explanation || '',
    hint: attrs.hint || '',
    difficulty: attrs.difficulty || 'beginner',
    tags: attrs.tags ? attrs.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    metadata: { source_line: lineNumber },
  };
};

export const parseScienceMarkdown = (markdown) => {
  const course = defaultCourse();
  const modules = [];
  const questions = [];
  const errors = [];
  const lines = `${markdown || ''}`.replace(/\r\n/g, '\n').split('\n');
  let currentModule = null;
  let currentLesson = null;
  let index = 0;

  const addError = (line, message) => {
    errors.push({ line, message });
  };

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    const lineNumber = index + 1;

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith('# Course:')) {
      course.title = line.replace(/^#\s*Course:\s*/i, '').trim();
      course.slug = scienceSlugify(course.title);
      index += 1;
      continue;
    }

    if (line.startsWith('## Module:')) {
      const title = line.replace(/^##\s*Module:\s*/i, '').trim();
      currentModule = {
        title,
        slug: scienceSlugify(title),
        description: '',
        lessons: [],
      };
      modules.push(currentModule);
      currentLesson = null;
      index += 1;
      continue;
    }

    if (line.startsWith('### Lesson:')) {
      if (!currentModule) {
        addError(lineNumber, 'Lesson declared before any module.');
      }
      const title = line.replace(/^###\s*Lesson:\s*/i, '').trim();
      currentLesson = {
        title,
        slug: scienceSlugify(title),
        summary: '',
        lesson_kind: 'concept',
        estimated_minutes: null,
        blocks: [],
      };
      if (currentModule) currentModule.lessons.push(currentLesson);
      index += 1;
      continue;
    }

    if (line.startsWith(':::block')) {
      if (!currentLesson) {
        addError(lineNumber, 'Block declared before any lesson.');
      }
      const attrs = parseAttributes(line.replace(/^:::block\s*/i, ''));
      const type = attrs.type || 'rich_text';
      const content = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ':::') {
        content.push(lines[index]);
        index += 1;
      }
      if (index >= lines.length) addError(lineNumber, 'Block is missing closing ::: marker.');
      if (currentLesson) currentLesson.blocks.push(createBlockFromRaw(type, attrs, content.join('\n'), lineNumber));
      index += 1;
      continue;
    }

    if (line.startsWith(':::question')) {
      if (!currentLesson) {
        addError(lineNumber, 'Question declared before any lesson.');
      }
      const attrs = parseAttributes(line.replace(/^:::question\s*/i, ''));
      const content = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ':::') {
        content.push(lines[index]);
        index += 1;
      }
      if (index >= lines.length) addError(lineNumber, 'Question is missing closing ::: marker.');
      const question = createQuestionFromRaw(attrs, content.join('\n'), lineNumber);
      questions.push(question);
      if (currentLesson) {
        currentLesson.blocks.push({
          block_type: 'exercise',
          title: attrs.title || 'Check understanding',
          content_json: { inline_question: question },
          config_json: { source_line: lineNumber },
        });
      }
      index += 1;
      continue;
    }

    const metadata = parseMetadataLine(line);
    if (metadata) {
      const { key, value } = metadata;
      if (currentLesson && key === 'summary') {
        currentLesson.summary = value;
      } else if (currentLesson && key === 'kind') {
        currentLesson.lesson_kind = value.toLowerCase();
      } else if (currentLesson && key === 'estimated_minutes') {
        currentLesson.estimated_minutes = Number(value);
      } else if (currentModule && key === 'description') {
        currentModule.description = value;
      } else if (key === 'subject') {
        course.subjectName = value;
      } else if (key === 'level') {
        course.level = value.toLowerCase();
      } else if (key === 'estimated_hours') {
        course.estimatedMinutes = Math.round(Number(value) * 60);
      } else if (key === 'subtitle') {
        course.subtitle = value;
      } else if (key === 'language') {
        course.language = value;
      } else if (key === 'outcome') {
        course.outcomes.push(value);
      } else if (key === 'prerequisite') {
        course.prerequisites.push(value);
      } else if (key === 'description') {
        course.description = value;
      }
      index += 1;
      continue;
    }

    if (!course.description && course.title && !currentModule) {
      course.description = rawLine.trim();
    }

    index += 1;
  }

  if (!course.title) addError(1, 'Missing "# Course: Title" header.');
  if (modules.length === 0) addError(1, 'No modules found.');

  modules.forEach((module, moduleIndex) => {
    if (module.lessons.length === 0) {
      addError(1, `Module ${moduleIndex + 1} has no lessons.`);
    }
    module.lessons.forEach((lesson) => {
      if (lesson.blocks.length === 0) {
        addError(1, `Lesson "${lesson.title}" has no blocks.`);
      }
    });
  });

  return { course, modules, questions, errors };
};

export const SCIENCE_IMPORT_SAMPLE = `# Course: Introductory Physics I
Subject: Physics
Level: Beginner
Estimated Hours: 12
Outcome: Understand Newton's laws through worked examples.
Outcome: Practice numeric mechanics problems.

## Module: Week 1 - Newton's Laws
Description: Force, acceleration, and inertial frames.

### Lesson: What Is a Force?
Summary: Build intuition for force as an interaction.

:::block type=rich_text
Forces are interactions that can change an object's motion.
:::

:::block type=math
F = ma
:::

:::block type=worked_example
Problem: A 2kg object accelerates at 3m/s^2. Find the net force.
Step 1: Use F = ma.
Step 2: Substitute 2kg and 3m/s^2.
Answer: 6N
:::

:::question type=multiple_choice answer="F = ma" difficulty="beginner"
What equation states Newton's second law?
- E = mc^2
- F = ma
- p = mv
:::`;
