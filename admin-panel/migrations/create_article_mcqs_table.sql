-- Migration: Create article_mcqs table for storing MCQs related to articles
-- Date: 2025-01-XX

-- ============= ARTICLE MCQs TABLE =============
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_mcqs_article_id ON article_mcqs(article_id);

-- Add comment to table
COMMENT ON TABLE article_mcqs IS 'Stores Multiple Choice Questions (MCQs) generated for articles';


