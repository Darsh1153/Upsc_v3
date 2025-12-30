import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/upsc_app';
const sql = postgres(connectionString);

// This endpoint creates the article_mcqs table if it doesn't exist
export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Create MCQs Table] Starting table creation...');
        
        // SQL to create the table (using unsafe for DDL statements)
        await sql.unsafe(`
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
            )
        `);

        // Create index
        await sql.unsafe(`
            CREATE INDEX IF NOT EXISTS idx_article_mcqs_article_id ON article_mcqs(article_id)
        `);
        
        console.log('[Create MCQs Table] Table created successfully');
        
        return NextResponse.json({ 
            success: true,
            message: 'article_mcqs table created successfully'
        });
    } catch (error) {
        console.error('[Create MCQs Table] Error:', error);
        return NextResponse.json({ 
            error: 'Failed to create table',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

