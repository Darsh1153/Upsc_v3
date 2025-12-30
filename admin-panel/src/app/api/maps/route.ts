import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maps } from '@/lib/db/schema';
import { eq, like, or, desc, count } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const whereClause = search ? or(
            like(maps.title, `%${search}%`),
            like(maps.category, `%${search}%`)
        ) : undefined;

        const allMaps = await db
            .select()
            .from(maps)
            .where(whereClause)
            .orderBy(desc(maps.createdAt));

        return NextResponse.json({ maps: allMaps });
    } catch (error) {
        console.error('Get maps error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const tagsStr = formData.get('tags') as string;
        const isPublished = formData.get('isPublished') === 'true';
        const image = formData.get('image') as File;

        if (!title || !category) {
            return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
        }

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // Save image
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'maps');
        await mkdir(uploadsDir, { recursive: true });

        const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, fileName);
        const buffer = Buffer.from(await image.arrayBuffer());
        await writeFile(filePath, buffer);

        const imageUrl = `/uploads/maps/${fileName}`;
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];

        const [newMap] = await db
            .insert(maps)
            .values({
                title,
                description: description || null,
                category,
                imageUrl,
                tags,
                isPublished,
            })
            .returning();

        await logActivity('map_created', 'map', newMap.id, `Map "${newMap.title}" was uploaded`);

        return NextResponse.json({ map: newMap }, { status: 201 });
    } catch (error) {
        console.error('Create map error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

