-- PHY111 interactive course platform.
-- New interactive block kinds, per-block learner evidence, module unlock
-- enforcement, quiz slugs, and the spaced-review (mistakes hub) system.
-- Follows the secure-science house style: learner-visible writes only through
-- validated private RPCs; public wrappers stay SECURITY INVOKER.

-- ---------------------------------------------------------------------------
-- 1. Interactive block kinds
-- ---------------------------------------------------------------------------
ALTER TABLE public.science_lesson_blocks
  DROP CONSTRAINT IF EXISTS science_lesson_blocks_block_type_check;

ALTER TABLE public.science_lesson_blocks
  ADD CONSTRAINT science_lesson_blocks_block_type_check CHECK (block_type IN (
    'rich_text', 'math', 'worked_example', 'video', 'simulation_embed',
    'exercise', 'quiz', 'callout', 'image',
    'interactive_widget', 'sim_lab', 'motion_lab', 'graph_table_lab',
    'fbd_builder', 'worked_example_studio', 'debug_task', 'constructed_response'
  ));

-- ---------------------------------------------------------------------------
-- 2. Quiz slugs (stable addresses for unlock rules and seed content)
-- ---------------------------------------------------------------------------
ALTER TABLE public.science_quizzes
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_science_quizzes_course_slug
  ON public.science_quizzes(course_id, slug)
  WHERE slug IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Per-block learner evidence (labs, studios, constructed responses)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.science_block_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.science_courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.science_lessons(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES public.science_lesson_blocks(id) ON DELETE CASCADE,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  state TEXT CHECK (state IN ('started', 'completed')) DEFAULT 'started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, block_id)
);

