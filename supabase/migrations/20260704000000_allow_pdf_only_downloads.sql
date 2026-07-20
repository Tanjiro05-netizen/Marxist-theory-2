-- Downloads entries may be PDF-only, while EPUB books may keep PDFs optional.
ALTER TABLE "public"."digital_library_books"
    ADD COLUMN IF NOT EXISTS "epub_filename" TEXT;

ALTER TABLE "public"."digital_library_books"
    ALTER COLUMN "pdf_filename" DROP NOT NULL;
