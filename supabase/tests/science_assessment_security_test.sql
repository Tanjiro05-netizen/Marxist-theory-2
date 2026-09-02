BEGIN;
SELECT plan(18);

SELECT ok(
  to_regclass('private.science_question_answers') IS NOT NULL,
  'answer material lives in a private table'
);

SELECT hasnt_column(
  'public',
  'science_questions',
  'correct_answer',
  'public questions do not expose correct answers'
);

SELECT hasnt_column(
  'public',
  'science_questions',
  'tolerance',
  'public questions do not expose numeric tolerances'
);

SELECT hasnt_column(
  'public',
  'science_questions',
  'explanation',
  'public questions do not expose post-submit explanations'
);

SELECT ok(
  NOT has_table_privilege('anon', 'private.science_question_answers', 'SELECT'),
  'anonymous clients cannot read private answers'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'private.science_question_answers', 'SELECT'),
  'authenticated clients cannot read private answers directly'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.science_enrollments', 'INSERT'),
  'learners cannot insert enrollment rows directly'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.science_enrollments', 'UPDATE'),
  'learners cannot elevate or rewrite enrollment roles'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.science_activity_progress', 'INSERT'),
  'learners cannot award progress or XP directly'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.science_activity_progress', 'UPDATE'),
  'learners cannot rewrite progress or XP directly'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.science_quiz_attempts', 'INSERT'),
  'learners cannot submit client-computed quiz attempts directly'
);

SELECT ok(
  to_regprocedure('public.enroll_in_science_course(uuid)') IS NOT NULL,
  'validated enrollment RPC exists'
);

SELECT ok(
  to_regprocedure('public.complete_science_lesson(uuid)') IS NOT NULL,
  'validated lesson completion RPC exists'
);

SELECT ok(
  to_regprocedure('public.check_science_question(uuid,text)') IS NOT NULL,
  'validated inline exercise RPC exists'
);

SELECT ok(
  to_regprocedure('public.submit_science_quiz_attempt(uuid,jsonb)') IS NOT NULL,
  'validated quiz submission RPC exists'
);

SELECT ok(
  has_function_privilege('authenticated', 'public.submit_science_quiz_attempt(uuid,jsonb)', 'EXECUTE'),
  'authenticated learners may execute the quiz RPC'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.submit_science_quiz_attempt(uuid,jsonb)', 'EXECUTE'),
  'anonymous clients cannot execute the quiz RPC'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS procedure
    JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
    JOIN unnest(procedure.proargnames) AS argument(name) ON true
    WHERE namespace.nspname = 'public'
      AND procedure.proname IN (
        'enroll_in_science_course',
        'complete_science_lesson',
        'submit_science_quiz_attempt'
      )
      AND argument.name IN ('user_id', 'role', 'score', 'xp_earned', 'progress_percent')
  ),
  'security-sensitive RPC values cannot be supplied as parameters'
);

SELECT * FROM finish();
ROLLBACK;