CREATE INDEX IF NOT EXISTS idx_science_evidence_user_course ON public.science_block_evidence(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_science_evidence_lesson ON public.science_block_evidence(lesson_id);

ALTER TABLE public.science_block_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own science block evidence" ON public.science_block_evidence;
CREATE POLICY "Users can view own science block evidence" ON public.science_block_evidence
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Evidence writes are reward-bearing state: RPC only, no direct table access.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.science_block_evidence FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.science_block_evidence TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Spaced review cards (mistakes hub, Leitner 1/3/7/21 ladder)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.science_review_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.science_questions(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.science_courses(id) ON DELETE CASCADE,
  box INT NOT NULL DEFAULT 0 CHECK (box BETWEEN 0 AND 3),
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  times_seen INT NOT NULL DEFAULT 0,
  source_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_science_review_cards_user_due ON public.science_review_cards(user_id, due_at);

ALTER TABLE public.science_review_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own science review cards" ON public.science_review_cards;
CREATE POLICY "Users can view own science review cards" ON public.science_review_cards
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON TABLE public.science_review_cards FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.science_review_cards TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. save_science_block_evidence RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.save_science_block_evidence(
  p_block_id UUID,
  p_evidence JSONB,
  p_state TEXT DEFAULT 'started'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  block_record RECORD;
  saved_record public.science_block_evidence%ROWTYPE;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_evidence IS NULL OR jsonb_typeof(p_evidence) <> 'object' THEN
    RAISE EXCEPTION 'Evidence must be a JSON object' USING ERRCODE = '22023';
  END IF;

  IF octet_length(p_evidence::TEXT) > 65536 THEN
    RAISE EXCEPTION 'Evidence payload too large (64 KB limit)' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_state, 'started') NOT IN ('started', 'completed') THEN
    RAISE EXCEPTION 'Invalid evidence state' USING ERRCODE = '22023';
  END IF;

  SELECT
    block.id AS block_id,
    lesson.id AS lesson_id,
    module.course_id AS course_id
  INTO block_record
  FROM public.science_lesson_blocks AS block
  JOIN public.science_lessons AS lesson ON lesson.id = block.lesson_id
  JOIN public.science_modules AS module ON module.id = lesson.module_id
  JOIN public.science_courses AS course ON course.id = module.course_id
  WHERE block.id = p_block_id
    AND lesson.is_published = true
    AND module.is_published = true
    AND course.status = 'published';

  IF block_record.block_id IS NULL THEN
    RAISE EXCEPTION 'Published lesson block not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.science_enrollments AS enrollment
    WHERE enrollment.user_id = caller_id
      AND enrollment.course_id = block_record.course_id
      AND enrollment.status IN ('active', 'completed')
  ) THEN
    RAISE EXCEPTION 'Active course enrollment required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.science_block_evidence (
    user_id, course_id, lesson_id, block_id, evidence, state, updated_at
  ) VALUES (
    caller_id, block_record.course_id, block_record.lesson_id, block_record.block_id,
    p_evidence, COALESCE(p_state, 'started'), now()
  )
  ON CONFLICT (user_id, block_id) DO UPDATE
  SET evidence = p_evidence,
      state = CASE
        WHEN COALESCE(p_state, 'started') = 'completed' THEN 'completed'
        ELSE public.science_block_evidence.state
      END,
      updated_at = now()
  RETURNING * INTO saved_record;

  -- Mirror block completion into activity progress so course/lesson views can
  -- show block-level completion without another query path.
  INSERT INTO public.science_activity_progress (
    user_id, course_id, module_id, lesson_id, block_id, state, progress_percent, xp_earned, completed_at
  )
  SELECT
    caller_id, block_record.course_id, lesson.module_id, lesson.id, block_record.block_id,
    saved_record.state,
    CASE WHEN saved_record.state = 'completed' THEN 100 ELSE 0 END,
    0,
    CASE WHEN saved_record.state = 'completed' THEN now() ELSE NULL END
  FROM public.science_lessons AS lesson
  WHERE lesson.id = block_record.lesson_id
  ON CONFLICT (user_id, lesson_id, block_id) DO UPDATE
  SET state = EXCLUDED.state,
      progress_percent = EXCLUDED.progress_percent,
      completed_at = COALESCE(EXCLUDED.completed_at, public.science_activity_progress.completed_at);

  RETURN to_jsonb(saved_record);
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Module unlock enforcement inside complete_science_lesson
--    unlock_conditions shapes supported on science_modules:
--      {"previous_module": "complete"}                      -- all required lessons of every earlier published module completed
--      {"quiz_slugs": ["m01-mastery"]}                      -- named quizzes passed (by slug, course-scoped)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.science_module_unlocked(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_order INT;
  course_id UUID;
  conditions JSONB;
  prev_required INT := 0;
  prev_completed INT := 0;
  quiz_slug TEXT;
  quiz_passed BOOLEAN;
BEGIN
  SELECT module.order_index, module.course_id, module.unlock_conditions
  INTO target_order, course_id, conditions
  FROM public.science_modules AS module
  WHERE module.id = p_module_id;

  IF course_id IS NULL THEN
    RETURN true;
  END IF;

  IF conditions IS NULL OR jsonb_typeof(conditions) <> 'object' THEN
    RETURN true;
  END IF;

  IF conditions ->> 'previous_module' = 'complete' THEN
    SELECT COUNT(*)
    INTO prev_required
    FROM public.science_lessons AS lesson
    JOIN public.science_modules AS module ON module.id = lesson.module_id
    WHERE module.course_id = course_id
      AND module.is_published = true
      AND module.order_index < target_order
      AND lesson.is_published = true
      AND lesson.is_required = true;

    SELECT COUNT(*)
    INTO prev_completed
    FROM public.science_activity_progress AS progress
    JOIN public.science_lessons AS lesson ON lesson.id = progress.lesson_id
    JOIN public.science_modules AS module ON module.id = lesson.module_id
    WHERE progress.user_id = p_user_id
      AND progress.course_id = course_id
      AND progress.block_id IS NULL
      AND progress.state = 'completed'
      AND module.is_published = true
      AND module.order_index < target_order
      AND lesson.is_published = true
      AND lesson.is_required = true;

    IF prev_completed < prev_required THEN
      RETURN false;
    END IF;
  END IF;

  IF jsonb_typeof(conditions -> 'quiz_slugs') = 'array' THEN
    FOR quiz_slug IN SELECT jsonb_array_elements_text(conditions -> 'quiz_slugs')
    LOOP
      SELECT EXISTS (
        SELECT 1
        FROM public.science_quiz_attempts AS attempt
        JOIN public.science_quizzes AS quiz ON quiz.id = attempt.quiz_id
        WHERE attempt.user_id = p_user_id
          AND quiz.course_id = course_id
          AND quiz.slug = quiz_slug
          AND attempt.passed = true
      )
      INTO quiz_passed;

      IF NOT quiz_passed THEN
        RETURN false;
      END IF;
    END LOOP;
  END IF;

  RETURN true;
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
    module.course_id,
    module.id AS module_id_resolved
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

  IF NOT private.science_module_unlocked(caller_id, lesson_record.module_id) THEN
    RAISE EXCEPTION 'Module locked: complete the previous module requirements first' USING ERRCODE = 'P0001';
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

-- ---------------------------------------------------------------------------
-- 7. Review cards: auto-created on wrong quiz answers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.upsert_science_review_card(
  p_user_id UUID,
  p_question_id UUID,
  p_course_id UUID,
  p_source_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.science_review_cards (user_id, question_id, course_id, box, due_at, source_meta, updated_at)
  VALUES (p_user_id, p_question_id, p_course_id, 0, now() + INTERVAL '1 day', p_source_meta, now())
  ON CONFLICT (user_id, question_id) DO UPDATE
  SET box = 0,
      due_at = now() + INTERVAL '1 day',
      updated_at = now();
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
    ELSE
      -- Missed items feed the spaced-review mistakes hub (due tomorrow).
      PERFORM private.upsert_science_review_card(
        caller_id,
        question_record.id,
        quiz_record.course_id,
        jsonb_build_object('kind', 'quiz_miss', 'quiz_id', p_quiz_id)
      );
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

-- ---------------------------------------------------------------------------
-- 8. Review card listing + Leitner rating (1/3/7/21 days)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.list_science_review_cards(
  p_course_id UUID DEFAULT NULL,
  p_due_only BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  cards JSONB;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(card_row.payload ORDER BY card_row.due_at), '[]'::JSONB)
  INTO cards
  FROM (
    SELECT
      card.due_at,
      jsonb_build_object(
        'questionId', question.id,
        'prompt', question.prompt,
        'questionType', question.question_type,
        'options', question.options,
        'hint', question.hint,
        'metadata', question.metadata,
        'tags', question.tags,
        'box', card.box,
        'dueAt', card.due_at,
        'timesSeen', card.times_seen,
        'courseId', card.course_id,
        'reviewAnswer', answer.correct_answer,
        'reviewTolerance', answer.tolerance,
        'explanation', answer.explanation
      ) AS payload
    FROM public.science_review_cards AS card
    JOIN public.science_questions AS question ON question.id = card.question_id
    JOIN private.science_question_answers AS answer ON answer.question_id = card.question_id
    WHERE card.user_id = caller_id
      AND (p_course_id IS NULL OR card.course_id = p_course_id)
      AND (NOT p_due_only OR card.due_at <= now())
  ) AS card_row;

  RETURN cards;
END;
$$;

CREATE OR REPLACE FUNCTION private.rate_science_review_card(
  p_question_id UUID,
  p_rating TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  new_box INT;
  new_due TIMESTAMPTZ;
  intervals INT[] := ARRAY[1, 3, 7, 21];
  rated_card public.science_review_cards%ROWTYPE;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_rating NOT IN ('again', 'hard', 'good', 'easy') THEN
    RAISE EXCEPTION 'Rating must be again, hard, good, or easy' USING ERRCODE = '22023';
  END IF;

  -- Rating maps directly onto the fixed 1/3/7/21-day ladder (box = interval index);
  -- 'again' resets to the shortest interval.
  new_box := CASE p_rating
    WHEN 'again' THEN 0
    WHEN 'hard' THEN 1
    WHEN 'good' THEN 2
    ELSE 3
  END;

  new_due := now() + make_interval(days => intervals[new_box + 1]);

  UPDATE public.science_review_cards
  SET box = new_box,
      due_at = new_due,
      last_seen_at = now(),
      times_seen = times_seen + 1,
      updated_at = now()
  WHERE user_id = caller_id
    AND question_id = p_question_id
  RETURNING * INTO rated_card;

  IF rated_card.id IS NULL THEN
    RAISE EXCEPTION 'Review card not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'box', rated_card.box,
    'dueAt', rated_card.due_at,
    'timesSeen', rated_card.times_seen
  );
END;
$$;

-- Also let learners seed a review card from any exercise block they missed.
CREATE OR REPLACE FUNCTION private.add_science_review_card(p_question_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  course_id UUID;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT course.id
  INTO course_id
  FROM public.science_questions AS question
  JOIN public.science_lesson_blocks AS block ON block.content_json ->> 'question_id' = p_question_id::TEXT
  JOIN public.science_lessons AS lesson ON lesson.id = block.lesson_id
  JOIN public.science_modules AS module ON module.id = lesson.module_id
  JOIN public.science_courses AS course ON course.id = module.course_id
  WHERE question.id = p_question_id
    AND block.block_type = 'exercise'
  LIMIT 1;

  PERFORM private.upsert_science_review_card(
    caller_id,
    p_question_id,
    course_id,
    jsonb_build_object('kind', 'manual_add')
  );

  RETURN jsonb_build_object('added', true, 'questionId', p_question_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Public wrappers (SECURITY INVOKER) + grants
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_science_block_evidence(p_block_id UUID, p_evidence JSONB, p_state TEXT DEFAULT 'started')
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.save_science_block_evidence(p_block_id, p_evidence, p_state);
$$;

CREATE OR REPLACE FUNCTION public.list_science_review_cards(p_course_id UUID DEFAULT NULL, p_due_only BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.list_science_review_cards(p_course_id, p_due_only);
$$;

CREATE OR REPLACE FUNCTION public.rate_science_review_card(p_question_id UUID, p_rating TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.rate_science_review_card(p_question_id, p_rating);
$$;

CREATE OR REPLACE FUNCTION public.add_science_review_card(p_question_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.add_science_review_card(p_question_id);
$$;

CREATE OR REPLACE FUNCTION public.get_science_module_unlock_state(p_course_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  modules JSONB;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'moduleId', module.id,
    'slug', module.slug,
    'unlocked', private.science_module_unlocked(caller_id, module.id)
  ) ORDER BY module.order_index), '[]'::JSONB)
  INTO modules
  FROM public.science_modules AS module
  WHERE module.course_id = p_course_id
    AND module.is_published = true;

  RETURN modules;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.save_science_block_evidence(UUID, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.science_module_unlocked(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.upsert_science_review_card(UUID, UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.list_science_review_cards(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.rate_science_review_card(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.add_science_review_card(UUID) FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.save_science_block_evidence(UUID, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_science_review_cards(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rate_science_review_card(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_science_review_card(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_science_module_unlock_state(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.save_science_block_evidence(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.list_science_review_cards(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION private.rate_science_review_card(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.add_science_review_card(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_science_block_evidence(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_science_review_cards(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rate_science_review_card(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_science_review_card(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_science_module_unlock_state(UUID) TO authenticated;
