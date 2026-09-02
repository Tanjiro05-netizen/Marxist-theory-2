-- Demo Science v2 Physics course.
-- Requires public.science_* tables from 20260427040000_science_v2_learning_platform.sql.
-- For the Supabase SQL editor, use supabase/manual/science_v2_schema_plus_physics_demo.sql
-- if the Science v2 tables do not exist yet.
-- This is intentionally concrete: subject, course shell, modules, lessons,
-- readable blocks, a simulation lab with checklist/notebook fields, questions,
-- and a linked quiz.

WITH physics_subject AS (
  INSERT INTO public.science_subjects (id, name, slug, description, icon_name, color, order_index)
  VALUES (
    '11111111-1111-4111-8111-111111111111',
    'Physics',
    'physics',
    'Mechanics, waves, fields, matter, and experiments.',
    'atom',
    '#3b82f6',
    1
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index,
    updated_at = now()
  RETURNING id
),
demo_course AS (
  INSERT INTO public.science_courses (
    id,
    subject_id,
    title,
    slug,
    subtitle,
    description,
    outcomes,
    prerequisites,
    level,
    estimated_minutes,
    language,
    certificate_available,
    status,
    order_index,
    metadata,
    published_at
  )
  SELECT
    '22222222-2222-4222-8222-222222222222',
    id,
    'Physics Demo: Forces and Motion',
    'physics-demo-forces-and-motion',
    'A compact mechanics course proving the Science v2 authoring loop.',
    'This dummy Physics course shows the full course-production model: academic readings, equations, worked examples, a simulation lab, inline practice, and a module checkpoint.',
    '[
      "Explain force as an interaction that changes motion",
      "Use F = ma to connect mass, acceleration, and net force",
      "Run a guided simulation lab and record observations",
      "Answer reusable mechanics questions inside a checkpoint"
    ]'::jsonb,
    '[
      "Basic algebra",
      "Comfort reading simple graphs",
      "No prior physics course required"
    ]'::jsonb,
    'beginner',
    90,
    'en',
    true,
    'published',
    1,
    '{"demo": true, "authoring_v2": true}'::jsonb,
    now()
  FROM physics_subject
  ON CONFLICT (slug) DO UPDATE
  SET
    subject_id = EXCLUDED.subject_id,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    outcomes = EXCLUDED.outcomes,
    prerequisites = EXCLUDED.prerequisites,
    level = EXCLUDED.level,
    estimated_minutes = EXCLUDED.estimated_minutes,
    language = EXCLUDED.language,
    certificate_available = EXCLUDED.certificate_available,
    status = EXCLUDED.status,
    order_index = EXCLUDED.order_index,
    metadata = EXCLUDED.metadata,
    published_at = EXCLUDED.published_at,
    updated_at = now()
  RETURNING id
),
module_one AS (
  INSERT INTO public.science_modules (id, course_id, title, slug, description, order_index, is_published)
  SELECT
    '33333333-3333-4333-8333-333333333331',
    id,
    'Module 1: Forces, Motion, and Measurement',
    'forces-motion-measurement',
    'Build the core relation between force, mass, acceleration, and observed motion.',
    0,
    true
  FROM demo_course
  ON CONFLICT (course_id, slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index,
    is_published = EXCLUDED.is_published,
    updated_at = now()
  RETURNING id, course_id
),
module_two AS (
  INSERT INTO public.science_modules (id, course_id, title, slug, description, order_index, is_published)
  SELECT
    '33333333-3333-4333-8333-333333333332',
    id,
    'Module 2: Energy as a Bookkeeping Tool',
    'energy-bookkeeping',
    'Introduce work and energy as a second way to analyze motion.',
    1,
    true
  FROM demo_course
  ON CONFLICT (course_id, slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index,
    is_published = EXCLUDED.is_published,
    updated_at = now()
  RETURNING id, course_id
),
lesson_force AS (
  INSERT INTO public.science_lessons (id, module_id, title, slug, summary, lesson_kind, estimated_minutes, xp_reward, order_index, is_published)
  SELECT
    '44444444-4444-4444-8444-444444444441',
    id,
    'What Changes Motion?',
    'what-changes-motion',
    'A concept lesson connecting force, mass, and acceleration.',
    'concept',
    25,
    15,
    0,
    true
  FROM module_one
  ON CONFLICT (module_id, slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    lesson_kind = EXCLUDED.lesson_kind,
    estimated_minutes = EXCLUDED.estimated_minutes,
    xp_reward = EXCLUDED.xp_reward,
    order_index = EXCLUDED.order_index,
    is_published = EXCLUDED.is_published,
    updated_at = now()
  RETURNING id, module_id
),
lesson_lab AS (
  INSERT INTO public.science_lessons (id, module_id, title, slug, summary, lesson_kind, estimated_minutes, xp_reward, order_index, is_published)
  SELECT
    '44444444-4444-4444-8444-444444444442',
    id,
    'Simulation Lab: Net Force',
    'simulation-lab-net-force',
    'Use a guided lab notebook to test how force and mass affect acceleration.',
    'lab',
    30,
    20,
    1,
    true
  FROM module_one
  ON CONFLICT (module_id, slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    lesson_kind = EXCLUDED.lesson_kind,
    estimated_minutes = EXCLUDED.estimated_minutes,
    xp_reward = EXCLUDED.xp_reward,
    order_index = EXCLUDED.order_index,
    is_published = EXCLUDED.is_published,
    updated_at = now()
  RETURNING id, module_id
),
lesson_practice AS (
  INSERT INTO public.science_lessons (id, module_id, title, slug, summary, lesson_kind, estimated_minutes, xp_reward, order_index, is_published)
  SELECT
    '44444444-4444-4444-8444-444444444443',
    id,
    'Practice: Force Calculations',
    'practice-force-calculations',
    'Short practice using reusable questions and a checkpoint.',
    'practice',
    20,
    20,
    2,
    true
  FROM module_one
  ON CONFLICT (module_id, slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    lesson_kind = EXCLUDED.lesson_kind,
    estimated_minutes = EXCLUDED.estimated_minutes,
    xp_reward = EXCLUDED.xp_reward,
    order_index = EXCLUDED.order_index,
    is_published = EXCLUDED.is_published,
    updated_at = now()
  RETURNING id, module_id
),
lesson_energy AS (
  INSERT INTO public.science_lessons (id, module_id, title, slug, summary, lesson_kind, estimated_minutes, xp_reward, order_index, is_published)
  SELECT
    '44444444-4444-4444-8444-444444444444',
    id,
    'Work and Energy Preview',
    'work-and-energy-preview',
    'A short bridge lesson showing how energy will extend the mechanics toolkit.',
    'concept',
    15,
    10,
    0,
    true
  FROM module_two
  ON CONFLICT (module_id, slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    lesson_kind = EXCLUDED.lesson_kind,
    estimated_minutes = EXCLUDED.estimated_minutes,
    xp_reward = EXCLUDED.xp_reward,
    order_index = EXCLUDED.order_index,
    is_published = EXCLUDED.is_published,
    updated_at = now()
  RETURNING id, module_id
),
question_one AS (
  INSERT INTO public.science_questions (
    id,
    subject_id,
    question_type,
    prompt,
    options,
    correct_answer,
    explanation,
    hint,
    difficulty,
    tags
  )
  SELECT
    '55555555-5555-4555-8555-555555555551',
    id,
    'multiple_choice',
    'Which equation states Newton''s second law in its simplest introductory form?',
    '["E = mc^2", "F = ma", "p = mv", "W = Fd"]'::jsonb,
    'F = ma',
    'Newton''s second law connects net force, mass, and acceleration.',
    'Look for the equation containing force and acceleration.',
    'beginner',
    ARRAY['mechanics', 'newton-laws', 'force']
  FROM physics_subject
  ON CONFLICT (id) DO UPDATE
  SET
    prompt = EXCLUDED.prompt,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation,
    hint = EXCLUDED.hint,
    difficulty = EXCLUDED.difficulty,
    tags = EXCLUDED.tags,
    updated_at = now()
  RETURNING id
),
question_two AS (
  INSERT INTO public.science_questions (
    id,
    subject_id,
    question_type,
    prompt,
    correct_answer,
    tolerance,
    explanation,
    hint,
    difficulty,
    tags
  )
  SELECT
    '55555555-5555-4555-8555-555555555552',
    id,
    'numeric',
    'A 2 kg cart accelerates at 3 m/s^2. What is the net force in newtons?',
    '6',
    0,
    'Use F = ma, so F = 2 × 3 = 6 N.',
    'Multiply mass by acceleration.',
    'beginner',
    ARRAY['mechanics', 'calculation', 'force']
  FROM physics_subject
  ON CONFLICT (id) DO UPDATE
  SET
    prompt = EXCLUDED.prompt,
    correct_answer = EXCLUDED.correct_answer,
    tolerance = EXCLUDED.tolerance,
    explanation = EXCLUDED.explanation,
    hint = EXCLUDED.hint,
    difficulty = EXCLUDED.difficulty,
    tags = EXCLUDED.tags,
    updated_at = now()
  RETURNING id
),
quiz_one AS (
  INSERT INTO public.science_quizzes (
    id,
    course_id,
    module_id,
    lesson_id,
    title,
    description,
    quiz_type,
    passing_score,
    attempts_allowed,
    feedback_policy,
    is_published
  )
  SELECT
    '66666666-6666-4666-8666-666666666661',
    module_one.course_id,
    module_one.id,
    lesson_practice.id,
    'Module 1 Checkpoint: Force and Acceleration',
    'A short checkpoint assembled from the reusable Physics question bank.',
    'checkpoint',
    70,
    3,
    'after_submit',
    true
  FROM module_one, lesson_practice
  ON CONFLICT (id) DO UPDATE
  SET
    course_id = EXCLUDED.course_id,
    module_id = EXCLUDED.module_id,
    lesson_id = EXCLUDED.lesson_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    quiz_type = EXCLUDED.quiz_type,
    passing_score = EXCLUDED.passing_score,
    attempts_allowed = EXCLUDED.attempts_allowed,
    feedback_policy = EXCLUDED.feedback_policy,
    is_published = EXCLUDED.is_published,
    updated_at = now()
  RETURNING id
)
INSERT INTO public.science_lesson_blocks (id, lesson_id, block_type, title, content_json, config_json, order_index, is_required)
SELECT *
FROM (
  VALUES
    (
      '77777777-7777-4777-8777-777777777771'::uuid,
      (SELECT id FROM lesson_force),
      'rich_text',
      'Force as an interaction',
      jsonb_build_object(
        'body',
        'A force is an interaction that can change an object''s motion. In this course shell, the lesson is not just a page of text: it is one block in a sequence that can include equations, worked examples, labs, practice, and checkpoints.'
      ),
      '{}'::jsonb,
      0,
      true
    ),
    (
      '77777777-7777-4777-8777-777777777772'::uuid,
      (SELECT id FROM lesson_force),
      'math',
      'Newton''s second law',
      jsonb_build_object(
        'body',
        '$$F_{net} = ma$$' || E'\n\nIf the mass stays fixed, more net force produces more acceleration. If the force stays fixed, more mass produces less acceleration.'
      ),
      '{}'::jsonb,
      1,
      true
    ),
    (
      '77777777-7777-4777-8777-777777777773'::uuid,
      (SELECT id FROM lesson_force),
      'worked_example',
      'Worked example: cart acceleration',
      jsonb_build_object(
        'problem', 'A 2 kg cart accelerates at 3 m/s^2. Find the net force.',
        'steps', jsonb_build_array('Start with Newton''s second law: $F = ma$.', 'Substitute mass and acceleration: $F = 2 \\times 3$.', 'Compute the result and include units.'),
        'answer', '6 N'
      ),
      '{}'::jsonb,
      2,
      true
    ),
    (
      '77777777-7777-4777-8777-777777777774'::uuid,
      (SELECT id FROM lesson_lab),
      'simulation_embed',
      'Simulation lab: force, mass, and acceleration',
      jsonb_build_object(
        'url', 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html',
        'caption', 'Run a net-force experiment and record what changes.',
        'prompt', 'Use the simulation to test how acceleration changes when force or mass changes.',
        'setup', 'Start with one object. Keep mass fixed for the first trial, then keep force fixed for the second trial.',
        'variables', jsonb_build_array('applied force', 'object mass', 'acceleration', 'friction setting'),
        'tasks', jsonb_build_array('Predict what happens when force increases.', 'Run one trial with higher force and the same mass.', 'Run one trial with higher mass and the same force.', 'Compare your observations to F = ma.'),
        'observations', jsonb_build_array('Which variable produced the clearest change?', 'Where did your prediction match or fail?', 'How would you explain the result using F = ma?')
      ),
      '{}'::jsonb,
      0,
      true
    ),
    (
      '77777777-7777-4777-8777-777777777775'::uuid,
      (SELECT id FROM lesson_practice),
      'exercise',
      'Inline exercise: identify the law',
      jsonb_build_object('question_id', (SELECT id FROM question_one)),
      '{}'::jsonb,
      0,
      true
    ),
    (
      '77777777-7777-4777-8777-777777777776'::uuid,
      (SELECT id FROM lesson_practice),
      'quiz',
      'Checkpoint quiz',
      jsonb_build_object('quiz_id', (SELECT id FROM quiz_one)),
      '{}'::jsonb,
      1,
      true
    ),
    (
      '77777777-7777-4777-8777-777777777777'::uuid,
      (SELECT id FROM lesson_energy),
      'callout',
      'Why energy appears next',
      jsonb_build_object(
        'variant', 'intuition',
        'body', 'Forces explain how motion changes instant by instant. Energy gives a second accounting system: what can a system do, and where did that capacity go?'
      ),
      '{}'::jsonb,
      0,
      true
    )
) AS blocks(id, lesson_id, block_type, title, content_json, config_json, order_index, is_required)
ON CONFLICT (id) DO UPDATE
SET
  lesson_id = EXCLUDED.lesson_id,
  block_type = EXCLUDED.block_type,
  title = EXCLUDED.title,
  content_json = EXCLUDED.content_json,
  config_json = EXCLUDED.config_json,
  order_index = EXCLUDED.order_index,
  is_required = EXCLUDED.is_required,
  updated_at = now();

INSERT INTO public.science_quiz_questions (id, quiz_id, question_id, order_index, points)
VALUES
  ('88888888-8888-4888-8888-888888888881', '66666666-6666-4666-8666-666666666661', '55555555-5555-4555-8555-555555555551', 0, 1),
  ('88888888-8888-4888-8888-888888888882', '66666666-6666-4666-8666-666666666661', '55555555-5555-4555-8555-555555555552', 1, 1)
ON CONFLICT (quiz_id, question_id) DO UPDATE
SET
  order_index = EXCLUDED.order_index,
  points = EXCLUDED.points;
