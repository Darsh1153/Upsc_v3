import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const articleId = parseInt(params.id);

        const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const [updatedArticle] = await db
            .update(articles)
            .set({ isPublished: !article.isPublished, updatedAt: new Date() })
            .where(eq(articles.id, articleId))
            .returning();

        await logActivity(
            article.isPublished ? 'article_unpublished' : 'article_published',
            'article',
            articleId,
            `Article "${updatedArticle.title}" was ${article.isPublished ? 'unpublished' : 'published'}`
        );

        return NextResponse.json({ article: updatedArticle });
    } catch (error) {
        console.error('Toggle publish error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

