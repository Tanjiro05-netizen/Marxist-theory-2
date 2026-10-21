-- User book bookmarks
CREATE TABLE IF NOT EXISTS "public"."user_book_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "book_id" "uuid" NOT NULL REFERENCES "public"."digital_library_books"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_book_bookmarks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_book_bookmarks_user_book_unique" UNIQUE ("user_id", "book_id")
);

ALTER TABLE "public"."user_book_bookmarks" OWNER TO "postgres";
ALTER TABLE "public"."user_book_bookmarks" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own book bookmarks" ON "public"."user_book_bookmarks";
CREATE POLICY "Users can manage their own book bookmarks"
    ON "public"."user_book_bookmarks"
    FOR ALL
    USING ("auth"."uid"() = "user_id")
    WITH CHECK ("auth"."uid"() = "user_id");

GRANT ALL ON TABLE "public"."user_book_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."user_book_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_book_bookmarks" TO "service_role";


-- User book reading progress
CREATE TABLE IF NOT EXISTS "public"."user_book_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "book_id" "uuid" NOT NULL REFERENCES "public"."digital_library_books"("id") ON DELETE CASCADE,
    "progress_percentage" integer DEFAULT 0 NOT NULL CHECK ("progress_percentage" >= 0 AND "progress_percentage" <= 100),
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_book_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_book_progress_user_book_unique" UNIQUE ("user_id", "book_id")
);

ALTER TABLE "public"."user_book_progress" OWNER TO "postgres";
ALTER TABLE "public"."user_book_progress" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own book progress" ON "public"."user_book_progress";
CREATE POLICY "Users can manage their own book progress"
    ON "public"."user_book_progress"
    FOR ALL
    USING ("auth"."uid"() = "user_id")
    WITH CHECK ("auth"."uid"() = "user_id");

GRANT ALL ON TABLE "public"."user_book_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_book_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_book_progress" TO "service_role";
