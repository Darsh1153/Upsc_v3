import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notes, tags, noteTags, users } from '@/lib/db/schema';
import { eq, desc, and, inArray, count } from 'drizzle-orm';

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

// GET /api/mobile/notes - List notes for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const isPinned = searchParams.get('isPinned');
        const isArchived = searchParams.get('isArchived');
        const offset = (page - 1) * limit;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const userIdInt = parseInt(userId);
        
        // Build conditions
        const conditions = [eq(notes.userId, userIdInt)];
        
        if (isArchived !== null && isArchived !== undefined) {
            conditions.push(eq(notes.isArchived, isArchived === 'true'));
        } else {
            // By default, don't show archived notes
            conditions.push(eq(notes.isArchived, false));
        }

        // Fetch notes
        const userNotes = await db
            .select({
                id: notes.id,
                userId: notes.userId,
                title: notes.title,
                content: notes.content,
                plainText: notes.plainText,
                isPinned: notes.isPinned,
                isArchived: notes.isArchived,
                createdAt: notes.createdAt,
                updatedAt: notes.updatedAt,
            })
            .from(notes)
            .where(and(...conditions))
            .orderBy(desc(notes.isPinned), desc(notes.updatedAt))
            .limit(limit)
            .offset(offset);

        // Get total count
        const [{ count: totalCount }] = await db
            .select({ count: count() })
            .from(notes)
            .where(and(...conditions));

        // Fetch tags for each note
        const notesWithTags = await Promise.all(
            userNotes.map(async (note) => {
                const noteTagsData = await db
                    .select({
                        id: tags.id,
                        name: tags.name,
                        color: tags.color,
                    })
                    .from(tags)
                    .innerJoin(noteTags, eq(noteTags.tagId, tags.id))
                    .where(eq(noteTags.noteId, note.id));

                return {
                    ...note,
                    tags: noteTagsData,
                };
            })
        );

        return NextResponse.json({
            success: true,
            notes: notesWithTags,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('List notes error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// POST /api/mobile/notes - Create a new note
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, title, content, plainText: rawPlainText, tagIds = [] } = body;

        if (!userId || !title) {
            return NextResponse.json(
                { success: false, error: 'User ID and title required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const userIdInt = parseInt(userId);

        // Verify user exists
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, userIdInt))
            .limit(1);

        if (!existingUser) {
            return NextResponse.json(
                { success: false, error: `User with ID ${userIdInt} not found` },
                { status: 404, headers: corsHeaders }
            );
        }

        // Use provided plainText or extract from content
        const plainText = rawPlainText || extractPlainText(content);

        // Create the note
        const [newNote] = await db
            .insert(notes)
            .values({
                userId: userIdInt,
                title,
                content: content || null,
                plainText,
            })
            .returning();

        // Attach tags if provided
        if (tagIds.length > 0) {
            const tagIdInts = tagIds.map((id: string | number) => parseInt(String(id)));
            const tagRows = tagIdInts.map((tagId: number) => ({
                noteId: newNote.id,
                tagId,
            }));
            await db.insert(noteTags).values(tagRows);
        }

        // Fetch attached tags
        const attachedTags = tagIds.length > 0 
            ? await db
                .select({
                    id: tags.id,
                    name: tags.name,
                    color: tags.color,
                })
                .from(tags)
                .where(inArray(tags.id, tagIds.map((id: string | number) => parseInt(String(id)))))
            : [];

        return NextResponse.json({
            success: true,
            note: {
                ...newNote,
                tags: attachedTags,
            },
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Create note error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

