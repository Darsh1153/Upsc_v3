import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mindMapConnections, mindMaps } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Add a new connection
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const body = await request.json();
        const { connectionId, sourceNodeId, targetNodeId, label, color, strokeWidth, style, animated } = body;

        if (!connectionId || !sourceNodeId || !targetNodeId) {
            return NextResponse.json(
                { success: false, error: 'Connection ID, source and target node IDs required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if connection already exists
        const existing = await db
            .select()
            .from(mindMapConnections)
            .where(
                and(
                    eq(mindMapConnections.mindMapId, mindMapId),
                    or(
                        and(
                            eq(mindMapConnections.sourceNodeId, sourceNodeId),
                            eq(mindMapConnections.targetNodeId, targetNodeId)
                        ),
                        and(
                            eq(mindMapConnections.sourceNodeId, targetNodeId),
                            eq(mindMapConnections.targetNodeId, sourceNodeId)
                        )
                    )
                )
            );

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Connection already exists' },
                { status: 400, headers: corsHeaders }
            );
        }

        console.log('[API] Creating connection:', { mindMapId, connectionId, sourceNodeId, targetNodeId });
        
        const [newConnection] = await db
            .insert(mindMapConnections)
            .values({
                mindMapId,
                connectionId,
                sourceNodeId,
                targetNodeId,
                label: label || null,
                color: color || '#94A3B8',
                strokeWidth: Math.round(strokeWidth) || 2,
                style: style || 'solid',
                animated: animated || false,
            })
            .returning();
        
        console.log('[API] Connection created:', newConnection);

        // Update mind map timestamp
        await db
            .update(mindMaps)
            .set({ updatedAt: new Date() })
            .where(eq(mindMaps.id, mindMapId));

        return NextResponse.json({
            success: true,
            connection: newConnection,
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Create connection error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Update a connection
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const body = await request.json();
        const { connectionId, label, color, strokeWidth, style, animated } = body;

        if (!connectionId) {
            return NextResponse.json(
                { success: false, error: 'Connection ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const updateData: any = {};
        if (label !== undefined) updateData.label = label;
        if (color !== undefined) updateData.color = color;
        if (strokeWidth !== undefined) updateData.strokeWidth = strokeWidth;
        if (style !== undefined) updateData.style = style;
        if (animated !== undefined) updateData.animated = animated;

        const [updated] = await db
            .update(mindMapConnections)
            .set(updateData)
            .where(
                and(
                    eq(mindMapConnections.mindMapId, mindMapId),
                    eq(mindMapConnections.connectionId, connectionId)
                )
            )
            .returning();

        if (!updated) {
            return NextResponse.json(
                { success: false, error: 'Connection not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            success: true,
            connection: updated,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Update connection error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Delete a connection
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const { searchParams } = new URL(request.url);
        const connectionId = searchParams.get('connectionId');

        if (!connectionId) {
            return NextResponse.json(
                { success: false, error: 'Connection ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [deleted] = await db
            .delete(mindMapConnections)
            .where(
                and(
                    eq(mindMapConnections.mindMapId, mindMapId),
                    eq(mindMapConnections.connectionId, connectionId)
                )
            )
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Connection not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Update mind map timestamp
        await db
            .update(mindMaps)
            .set({ updatedAt: new Date() })
            .where(eq(mindMaps.id, mindMapId));

        return NextResponse.json({
            success: true,
            message: 'Connection deleted',
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Delete connection error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Delete all connections for a node (when node is deleted)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const body = await request.json();
        const { nodeId } = body;

        if (!nodeId) {
            return NextResponse.json(
                { success: false, error: 'Node ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const deleted = await db
            .delete(mindMapConnections)
            .where(
                and(
                    eq(mindMapConnections.mindMapId, mindMapId),
                    or(
                        eq(mindMapConnections.sourceNodeId, nodeId),
                        eq(mindMapConnections.targetNodeId, nodeId)
                    )
                )
            )
            .returning();

        return NextResponse.json({
            success: true,
            deletedCount: deleted.length,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Delete node connections error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

