import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
    { params }: { params: { id: string } }
) {
    try {
        const articleId = parseInt(params.id);

        // Validate article ID
        if (isNaN(articleId)) {
            return NextResponse.json({ error: 'Invalid article ID' }, { status: 400, headers: corsHeaders });
        }

        const [article] = await db
            .select()
            .from(articles)
            .where(and(eq(articles.id, articleId), eq(articles.isPublished, true)));

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json({ article }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

