import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
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

        return NextResponse.json({ article });
    } catch (error) {
        console.error('Get article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const articleId = parseInt(params.id);
        const body = await request.json();
        const { title, author, publishedDate, summary, metaDescription, content, images, gsPaper, subject, tags, isPublished } = body;

        const updateData: any = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (author !== undefined) updateData.author = author;
        if (publishedDate !== undefined) updateData.publishedDate = publishedDate ? new Date(publishedDate) : null;
        if (summary !== undefined) updateData.summary = summary;
        if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
        if (content !== undefined) updateData.content = content;
        if (images !== undefined) updateData.images = images;
        if (gsPaper !== undefined) updateData.gsPaper = gsPaper;
        if (subject !== undefined) updateData.subject = subject;
        if (tags !== undefined) updateData.tags = tags;
        if (isPublished !== undefined) updateData.isPublished = isPublished;

        const [updatedArticle] = await db
            .update(articles)
            .set(updateData)
            .where(eq(articles.id, articleId))
            .returning();

        if (!updatedArticle) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        await logActivity('article_updated', 'article', articleId, `Article "${updatedArticle.title}" was updated`);

        return NextResponse.json({ article: updatedArticle });
    } catch (error) {
        console.error('Update article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
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

        await db.delete(articles).where(eq(articles.id, articleId));

        await logActivity('article_deleted', 'article', articleId, `Article "${article.title}" was deleted`);

        return NextResponse.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Delete article error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

