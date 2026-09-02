-- Text editions for digital library books: the reflowable reading edition
-- rendered by the TextEditionReader. Sections are stored as markdown so the
-- admin can keep editing them; pdf_filename remains the fixed-page download.
--
-- Shape:
--   {
--     sections: [{ id: 's1', title, level, md }],
--     reading_minutes: integer,
--     source: 'md' | 'txt' | 'extracted',
--     generated_at: ISO timestamp
--   }

alter table "public"."digital_library_books"
    add column if not exists "text_edition" jsonb;
