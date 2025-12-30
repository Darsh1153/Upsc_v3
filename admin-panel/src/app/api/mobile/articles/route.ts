import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, desc, count, and, gte, lte } from 'drizzle-orm';

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
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const source = searchParams.get('source'); // TH, ET, or PIB
        const gsPaper = searchParams.get('gsPaper'); // Keep for backward compatibility
        const subject = searchParams.get('subject');
        const offset = (page - 1) * limit;

        let conditions = [eq(articles.isPublished, true)];

        // Map source abbreviations to full names
        const sourceMap: { [key: string]: string } = {
            'TH': 'The Hindu',
            'ET': 'The Economic Times',
            'PIB': 'Press Information Bureau',
        };

        // If source parameter is provided, use it; otherwise fall back to gsPaper for backward compatibility
        if (source && sourceMap[source]) {
            conditions.push(eq(articles.gsPaper, sourceMap[source]));
        } else if (gsPaper) {
            conditions.push(eq(articles.gsPaper, gsPaper));
        }

        if (subject) {
            conditions.push(eq(articles.subject, subject));
        }

        const dateParam = searchParams.get('date');
        if (dateParam) {
            // Filter by specific date (ignoring time)
            const startDate = new Date(dateParam);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(dateParam);
            endDate.setHours(23, 59, 59, 999);

            const dateCondition = and(
                gte(articles.publishedDate, startDate),
                lte(articles.publishedDate, endDate)
            );
            if (dateCondition) {
                conditions.push(dateCondition);
            }
        }

        const whereClause = and(...conditions)!;

        const publishedArticles = await db
            .select({
                id: articles.id,
                title: articles.title,
                author: articles.author,
                summary: articles.summary,
                gsPaper: articles.gsPaper,
                subject: articles.subject,
                tags: articles.tags,
                publishedDate: articles.publishedDate,
                createdAt: articles.createdAt,
            })
            .from(articles)
            .where(whereClause)
            .orderBy(desc(articles.createdAt))
            .limit(limit)
            .offset(offset);

        const [{ count: totalCount }] = await db.select({ count: count() }).from(articles).where(whereClause);

        return NextResponse.json({
            articles: publishedArticles,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get articles error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

