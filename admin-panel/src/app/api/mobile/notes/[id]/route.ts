import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notes, tags, noteTags } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Helper function to extract plain text from Lexical JSON
function extractPlainText(content: any): string {
    if (!content) return '';
    
    let text = '';
    
    const extractFromNode = (node: any) => {
        if (node.text) {
            text += node.text + ' ';
        }
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(extractFromNode);
        }
    };
    
    if (content.root) {
        extractFromNode(content.root);
    } else if (content.children) {
        content.children.forEach(extractFromNode);
    }
    
    return text.trim();
}

// GET /api/mobile/notes/[id] - Get a single note
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const noteId = parseInt(id);

        if (isNaN(noteId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid note ID' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1);

        if (!note) {
            return NextResponse.json(
                { success: false, error: 'Note not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Fetch tags for this note
        const noteTags_ = await db
            .select({
                id: tags.id,
                name: tags.name,
                color: tags.color,
            })
            .from(tags)
            .innerJoin(noteTags, eq(noteTags.tagId, tags.id))
            .where(eq(noteTags.noteId, noteId));

        return NextResponse.json({
            success: true,
            note: {
                ...note,
                tags: noteTags_,
            },
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get note error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// PUT /api/mobile/notes/[id] - Update a note
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const noteId = parseInt(id);
        const body = await request.json();
        const { title, content, plainText: rawPlainText, tagIds, isPinned, isArchived } = body;

        if (isNaN(noteId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid note ID' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if note exists
        const [existingNote] = await db
            .select({ id: notes.id })
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1);

        if (!existingNote) {
            return NextResponse.json(
                { success: false, error: 'Note not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Build update object
        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (title !== undefined) {
            updateData.title = title;
        }

        // Handle plainText - use provided or extract from content
        if (rawPlainText !== undefined) {
            updateData.plainText = rawPlainText;
        } else if (content !== undefined) {
            updateData.content = content;
            updateData.plainText = extractPlainText(content);
        }

        if (isPinned !== undefined) {
            updateData.isPinned = isPinned;
        }

        if (isArchived !== undefined) {
            updateData.isArchived = isArchived;
        }

        // Update the note
        const [updatedNote] = await db
            .update(notes)
            .set(updateData)
            .where(eq(notes.id, noteId))
            .returning();

        // Update tags if provided
        if (tagIds !== undefined) {
            // Delete existing tag associations
            await db.delete(noteTags).where(eq(noteTags.noteId, noteId));

            // Add new tag associations
            if (tagIds.length > 0) {
                const tagIdInts = tagIds.map((id: string | number) => parseInt(String(id)));
                const tagRows = tagIdInts.map((tagId: number) => ({
                    noteId,
                    tagId,
                }));
                await db.insert(noteTags).values(tagRows);
            }
        }

        // Fetch updated tags
        const noteTags_ = await db
            .select({
                id: tags.id,
                name: tags.name,
                color: tags.color,
            })
            .from(tags)
            .innerJoin(noteTags, eq(noteTags.tagId, tags.id))
            .where(eq(noteTags.noteId, noteId));

        return NextResponse.json({
            success: true,
            note: {
                ...updatedNote,
                tags: noteTags_,
            },
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Update note error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// DELETE /api/mobile/notes/[id] - Delete a note
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const noteId = parseInt(id);

        if (isNaN(noteId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid note ID' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if note exists
        const [existingNote] = await db
            .select({ id: notes.id })
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1);

        if (!existingNote) {
            return NextResponse.json(
                { success: false, error: 'Note not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Delete the note (cascade will handle note_tags)
        await db.delete(notes).where(eq(notes.id, noteId));

        return NextResponse.json({
            success: true,
            message: 'Note deleted successfully',
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Delete note error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

