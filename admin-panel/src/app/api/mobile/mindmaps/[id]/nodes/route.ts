import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mindMapNodes, mindMaps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Add a new node
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const body = await request.json();
        const { nodeId, label, x, y, color, shape, referenceType, referenceId, metadata } = body;

        if (!nodeId || !label) {
            return NextResponse.json(
                { success: false, error: 'Node ID and label required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [newNode] = await db
            .insert(mindMapNodes)
            .values({
                mindMapId,
                nodeId,
                label,
                x: x || 0,
                y: y || 0,
                color: color || '#3B82F6',
                shape: shape || 'rounded',
                referenceType: referenceType || null,
                referenceId: referenceId || null,
                metadata: metadata || null,
            })
            .returning();

        // Update mind map timestamp
        await db
            .update(mindMaps)
            .set({ updatedAt: new Date() })
            .where(eq(mindMaps.id, mindMapId));

        return NextResponse.json({
            success: true,
            node: newNode,
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Create node error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Update a node
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const body = await request.json();
        const { nodeId, label, x, y, color, shape, width, height, referenceType, referenceId, metadata } = body;

        if (!nodeId) {
            return NextResponse.json(
                { success: false, error: 'Node ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const updateData: any = { updatedAt: new Date() };
        if (label !== undefined) updateData.label = label;
        if (x !== undefined) updateData.x = x;
        if (y !== undefined) updateData.y = y;
        if (color !== undefined) updateData.color = color;
        if (shape !== undefined) updateData.shape = shape;
        if (width !== undefined) updateData.width = width;
        if (height !== undefined) updateData.height = height;
        if (referenceType !== undefined) updateData.referenceType = referenceType;
        if (referenceId !== undefined) updateData.referenceId = referenceId;
        if (metadata !== undefined) updateData.metadata = metadata;

        const [updated] = await db
            .update(mindMapNodes)
            .set(updateData)
            .where(
                and(
                    eq(mindMapNodes.mindMapId, mindMapId),
                    eq(mindMapNodes.nodeId, nodeId)
                )
            )
            .returning();

        if (!updated) {
            return NextResponse.json(
                { success: false, error: 'Node not found' },
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
            node: updated,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Update node error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Delete a node
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const { searchParams } = new URL(request.url);
        const nodeId = searchParams.get('nodeId');

        if (!nodeId) {
            return NextResponse.json(
                { success: false, error: 'Node ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [deleted] = await db
            .delete(mindMapNodes)
            .where(
                and(
                    eq(mindMapNodes.mindMapId, mindMapId),
                    eq(mindMapNodes.nodeId, nodeId)
                )
            )
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Node not found' },
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
            message: 'Node deleted',
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Delete node error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Batch update nodes (for moving multiple nodes at once)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mindMapId = parseInt(params.id);
        const body = await request.json();
        const { nodes } = body; // Array of { nodeId, x, y }

        if (!nodes || !Array.isArray(nodes)) {
            return NextResponse.json(
                { success: false, error: 'Nodes array required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const updatedNodes = [];
        for (const node of nodes) {
            const [updated] = await db
                .update(mindMapNodes)
                .set({ x: node.x, y: node.y, updatedAt: new Date() })
                .where(
                    and(
                        eq(mindMapNodes.mindMapId, mindMapId),
                        eq(mindMapNodes.nodeId, node.nodeId)
                    )
                )
                .returning();
            if (updated) updatedNodes.push(updated);
        }

        // Update mind map timestamp
        await db
            .update(mindMaps)
            .set({ updatedAt: new Date() })
            .where(eq(mindMaps.id, mindMapId));

        return NextResponse.json({
            success: true,
            nodes: updatedNodes,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Batch update nodes error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

