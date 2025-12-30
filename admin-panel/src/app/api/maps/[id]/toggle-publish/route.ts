import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maps } from '@/lib/db/schema';
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
        const mapId = parseInt(params.id);

        const [map] = await db.select().from(maps).where(eq(maps.id, mapId));
        if (!map) {
            return NextResponse.json({ error: 'Map not found' }, { status: 404 });
        }

        const [updatedMap] = await db
            .update(maps)
            .set({ isPublished: !map.isPublished, updatedAt: new Date() })
            .where(eq(maps.id, mapId))
            .returning();

        await logActivity(
            map.isPublished ? 'map_unpublished' : 'map_published',
            'map',
            mapId,
            `Map "${updatedMap.title}" was ${map.isPublished ? 'unpublished' : 'published'}`
        );

        return NextResponse.json({ map: updatedMap });
    } catch (error) {
        console.error('Toggle publish error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

