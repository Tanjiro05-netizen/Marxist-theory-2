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
