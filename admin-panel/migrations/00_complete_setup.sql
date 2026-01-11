-- ============================================
-- Complete Database Setup for UPSC Prep
-- ============================================
-- This file creates all tables and runs all migrations
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CORE TABLES (from Drizzle schema)
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    picture TEXT,
    provider VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'student' NOT NULL,
    is_guest BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Admin Users Table (legacy)
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Maps Table
CREATE TABLE IF NOT EXISTS maps (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    image_path TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    additional_info JSONB,
    hotspots JSONB,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    source_url TEXT,
    published_date TIMESTAMP,
    summary TEXT,
    meta_description TEXT,
    content JSONB,
    raw_html TEXT,
    images JSONB,
    gs_paper VARCHAR(50),
    subject VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Question Sets Table
CREATE TABLE IF NOT EXISTS question_sets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    year INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Practice Questions Table
CREATE TABLE IF NOT EXISTS practice_questions (
    id SERIAL PRIMARY KEY,
    question_set_id INTEGER REFERENCES question_sets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Roadmap Tables
CREATE TABLE IF NOT EXISTS roadmap_topics (
    id SERIAL PRIMARY KEY,
    topic_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    paper VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    estimated_hours INTEGER NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    optional VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmap_subtopics (
    id SERIAL PRIMARY KEY,
    subtopic_id VARCHAR(100) UNIQUE NOT NULL,
    topic_id INTEGER NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    estimated_hours INTEGER NOT NULL,
    "order" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmap_sources (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    link TEXT,
    "order" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_topic_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    completed_subtopics JSONB DEFAULT '[]'::jsonb,
    revision_status VARCHAR(50) DEFAULT 'not_started',
    hours_studied INTEGER DEFAULT 0,
    last_studied TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- History Timeline Table
CREATE TABLE IF NOT EXISTS history_timeline_events (
    id SERIAL PRIMARY KEY,
    year VARCHAR(50) NOT NULL,
    event TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    details TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Visual References Table
CREATE TABLE IF NOT EXISTS visual_references (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(20) DEFAULT '#6366F1',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content JSONB,
    plain_text TEXT,
    folder_id INTEGER,
    backlinks JSONB DEFAULT '[]'::jsonb,
    linked_mind_map_nodes JSONB DEFAULT '[]'::jsonb,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Note Tags Junction Table
CREATE TABLE IF NOT EXISTS note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (note_id, tag_id)
);

-- ============================================
-- MIGRATION: Mind Maps Tables
-- ============================================

CREATE TABLE IF NOT EXISTS mind_maps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    canvas_state JSONB DEFAULT '{"zoom": 1, "offsetX": 0, "offsetY": 0}'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mind_map_nodes (
    id SERIAL PRIMARY KEY,
    mind_map_id INTEGER NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    label VARCHAR(500) NOT NULL,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    width INTEGER DEFAULT 120,
    height INTEGER DEFAULT 60,
    color VARCHAR(20) DEFAULT '#3B82F6',
    shape VARCHAR(20) DEFAULT 'rounded',
    font_size INTEGER DEFAULT 14,
    note_id INTEGER,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mind_map_connections (
    id SERIAL PRIMARY KEY,
    mind_map_id INTEGER NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
    connection_id VARCHAR(100) NOT NULL,
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    color VARCHAR(20) DEFAULT '#94A3B8',
    stroke_width INTEGER DEFAULT 2,
    style VARCHAR(20) DEFAULT 'solid',
    animated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- MIGRATION: Article MCQs Table
-- ============================================

CREATE TABLE IF NOT EXISTS article_mcqs (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- MIGRATION: Notes & Tags FTS Support
-- ============================================

-- Add FTS columns to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS headings TEXT[];

-- Function to extract text from Lexical JSON
CREATE OR REPLACE FUNCTION extract_text_from_lexical_json(content JSONB) RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    node JSONB;
BEGIN
    IF content IS NULL THEN
        RETURN '';
    END IF;
    
    IF content ? 'root' THEN
        content := content->'root';
    END IF;
    
    IF content ? 'text' THEN
        result := result || ' ' || (content->>'text');
    END IF;
    
    IF content ? 'children' AND jsonb_typeof(content->'children') = 'array' THEN
        FOR node IN SELECT * FROM jsonb_array_elements(content->'children')
        LOOP
            result := result || ' ' || extract_text_from_lexical_json(node);
        END LOOP;
    END IF;
    
    RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract headings from Lexical JSON
CREATE OR REPLACE FUNCTION extract_headings_from_lexical_json(content JSONB) RETURNS TEXT[] AS $$
DECLARE
    headings TEXT[] := '{}';
    node JSONB;
    child_headings TEXT[];
BEGIN
    IF content IS NULL THEN
        RETURN headings;
    END IF;
    
    IF content ? 'root' THEN
        content := content->'root';
    END IF;
    
    IF content->>'type' = 'heading' THEN
        headings := array_append(headings, extract_text_from_lexical_json(content));
    END IF;
    
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

-- Trigger function to update search_tsv and headings
CREATE OR REPLACE FUNCTION notes_search_trigger_fn() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.plain_text, '') || ' ' ||
        COALESCE(extract_text_from_lexical_json(NEW.content), '')
    );
    
    NEW.headings := extract_headings_from_lexical_json(NEW.content);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trg_notes_search_update ON notes;
CREATE TRIGGER trg_notes_search_update
    BEFORE INSERT OR UPDATE OF title, content, plain_text ON notes
    FOR EACH ROW
    EXECUTE FUNCTION notes_search_trigger_fn();

-- Function to update tag usage count
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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Notes FTS indexes
CREATE INDEX IF NOT EXISTS idx_notes_search_tsv ON notes USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_notes_headings_gin ON notes USING GIN (headings);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

-- Mind map indexes
CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_mind_map_id ON mind_map_nodes(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_node_id ON mind_map_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_connections_mind_map_id ON mind_map_connections(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_connections_source ON mind_map_connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_connections_target ON mind_map_connections(target_node_id);

-- Article MCQs indexes
CREATE INDEX IF NOT EXISTS idx_article_mcqs_article_id ON article_mcqs(article_id);

-- Roadmap indexes
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic_id ON user_topic_progress(topic_id);

-- ============================================
-- UPDATE EXISTING NOTES (if any)
-- ============================================

UPDATE notes SET updated_at = updated_at WHERE search_tsv IS NULL;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE 'All tables, indexes, and triggers have been created.';
    RAISE NOTICE 'Next: Create admin user via Supabase Dashboard > Authentication > Users';
END $$;



