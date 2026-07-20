-- Align STEM course authoring permissions with the app-wide admin check.
-- The frontend treats profiles.role = 'admin' as admin via public.is_admin(),
-- while the original STEM policies checked profiles.is_admin directly.

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.stem_subjects;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.stem_courses;
DROP POLICY IF EXISTS "Admins can manage chapters" ON public.stem_chapters;
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.stem_lessons;
DROP POLICY IF EXISTS "Admins can manage exercises" ON public.stem_exercises;
DROP POLICY IF EXISTS "Admins can manage chapter tests" ON public.stem_chapter_tests;
DROP POLICY IF EXISTS "Admins can manage test questions" ON public.stem_test_questions;
DROP POLICY IF EXISTS "Admins can manage textbooks" ON public.stem_textbooks;
DROP POLICY IF EXISTS "Admins can issue certificates" ON public.stem_certificates;

CREATE POLICY "Admins can manage subjects"
  ON public.stem_subjects
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all courses"
  ON public.stem_courses
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage chapters"
  ON public.stem_chapters
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage lessons"
  ON public.stem_lessons
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage exercises"
  ON public.stem_exercises
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage chapter tests"
  ON public.stem_chapter_tests
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage test questions"
  ON public.stem_test_questions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage textbooks"
  ON public.stem_textbooks
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can issue certificates"
  ON public.stem_certificates
  FOR INSERT
  WITH CHECK (public.is_admin());
