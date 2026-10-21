-- Social Core: account social graph plus public imageboard graph.
--
-- Social media and the imageboard share a post graph, but stay distinct:
-- - social post: board_slug null, parent_id null, author_id required by RLS
-- - board thread: board_slug set, parent_id null, may be anonymous
-- - reply: parent_id set, root_id points at the thread/root post
-- - repost/quote: account social actions only

CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    title TEXT,
    board_slug TEXT,
    parent_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    root_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    quoted_post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
    repost_of_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    anonymous_name TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'unlisted')),
    reply_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    repost_count INTEGER NOT NULL DEFAULT 0,
    quote_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    bump_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT social_posts_title_length CHECK (title IS NULL OR char_length(title) BETWEEN 3 AND 200),
    CONSTRAINT social_posts_content_length CHECK (char_length(content) <= 10000),
    CONSTRAINT social_posts_content_or_repost CHECK (char_length(btrim(content)) > 0 OR repost_of_id IS NOT NULL),
    CONSTRAINT social_posts_anonymous_board_only CHECK (is_anonymous = false OR board_slug IS NOT NULL),
    CONSTRAINT social_posts_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id),
    CONSTRAINT social_posts_no_self_quote CHECK (quoted_post_id IS NULL OR quoted_post_id <> id),
    CONSTRAINT social_posts_no_self_repost CHECK (repost_of_id IS NULL OR repost_of_id <> id)
);

ALTER TABLE public.social_posts
ALTER COLUMN author_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_author_created
    ON public.social_posts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_posts_created
    ON public.social_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_posts_board_bump
    ON public.social_posts(board_slug, bump_at DESC)
    WHERE board_slug IS NOT NULL AND parent_id IS NULL AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_social_posts_root_created
    ON public.social_posts(root_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_social_posts_parent
    ON public.social_posts(parent_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_quoted
    ON public.social_posts(quoted_post_id)
    WHERE quoted_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_repost
    ON public.social_posts(repost_of_id)
    WHERE repost_of_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_unique_repost
    ON public.social_posts(author_id, repost_of_id)
    WHERE repost_of_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.social_post_likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_post_likes_post
    ON public.social_post_likes(post_id);

CREATE TABLE IF NOT EXISTS public.social_follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT social_follows_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_social_follows_following
    ON public.social_follows(following_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.social_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow', 'reply', 'like', 'repost', 'quote', 'mention')),
    source_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    source_label TEXT,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    related_post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    content_preview TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_notifications_user_created
    ON public.social_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_notifications_unread
    ON public.social_notifications(user_id, is_read)
    WHERE is_read = false;

CREATE TABLE IF NOT EXISTS public.social_user_mutes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    muted_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, muted_user_id),
    CONSTRAINT social_user_mutes_no_self CHECK (user_id <> muted_user_id)
);

CREATE TABLE IF NOT EXISTS public.social_board_mutes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    board_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, board_slug)
);

