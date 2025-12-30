import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags, noteTags } from '@/lib/db/schema';
import { eq, ilike } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/mobile/tags/[id] - Get a single tag
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tagId = parseInt(id);

        if (isNaN(tagId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid tag ID' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [tag] = await db
            .select()
            .from(tags)
            .where(eq(tags.id, tagId))
            .limit(1);

        if (!tag) {
            return NextResponse.json(
                { success: false, error: 'Tag not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            success: true,
            tag,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get tag error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// PUT /api/mobile/tags/[id] - Update a tag
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tagId = parseInt(id);
        const body = await request.json();
        const { name, color } = body;

        if (isNaN(tagId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid tag ID' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if tag exists
        const [existingTag] = await db
            .select()
            .from(tags)
            .where(eq(tags.id, tagId))
            .limit(1);

        if (!existingTag) {
            return NextResponse.json(
                { success: false, error: 'Tag not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Build update object
        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (name !== undefined) {
            const normalizedName = name.trim().toLowerCase();
            
            // Check if another tag with this name exists
            const [duplicateTag] = await db
                .select()
                .from(tags)
                .where(ilike(tags.name, normalizedName))
                .limit(1);

            if (duplicateTag && duplicateTag.id !== tagId) {
                return NextResponse.json(
                    { success: false, error: 'A tag with this name already exists' },
                    { status: 409, headers: corsHeaders }
                );
            }

            updateData.name = normalizedName;
        }

        if (color !== undefined) {
            updateData.color = color;
        }

        const [updatedTag] = await db
            .update(tags)
            .set(updateData)
            .where(eq(tags.id, tagId))
            .returning();

        return NextResponse.json({
            success: true,
            tag: updatedTag,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Update tag error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// DELETE /api/mobile/tags/[id] - Delete a tag
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tagId = parseInt(id);

        if (isNaN(tagId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid tag ID' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if tag exists
        const [existingTag] = await db
            .select()
            .from(tags)
            .where(eq(tags.id, tagId))
            .limit(1);

        if (!existingTag) {
            return NextResponse.json(
                { success: false, error: 'Tag not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Delete the tag (cascade will handle note_tags)
        await db.delete(tags).where(eq(tags.id, tagId));

        return NextResponse.json({
            success: true,
            message: 'Tag deleted successfully',
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Delete tag error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

