import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mindMaps, mindMapNodes, mindMapConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Get a single mind map with all nodes and connections
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);

        const [mindMap] = await db
            .select()
            .from(mindMaps)
            .where(eq(mindMaps.id, mindMapId));

        if (!mindMap) {
            return NextResponse.json(
                { success: false, error: 'Mind map not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        const nodes = await db
            .select()
            .from(mindMapNodes)
            .where(eq(mindMapNodes.mindMapId, mindMapId));

        const connections = await db
            .select()
            .from(mindMapConnections)
            .where(eq(mindMapConnections.mindMapId, mindMapId));

        console.log('[API] Mind map ID:', mindMapId);
        console.log('[API] Nodes count:', nodes.length);
        console.log('[API] Connections count:', connections.length);
        console.log('[API] Connections:', JSON.stringify(connections, null, 2));

        return NextResponse.json({
            success: true,
            mindMap: {
                ...mindMap,
                nodes,
                connections,
            },
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get mind map error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Update mind map (title, description, canvas state)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const body = await request.json();
        const { title, description, canvasState, tags } = body;

        const updateData: any = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (canvasState !== undefined) updateData.canvasState = canvasState;
        if (tags !== undefined) updateData.tags = tags;

        const [updated] = await db
            .update(mindMaps)
            .set(updateData)
            .where(eq(mindMaps.id, mindMapId))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { success: false, error: 'Mind map not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            success: true,
            mindMap: updated,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Update mind map error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Delete mind map (cascades to nodes and connections)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);

        const [deleted] = await db
            .delete(mindMaps)
            .where(eq(mindMaps.id, mindMapId))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Mind map not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Mind map deleted',
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Delete mind map error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

