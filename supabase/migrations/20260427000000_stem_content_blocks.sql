-- Add content_blocks JSONB to stem_lessons for rich block-based content
ALTER TABLE stem_lessons ADD COLUMN IF NOT EXISTS content_blocks JSONB;

-- Add prerequisites to stem_courses (array of strings or course slugs)
ALTER TABLE stem_courses ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;

-- Add learning objectives to stem_chapters
ALTER TABLE stem_chapters ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]'::jsonb;

-- Comment on new columns
COMMENT ON COLUMN stem_lessons.content_blocks IS 'JSONB array of typed content blocks (text, callout, image, video, worked_example, inline_exercise, code_sandbox, interactive_widget, summary, divider, embed, table). When non-null and non-empty, takes priority over the legacy content TEXT field.';
COMMENT ON COLUMN stem_courses.prerequisites IS 'JSONB array of prerequisite descriptions or course slugs';
COMMENT ON COLUMN stem_chapters.objectives IS 'JSONB array of learning objective strings for this chapter';
