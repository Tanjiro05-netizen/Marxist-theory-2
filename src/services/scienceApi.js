import { supabase } from '../supabaseClient';
import { scienceSlugify } from '../utils/scienceMarkdownImporter';

const REQUEST_TIMEOUT_MS = 15000;

const demoSubject = {
  id: 'demo-physics-subject',
  name: 'Physics',
  slug: 'physics',
  description: 'Mechanics, waves, fields, matter, and experiments.',
  icon_name: 'atom',
  color: '#3b82f6',
  order_index: 1,
};

const demoCourse = {
  id: 'demo-physics-course',
  subject_id: demoSubject.id,
  title: 'Physics Demo: Forces and Motion',
  slug: 'physics-demo-forces-and-motion',
  subtitle: 'A compact mechanics course proving the Science v2 authoring loop.',
  description: 'This local demo shows the full Science v2 course model: readings, equations, worked examples, a simulation lab, inline practice, and a checkpoint.',
  outcomes: [
    'Explain force as an interaction that changes motion',
    'Use F = ma to connect mass, acceleration, and net force',
    'Run a guided simulation lab and record observations',
    'Answer reusable mechanics questions inside a checkpoint',
  ],
  prerequisites: ['Basic algebra', 'Comfort reading simple graphs', 'No prior physics course required'],
  level: 'beginner',
  estimated_minutes: 90,
  language: 'en',
  certificate_available: true,
  status: 'published',
  order_index: 1,
  metadata: { local_demo: true },
  science_subjects: demoSubject,
  science_enrollments: [],
};

const demoQuestions = [
  {
    id: 'demo-question-newton-law',
    subject_id: demoSubject.id,
    question_type: 'multiple_choice',
    prompt: "Which equation states Newton's second law in its simplest introductory form?",
    options: ['E = mc^2', 'F = ma', 'p = mv', 'W = Fd'],
    correct_answer: 'F = ma',
    explanation: "Newton's second law connects net force, mass, and acceleration.",
    hint: 'Look for the equation containing force and acceleration.',
    difficulty: 'beginner',
    tags: ['mechanics', 'newton-laws', 'force'],
  },
  {
    id: 'demo-question-net-force',
    subject_id: demoSubject.id,
    question_type: 'numeric',
    prompt: 'A 2 kg cart accelerates at 3 m/s^2. What is the net force in newtons?',
    correct_answer: '6',
    tolerance: 0,
    explanation: 'Use F = ma, so F = 2 x 3 = 6 N.',
    hint: 'Multiply mass by acceleration.',
    difficulty: 'beginner',
    tags: ['mechanics', 'calculation', 'force'],
  },
];

const demoQuiz = {
  id: 'demo-quiz-module-1',
  course_id: demoCourse.id,
  module_id: 'demo-module-forces',
  lesson_id: 'demo-lesson-practice',
  title: 'Module 1 Checkpoint: Force and Acceleration',
  description: 'A short checkpoint assembled from the reusable Physics question bank.',
  quiz_type: 'checkpoint',
  passing_score: 70,
  attempts_allowed: 3,
  feedback_policy: 'after_submit',
  is_published: true,
  science_quiz_questions: [
    { id: 'demo-quiz-link-1', question_id: demoQuestions[0].id, order_index: 0, points: 1, science_questions: demoQuestions[0] },
    { id: 'demo-quiz-link-2', question_id: demoQuestions[1].id, order_index: 1, points: 1, science_questions: demoQuestions[1] },
  ],
};

