-- Audiobooks — dedicated table, storage bucket, and RLS policies
-- Supports MP3 uploads with cover images and chapter metadata

-- =============================================
-- TABLE: audiobooks
-- =============================================
CREATE TABLE IF NOT EXISTS public.audiobooks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,
    author           TEXT,
    narrator         TEXT,
    description      TEXT,
    audio_url        TEXT NOT NULL,
    cover_url        TEXT,
    duration_seconds INTEGER,
    chapters         JSONB DEFAULT '[]'::jsonb,
    category         TEXT,
    is_featured      BOOLEAN DEFAULT false,
    sort_order       INTEGER DEFAULT 0,
    created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audiobooks_sort ON public.audiobooks (sort_order);
CREATE INDEX IF NOT EXISTS idx_audiobooks_featured ON public.audiobooks (is_featured) WHERE is_featured = true;

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
DROP TRIGGER IF EXISTS handle_audiobooks_updated_at ON public.audiobooks;
CREATE TRIGGER handle_audiobooks_updated_at
    BEFORE UPDATE ON public.audiobooks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- RLS POLICIES  (public read, Teacher+admin write)
-- =============================================
ALTER TABLE public.audiobooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audiobooks are publicly readable" ON public.audiobooks;
CREATE POLICY "Audiobooks are publicly readable"
    ON public.audiobooks FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Teachers and admins can insert audiobooks" ON public.audiobooks;
CREATE POLICY "Teachers and admins can insert audiobooks"
    ON public.audiobooks FOR INSERT
    TO authenticated
    WITH CHECK (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can update audiobooks" ON public.audiobooks;
CREATE POLICY "Teachers and admins can update audiobooks"
    ON public.audiobooks FOR UPDATE
    TO authenticated
    USING (public.can_manage_study());

DROP POLICY IF EXISTS "Teachers and admins can delete audiobooks" ON public.audiobooks;
CREATE POLICY "Teachers and admins can delete audiobooks"
    ON public.audiobooks FOR DELETE
    TO authenticated
    USING (public.can_manage_study());

-- =============================================
-- GRANTS
-- =============================================
GRANT SELECT ON public.audiobooks TO anon;
GRANT SELECT ON public.audiobooks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.audiobooks TO authenticated;
GRANT ALL ON public.audiobooks TO service_role;

-- =============================================
-- STORAGE BUCKET: audiobooks
-- Stores MP3 files and cover images
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audiobooks',
    'audiobooks',
    true,
    104857600,  -- 100 MB (audiobooks can be large)
    ARRAY[
        'audio/mpeg',
        'audio/mp3',
        'audio/mp4',
        'audio/ogg',
        'audio/wav',
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================
DROP POLICY IF EXISTS "Audiobook files are publicly viewable" ON storage.objects;
CREATE POLICY "Audiobook files are publicly viewable"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'audiobooks');

DROP POLICY IF EXISTS "Teachers and admins can upload audiobook files" ON storage.objects;
CREATE POLICY "Teachers and admins can upload audiobook files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'audiobooks'
        AND public.can_manage_study()
    );

DROP POLICY IF EXISTS "Teachers and admins can update audiobook files" ON storage.objects;
CREATE POLICY "Teachers and admins can update audiobook files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'audiobooks'
        AND public.can_manage_study()
    )
    WITH CHECK (
        bucket_id = 'audiobooks'
        AND public.can_manage_study()
    );

DROP POLICY IF EXISTS "Teachers and admins can delete audiobook files" ON storage.objects;
CREATE POLICY "Teachers and admins can delete audiobook files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'audiobooks'
        AND public.can_manage_study()
    );
