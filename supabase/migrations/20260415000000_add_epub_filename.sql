-- Add epub_filename column for the primary EPUB reading file
ALTER TABLE "public"."digital_library_books"
    ADD COLUMN IF NOT EXISTS "epub_filename" TEXT;

-- Make pdf_filename nullable (it becomes optional PDF download only)
ALTER TABLE "public"."digital_library_books"
    ALTER COLUMN "pdf_filename" DROP NOT NULL;
