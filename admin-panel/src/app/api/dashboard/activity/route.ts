import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activityLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const activities = await db
            .select()
            .from(activityLogs)
            .orderBy(desc(activityLogs.createdAt))
            .limit(limit);

        return NextResponse.json({ activities });
    } catch (error) {
        console.error('Get activity error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

