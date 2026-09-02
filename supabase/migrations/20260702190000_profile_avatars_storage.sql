-- Profile avatars/banners storage bucket
-- Users upload their own avatar/banner images under a folder named after their user id:
--   avatars/{user_id}/avatar-*.ext
--   avatars/{user_id}/banner-*.ext

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================
DROP POLICY IF EXISTS "Avatar images are publicly viewable" ON storage.objects;
CREATE POLICY "Avatar images are publicly viewable"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar/banner images" ON storage.objects;
CREATE POLICY "Users can upload their own avatar/banner images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update their own avatar/banner images" ON storage.objects;
CREATE POLICY "Users can update their own avatar/banner images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete their own avatar/banner images" ON storage.objects;
CREATE POLICY "Users can delete their own avatar/banner images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
