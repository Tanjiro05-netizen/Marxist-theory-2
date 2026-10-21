-- RETIRED: this historical one-shot script predates the private assessment
-- answer store and server-authoritative grading migration. Use the ordered
-- files in supabase/migrations instead so the security migration cannot be
-- skipped accidentally.

BEGIN;

DO $$
BEGIN
  RAISE EXCEPTION 'This script is retired. Apply the ordered Supabase migrations instead.';
END;
$$;

-- Science & Technology V2 learning platform.
-- Fresh v2 tables; legacy stem_* tables are intentionally untouched.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keep this migration runnable from the Supabase SQL editor even if the
-- earlier helper migration was not applied in this database yet.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  IF auth.uid() IS NULL OR to_regclass('public.profiles') IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    EXECUTE 'SELECT COALESCE((SELECT role = ''admin'' FROM public.profiles WHERE id = $1), false)'
      INTO is_admin_user
      USING auth.uid();
    RETURN COALESCE(is_admin_user, false);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin'
  ) THEN
    EXECUTE 'SELECT COALESCE((SELECT is_admin = true FROM public.profiles WHERE id = $1), false)'
      INTO is_admin_user
      USING auth.uid();
    RETURN COALESCE(is_admin_user, false);
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id_to_check uuid) RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user boolean := false;
BEGIN
  IF user_id_to_check IS NULL OR to_regclass('public.profiles') IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    EXECUTE 'SELECT COALESCE((SELECT role = ''admin'' FROM public.profiles WHERE id = $1), false)'
      INTO is_admin_user
      USING user_id_to_check;
    RETURN COALESCE(is_admin_user, false);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin'
  ) THEN
    EXECUTE 'SELECT COALESCE((SELECT is_admin = true FROM public.profiles WHERE id = $1), false)'
      INTO is_admin_user
      USING user_id_to_check;
    RETURN COALESCE(is_admin_user, false);
  END IF;

  RETURN false;
END;
$$;

CREATE TABLE IF NOT EXISTS public.science_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  color TEXT DEFAULT '#ef4444',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.science_subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  color TEXT DEFAULT '#ef4444',
  order_index INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.science_subjects(id) ON DELETE SET NULL,
  track_id UUID REFERENCES public.science_tracks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  description TEXT,
  outcomes JSONB DEFAULT '[]'::jsonb,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_minutes INT,
  language TEXT DEFAULT 'en',
  thumbnail_url TEXT,
  certificate_available BOOLEAN DEFAULT true,
  status TEXT CHECK (status IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
  published_version INT DEFAULT 0,
  order_index INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.science_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.science_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  unlock_conditions JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, slug)
);

CREATE TABLE IF NOT EXISTS public.science_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.science_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  lesson_kind TEXT CHECK (lesson_kind IN ('concept', 'practice', 'lab', 'quiz', 'project', 'review')) DEFAULT 'concept',
  estimated_minutes INT,
  xp_reward INT DEFAULT 10,
  order_index INT DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, slug)
);

CREATE TABLE IF NOT EXISTS public.science_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.science_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('image', 'video', 'audio', 'pdf', 'external', 'simulation', 'transcript')) DEFAULT 'external',
  url TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.science_courses(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.science_subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES public.science_question_banks(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.science_subjects(id) ON DELETE SET NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'numeric', 'fill_blank')) DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  tolerance NUMERIC,
  explanation TEXT,
  hint TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.science_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.science_modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.science_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT CHECK (quiz_type IN ('checkpoint', 'practice', 'final', 'diagnostic')) DEFAULT 'checkpoint',
  passing_score INT DEFAULT 70,
  attempts_allowed INT DEFAULT 3,
  time_limit_minutes INT,
  feedback_policy TEXT CHECK (feedback_policy IN ('immediate', 'after_submit', 'hidden')) DEFAULT 'immediate',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.science_quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.science_questions(id) ON DELETE CASCADE,
  order_index INT DEFAULT 0,
  points INT DEFAULT 1,
  UNIQUE(quiz_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.science_lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.science_lessons(id) ON DELETE CASCADE,
  block_type TEXT CHECK (block_type IN ('rich_text', 'math', 'worked_example', 'video', 'simulation_embed', 'exercise', 'quiz', 'callout', 'image')) NOT NULL,
  title TEXT,
  content_json JSONB DEFAULT '{}'::jsonb,
  config_json JSONB DEFAULT '{}'::jsonb,
  order_index INT DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  description TEXT,
  difficulty NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_skill_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_skill_id UUID NOT NULL REFERENCES public.science_skills(id) ON DELETE CASCADE,
  child_skill_id UUID NOT NULL REFERENCES public.science_skills(id) ON DELETE CASCADE,
  edge_type TEXT CHECK (edge_type IN ('required', 'recommended')) DEFAULT 'required',
  min_mastery NUMERIC DEFAULT 0.8,
  UNIQUE(parent_skill_id, child_skill_id)
);

