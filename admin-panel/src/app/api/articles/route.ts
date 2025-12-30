import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, like, or, desc, count, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const gsPaper = searchParams.get('gsPaper') || '';
        const subject = searchParams.get('subject') || '';
        const status = searchParams.get('status') || '';
        const offset = (page - 1) * limit;

        let conditions = [];

        if (search) {
            conditions.push(or(
                like(articles.title, `%${search}%`),
                like(articles.summary, `%${search}%`)
            ));
        }

        if (gsPaper && gsPaper !== 'all') {
            conditions.push(eq(articles.gsPaper, gsPaper));
        }

        if (subject && subject !== 'all') {
            conditions.push(eq(articles.subject, subject));
        }

        if (status === 'published') {
            conditions.push(eq(articles.isPublished, true));
        } else if (status === 'draft') {
            conditions.push(eq(articles.isPublished, false));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const allArticles = await db
            .select()
            .from(articles)
            .where(whereClause)
            .orderBy(desc(articles.createdAt))
            .limit(limit)
            .offset(offset);

        const [{ count: totalCount }] = await db
            .select({ count: count() })
            .from(articles)
            .where(whereClause);

        return NextResponse.json({
            articles: allArticles,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Get articles error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, author, publishedDate, summary, metaDescription, content, images, sourceUrl, gsPaper, subject, tags, isPublished } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const [newArticle] = await db
            .insert(articles)
            .values({
                title,
                author: author || null,
                publishedDate: publishedDate ? new Date(publishedDate) : null,
                summary: summary || null,
                metaDescription: metaDescription || null,
                content: content || [],
                images: images || [],
                sourceUrl: sourceUrl || null,
                gsPaper: gsPaper || null,
                subject: subject || null,
                tags: tags || [],
                isPublished: isPublished || false,
                scrapedAt: new Date(),
            })
            .returning();

        await logActivity('article_created', 'article', newArticle.id, `Article "${newArticle.title}" was saved`, { gsPaper, subject });

        return NextResponse.json({ article: newArticle }, { status: 201 });
    } catch (error) {
        console.error('Create article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

