-- Keep Science assessment answers and reward-bearing writes off the public
-- Data API. Public RPC wrappers run as the caller; the privileged work lives
-- in the non-exposed private schema and validates auth.uid() itself.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE IF NOT EXISTS private.science_question_answers (
  question_id UUID PRIMARY KEY REFERENCES public.science_questions(id) ON DELETE CASCADE,
  correct_answer TEXT NOT NULL,
  tolerance NUMERIC,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE private.science_question_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.science_question_answers FROM PUBLIC, anon, authenticated;

-- Older imports could embed an entire question, including its answer, inside
-- a public lesson block. Promote those records to the question bank before
-- enforcing the safe block shape.
DO $$
DECLARE
  embedded RECORD;
  question_payload JSONB;
  new_question_id UUID;
  question_tags TEXT[];
BEGIN
  FOR embedded IN
    SELECT
      block.id AS block_id,
      block.content_json,
      block.content_json -> 'inline_question' AS question,
      course.subject_id
    FROM public.science_lesson_blocks AS block
    JOIN public.science_lessons AS lesson ON lesson.id = block.lesson_id
    JOIN public.science_modules AS module ON module.id = lesson.module_id
    JOIN public.science_courses AS course ON course.id = module.course_id
    WHERE block.block_type = 'exercise'
      AND jsonb_typeof(block.content_json -> 'inline_question') = 'object'
  LOOP
    question_payload := embedded.question;
    new_question_id := gen_random_uuid();

    SELECT COALESCE(array_agg(value), ARRAY[]::TEXT[])
      INTO question_tags
    FROM jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(question_payload -> 'tags') = 'array' THEN question_payload -> 'tags'
        ELSE '[]'::JSONB
      END
    ) AS tag(value);

    INSERT INTO public.science_questions (
      id,
      subject_id,
      question_type,
      prompt,
      options,
      correct_answer,
      tolerance,
      explanation,
      hint,
      difficulty,
      tags,
      metadata
    ) VALUES (
      new_question_id,
      embedded.subject_id,
      COALESCE(NULLIF(question_payload ->> 'question_type', ''), 'multiple_choice'),
      COALESCE(NULLIF(question_payload ->> 'prompt', ''), NULLIF(question_payload ->> 'question', ''), 'Untitled exercise'),
      CASE WHEN jsonb_typeof(question_payload -> 'options') = 'array' THEN question_payload -> 'options' ELSE NULL END,
      COALESCE(NULLIF(BTRIM(question_payload ->> 'correct_answer'), ''), '[unconfigured]'),
      CASE
        WHEN NULLIF(question_payload ->> 'tolerance', '') IS NULL THEN NULL
        ELSE (question_payload ->> 'tolerance')::NUMERIC
      END,
      NULLIF(question_payload ->> 'explanation', ''),
      NULLIF(question_payload ->> 'hint', ''),
      COALESCE(NULLIF(question_payload ->> 'difficulty', ''), 'beginner'),
      question_tags,
      COALESCE(question_payload -> 'metadata', '{}'::JSONB)
    );

    UPDATE public.science_lesson_blocks
    SET content_json = (content_json - 'inline_question') || jsonb_build_object('question_id', new_question_id::TEXT),
        updated_at = now()
    WHERE id = embedded.block_id;
  END LOOP;
END;
$$;

INSERT INTO private.science_question_answers (
  question_id,
  correct_answer,
  tolerance,
  explanation,
  created_at,
  updated_at
)
SELECT
  id,
  correct_answer,
  tolerance,
  explanation,
  created_at,
  updated_at
FROM public.science_questions
ON CONFLICT (question_id) DO UPDATE
SET correct_answer = EXCLUDED.correct_answer,
    tolerance = EXCLUDED.tolerance,
    explanation = EXCLUDED.explanation,
    updated_at = EXCLUDED.updated_at;

ALTER TABLE public.science_questions
  DROP COLUMN correct_answer,
  DROP COLUMN tolerance,
  DROP COLUMN explanation;

ALTER TABLE public.science_lesson_blocks
  DROP CONSTRAINT IF EXISTS science_exercise_answers_not_embedded;

ALTER TABLE public.science_lesson_blocks
  ADD CONSTRAINT science_exercise_answers_not_embedded CHECK (
    block_type <> 'exercise'
    OR (
      NOT (content_json ? 'inline_question')
      AND NOT (content_json ? 'correct_answer')
      AND NOT (content_json ? 'tolerance')
      AND NOT (content_json ? 'explanation')
    )
  );