const demoModules = [
  {
    id: 'demo-module-forces',
    course_id: demoCourse.id,
    title: 'Module 1: Forces, Motion, and Measurement',
    slug: 'forces-motion-measurement',
    description: 'Build the core relation between force, mass, acceleration, and observed motion.',
    order_index: 0,
    is_published: true,
    science_lessons: [
      {
        id: 'demo-lesson-force',
        module_id: 'demo-module-forces',
        title: 'What Changes Motion?',
        slug: 'what-changes-motion',
        summary: 'A concept lesson connecting force, mass, and acceleration.',
        lesson_kind: 'concept',
        estimated_minutes: 25,
        xp_reward: 15,
        order_index: 0,
        is_required: true,
        is_published: true,
        science_quizzes: [],
        science_lesson_blocks: [
          {
            id: 'demo-block-force-text',
            lesson_id: 'demo-lesson-force',
            block_type: 'rich_text',
            title: 'Force as an interaction',
            content_json: {
              body: "A force is an interaction that can change an object's motion. In Science v2, this reading block can sit beside equations, examples, labs, practice, and checkpoints.",
            },
            order_index: 0,
          },
          {
            id: 'demo-block-force-math',
            lesson_id: 'demo-lesson-force',
            block_type: 'math',
            title: "Newton's second law",
            content_json: {
              body: '$$F_{net} = ma$$\n\nIf mass stays fixed, more net force produces more acceleration. If force stays fixed, more mass produces less acceleration.',
            },
            order_index: 1,
          },
          {
            id: 'demo-block-force-example',
            lesson_id: 'demo-lesson-force',
            block_type: 'worked_example',
            title: 'Worked example: cart acceleration',
            content_json: {
              problem: 'A 2 kg cart accelerates at 3 m/s^2. Find the net force.',
              steps: ['Start with Newton\'s second law: $F = ma$.', 'Substitute mass and acceleration: $F = 2 \\times 3$.', 'Compute the result and include units.'],
              answer: '6 N',
            },
            order_index: 2,
          },
        ],
      },
      {
        id: 'demo-lesson-lab',
        module_id: 'demo-module-forces',
        title: 'Simulation Lab: Net Force',
        slug: 'simulation-lab-net-force',
        summary: 'Use a guided lab notebook to test how force and mass affect acceleration.',
        lesson_kind: 'lab',
        estimated_minutes: 30,
        xp_reward: 20,
        order_index: 1,
        is_required: true,
        is_published: true,
        science_quizzes: [],
        science_lesson_blocks: [
          {
            id: 'demo-block-simulation',
            lesson_id: 'demo-lesson-lab',
            block_type: 'simulation_embed',
            title: 'Simulation lab: force, mass, and acceleration',
            content_json: {
              url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html',
              caption: 'Run a net-force experiment and record what changes.',
              prompt: 'Use the simulation to test how acceleration changes when force or mass changes.',
              setup: 'Start with one object. Keep mass fixed for the first trial, then keep force fixed for the second trial.',
              variables: ['applied force', 'object mass', 'acceleration', 'friction setting'],
              tasks: [
                'Predict what happens when force increases.',
                'Run one trial with higher force and the same mass.',
                'Run one trial with higher mass and the same force.',
                'Compare your observations to F = ma.',
              ],
              observations: [
                'Which variable produced the clearest change?',
                'Where did your prediction match or fail?',
                'How would you explain the result using F = ma?',
              ],
            },
            order_index: 0,
          },
        ],
      },
      {
        id: 'demo-lesson-practice',
        module_id: 'demo-module-forces',
        title: 'Practice: Force Calculations',
        slug: 'practice-force-calculations',
        summary: 'Short practice using reusable questions and a checkpoint.',
        lesson_kind: 'practice',
        estimated_minutes: 20,
        xp_reward: 20,
        order_index: 2,
        is_required: true,
        is_published: true,
        science_quizzes: [demoQuiz],
        science_lesson_blocks: [
          {
            id: 'demo-block-exercise',
            lesson_id: 'demo-lesson-practice',
            block_type: 'exercise',
            title: 'Inline exercise: identify the law',
            content_json: { question_id: demoQuestions[0].id },
            order_index: 0,
          },
          {
            id: 'demo-block-quiz',
            lesson_id: 'demo-lesson-practice',
            block_type: 'quiz',
            title: 'Checkpoint quiz',
            content_json: { quiz_id: demoQuiz.id },
            order_index: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'demo-module-energy',
    course_id: demoCourse.id,
    title: 'Module 2: Energy as a Bookkeeping Tool',
    slug: 'energy-bookkeeping',
    description: 'Introduce work and energy as a second way to analyze motion.',
    order_index: 1,
    is_published: true,
    science_lessons: [
      {
        id: 'demo-lesson-energy',
        module_id: 'demo-module-energy',
        title: 'Work and Energy Preview',
        slug: 'work-and-energy-preview',
        summary: 'A short bridge lesson showing how energy will extend the mechanics toolkit.',
        lesson_kind: 'concept',
        estimated_minutes: 15,
        xp_reward: 10,
        order_index: 0,
        is_required: true,
        is_published: true,
        science_quizzes: [],
        science_lesson_blocks: [
          {
            id: 'demo-block-energy-note',
            lesson_id: 'demo-lesson-energy',
            block_type: 'callout',
            title: 'Why energy appears next',
            content_json: {
              variant: 'intuition',
              body: 'Forces explain how motion changes instant by instant. Energy gives a second accounting system: what can a system do, and where did that capacity go?',
            },
            order_index: 0,
          },
        ],
      },
    ],
  },
];

const cloneDemo = (value) => JSON.parse(JSON.stringify(value));

const getDemoCoursePayload = () => ({
  course: {
    ...cloneDemo(demoCourse),
    science_modules: demoModules.map((module) => ({ id: module.id })),
  },
  modules: cloneDemo(demoModules),
  demoMode: true,
});

const getDemoHubPayload = () => ({
  subjects: [cloneDemo(demoSubject)],
  courses: [{
    ...cloneDemo(demoCourse),
    science_modules: demoModules.map((module) => ({ id: module.id })),
    science_enrollments: [],
  }],
  tracks: [],
  textbooks: [],
  demoMode: true,
});

const getDemoLessonPayload = ({ moduleSlug, lessonSlug }) => {
  const { course, modules } = getDemoCoursePayload();
  const module = modules.find((item) => item.slug === moduleSlug);
  if (!module) throw new Error('Module not found.');
  const lesson = (module.science_lessons || []).find((item) => item.slug === lessonSlug);
  if (!lesson) throw new Error('Lesson not found.');
  const nav = modules.flatMap((mod) =>
    (mod.science_lessons || []).map((item) => ({
      moduleSlug: mod.slug,
      moduleTitle: mod.title,
      lessonSlug: item.slug,
      lessonTitle: item.title,
      lessonId: item.id,
    }))
  );
  return {
    course,
    module,
    lesson,
    blocks: cloneDemo(lesson.science_lesson_blocks || []),
    quizzes: cloneDemo(lesson.science_quizzes || []),
    questions: cloneDemo(demoQuestions),
    modules,
    nav,
    navIndex: nav.findIndex((item) => item.moduleSlug === moduleSlug && item.lessonSlug === lessonSlug),
    demoMode: true,
  };
};

const isScienceSchemaUnavailable = (error) => {
  const message = error?.message || `${error || ''}`;
  const lower = message.toLowerCase();
  return error?.code === '42P01' || (lower.includes('relation') && lower.includes('science_') && lower.includes('does not exist'));
};

export const withScienceTimeout = async (request, message = 'Science request timed out.') => {
  let timeoutId;

  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getScienceErrorMessage = (error, fallback = 'Something went wrong.') => {
  const message = error?.message || `${error || ''}` || fallback;
  const code = error?.code ? `${error.code}` : '';
  const lower = message.toLowerCase();

  if (code === '23505' || lower.includes('duplicate key')) {
    return 'That slug already exists. Use a more specific title or edit the slug.';
  }

  if (
    code === '42501' ||
    lower.includes('row-level security') ||
    lower.includes('permission denied') ||
    lower.includes('jwt') ||
    lower.includes('no authenticated')
  ) {
    return 'Supabase rejected the save. Log in with a real authenticated admin account and apply the Science v2 migration.';
  }

  if (lower.includes('relation') && lower.includes('does not exist')) {
    return 'Science v2 tables are not in Supabase yet. Apply the new migration, then refresh.';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Supabase did not respond. Check the connection, then try again.';
  }

  return message || fallback;
};

export const requireAdminSession = async () => {
  const { data, error } = await withScienceTimeout(
    supabase.auth.getSession(),
    'Admin session check timed out.'
  );
  if (error) throw error;
  if (!data?.session) throw new Error('No authenticated Supabase admin session.');
  return data.session;
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await withScienceTimeout(supabase.auth.getUser(), 'User loading timed out.');
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
};

export const fetchScienceHub = async () => {
  try {
    const [{ data: subjects, error: subjectError }, { data: courses, error: courseError }] = await Promise.all([
      withScienceTimeout(
        supabase.from('science_subjects').select('*').order('order_index'),
        'Science subjects loading timed out.'
      ),
      withScienceTimeout(
        supabase
          .from('science_courses')
          .select(`
            *,
            science_subjects(name, slug, color, icon_name)
          `)
          .eq('status', 'published')
          .order('order_index'),
        'Published Science courses loading timed out.'
      ),
    ]);

    if (subjectError) throw subjectError;
    if (courseError) throw courseError;

    const courseIds = (courses || []).map((course) => course.id);
    const [{ data: modules }, { data: tracks }, { data: textbooks }] = await Promise.all([
      courseIds.length > 0
        ? withScienceTimeout(
          supabase
            .from('science_modules')
            .select('id, course_id')
            .in('course_id', courseIds)
            .eq('is_published', true),
          'Science module counts loading timed out.'
        ).catch(() => ({ data: [] }))
        : { data: [] },
      withScienceTimeout(
        supabase
          .from('science_tracks')
          .select('*, science_subjects(name, color)')
          .eq('is_published', true)
          .order('order_index')
      ).catch(() => ({ data: [] })),
      withScienceTimeout(
        supabase
          .from('stem_textbooks')
          .select('*, stem_subjects(name, color)')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(6)
      ).catch(() => ({ data: [] })),
    ]);

    const modulesByCourse = (modules || []).reduce((lookup, module) => {
      if (!lookup[module.course_id]) lookup[module.course_id] = [];
      lookup[module.course_id].push({ id: module.id });
      return lookup;
    }, {});

    return {
      subjects: subjects || [],
      courses: (courses || []).map((course) => ({
        ...course,
        science_modules: modulesByCourse[course.id] || [],
        science_enrollments: [],
      })),
      tracks: tracks || [],
      textbooks: textbooks || [],
    };
  } catch (error) {
    if (isScienceSchemaUnavailable(error)) return getDemoHubPayload();
    throw error;
  }
};

export const fetchScienceCourse = async (courseSlug) => {
  if (courseSlug === demoCourse.slug) return getDemoCoursePayload();

  try {
    const { data: course, error } = await withScienceTimeout(
      supabase
        .from('science_courses')
        .select(`
          *,
          science_subjects(name, slug, color, icon_name),
          science_tracks(title, slug)
        `)
        .eq('slug', courseSlug)
        .single(),
      'Course loading timed out.'
    );
    if (error) throw error;

    const { data: modules, error: moduleError } = await withScienceTimeout(
      supabase
        .from('science_modules')
        .select(`
          *,
          science_lessons(
            id,
            title,
            slug,
            summary,
            lesson_kind,
            estimated_minutes,
            xp_reward,
            order_index,
            science_lesson_blocks(id, block_type),
            science_quizzes(id, title, passing_score)
          )
        `)
        .eq('course_id', course.id)
        .order('order_index'),
      'Course outline loading timed out.'
    );
    if (moduleError) throw moduleError;

    return {
      course,
      modules: (modules || []).map((module) => ({
        ...module,
        science_lessons: (module.science_lessons || []).sort((a, b) => a.order_index - b.order_index),
      })),
    };
  } catch (error) {
    if (isScienceSchemaUnavailable(error) && courseSlug === demoCourse.slug) return getDemoCoursePayload();
    throw error;
  }
};

export const fetchScienceLesson = async ({ courseSlug, moduleSlug, lessonSlug }) => {
  if (courseSlug === demoCourse.slug) return getDemoLessonPayload({ moduleSlug, lessonSlug });

  const { course, modules } = await fetchScienceCourse(courseSlug);
  const module = modules.find((item) => item.slug === moduleSlug);
  if (!module) throw new Error('Module not found.');

  const lessonShell = (module.science_lessons || []).find((item) => item.slug === lessonSlug);
  if (!lessonShell) throw new Error('Lesson not found.');

  const [{ data: lesson, error: lessonError }, { data: blocks, error: blockError }, { data: quizzes }] = await Promise.all([
    withScienceTimeout(
      supabase.from('science_lessons').select('*').eq('id', lessonShell.id).single(),
      'Lesson loading timed out.'
    ),
    withScienceTimeout(
      supabase
        .from('science_lesson_blocks')
        .select('*')
        .eq('lesson_id', lessonShell.id)
        .order('order_index'),
      'Lesson blocks loading timed out.'
    ),
    withScienceTimeout(
      supabase
        .from('science_quizzes')
        .select('*, science_quiz_questions(points, order_index, science_questions(*))')
        .eq('lesson_id', lessonShell.id)
        .eq('is_published', true)
    ).catch(() => ({ data: [] })),
  ]);

  if (lessonError) throw lessonError;
  if (blockError) throw blockError;

  const exerciseQuestionIds = (blocks || [])
    .filter((block) => block.block_type === 'exercise' && block.content_json?.question_id)
    .map((block) => block.content_json.question_id);

  const { data: exerciseQuestions } = exerciseQuestionIds.length > 0
    ? await withScienceTimeout(
      supabase.from('science_questions').select('*').in('id', exerciseQuestionIds),
      'Exercise questions loading timed out.'
    )
    : { data: [] };

  const nav = modules.flatMap((mod) =>
    (mod.science_lessons || []).map((item) => ({
      moduleSlug: mod.slug,
      moduleTitle: mod.title,
      lessonSlug: item.slug,
      lessonTitle: item.title,
      lessonId: item.id,
    }))
  );

  return {
    course,
    module,
    lesson,
    blocks: blocks || [],
    quizzes: quizzes || [],
    questions: exerciseQuestions || [],
    modules,
    nav,
    navIndex: nav.findIndex((item) => item.moduleSlug === moduleSlug && item.lessonSlug === lessonSlug),
  };
};

export const fetchScienceCheckpoint = async ({ courseSlug, moduleSlug }) => {
  const { course, modules } = await fetchScienceCourse(courseSlug);
  const module = modules.find((item) => item.slug === moduleSlug);
  if (!module) throw new Error('Module not found.');

  const lessonIds = (module.science_lessons || []).map((lesson) => lesson.id);
  const [moduleQuizzes, lessonQuizzes] = await Promise.all([
    withScienceTimeout(
      supabase
        .from('science_quizzes')
        .select('*, science_quiz_questions(id, points, order_index, science_questions(*))')
        .eq('module_id', module.id)
        .eq('is_published', true)
        .order('created_at'),
      'Module checkpoint loading timed out.'
    ),
    lessonIds.length > 0
      ? withScienceTimeout(
        supabase
          .from('science_quizzes')
          .select('*, science_quiz_questions(id, points, order_index, science_questions(*))')
          .in('lesson_id', lessonIds)
          .eq('is_published', true)
          .order('created_at'),
        'Lesson checkpoints loading timed out.'
      )
      : { data: [] },
  ]);

  if (moduleQuizzes.error) throw moduleQuizzes.error;
  if (lessonQuizzes.error) throw lessonQuizzes.error;

  const quizzes = [...(moduleQuizzes.data || []), ...(lessonQuizzes.data || [])].map((quiz) => ({
    ...quiz,
    science_quiz_questions: (quiz.science_quiz_questions || []).sort((a, b) => a.order_index - b.order_index),
  }));

  return { course, module, modules, quizzes };
};

export const enrollInScienceCourse = async (userId, courseId) => {
  const { data, error } = await withScienceTimeout(
    supabase
      .from('science_enrollments')
      .upsert({ user_id: userId, course_id: courseId, status: 'active' }, { onConflict: 'user_id,course_id' })
      .select()
      .single(),
    'Enrollment timed out.'
  );
  if (error) throw error;
  return data;
};

export const completeScienceLesson = async ({ userId, courseId, moduleId, lessonId, xpReward }) => {
  const payload = {
    user_id: userId,
    course_id: courseId,
    module_id: moduleId,
    lesson_id: lessonId,
    block_id: null,
    state: 'completed',
    progress_percent: 100,
    xp_earned: xpReward || 10,
    completed_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await withScienceTimeout(
    supabase
      .from('science_activity_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .is('block_id', null)
      .maybeSingle(),
    'Lesson completion lookup timed out.'
  );
  if (lookupError) throw lookupError;

  const request = existing?.id
    ? supabase.from('science_activity_progress').update(payload).eq('id', existing.id)
    : supabase.from('science_activity_progress').insert(payload);

  const { error } = await withScienceTimeout(request, 'Lesson completion timed out.');
  if (error) throw error;
};

export const submitScienceQuizAttempt = async ({ userId, quiz, answers, results }) => {
  const { data, error } = await withScienceTimeout(
    supabase
      .from('science_quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id: quiz.id,
        score: results.score,
        total_points: results.totalPoints,
        passed: results.passed,
        answers: results.questionResults,
        started_at: results.startedAt,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single(),
    'Quiz attempt save timed out.'
  );
  if (error) throw error;
  return data;
};

export const fetchScienceAdminData = async () => {
  await requireAdminSession();
  const [{ data: subjects, error: subjectError }, { data: courses, error: courseError }] = await Promise.all([
    withScienceTimeout(supabase.from('science_subjects').select('*').order('order_index')),
    withScienceTimeout(
      supabase
        .from('science_courses')
        .select('*, science_subjects(name, color), science_modules(id, science_lessons(id))')
        .order('updated_at', { ascending: false })
    ),
  ]);
  if (subjectError) throw subjectError;
  if (courseError) throw courseError;
  return { subjects: subjects || [], courses: courses || [] };
};

export const fetchScienceAdminCourse = async (courseId) => {
  await requireAdminSession();
  const { data: modules, error } = await withScienceTimeout(
    supabase
      .from('science_modules')
      .select(`
        *,
        science_lessons(
          *,
          science_lesson_blocks(*),
          science_quizzes(*)
        )
      `)
      .eq('course_id', courseId)
      .order('order_index')
  );
  if (error) throw error;
  return (modules || []).map((module) => ({
    ...module,
    science_lessons: (module.science_lessons || [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson) => ({
        ...lesson,
        science_lesson_blocks: (lesson.science_lesson_blocks || []).sort((a, b) => a.order_index - b.order_index),
      })),
  }));
};

export const saveScienceCourse = async (course) => {
  await requireAdminSession();
  const payload = {
    subject_id: course.subject_id || null,
    track_id: course.track_id || null,
    title: course.title,
    slug: course.slug ? scienceSlugify(course.slug) : scienceSlugify(course.title),
    subtitle: course.subtitle || null,
    description: course.description || null,
    outcomes: course.outcomes || [],
    prerequisites: course.prerequisites || [],
    level: course.level || 'beginner',
    estimated_minutes: course.estimated_minutes ? Number(course.estimated_minutes) : null,
    language: course.language || 'en',
    thumbnail_url: course.thumbnail_url || null,
    certificate_available: course.certificate_available !== false,
    status: course.status || 'draft',
    updated_at: new Date().toISOString(),
    published_at: course.status === 'published' ? new Date().toISOString() : null,
  };

  const request = course.id
    ? supabase.from('science_courses').update(payload).eq('id', course.id).select('*, science_subjects(name, color)').single()
    : supabase.from('science_courses').insert(payload).select('*, science_subjects(name, color)').single();
  const { data, error } = await withScienceTimeout(request, 'Course save timed out.');
  if (error) throw error;
  return data;
};

export const saveScienceModule = async (module) => {
  await requireAdminSession();
  const payload = {
    course_id: module.course_id,
    title: module.title,
    slug: module.slug ? scienceSlugify(module.slug) : scienceSlugify(module.title),
    description: module.description || null,
    order_index: Number(module.order_index) || 0,
    is_published: module.is_published !== false,
    updated_at: new Date().toISOString(),
  };
  const request = module.id
    ? supabase.from('science_modules').update(payload).eq('id', module.id).select().single()
    : supabase.from('science_modules').insert(payload).select().single();
  const { data, error } = await withScienceTimeout(request, 'Module save timed out.');
  if (error) throw error;
  return data;
};

export const saveScienceLesson = async (lesson) => {
  await requireAdminSession();
  const payload = {
    module_id: lesson.module_id,
    title: lesson.title,
    slug: lesson.slug ? scienceSlugify(lesson.slug) : scienceSlugify(lesson.title),
    summary: lesson.summary || null,
    lesson_kind: lesson.lesson_kind || 'concept',
    estimated_minutes: lesson.estimated_minutes ? Number(lesson.estimated_minutes) : null,
    xp_reward: Number(lesson.xp_reward) || 10,
    order_index: Number(lesson.order_index) || 0,
    is_required: lesson.is_required !== false,
    is_published: lesson.is_published !== false,
    updated_at: new Date().toISOString(),
  };
  const request = lesson.id
    ? supabase.from('science_lessons').update(payload).eq('id', lesson.id).select().single()
    : supabase.from('science_lessons').insert(payload).select().single();
  const { data, error } = await withScienceTimeout(request, 'Lesson save timed out.');
  if (error) throw error;
  return data;
};

export const saveScienceBlock = async (block) => {
  await requireAdminSession();
  const payload = {
    lesson_id: block.lesson_id,
    block_type: block.block_type,
    title: block.title || null,
    content_json: block.content_json || {},
    config_json: block.config_json || {},
    order_index: Number(block.order_index) || 0,
    is_required: block.is_required !== false,
    updated_at: new Date().toISOString(),
  };
  const request = block.id
    ? supabase.from('science_lesson_blocks').update(payload).eq('id', block.id).select().single()
    : supabase.from('science_lesson_blocks').insert(payload).select().single();
  const { data, error } = await withScienceTimeout(request, 'Block save timed out.');
  if (error) throw error;
  return data;
};

export const saveScienceQuestion = async (question) => {
  await requireAdminSession();
  const payload = {
    bank_id: question.bank_id || null,
    subject_id: question.subject_id || null,
    question_type: question.question_type || 'multiple_choice',
    prompt: question.prompt,
    options: question.options || null,
    correct_answer: question.correct_answer,
    tolerance: question.tolerance ? Number(question.tolerance) : null,
    explanation: question.explanation || null,
    hint: question.hint || null,
    difficulty: question.difficulty || 'beginner',
    tags: question.tags || [],
    metadata: question.metadata || {},
    updated_at: new Date().toISOString(),
  };
  const request = question.id
    ? supabase.from('science_questions').update(payload).eq('id', question.id).select().single()
    : supabase.from('science_questions').insert(payload).select().single();
  const { data, error } = await withScienceTimeout(request, 'Question save timed out.');
  if (error) throw error;
  return data;
};

export const fetchScienceQuestions = async ({ subjectId, limit = 200 } = {}) => {
  await requireAdminSession();
  let query = supabase
    .from('science_questions')
    .select('*, science_subjects(name, color)')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (subjectId) query = query.eq('subject_id', subjectId);

  const { data, error } = await withScienceTimeout(query, 'Questions loading timed out.');
  if (error) throw error;
  return data || [];
};

export const fetchScienceQuizzes = async ({ courseId } = {}) => {
  await requireAdminSession();
  let query = supabase
    .from('science_quizzes')
    .select('*, science_quiz_questions(id, question_id, points, order_index, science_questions(id, prompt, question_type, difficulty))')
    .order('updated_at', { ascending: false });

  if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await withScienceTimeout(query, 'Quizzes loading timed out.');
  if (error) throw error;
  return (data || []).map((quiz) => ({
    ...quiz,
    science_quiz_questions: (quiz.science_quiz_questions || []).sort((a, b) => a.order_index - b.order_index),
  }));
};

export const saveScienceQuiz = async (quiz) => {
  await requireAdminSession();
  const payload = {
    course_id: quiz.course_id || null,
    module_id: quiz.module_id || null,
    lesson_id: quiz.lesson_id || null,
    title: quiz.title,
    description: quiz.description || null,
    quiz_type: quiz.quiz_type || 'checkpoint',
    passing_score: Number(quiz.passing_score) || 70,
    attempts_allowed: quiz.attempts_allowed ? Number(quiz.attempts_allowed) : null,
    feedback_policy: quiz.feedback_policy || quiz.feedback_mode || 'after_submit',
    is_published: quiz.is_published !== false,
    updated_at: new Date().toISOString(),
  };
  const request = quiz.id
    ? supabase.from('science_quizzes').update(payload).eq('id', quiz.id).select().single()
    : supabase.from('science_quizzes').insert(payload).select().single();
  const { data, error } = await withScienceTimeout(request, 'Quiz save timed out.');
  if (error) throw error;
  return data;
};

export const saveScienceQuizQuestion = async ({ quiz_id, question_id, order_index = 0, points = 1 }) => {
  await requireAdminSession();
  const { data, error } = await withScienceTimeout(
    supabase
      .from('science_quiz_questions')
      .upsert({
        quiz_id,
        question_id,
        order_index: Number(order_index) || 0,
        points: Number(points) || 1,
      }, { onConflict: 'quiz_id,question_id' })
      .select()
      .single(),
    'Quiz question attach timed out.'
  );
  if (error) throw error;
  return data;
};

export const deleteScienceRecord = async (table, id) => {
  await requireAdminSession();
  const { error } = await withScienceTimeout(supabase.from(table).delete().eq('id', id), 'Delete timed out.');
  if (error) throw error;
};

export const createScienceCourseFromImport = async (parsed, subjects) => {
  await requireAdminSession();
  const matchingSubject = (subjects || []).find(
    (subject) => subject.name.toLowerCase() === parsed.course.subjectName.toLowerCase() ||
      subject.slug === scienceSlugify(parsed.course.subjectName)
  );

  const savedCourse = await saveScienceCourse({
    title: parsed.course.title,
    slug: parsed.course.slug,
    subtitle: parsed.course.subtitle,
    subject_id: matchingSubject?.id || null,
    description: parsed.course.description,
    outcomes: parsed.course.outcomes,
    prerequisites: parsed.course.prerequisites,
    level: parsed.course.level,
    estimated_minutes: parsed.course.estimatedMinutes,
    language: parsed.course.language,
    status: 'draft',
  });

  for (const [moduleIndex, module] of parsed.modules.entries()) {
    const savedModule = await saveScienceModule({
      course_id: savedCourse.id,
      title: module.title,
      slug: module.slug,
      description: module.description,
      order_index: moduleIndex,
    });

    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      const savedLesson = await saveScienceLesson({
        module_id: savedModule.id,
        title: lesson.title,
        slug: lesson.slug,
        summary: lesson.summary,
        lesson_kind: lesson.lesson_kind,
        estimated_minutes: lesson.estimated_minutes,
        order_index: lessonIndex,
      });

      for (const [blockIndex, block] of lesson.blocks.entries()) {
        let blockToSave = { ...block };
        if (block.block_type === 'exercise' && block.content_json?.inline_question) {
          const savedQuestion = await saveScienceQuestion({
            ...block.content_json.inline_question,
            subject_id: matchingSubject?.id || null,
          });
          blockToSave = {
            ...block,
            content_json: { question_id: savedQuestion.id },
          };
        }
        await saveScienceBlock({
          ...blockToSave,
          lesson_id: savedLesson.id,
          order_index: blockIndex,
        });
      }
    }
  }

  return savedCourse;
};
