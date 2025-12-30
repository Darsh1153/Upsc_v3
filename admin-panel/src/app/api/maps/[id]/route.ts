import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export async function GET(
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

        return NextResponse.json({ map });
    } catch (error) {
        console.error('Get map error:', error);
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
        const mapId = parseInt(params.id);
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const tagsStr = formData.get('tags') as string;
        const isPublished = formData.get('isPublished') === 'true';
        const image = formData.get('image') as File | null;

        const updateData: any = { updatedAt: new Date() };
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category) updateData.category = category;
        if (tagsStr !== undefined) {
            updateData.tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
        }
        updateData.isPublished = isPublished;

        if (image) {
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'maps');
            await mkdir(uploadsDir, { recursive: true });

            const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const filePath = path.join(uploadsDir, fileName);
            const buffer = Buffer.from(await image.arrayBuffer());
            await writeFile(filePath, buffer);

            updateData.imageUrl = `/uploads/maps/${fileName}`;
        }

        const [updatedMap] = await db
            .update(maps)
            .set(updateData)
            .where(eq(maps.id, mapId))
            .returning();

        if (!updatedMap) {
            return NextResponse.json({ error: 'Map not found' }, { status: 404 });
        }

        await logActivity('map_updated', 'map', mapId, `Map "${updatedMap.title}" was updated`);

        return NextResponse.json({ map: updatedMap });
    } catch (error) {
        console.error('Update map error:', error);
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
        const mapId = parseInt(params.id);

        const [map] = await db.select().from(maps).where(eq(maps.id, mapId));
        if (!map) {
            return NextResponse.json({ error: 'Map not found' }, { status: 404 });
        }

        // Try to delete the file using imageUrl
        if (map.imageUrl && map.imageUrl.startsWith('/uploads/')) {
            try {
                const filePath = path.join(process.cwd(), 'public', map.imageUrl);
                await unlink(filePath);
            } catch (e) {
                // Ignore file deletion errors
            }
        }

        await db.delete(maps).where(eq(maps.id, mapId));

        await logActivity('map_deleted', 'map', mapId, `Map "${map.title}" was deleted`);

        return NextResponse.json({ message: 'Map deleted successfully' });
    } catch (error) {
        console.error('Delete map error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