-- Learners may read their own state, but all reward-bearing writes now go
-- through the validated RPCs below. service_role remains unaffected.
DROP POLICY IF EXISTS "Users can enroll in science courses" ON public.science_enrollments;
DROP POLICY IF EXISTS "Users can update own science enrollment" ON public.science_enrollments;
DROP POLICY IF EXISTS "Users can insert own science progress" ON public.science_activity_progress;
DROP POLICY IF EXISTS "Users can update own science progress" ON public.science_activity_progress;
DROP POLICY IF EXISTS "Users can insert own science quiz attempts" ON public.science_quiz_attempts;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.science_enrollments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.science_activity_progress FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.science_quiz_attempts FROM anon, authenticated;

GRANT SELECT ON TABLE public.science_enrollments TO authenticated;
GRANT SELECT ON TABLE public.science_activity_progress TO authenticated;
GRANT SELECT ON TABLE public.science_quiz_attempts TO authenticated;

UPDATE public.science_enrollments
SET progress_percent = LEAST(100, GREATEST(0, COALESCE(progress_percent, 0)));

UPDATE public.science_activity_progress
SET progress_percent = LEAST(100, GREATEST(0, COALESCE(progress_percent, 0))),
    xp_earned = GREATEST(0, COALESCE(xp_earned, 0));

UPDATE public.science_quiz_attempts
SET score = LEAST(100, GREATEST(0, score)),
    total_points = GREATEST(1, total_points);

ALTER TABLE public.science_enrollments
  DROP CONSTRAINT IF EXISTS science_enrollments_progress_percent_check;
ALTER TABLE public.science_enrollments
  ADD CONSTRAINT science_enrollments_progress_percent_check CHECK (progress_percent BETWEEN 0 AND 100);

ALTER TABLE public.science_activity_progress
  DROP CONSTRAINT IF EXISTS science_activity_progress_values_check;
ALTER TABLE public.science_activity_progress
  ADD CONSTRAINT science_activity_progress_values_check CHECK (
    progress_percent BETWEEN 0 AND 100 AND xp_earned >= 0
  );

ALTER TABLE public.science_quiz_attempts
  DROP CONSTRAINT IF EXISTS science_quiz_attempts_values_check;
ALTER TABLE public.science_quiz_attempts
  ADD CONSTRAINT science_quiz_attempts_values_check CHECK (
    score BETWEEN 0 AND 100 AND total_points > 0
  );