CREATE TABLE IF NOT EXISTS public.social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 200),
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (reporter_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_reports_status_created
    ON public.social_reports(status, created_at DESC);

CREATE OR REPLACE FUNCTION private.prepare_social_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
DECLARE
    parent_post public.social_posts%ROWTYPE;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT * INTO parent_post
        FROM public.social_posts
        WHERE id = NEW.parent_id;

        IF parent_post.id IS NULL THEN
            RAISE EXCEPTION 'Parent post not found';
        END IF;

        IF parent_post.is_locked THEN
            RAISE EXCEPTION 'This thread is locked';
        END IF;

        NEW.root_id := COALESCE(parent_post.root_id, parent_post.id);
        NEW.board_slug := COALESCE(NEW.board_slug, parent_post.board_slug);
    ELSE
        NEW.root_id := COALESCE(NEW.root_id, NEW.id);
    END IF;

    IF NEW.repost_of_id IS NOT NULL THEN
        NEW.parent_id := NULL;
        NEW.root_id := NEW.id;
    END IF;

    IF NEW.is_anonymous AND NEW.board_slug IS NULL THEN
        RAISE EXCEPTION 'Anonymous posts must belong to a board';
    END IF;

    NEW.anonymous_name := NULLIF(btrim(COALESCE(NEW.anonymous_name, '')), '');
    NEW.bump_at := COALESCE(NEW.bump_at, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS social_posts_prepare_trigger ON public.social_posts;
CREATE TRIGGER social_posts_prepare_trigger
BEFORE INSERT ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION private.prepare_social_post();

CREATE OR REPLACE FUNCTION private.after_social_post_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
DECLARE
    target_author_id UUID;
    target_title TEXT;
    target_content TEXT;
    source_profile public.profiles%ROWTYPE;
    source_label TEXT;
BEGIN
    SELECT * INTO source_profile
    FROM public.profiles
    WHERE id = NEW.author_id;

    source_label := CASE
        WHEN NEW.is_anonymous THEN COALESCE(NEW.anonymous_name, 'Anonymous')
        ELSE COALESCE(source_profile.username, 'Someone')
    END;

    IF NEW.parent_id IS NOT NULL THEN
        UPDATE public.social_posts
        SET reply_count = reply_count + 1,
            bump_at = now()
        WHERE id = NEW.parent_id;

        UPDATE public.social_posts
        SET bump_at = now()
        WHERE id = NEW.root_id;

        SELECT author_id, title, content
        INTO target_author_id, target_title, target_content
        FROM public.social_posts
        WHERE id = NEW.parent_id;

        IF target_author_id IS NOT NULL AND target_author_id IS DISTINCT FROM NEW.author_id THEN
            INSERT INTO public.social_notifications (
                user_id,
                type,
                source_user_id,
                source_label,
                post_id,
                related_post_id,
                content_preview
            ) VALUES (
                target_author_id,
                'reply',
                CASE WHEN NEW.is_anonymous THEN NULL ELSE NEW.author_id END,
                source_label,
                NEW.parent_id,
                NEW.id,
                LEFT(NEW.content, 160)
            );
        END IF;
    END IF;

    IF NEW.repost_of_id IS NOT NULL THEN
        UPDATE public.social_posts
        SET repost_count = repost_count + 1
        WHERE id = NEW.repost_of_id;

        SELECT author_id, title, content
        INTO target_author_id, target_title, target_content
        FROM public.social_posts
        WHERE id = NEW.repost_of_id;

        IF target_author_id IS NOT NULL AND target_author_id IS DISTINCT FROM NEW.author_id THEN
            INSERT INTO public.social_notifications (
                user_id,
                type,
                source_user_id,
                source_label,
                post_id,
                related_post_id,
                content_preview
            ) VALUES (
                target_author_id,
                'repost',
                NEW.author_id,
                source_label,
                NEW.repost_of_id,
                NEW.id,
                LEFT(COALESCE(target_title, target_content, ''), 160)
            );
        END IF;
    END IF;

    IF NEW.quoted_post_id IS NOT NULL THEN
        UPDATE public.social_posts
        SET quote_count = quote_count + 1
        WHERE id = NEW.quoted_post_id;

        SELECT author_id, title, content
        INTO target_author_id, target_title, target_content
        FROM public.social_posts
        WHERE id = NEW.quoted_post_id;

        IF target_author_id IS NOT NULL AND target_author_id IS DISTINCT FROM NEW.author_id THEN
            INSERT INTO public.social_notifications (
                user_id,
                type,
                source_user_id,
                source_label,
                post_id,
                related_post_id,
                content_preview
            ) VALUES (
                target_author_id,
                'quote',
                CASE WHEN NEW.is_anonymous THEN NULL ELSE NEW.author_id END,
                source_label,
                NEW.quoted_post_id,
                NEW.id,
                LEFT(NEW.content, 160)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS social_posts_after_insert_trigger ON public.social_posts;
CREATE TRIGGER social_posts_after_insert_trigger
AFTER INSERT ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION private.after_social_post_insert();

CREATE OR REPLACE FUNCTION private.after_social_post_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
    IF OLD.parent_id IS NOT NULL THEN
        UPDATE public.social_posts
        SET reply_count = GREATEST(0, reply_count - 1)
        WHERE id = OLD.parent_id;
    END IF;

    IF OLD.repost_of_id IS NOT NULL THEN
        UPDATE public.social_posts
        SET repost_count = GREATEST(0, repost_count - 1)
        WHERE id = OLD.repost_of_id;
    END IF;

    IF OLD.quoted_post_id IS NOT NULL THEN
        UPDATE public.social_posts
        SET quote_count = GREATEST(0, quote_count - 1)
        WHERE id = OLD.quoted_post_id;
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS social_posts_after_delete_trigger ON public.social_posts;
CREATE TRIGGER social_posts_after_delete_trigger
AFTER DELETE ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION private.after_social_post_delete();

CREATE OR REPLACE FUNCTION private.after_social_like_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
DECLARE
    target_author_id UUID;
    target_title TEXT;
    target_content TEXT;
    liker_username TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.social_posts
        SET like_count = like_count + 1
        WHERE id = NEW.post_id;

        SELECT author_id, title, content
        INTO target_author_id, target_title, target_content
        FROM public.social_posts
        WHERE id = NEW.post_id;

        SELECT username INTO liker_username
        FROM public.profiles
        WHERE id = NEW.user_id;

        IF target_author_id IS NOT NULL AND target_author_id <> NEW.user_id THEN
            INSERT INTO public.social_notifications (
                user_id,
                type,
                source_user_id,
                source_label,
                post_id,
                content_preview
            ) VALUES (
                target_author_id,
                'like',
                NEW.user_id,
                COALESCE(liker_username, 'Someone'),
                NEW.post_id,
                LEFT(COALESCE(target_title, target_content, ''), 160)
            );
        END IF;

        RETURN NEW;
    END IF;

    UPDATE public.social_posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.post_id;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS social_likes_after_change_trigger ON public.social_post_likes;
CREATE TRIGGER social_likes_after_change_trigger
AFTER INSERT OR DELETE ON public.social_post_likes
FOR EACH ROW
EXECUTE FUNCTION private.after_social_like_change();

CREATE OR REPLACE FUNCTION private.after_social_follow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
DECLARE
    follower_username TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles
        SET following_count = following_count + 1
        WHERE id = NEW.follower_id;

        UPDATE public.profiles
        SET follower_count = follower_count + 1
        WHERE id = NEW.following_id;

        SELECT username INTO follower_username
        FROM public.profiles
        WHERE id = NEW.follower_id;

        INSERT INTO public.social_notifications (
            user_id,
            type,
            source_user_id,
            source_label
        ) VALUES (
            NEW.following_id,
            'follow',
            NEW.follower_id,
            COALESCE(follower_username, 'Someone')
        );

        RETURN NEW;
    END IF;

    UPDATE public.profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;

    UPDATE public.profiles
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE id = OLD.following_id;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS social_follows_after_change_trigger ON public.social_follows;
CREATE TRIGGER social_follows_after_change_trigger
AFTER INSERT OR DELETE ON public.social_follows
FOR EACH ROW
EXECUTE FUNCTION private.after_social_follow_change();

DROP TRIGGER IF EXISTS social_reports_updated_at ON public.social_reports;
CREATE TRIGGER social_reports_updated_at
BEFORE UPDATE ON public.social_reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS social_posts_updated_at ON public.social_posts;
CREATE TRIGGER social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

UPDATE public.profiles p
SET follower_count = COALESCE(f.followers, 0),
    following_count = COALESCE(g.following, 0)
FROM (
    SELECT following_id, COUNT(*)::INTEGER AS followers
    FROM public.social_follows
    GROUP BY following_id
) f
FULL JOIN (
    SELECT follower_id, COUNT(*)::INTEGER AS following
    FROM public.social_follows
    GROUP BY follower_id
) g ON g.follower_id = f.following_id
WHERE p.id = COALESCE(f.following_id, g.follower_id);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_user_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_board_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can read visible social posts" ON public.social_posts;
CREATE POLICY "Signed-in users can read visible social posts"
    ON public.social_posts FOR SELECT
    TO authenticated
    USING (
        is_deleted = false
        AND (
            visibility IN ('public', 'unlisted')
            OR author_id = (select auth.uid())
            OR (
                visibility = 'followers'
                AND EXISTS (
                    SELECT 1
                    FROM public.social_follows f
                    WHERE f.follower_id = (select auth.uid())
                      AND f.following_id = social_posts.author_id
                )
            )
        )
    );

DROP POLICY IF EXISTS "Guests can read public board posts" ON public.social_posts;
CREATE POLICY "Guests can read public board posts"
    ON public.social_posts FOR SELECT
    TO anon
    USING (
        is_deleted = false
        AND board_slug IS NOT NULL
        AND visibility = 'public'
    );

DROP POLICY IF EXISTS "Users can create their own social posts" ON public.social_posts;
CREATE POLICY "Users can create their own social posts"
    ON public.social_posts FOR INSERT
    TO authenticated
    WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Guests can create anonymous board posts" ON public.social_posts;
CREATE POLICY "Guests can create anonymous board posts"
    ON public.social_posts FOR INSERT
    TO anon
    WITH CHECK (
        author_id IS NULL
        AND board_slug IS NOT NULL
        AND is_anonymous = true
        AND visibility = 'public'
        AND repost_of_id IS NULL
        AND quoted_post_id IS NULL
    );

DROP POLICY IF EXISTS "Users can update their own social posts" ON public.social_posts;
CREATE POLICY "Users can update their own social posts"
    ON public.social_posts FOR UPDATE
    TO authenticated
    USING (author_id = (select auth.uid()) OR public.is_admin())
    WITH CHECK (author_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own social posts" ON public.social_posts;
CREATE POLICY "Users can delete their own social posts"
    ON public.social_posts FOR DELETE
    TO authenticated
    USING (author_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Signed-in users can read social likes" ON public.social_post_likes;
CREATE POLICY "Signed-in users can read social likes"
    ON public.social_post_likes FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can like posts as themselves" ON public.social_post_likes;
CREATE POLICY "Users can like posts as themselves"
    ON public.social_post_likes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove their own social likes" ON public.social_post_likes;
CREATE POLICY "Users can remove their own social likes"
    ON public.social_post_likes FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Signed-in users can read follows" ON public.social_follows;
CREATE POLICY "Signed-in users can read follows"
    ON public.social_follows FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can follow as themselves" ON public.social_follows;
CREATE POLICY "Users can follow as themselves"
    ON public.social_follows FOR INSERT
    TO authenticated
    WITH CHECK (follower_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can unfollow as themselves" ON public.social_follows;
CREATE POLICY "Users can unfollow as themselves"
    ON public.social_follows FOR DELETE
    TO authenticated
    USING (follower_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can read their social notifications" ON public.social_notifications;
CREATE POLICY "Users can read their social notifications"
    ON public.social_notifications FOR SELECT
    TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their social notifications" ON public.social_notifications;
CREATE POLICY "Users can update their social notifications"
    ON public.social_notifications FOR UPDATE
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their social notifications" ON public.social_notifications;
CREATE POLICY "Users can delete their social notifications"
    ON public.social_notifications FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can read their user mutes" ON public.social_user_mutes;
CREATE POLICY "Users can read their user mutes"
    ON public.social_user_mutes FOR SELECT
    TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their user mutes" ON public.social_user_mutes;
CREATE POLICY "Users can create their user mutes"
    ON public.social_user_mutes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their user mutes" ON public.social_user_mutes;
CREATE POLICY "Users can delete their user mutes"
    ON public.social_user_mutes FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can read their board mutes" ON public.social_board_mutes;
CREATE POLICY "Users can read their board mutes"
    ON public.social_board_mutes FOR SELECT
    TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their board mutes" ON public.social_board_mutes;
CREATE POLICY "Users can create their board mutes"
    ON public.social_board_mutes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their board mutes" ON public.social_board_mutes;
CREATE POLICY "Users can delete their board mutes"
    ON public.social_board_mutes FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can report posts" ON public.social_reports;
CREATE POLICY "Users can report posts"
    ON public.social_reports FOR INSERT
    TO authenticated
    WITH CHECK (reporter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can read their own reports" ON public.social_reports;
CREATE POLICY "Users can read their own reports"
    ON public.social_reports FOR SELECT
    TO authenticated
    USING (reporter_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update reports" ON public.social_reports;
CREATE POLICY "Admins can update reports"
    ON public.social_reports FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.social_posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.social_post_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.social_follows TO authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.social_notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.social_user_mutes TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.social_board_mutes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.social_reports TO authenticated;

GRANT SELECT, INSERT ON TABLE public.social_posts TO anon;

GRANT ALL ON TABLE public.social_posts TO service_role;
GRANT ALL ON TABLE public.social_post_likes TO service_role;
GRANT ALL ON TABLE public.social_follows TO service_role;
GRANT ALL ON TABLE public.social_notifications TO service_role;
GRANT ALL ON TABLE public.social_user_mutes TO service_role;
GRANT ALL ON TABLE public.social_board_mutes TO service_role;
GRANT ALL ON TABLE public.social_reports TO service_role;