CREATE TABLE IF NOT EXISTS public.science_content_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.science_skills(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.science_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.science_modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.science_lessons(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.science_lesson_blocks(id) ON DELETE CASCADE,
  weight NUMERIC DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.science_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.science_courses(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('learner', 'instructor', 'ta')) DEFAULT 'learner',
  status TEXT CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  progress_percent INT DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.science_activity_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.science_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.science_modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.science_lessons(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.science_lesson_blocks(id) ON DELETE CASCADE,
  state TEXT CHECK (state IN ('not_started', 'started', 'completed')) DEFAULT 'started',
  progress_percent INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id, block_id)
);

CREATE TABLE IF NOT EXISTS public.science_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.science_quizzes(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total_points INT NOT NULL,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.science_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.science_courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL DEFAULT ('SCI-' || upper(substr(md5(gen_random_uuid()::text), 1, 10))),
  final_score INT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_science_courses_subject ON public.science_courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_science_courses_track ON public.science_courses(track_id);
CREATE INDEX IF NOT EXISTS idx_science_modules_course ON public.science_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_science_lessons_module ON public.science_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_science_blocks_lesson ON public.science_lesson_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_science_questions_bank ON public.science_questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_science_quiz_questions_quiz ON public.science_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_science_progress_user_course ON public.science_activity_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_science_attempts_user_quiz ON public.science_quiz_attempts(user_id, quiz_id);

-- Keep manual SQL-editor reruns safe if an earlier draft already created the quiz table.
ALTER TABLE public.science_quizzes ADD COLUMN IF NOT EXISTS quiz_type TEXT DEFAULT 'checkpoint';
ALTER TABLE public.science_quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.science_quizzes DROP CONSTRAINT IF EXISTS science_quizzes_quiz_type_check;
ALTER TABLE public.science_quizzes ADD CONSTRAINT science_quizzes_quiz_type_check CHECK (quiz_type IN ('checkpoint', 'practice', 'final', 'diagnostic'));

ALTER TABLE public.science_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_skill_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_content_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.science_certificates ENABLE ROW LEVEL SECURITY;

-- Supabase SQL editor retries can leave policies behind after a partial run.
DROP POLICY IF EXISTS "Science subjects are readable" ON public.science_subjects;
DROP POLICY IF EXISTS "Science tracks are readable" ON public.science_tracks;
DROP POLICY IF EXISTS "Science courses are readable" ON public.science_courses;
DROP POLICY IF EXISTS "Science modules are readable" ON public.science_modules;
DROP POLICY IF EXISTS "Science lessons are readable" ON public.science_lessons;
DROP POLICY IF EXISTS "Science blocks are readable" ON public.science_lesson_blocks;
DROP POLICY IF EXISTS "Science public assets are readable" ON public.science_assets;
DROP POLICY IF EXISTS "Science skills are readable" ON public.science_skills;
DROP POLICY IF EXISTS "Science skill edges are readable" ON public.science_skill_edges;
DROP POLICY IF EXISTS "Science content skills are readable" ON public.science_content_skills;
DROP POLICY IF EXISTS "Science questions are readable" ON public.science_questions;
DROP POLICY IF EXISTS "Science question banks are readable" ON public.science_question_banks;
DROP POLICY IF EXISTS "Science quizzes are readable" ON public.science_quizzes;
DROP POLICY IF EXISTS "Science quiz questions are readable" ON public.science_quiz_questions;
DROP POLICY IF EXISTS "Users can view own science enrollments" ON public.science_enrollments;
DROP POLICY IF EXISTS "Users can enroll in science courses" ON public.science_enrollments;
DROP POLICY IF EXISTS "Users can update own science enrollment" ON public.science_enrollments;
DROP POLICY IF EXISTS "Users can view own science progress" ON public.science_activity_progress;
DROP POLICY IF EXISTS "Users can insert own science progress" ON public.science_activity_progress;
DROP POLICY IF EXISTS "Users can update own science progress" ON public.science_activity_progress;
DROP POLICY IF EXISTS "Users can view own science quiz attempts" ON public.science_quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own science quiz attempts" ON public.science_quiz_attempts;
DROP POLICY IF EXISTS "Users can view own science certificates" ON public.science_certificates;
DROP POLICY IF EXISTS "Public can verify science certificates" ON public.science_certificates;
DROP POLICY IF EXISTS "Admins manage science subjects" ON public.science_subjects;
DROP POLICY IF EXISTS "Admins manage science tracks" ON public.science_tracks;
DROP POLICY IF EXISTS "Admins manage science courses" ON public.science_courses;
DROP POLICY IF EXISTS "Admins manage science modules" ON public.science_modules;
DROP POLICY IF EXISTS "Admins manage science lessons" ON public.science_lessons;
DROP POLICY IF EXISTS "Admins manage science blocks" ON public.science_lesson_blocks;
DROP POLICY IF EXISTS "Admins manage science assets" ON public.science_assets;
DROP POLICY IF EXISTS "Admins manage science skills" ON public.science_skills;
DROP POLICY IF EXISTS "Admins manage science skill edges" ON public.science_skill_edges;
DROP POLICY IF EXISTS "Admins manage science content skills" ON public.science_content_skills;
DROP POLICY IF EXISTS "Admins manage science question banks" ON public.science_question_banks;
DROP POLICY IF EXISTS "Admins manage science questions" ON public.science_questions;
DROP POLICY IF EXISTS "Admins manage science quizzes" ON public.science_quizzes;
DROP POLICY IF EXISTS "Admins manage science quiz questions" ON public.science_quiz_questions;
DROP POLICY IF EXISTS "Admins issue science certificates" ON public.science_certificates;

CREATE POLICY "Science subjects are readable" ON public.science_subjects FOR SELECT USING (true);
CREATE POLICY "Science tracks are readable" ON public.science_tracks FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Science courses are readable" ON public.science_courses FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Science modules are readable" ON public.science_modules FOR SELECT USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.science_courses
    WHERE science_courses.id = science_modules.course_id
      AND science_courses.status = 'published'
      AND science_modules.is_published = true
  )
);
CREATE POLICY "Science lessons are readable" ON public.science_lessons FOR SELECT USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.science_modules
    JOIN public.science_courses ON science_courses.id = science_modules.course_id
    WHERE science_modules.id = science_lessons.module_id
      AND science_courses.status = 'published'
      AND science_modules.is_published = true
      AND science_lessons.is_published = true
  )
);
CREATE POLICY "Science blocks are readable" ON public.science_lesson_blocks FOR SELECT USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.science_lessons
    JOIN public.science_modules ON science_modules.id = science_lessons.module_id
    JOIN public.science_courses ON science_courses.id = science_modules.course_id
    WHERE science_lessons.id = science_lesson_blocks.lesson_id
      AND science_courses.status = 'published'
      AND science_modules.is_published = true
      AND science_lessons.is_published = true
  )
);
CREATE POLICY "Science public assets are readable" ON public.science_assets FOR SELECT USING (true);
CREATE POLICY "Science skills are readable" ON public.science_skills FOR SELECT USING (true);
CREATE POLICY "Science skill edges are readable" ON public.science_skill_edges FOR SELECT USING (true);
CREATE POLICY "Science content skills are readable" ON public.science_content_skills FOR SELECT USING (true);
CREATE POLICY "Science questions are readable" ON public.science_questions FOR SELECT USING (true);
CREATE POLICY "Science question banks are readable" ON public.science_question_banks FOR SELECT USING (true);
CREATE POLICY "Science quizzes are readable" ON public.science_quizzes FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Science quiz questions are readable" ON public.science_quiz_questions FOR SELECT USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.science_quizzes
    WHERE science_quizzes.id = science_quiz_questions.quiz_id
      AND science_quizzes.is_published = true
  )
);

