-- Study Center — standalone Marxist theory study ecosystem
-- Tables: study_resources, study_concepts, study_milestones, study_user_progress

-- =============================================
-- HELPER: can_manage_study()
-- =============================================
CREATE OR REPLACE FUNCTION public.can_manage_study()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
    SELECT
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND (
                  'Teacher' = ANY(editorial_roles)
                  OR 'teacher' = ANY(editorial_roles)
              )
        );
$$;

-- =============================================
-- STUDY RESOURCES
-- =============================================
CREATE TABLE IF NOT EXISTS public.study_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'video', 'audio', 'lecture')),
    excerpt TEXT,
    content_url TEXT,
    cover_image_url TEXT,
    author TEXT,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    digital_library_book_id UUID REFERENCES public.digital_library_books(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_resources_type ON public.study_resources (type);
CREATE INDEX IF NOT EXISTS idx_study_resources_sort ON public.study_resources (sort_order);

-- =============================================
-- STUDY CONCEPTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.study_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    chinese_term TEXT,
    icon_name TEXT DEFAULT 'BookOpen',
    explanation TEXT NOT NULL,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_concepts_sort ON public.study_concepts (sort_order);

-- =============================================
-- STUDY MILESTONES
-- =============================================
CREATE TABLE IF NOT EXISTS public.study_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    chinese_title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    resource_id UUID REFERENCES public.study_resources(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_milestones_sort ON public.study_milestones (sort_order);

-- =============================================
-- STUDY USER PROGRESS
-- =============================================
CREATE TABLE IF NOT EXISTS public.study_user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES public.study_milestones(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_study_user_progress_user ON public.study_user_progress (user_id);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS handle_study_resources_updated_at ON public.study_resources;
CREATE TRIGGER handle_study_resources_updated_at
    BEFORE UPDATE ON public.study_resources
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

-- study_resources: public read, Teacher+admin write
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Study resources are publicly readable" ON public.study_resources;
CREATE POLICY "Study resources are publicly readable"
    ON public.study_resources FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Teachers and admins can insert study resources" ON public.study_resources;
CREATE POLICY "Teachers and admins can insert study resources"
    ON public.study_resources FOR INSERT
    TO authenticated
    WITH CHECK (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can update study resources" ON public.study_resources;
CREATE POLICY "Teachers and admins can update study resources"
    ON public.study_resources FOR UPDATE
    TO authenticated
    USING (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can delete study resources" ON public.study_resources;
CREATE POLICY "Teachers and admins can delete study resources"
    ON public.study_resources FOR DELETE
    TO authenticated
    USING (public.can_manage_study());

-- study_concepts: public read, Teacher+admin write
ALTER TABLE public.study_concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Study concepts are publicly readable" ON public.study_concepts;
CREATE POLICY "Study concepts are publicly readable"
    ON public.study_concepts FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Teachers and admins can insert study concepts" ON public.study_concepts;
CREATE POLICY "Teachers and admins can insert study concepts"
    ON public.study_concepts FOR INSERT
    TO authenticated
    WITH CHECK (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can update study concepts" ON public.study_concepts;
CREATE POLICY "Teachers and admins can update study concepts"
    ON public.study_concepts FOR UPDATE
    TO authenticated
    USING (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can delete study concepts" ON public.study_concepts;
CREATE POLICY "Teachers and admins can delete study concepts"
    ON public.study_concepts FOR DELETE
    TO authenticated
    USING (public.can_manage_study());

-- study_milestones: public read, Teacher+admin write
ALTER TABLE public.study_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Study milestones are publicly readable" ON public.study_milestones;
CREATE POLICY "Study milestones are publicly readable"
    ON public.study_milestones FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Teachers and admins can insert study milestones" ON public.study_milestones;
CREATE POLICY "Teachers and admins can insert study milestones"
    ON public.study_milestones FOR INSERT
    TO authenticated
    WITH CHECK (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can update study milestones" ON public.study_milestones;
CREATE POLICY "Teachers and admins can update study milestones"
    ON public.study_milestones FOR UPDATE
    TO authenticated
    USING (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can delete study milestones" ON public.study_milestones;
CREATE POLICY "Teachers and admins can delete study milestones"
    ON public.study_milestones FOR DELETE
    TO authenticated
    USING (public.can_manage_study());

-- study_user_progress: users read/write own rows
ALTER TABLE public.study_user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own study progress" ON public.study_user_progress;
CREATE POLICY "Users can view their own study progress"
    ON public.study_user_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own study progress" ON public.study_user_progress;
CREATE POLICY "Users can insert their own study progress"
    ON public.study_user_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study progress" ON public.study_user_progress;
CREATE POLICY "Users can update their own study progress"
    ON public.study_user_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own study progress" ON public.study_user_progress;
CREATE POLICY "Users can delete their own study progress"
    ON public.study_user_progress FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Admins can also read all progress (for admin views)
DROP POLICY IF EXISTS "Admins can view all study progress" ON public.study_user_progress;
CREATE POLICY "Admins can view all study progress"
    ON public.study_user_progress FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- SEED DATA
-- =============================================

-- Seed study resources (matching current dummy data)
INSERT INTO public.study_resources (title, type, excerpt, author, category, sort_order, is_featured) VALUES
    ('The Communist Manifesto', 'text', 'A foundational Marxist text by Karl Marx and Friedrich Engels.', 'Karl Marx & Friedrich Engels', 'Foundational', 1, true),
    ('Das Kapital (Video Lecture)', 'video', 'An overview of Marx''s critique of political economy.', 'Editorial Desk', 'Political Economy', 2, false),
    ('Historical Materialism (Podcast)', 'audio', 'Podcast episode explaining historical materialism.', 'Editorial Desk', 'Philosophy', 3, false),
    ('Wage Labour and Capital', 'text', 'Introduction to the economic relationships of capitalism.', 'Karl Marx', 'Political Economy', 4, false);

-- Seed study concepts (matching current dummy data)
INSERT INTO public.study_concepts (term, chinese_term, icon_name, explanation, category, sort_order) VALUES
    ('Historical Materialism', '历史唯物主义', 'GitBranch', 'Explains how material conditions and economic factors shape society and history.', 'Philosophy', 1),
    ('Class Struggle', '阶级斗争', 'Users', 'Describes the conflict between different classes as the driving force of historical development.', 'Politics', 2),
    ('Alienation', '异化', 'BookOpen', 'Refers to the estrangement of people from aspects of their human nature due to living in a society stratified by social classes.', 'Philosophy', 3);

-- Seed study milestones (matching current dummy data)
INSERT INTO public.study_milestones (title, chinese_title, description, sort_order) VALUES
    ('Read The Communist Manifesto', '阅读《共产党宣言》', 'Begin with the foundational text of Marxist theory.', 1),
    ('Watch Das Kapital Lecture', '观看《资本论》讲座', 'Watch the introductory video lecture on political economy.', 2),
    ('Complete Historical Materialism Podcast', '完成历史唯物主义播客', 'Listen to the podcast on historical materialism.', 3),
    ('Join Community Discussion', '参加社区讨论', 'Participate in a forum discussion about what you have learned.', 4);

-- Link milestones to resources where applicable
UPDATE public.study_milestones SET resource_id = (
    SELECT id FROM public.study_resources WHERE title = 'The Communist Manifesto' LIMIT 1
) WHERE title = 'Read The Communist Manifesto';

UPDATE public.study_milestones SET resource_id = (
    SELECT id FROM public.study_resources WHERE title = 'Das Kapital (Video Lecture)' LIMIT 1
) WHERE title = 'Watch Das Kapital Lecture';

UPDATE public.study_milestones SET resource_id = (
    SELECT id FROM public.study_resources WHERE title = 'Historical Materialism (Podcast)' LIMIT 1
) WHERE title = 'Complete Historical Materialism Podcast';
