import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Public endpoint - no auth required
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mapId = parseInt(params.id);

        // Validate map ID
        if (isNaN(mapId)) {
            return NextResponse.json({ error: 'Invalid map ID' }, { status: 400, headers: corsHeaders });
        }

        const [map] = await db
            .select()
            .from(maps)
            .where(and(eq(maps.id, mapId), eq(maps.isPublished, true)));

        if (!map) {
            return NextResponse.json({ error: 'Map not found' }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json({ map }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get map error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

