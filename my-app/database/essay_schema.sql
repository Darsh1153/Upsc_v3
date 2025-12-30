-- Essay Attempts Table for Supabase
-- This schema is for future implementation when you want to sync essay data to the cloud
-- For now, the app stores everything locally using AsyncStorage

-- Create essays table
CREATE TABLE IF NOT EXISTS essays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create essay_evaluations table (stores AI evaluation results)
CREATE TABLE IF NOT EXISTS essay_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    essay_id UUID REFERENCES essays(id) ON DELETE CASCADE,
    examiner_remark TEXT,
    strengths JSONB, -- Array of strengths
    weaknesses JSONB, -- Array of weaknesses
    improvement_plan JSONB, -- Array of improvement suggestions
    rewritten_intro TEXT,
    rewritten_conclusion TEXT,
    detailed_feedback JSONB, -- Object with content, structure, language, arguments, upscRelevance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_essays_user_id ON essays(user_id);
CREATE INDEX IF NOT EXISTS idx_essays_created_at ON essays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_essay_evaluations_essay_id ON essay_evaluations(essay_id);

-- Enable Row Level Security (RLS)
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for essays
CREATE POLICY "Users can view their own essays"
    ON essays FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own essays"
    ON essays FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own essays"
    ON essays FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own essays"
    ON essays FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for essay_evaluations
CREATE POLICY "Users can view evaluations for their essays"
    ON essay_evaluations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM essays
            WHERE essays.id = essay_evaluations.essay_id
            AND essays.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert evaluations for their essays"
    ON essay_evaluations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM essays
            WHERE essays.id = essay_evaluations.essay_id
            AND essays.user_id = auth.uid()
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for essays table
CREATE TRIGGER update_essays_updated_at
    BEFORE UPDATE ON essays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample query to fetch essays with evaluations
-- SELECT 
--     e.*,
--     ev.examiner_remark,
--     ev.strengths,
--     ev.weaknesses,
--     ev.improvement_plan,
--     ev.rewritten_intro,
--     ev.rewritten_conclusion,
--     ev.detailed_feedback
-- FROM essays e
-- LEFT JOIN essay_evaluations ev ON e.id = ev.essay_id
-- WHERE e.user_id = auth.uid()
-- ORDER BY e.created_at DESC;
