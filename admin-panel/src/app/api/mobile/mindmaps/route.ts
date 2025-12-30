import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mindMaps, mindMapNodes, mindMapConnections, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Get all mind maps for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const userMindMaps = await db
            .select()
            .from(mindMaps)
            .where(eq(mindMaps.userId, parseInt(userId)))
            .orderBy(desc(mindMaps.updatedAt));

        return NextResponse.json({
            success: true,
            mindMaps: userMindMaps,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get mind maps error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Create a new mind map
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, title, description, tags } = body;

        if (!userId || !title) {
            return NextResponse.json(
                { success: false, error: 'User ID and title required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Verify user exists
        const userIdInt = parseInt(userId);
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, userIdInt))
            .limit(1);

        if (!existingUser) {
            return NextResponse.json(
                { success: false, error: `User with ID ${userIdInt} not found. Please log in again.` },
                { status: 404, headers: corsHeaders }
            );
        }

        const [newMindMap] = await db
            .insert(mindMaps)
            .values({
                userId: userIdInt,
                title,
                description: description || null,
                tags: tags || [],
            })
            .returning();

        return NextResponse.json({
            success: true,
            mindMap: newMindMap,
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Create mind map error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

