import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articleMcqs, articles } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Public endpoint - no auth required
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    console.log('[MCQs GET] Starting request...');
    try {
        // Handle both Promise and direct params (Next.js 13+ vs 15)
        const resolvedParams = params instanceof Promise ? await params : params;
        console.log('[MCQs GET] Params:', resolvedParams);
        
        const articleId = parseInt(resolvedParams.id);
        console.log('[MCQs GET] Parsed article ID:', articleId);

        // Validate article ID
        if (isNaN(articleId)) {
            console.error('[MCQs GET] Invalid article ID:', resolvedParams.id);
            return NextResponse.json({ error: 'Invalid article ID' }, { status: 400, headers: corsHeaders });
        }

        // Verify article exists and is published
        console.log('[MCQs GET] Fetching article from database...');
        const [article] = await db
            .select()
            .from(articles)
            .where(and(eq(articles.id, articleId), eq(articles.isPublished, true)));

        if (!article) {
            console.error('[MCQs GET] Article not found or not published:', articleId);
            return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: corsHeaders });
        }

        console.log('[MCQs GET] Article found:', article.title);

        // Fetch MCQs for this article
        console.log('[MCQs GET] Fetching MCQs from database...');
        let mcqs;
        try {
            mcqs = await db
                .select()
                .from(articleMcqs)
                .where(eq(articleMcqs.articleId, articleId))
                .orderBy(asc(articleMcqs.id));
            console.log('[MCQs GET] Found MCQs:', mcqs.length);
        } catch (dbError) {
            console.error('[MCQs GET] Database query error:', dbError);
            console.error('[MCQs GET] Error type:', dbError instanceof Error ? dbError.constructor.name : typeof dbError);
            throw dbError;
        }

        return NextResponse.json({ 
            mcqs,
            count: mcqs.length
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('[MCQs GET] Error details:', error);
        console.error('[MCQs GET] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500, headers: corsHeaders });
    }
}

