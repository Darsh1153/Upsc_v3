import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, maps, articles, activityLogs } from '@/lib/db/schema';
import { count, eq, gte, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [usersCount] = await db.select({ count: count() }).from(users);
        const [mapsCount] = await db.select({ count: count() }).from(maps);
        const [articlesCount] = await db.select({ count: count() }).from(articles);
        const [publishedArticlesCount] = await db.select({ count: count() }).from(articles).where(eq(articles.isPublished, true));

        return NextResponse.json({
            stats: {
                totalUsers: usersCount.count || 0,
                totalMaps: mapsCount.count || 0,
                totalArticles: articlesCount.count || 0,
                publishedArticles: publishedArticlesCount.count || 0,
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

