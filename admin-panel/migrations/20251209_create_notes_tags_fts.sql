-- Migration: Create enhanced notes system with tags and FTS support
-- Date: 2025-12-09

-- ============= TAGS TABLE =============
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(20) DEFAULT '#6366F1',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============= NOTE_TAGS JUNCTION TABLE =============
CREATE TABLE IF NOT EXISTS note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, tag_id)
);

-- Create index for faster tag lookups
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

-- ============= ENHANCE NOTES TABLE FOR FTS =============

-- Add tsvector column for full-text search (title + content text)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR;

-- Add headings column for heading-only searches
ALTER TABLE notes ADD COLUMN IF NOT EXISTS headings TEXT[];

-- Trigger function to extract text from Lexical JSON and update tsvector
CREATE OR REPLACE FUNCTION extract_text_from_lexical_json(content JSONB) RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    node JSONB;
BEGIN
    IF content IS NULL THEN
        RETURN '';
    END IF;
    
    -- Check if this is a root node with children
    IF content ? 'root' THEN
        content := content->'root';
    END IF;
    
    -- If this node has text, append it
    IF content ? 'text' THEN
        result := result || ' ' || (content->>'text');
    END IF;
    
    -- Recursively process children
    IF content ? 'children' AND jsonb_typeof(content->'children') = 'array' THEN
        FOR node IN SELECT * FROM jsonb_array_elements(content->'children')
        LOOP
            result := result || ' ' || extract_text_from_lexical_json(node);
        END LOOP;
    END IF;
    
    RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to extract headings from Lexical JSON
CREATE OR REPLACE FUNCTION extract_headings_from_lexical_json(content JSONB) RETURNS TEXT[] AS $$
DECLARE
    headings TEXT[] := '{}';
    node JSONB;
    child_headings TEXT[];
BEGIN
    IF content IS NULL THEN
        RETURN headings;
    END IF;
    
    -- Check if this is a root node
    IF content ? 'root' THEN
        content := content->'root';
    END IF;
    
    -- Check if this is a heading node
    IF content->>'type' = 'heading' THEN
        headings := array_append(headings, extract_text_from_lexical_json(content));
    END IF;
    
    -- Recursively process children
    IF content ? 'children' AND jsonb_typeof(content->'children') = 'array' THEN
        FOR node IN SELECT * FROM jsonb_array_elements(content->'children')
        LOOP
            child_headings := extract_headings_from_lexical_json(node);
            headings := array_cat(headings, child_headings);
        END LOOP;
    END IF;
    
    RETURN headings;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to update search_tsv and headings on note insert/update
CREATE OR REPLACE FUNCTION notes_search_trigger_fn() RETURNS TRIGGER AS $$
BEGIN
    -- Update search_tsv with title and extracted content text
    NEW.search_tsv := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.plain_text, '') || ' ' ||
        COALESCE(extract_text_from_lexical_json(NEW.content), '')
    );
    
    -- Update headings array
    NEW.headings := extract_headings_from_lexical_json(NEW.content);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_notes_search_update ON notes;
CREATE TRIGGER trg_notes_search_update
    BEFORE INSERT OR UPDATE OF title, content, plain_text ON notes
    FOR EACH ROW
    EXECUTE FUNCTION notes_search_trigger_fn();

-- ============= INDEXES FOR SEARCH =============

-- GIN index for full-text search on tsvector
CREATE INDEX IF NOT EXISTS idx_notes_search_tsv ON notes USING GIN (search_tsv);

-- GIN index for headings array (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_notes_headings_gin ON notes USING GIN (headings);

-- Index for faster sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);

-- Index for user's notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Index for tag name prefix searches
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING GIN (name gin_trgm_ops);

-- ============= UPDATE EXISTING NOTES =============
-- Reindex existing notes to populate search_tsv and headings
UPDATE notes SET updated_at = updated_at WHERE search_tsv IS NULL;

-- ============= HELPER FUNCTION FOR TAG USAGE COUNT =============
CREATE OR REPLACE FUNCTION update_tag_usage_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = GREATEST(0, usage_count - 1), updated_at = NOW() WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_tag_usage ON note_tags;
CREATE TRIGGER trg_update_tag_usage
    AFTER INSERT OR DELETE ON note_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