CREATE POLICY "Users can view own science enrollments" ON public.science_enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can enroll in science courses" ON public.science_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own science enrollment" ON public.science_enrollments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own science progress" ON public.science_activity_progress FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own science progress" ON public.science_activity_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own science progress" ON public.science_activity_progress FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own science quiz attempts" ON public.science_quiz_attempts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own science quiz attempts" ON public.science_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own science certificates" ON public.science_certificates FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Public can verify science certificates" ON public.science_certificates FOR SELECT USING (true);

CREATE POLICY "Admins manage science subjects" ON public.science_subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science tracks" ON public.science_tracks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science courses" ON public.science_courses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science modules" ON public.science_modules FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science lessons" ON public.science_lessons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science blocks" ON public.science_lesson_blocks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science assets" ON public.science_assets FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science skills" ON public.science_skills FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science skill edges" ON public.science_skill_edges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science content skills" ON public.science_content_skills FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science question banks" ON public.science_question_banks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science questions" ON public.science_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science quizzes" ON public.science_quizzes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage science quiz questions" ON public.science_quiz_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins issue science certificates" ON public.science_certificates FOR INSERT WITH CHECK (public.is_admin());

INSERT INTO public.science_subjects (name, slug, description, icon_name, color, order_index)
VALUES
  ('Physics', 'physics', 'Mechanics, waves, fields, matter, and experiments.', 'atom', '#3b82f6', 1),
  ('Mathematics', 'mathematics', 'Algebra, calculus, proof, visualization, and modeling.', 'sigma', '#22c55e', 2),
  ('Computer Science', 'computer-science', 'Programming, algorithms, systems, data, and AI.', 'code', '#a855f7', 3),
  ('Chemistry', 'chemistry', 'Matter, reactions, molecules, and laboratory reasoning.', 'flask', '#f59e0b', 4),
  ('Biology & Medicine', 'biology-medicine', 'Life systems, physiology, health, and biological data.', 'dna', '#ec4899', 5),
  ('Engineering', 'engineering', 'Design, circuits, mechanics, controls, and applied systems.', 'cog', '#ef4444', 6)
ON CONFLICT (slug) DO NOTHING;


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


COMMIT;