CREATE OR REPLACE FUNCTION private.science_answer_is_correct(
  question_type TEXT,
  expected_answer TEXT,
  accepted_tolerance NUMERIC,
  submitted_answer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  expected_number NUMERIC;
  submitted_number NUMERIC;
BEGIN
  IF question_type = 'numeric' THEN
    BEGIN
      expected_number := BTRIM(expected_answer)::NUMERIC;
      submitted_number := BTRIM(submitted_answer)::NUMERIC;
    EXCEPTION
      WHEN invalid_text_representation THEN
        RETURN false;
    END;

    RETURN ABS(expected_number - submitted_number) <= COALESCE(accepted_tolerance, 0);
  END IF;

  RETURN LOWER(BTRIM(COALESCE(submitted_answer, ''))) = LOWER(BTRIM(COALESCE(expected_answer, '')));
END;
$$;

CREATE OR REPLACE FUNCTION private.enroll_in_science_course(p_course_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  enrollment public.science_enrollments%ROWTYPE;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.science_courses AS course
    WHERE course.id = p_course_id
      AND course.status = 'published'
  ) THEN
    RAISE EXCEPTION 'Published course not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.science_enrollments (user_id, course_id, role, status)
  VALUES (caller_id, p_course_id, 'learner', 'active')
  ON CONFLICT (user_id, course_id) DO UPDATE
  SET status = CASE
        WHEN public.science_enrollments.role = 'learner' THEN 'active'
        ELSE public.science_enrollments.status
      END
  RETURNING * INTO enrollment;

  RETURN to_jsonb(enrollment);
END;
$$;

CREATE OR REPLACE FUNCTION private.complete_science_lesson(p_lesson_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  lesson_record RECORD;
  progress_record public.science_activity_progress%ROWTYPE;
  required_lessons INTEGER := 0;
  completed_lessons INTEGER := 0;
  course_progress INTEGER := 0;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT
    lesson.id,
    lesson.module_id,
    lesson.xp_reward,
    module.course_id
  INTO lesson_record
  FROM public.science_lessons AS lesson
  JOIN public.science_modules AS module ON module.id = lesson.module_id
  JOIN public.science_courses AS course ON course.id = module.course_id
  WHERE lesson.id = p_lesson_id
    AND lesson.is_published = true
    AND module.is_published = true
    AND course.status = 'published';

  IF lesson_record.id IS NULL THEN
    RAISE EXCEPTION 'Published lesson not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.science_enrollments AS enrollment
    WHERE enrollment.user_id = caller_id
      AND enrollment.course_id = lesson_record.course_id
      AND enrollment.status IN ('active', 'completed')
  ) THEN
    RAISE EXCEPTION 'Active course enrollment required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(caller_id::TEXT || ':' || p_lesson_id::TEXT, 0)
  );

  SELECT *
  INTO progress_record
  FROM public.science_activity_progress AS progress
  WHERE progress.user_id = caller_id
    AND progress.lesson_id = p_lesson_id
    AND progress.block_id IS NULL
  ORDER BY progress.started_at
  LIMIT 1
  FOR UPDATE;

  IF progress_record.id IS NULL THEN
    INSERT INTO public.science_activity_progress (
      user_id,
      course_id,
      module_id,
      lesson_id,
      block_id,
      state,
      progress_percent,
      xp_earned,
      completed_at
    ) VALUES (
      caller_id,
      lesson_record.course_id,
      lesson_record.module_id,
      lesson_record.id,
      NULL,
      'completed',
      100,
      GREATEST(0, COALESCE(lesson_record.xp_reward, 10)),
      now()
    )
    RETURNING * INTO progress_record;
  ELSIF progress_record.state <> 'completed' THEN
    UPDATE public.science_activity_progress
    SET course_id = lesson_record.course_id,
        module_id = lesson_record.module_id,
        state = 'completed',
        progress_percent = 100,
        xp_earned = GREATEST(0, COALESCE(lesson_record.xp_reward, 10)),
        completed_at = now()
    WHERE id = progress_record.id
    RETURNING * INTO progress_record;
  END IF;

  SELECT COUNT(*)
  INTO required_lessons
  FROM public.science_lessons AS lesson
  JOIN public.science_modules AS module ON module.id = lesson.module_id
  WHERE module.course_id = lesson_record.course_id
    AND module.is_published = true
    AND lesson.is_published = true
    AND lesson.is_required = true;

  SELECT COUNT(DISTINCT progress.lesson_id)
  INTO completed_lessons
  FROM public.science_activity_progress AS progress
  JOIN public.science_lessons AS lesson ON lesson.id = progress.lesson_id
  JOIN public.science_modules AS module ON module.id = lesson.module_id
  WHERE progress.user_id = caller_id
    AND progress.course_id = lesson_record.course_id
    AND progress.block_id IS NULL
    AND progress.state = 'completed'
    AND module.is_published = true
    AND lesson.is_published = true
    AND lesson.is_required = true;

  course_progress := CASE
    WHEN required_lessons = 0 THEN 100
    ELSE LEAST(100, ROUND((completed_lessons::NUMERIC / required_lessons::NUMERIC) * 100)::INTEGER)
  END;

  UPDATE public.science_enrollments
  SET progress_percent = course_progress,
      status = CASE WHEN course_progress = 100 THEN 'completed' ELSE status END,
      completed_at = CASE WHEN course_progress = 100 THEN COALESCE(completed_at, now()) ELSE completed_at END
  WHERE user_id = caller_id
    AND course_id = lesson_record.course_id;

  RETURN jsonb_build_object(
    'progress', to_jsonb(progress_record),
    'courseProgress', course_progress,
    'xpEarned', progress_record.xp_earned
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.check_science_question(
  p_question_id UUID,
  p_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  question_record RECORD;
  is_correct BOOLEAN;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT
    question.question_type,
    answer.correct_answer,
    answer.tolerance,
    answer.explanation
  INTO question_record
  FROM public.science_questions AS question
  JOIN private.science_question_answers AS answer ON answer.question_id = question.id
  WHERE question.id = p_question_id
    AND EXISTS (
      SELECT 1
      FROM public.science_lesson_blocks AS block
      JOIN public.science_lessons AS lesson ON lesson.id = block.lesson_id
      JOIN public.science_modules AS module ON module.id = lesson.module_id
      JOIN public.science_courses AS course ON course.id = module.course_id
      JOIN public.science_enrollments AS enrollment
        ON enrollment.course_id = course.id
       AND enrollment.user_id = caller_id
       AND enrollment.status IN ('active', 'completed')
      WHERE block.block_type = 'exercise'
        AND block.content_json ->> 'question_id' = p_question_id::TEXT
        AND lesson.is_published = true
        AND module.is_published = true
        AND course.status = 'published'
    );

  IF question_record.correct_answer IS NULL THEN
    RAISE EXCEPTION 'Published exercise question not found' USING ERRCODE = 'P0002';
  END IF;

  is_correct := private.science_answer_is_correct(
    question_record.question_type,
    question_record.correct_answer,
    question_record.tolerance,
    COALESCE(p_answer, '')
  );

  RETURN jsonb_build_object(
    'is_correct', is_correct,
    'correct_answer', question_record.correct_answer,
    'explanation', question_record.explanation
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.submit_science_quiz_attempt(
  p_quiz_id UUID,
  p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  quiz_record RECORD;
  question_record RECORD;
  submitted_answer TEXT;
  is_correct BOOLEAN;
  total_points INTEGER := 0;
  earned_points INTEGER := 0;
  score_percent INTEGER := 0;
  did_pass BOOLEAN := false;
  prior_attempts INTEGER := 0;
  stored_results JSONB := '[]'::JSONB;
  returned_results JSONB := '[]'::JSONB;
  attempt_record public.science_quiz_attempts%ROWTYPE;
  reveal_feedback BOOLEAN := false;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RAISE EXCEPTION 'Answers must be a JSON object' USING ERRCODE = '22023';
  END IF;

  SELECT
    quiz.id,
    quiz.passing_score,
    quiz.attempts_allowed,
    quiz.feedback_policy,
    COALESCE(quiz.course_id, direct_module.course_id, lesson_module.course_id) AS course_id
  INTO quiz_record
  FROM public.science_quizzes AS quiz
  LEFT JOIN public.science_modules AS direct_module ON direct_module.id = quiz.module_id
  LEFT JOIN public.science_lessons AS lesson ON lesson.id = quiz.lesson_id
  LEFT JOIN public.science_modules AS lesson_module ON lesson_module.id = lesson.module_id
  JOIN public.science_courses AS course
    ON course.id = COALESCE(quiz.course_id, direct_module.course_id, lesson_module.course_id)
  WHERE quiz.id = p_quiz_id
    AND quiz.is_published = true
    AND course.status = 'published';

  IF quiz_record.id IS NULL THEN
    RAISE EXCEPTION 'Published quiz not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.science_enrollments AS enrollment
    WHERE enrollment.user_id = caller_id
      AND enrollment.course_id = quiz_record.course_id
      AND enrollment.status IN ('active', 'completed')
  ) THEN
    RAISE EXCEPTION 'Active course enrollment required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(caller_id::TEXT || ':' || p_quiz_id::TEXT, 0)
  );

  SELECT COUNT(*)
  INTO prior_attempts
  FROM public.science_quiz_attempts AS attempt
  WHERE attempt.user_id = caller_id
    AND attempt.quiz_id = p_quiz_id;

  IF quiz_record.attempts_allowed IS NOT NULL
    AND quiz_record.attempts_allowed > 0
    AND prior_attempts >= quiz_record.attempts_allowed THEN
    RAISE EXCEPTION 'No quiz attempts remaining' USING ERRCODE = 'P0001';
  END IF;

  reveal_feedback := COALESCE(quiz_record.feedback_policy, 'after_submit') <> 'hidden';

  FOR question_record IN
    SELECT
      question.id,
      question.prompt,
      question.question_type,
      link.points,
      answer.correct_answer,
      answer.tolerance,
      answer.explanation
    FROM public.science_quiz_questions AS link
    JOIN public.science_questions AS question ON question.id = link.question_id
    JOIN private.science_question_answers AS answer ON answer.question_id = question.id
    WHERE link.quiz_id = p_quiz_id
    ORDER BY link.order_index, link.id
  LOOP
    submitted_answer := COALESCE(p_answers ->> question_record.id::TEXT, '');
    is_correct := private.science_answer_is_correct(
      question_record.question_type,
      question_record.correct_answer,
      question_record.tolerance,
      submitted_answer
    );

    total_points := total_points + GREATEST(0, COALESCE(question_record.points, 1));
    IF is_correct THEN
      earned_points := earned_points + GREATEST(0, COALESCE(question_record.points, 1));
    END IF;

    stored_results := stored_results || jsonb_build_array(jsonb_build_object(
      'question_id', question_record.id,
      'user_answer', submitted_answer,
      'is_correct', is_correct,
      'points', GREATEST(0, COALESCE(question_record.points, 1))
    ));

    returned_results := returned_results || jsonb_build_array(jsonb_build_object(
      'question_id', question_record.id,
      'prompt', question_record.prompt,
      'user_answer', submitted_answer,
      'correct_answer', CASE WHEN reveal_feedback THEN question_record.correct_answer ELSE NULL END,
      'is_correct', is_correct,
      'points', GREATEST(0, COALESCE(question_record.points, 1)),
      'explanation', CASE WHEN reveal_feedback THEN question_record.explanation ELSE NULL END
    ));
  END LOOP;

  IF total_points <= 0 THEN
    RAISE EXCEPTION 'Quiz has no scorable questions' USING ERRCODE = '22023';
  END IF;

  score_percent := ROUND((earned_points::NUMERIC / total_points::NUMERIC) * 100)::INTEGER;
  did_pass := score_percent >= COALESCE(quiz_record.passing_score, 70);

  INSERT INTO public.science_quiz_attempts (
    user_id,
    quiz_id,
    score,
    total_points,
    passed,
    answers,
    started_at,
    completed_at
  ) VALUES (
    caller_id,
    p_quiz_id,
    score_percent,
    total_points,
    did_pass,
    stored_results,
    now(),
    now()
  )
  RETURNING * INTO attempt_record;

  RETURN jsonb_build_object(
    'attemptId', attempt_record.id,
    'attemptNumber', prior_attempts + 1,
    'attemptsRemaining', CASE
      WHEN quiz_record.attempts_allowed IS NULL OR quiz_record.attempts_allowed <= 0 THEN NULL
      ELSE GREATEST(0, quiz_record.attempts_allowed - prior_attempts - 1)
    END,
    'score', score_percent,
    'earnedPoints', earned_points,
    'totalPoints', total_points,
    'passed', did_pass,
    'startedAt', attempt_record.started_at,
    'completedAt', attempt_record.completed_at,
    'questionResults', returned_results
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.save_science_question(p_question JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  saved_question_id UUID;
  saved_question public.science_questions%ROWTYPE;
  answer_text TEXT;
  answer_tolerance NUMERIC;
  answer_explanation TEXT;
  question_tags TEXT[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;

  IF p_question IS NULL OR jsonb_typeof(p_question) <> 'object' THEN
    RAISE EXCEPTION 'Question payload must be a JSON object' USING ERRCODE = '22023';
  END IF;

  answer_text := NULLIF(BTRIM(p_question ->> 'correct_answer'), '');
  IF NULLIF(BTRIM(p_question ->> 'prompt'), '') IS NULL OR answer_text IS NULL THEN
    RAISE EXCEPTION 'Prompt and correct answer are required' USING ERRCODE = '22023';
  END IF;

  saved_question_id := COALESCE(NULLIF(p_question ->> 'id', '')::UUID, gen_random_uuid());
  answer_tolerance := CASE
    WHEN NULLIF(p_question ->> 'tolerance', '') IS NULL THEN NULL
    ELSE (p_question ->> 'tolerance')::NUMERIC
  END;
  answer_explanation := NULLIF(p_question ->> 'explanation', '');

  SELECT COALESCE(array_agg(value), ARRAY[]::TEXT[])
  INTO question_tags
  FROM jsonb_array_elements_text(
    CASE
      WHEN jsonb_typeof(p_question -> 'tags') = 'array' THEN p_question -> 'tags'
      ELSE '[]'::JSONB
    END
  ) AS tag(value);

  INSERT INTO public.science_questions (
    id,
    bank_id,
    subject_id,
    question_type,
    prompt,
    options,
    hint,
    difficulty,
    tags,
    metadata,
    updated_at
  ) VALUES (
    saved_question_id,
    NULLIF(p_question ->> 'bank_id', '')::UUID,
    NULLIF(p_question ->> 'subject_id', '')::UUID,
    COALESCE(NULLIF(p_question ->> 'question_type', ''), 'multiple_choice'),
    BTRIM(p_question ->> 'prompt'),
    CASE WHEN jsonb_typeof(p_question -> 'options') = 'array' THEN p_question -> 'options' ELSE NULL END,
    NULLIF(p_question ->> 'hint', ''),
    COALESCE(NULLIF(p_question ->> 'difficulty', ''), 'beginner'),
    question_tags,
    COALESCE(p_question -> 'metadata', '{}'::JSONB),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET bank_id = EXCLUDED.bank_id,
      subject_id = EXCLUDED.subject_id,
      question_type = EXCLUDED.question_type,
      prompt = EXCLUDED.prompt,
      options = EXCLUDED.options,
      hint = EXCLUDED.hint,
      difficulty = EXCLUDED.difficulty,
      tags = EXCLUDED.tags,
      metadata = EXCLUDED.metadata,
      updated_at = now()
  RETURNING * INTO saved_question;

  INSERT INTO private.science_question_answers (
    question_id,
    correct_answer,
    tolerance,
    explanation,
    updated_at
  ) VALUES (
    saved_question_id,
    answer_text,
    answer_tolerance,
    answer_explanation,
    now()
  )
  ON CONFLICT (question_id) DO UPDATE
  SET correct_answer = EXCLUDED.correct_answer,
      tolerance = EXCLUDED.tolerance,
      explanation = EXCLUDED.explanation,
      updated_at = now();

  RETURN to_jsonb(saved_question) || jsonb_build_object(
    'correct_answer', answer_text,
    'tolerance', answer_tolerance,
    'explanation', answer_explanation
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.list_science_questions(
  p_subject_id UUID,
  p_limit INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  questions JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(question_row.payload ORDER BY question_row.updated_at DESC), '[]'::JSONB)
  INTO questions
  FROM (
    SELECT
      question.updated_at,
      to_jsonb(question)
        || jsonb_build_object(
          'correct_answer', answer.correct_answer,
          'tolerance', answer.tolerance,
          'explanation', answer.explanation,
          'science_subjects', CASE
            WHEN subject.id IS NULL THEN NULL
            ELSE jsonb_build_object('name', subject.name, 'color', subject.color)
          END
        ) AS payload
    FROM public.science_questions AS question
    JOIN private.science_question_answers AS answer ON answer.question_id = question.id
    LEFT JOIN public.science_subjects AS subject ON subject.id = question.subject_id
    WHERE p_subject_id IS NULL OR question.subject_id = p_subject_id
    ORDER BY question.updated_at DESC
    LIMIT LEAST(500, GREATEST(1, COALESCE(p_limit, 200)))
  ) AS question_row;

  RETURN questions;
END;
$$;

-- Public wrappers remain SECURITY INVOKER. They cannot bypass RLS or grants;
-- they only dispatch to tightly scoped private functions that validate auth.
CREATE OR REPLACE FUNCTION public.enroll_in_science_course(p_course_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.enroll_in_science_course(p_course_id);
$$;

CREATE OR REPLACE FUNCTION public.complete_science_lesson(p_lesson_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.complete_science_lesson(p_lesson_id);
$$;

CREATE OR REPLACE FUNCTION public.check_science_question(p_question_id UUID, p_answer TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.check_science_question(p_question_id, p_answer);
$$;

CREATE OR REPLACE FUNCTION public.submit_science_quiz_attempt(p_quiz_id UUID, p_answers JSONB)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.submit_science_quiz_attempt(p_quiz_id, p_answers);
$$;

CREATE OR REPLACE FUNCTION public.save_science_question(p_question JSONB)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.save_science_question(p_question);
$$;

CREATE OR REPLACE FUNCTION public.list_science_questions(p_subject_id UUID DEFAULT NULL, p_limit INTEGER DEFAULT 200)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.list_science_questions(p_subject_id, p_limit);
$$;

REVOKE EXECUTE ON FUNCTION private.science_answer_is_correct(TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.enroll_in_science_course(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.complete_science_lesson(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.check_science_question(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.submit_science_quiz_attempt(UUID, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.save_science_question(JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.list_science_questions(UUID, INTEGER) FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.enroll_in_science_course(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_science_lesson(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_science_question(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_science_quiz_attempt(UUID, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_science_question(JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_science_questions(UUID, INTEGER) FROM PUBLIC, anon;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.enroll_in_science_course(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.complete_science_lesson(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.check_science_question(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.submit_science_quiz_attempt(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION private.save_science_question(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION private.list_science_questions(UUID, INTEGER) TO authenticated;

GRANT EXECUTE ON FUNCTION public.enroll_in_science_course(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_science_lesson(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_science_question(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_science_quiz_attempt(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_science_question(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_science_questions(UUID, INTEGER) TO authenticated;
