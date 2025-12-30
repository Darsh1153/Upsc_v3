import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq, asc, desc, ilike } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/mobile/tags - List all tags
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'name'; // 'name' | 'usageCount' | 'createdAt'
        const order = searchParams.get('order') || 'asc'; // 'asc' | 'desc'

        let orderByClause;
        switch (sortBy) {
            case 'usageCount':
                orderByClause = order === 'desc' ? desc(tags.usageCount) : asc(tags.usageCount);
                break;
            case 'createdAt':
                orderByClause = order === 'desc' ? desc(tags.createdAt) : asc(tags.createdAt);
                break;
            default:
                orderByClause = order === 'desc' ? desc(tags.name) : asc(tags.name);
        }

        const allTags = await db
            .select()
            .from(tags)
            .orderBy(orderByClause);

        return NextResponse.json({
            success: true,
            tags: allTags,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('List tags error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// POST /api/mobile/tags - Create a new tag
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, color } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Tag name is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const normalizedName = name.trim().toLowerCase();

        // Check if tag already exists
        const [existingTag] = await db
            .select()
            .from(tags)
            .where(ilike(tags.name, normalizedName))
            .limit(1);

        if (existingTag) {
            // Return existing tag instead of error
            return NextResponse.json({
                success: true,
                tag: existingTag,
                isExisting: true,
            }, { headers: corsHeaders });
        }

        // Create new tag
        const [newTag] = await db
            .insert(tags)
            .values({
                name: normalizedName,
                color: color || '#6366F1',
            })
            .returning();

        return NextResponse.json({
            success: true,
            tag: newTag,
            isExisting: false,
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Create tag error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

