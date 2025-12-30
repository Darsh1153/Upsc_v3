import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notes, tags, noteTags } from '@/lib/db/schema';
import { eq, and, or, gte, lte, inArray, desc, sql, SQL } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/mobile/notes/search - Search notes with FTS
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const query = searchParams.get('query') || '';
        const tagNamesParam = searchParams.get('tags') || '';
        const from = searchParams.get('from'); // ISO date string
        const to = searchParams.get('to'); // ISO date string
        const headingOnly = searchParams.get('headingOnly') === 'true';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const userIdInt = parseInt(userId);
        
        // Build conditions array
        const conditions: SQL<unknown>[] = [eq(notes.userId, userIdInt)];

        // Full-text search condition
        if (query.trim().length > 0) {
            if (headingOnly) {
                // Search only in headings array
                // Using array contains with text search
                conditions.push(
                    sql`EXISTS (
                        SELECT 1 FROM unnest(${notes}.headings) AS h 
                        WHERE h ILIKE ${'%' + query + '%'}
                    )`
                );
            } else {
                // Full-text search using tsvector
                // Convert query to tsquery format
                const tsQuery = query
                    .trim()
                    .split(/\s+/)
                    .filter(word => word.length > 0)
                    .map(word => word + ':*')
                    .join(' & ');
                
                conditions.push(
                    sql`${notes}.search_tsv @@ to_tsquery('english', ${tsQuery})`
                );
            }
        }

        // Tag filter
        if (tagNamesParam.trim().length > 0) {
            const tagNames = tagNamesParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            
            if (tagNames.length > 0) {
                // Get tag IDs for the given tag names
                const matchingTags = await db
                    .select({ id: tags.id })
                    .from(tags)
                    .where(inArray(tags.name, tagNames));
                
                const tagIds = matchingTags.map(t => t.id);
                
                if (tagIds.length > 0) {
                    // Find notes that have ALL the specified tags
                    conditions.push(
                        sql`${notes.id} IN (
                            SELECT note_id FROM note_tags 
                            WHERE tag_id = ANY(${tagIds})
                            GROUP BY note_id 
                            HAVING COUNT(DISTINCT tag_id) = ${tagIds.length}
                        )`
                    );
                } else {
                    // No matching tags found, return empty results
                    return NextResponse.json({
                        success: true,
                        results: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            totalPages: 0,
                        },
                    }, { headers: corsHeaders });
                }
            }
        }

        // Date range filters
        if (from) {
            const fromDate = new Date(from);
            if (!isNaN(fromDate.getTime())) {
                conditions.push(gte(notes.createdAt, fromDate));
            }
        }

        if (to) {
            const toDate = new Date(to);
            if (!isNaN(toDate.getTime())) {
                conditions.push(lte(notes.createdAt, toDate));
            }
        }

        // Execute search query
        const whereClause = and(...conditions);

        // Get results with rank if doing FTS
        let searchResults;
        
        if (query.trim().length > 0 && !headingOnly) {
            // Include FTS rank in sorting
            const tsQuery = query
                .trim()
                .split(/\s+/)
                .filter(word => word.length > 0)
                .map(word => word + ':*')
                .join(' & ');
            
            searchResults = await db
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
                    rank: sql<number>`ts_rank(${notes}.search_tsv, to_tsquery('english', ${tsQuery}))`.as('rank'),
                })
                .from(notes)
                .where(whereClause)
                .orderBy(desc(sql`rank`), desc(notes.updatedAt))
                .limit(limit)
                .offset(offset);
        } else {
            searchResults = await db
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
                .where(whereClause)
                .orderBy(desc(notes.updatedAt))
                .limit(limit)
                .offset(offset);
        }

        // Get total count for pagination
        const [{ count: totalCount }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notes)
            .where(whereClause);

        // Fetch tags for each result
        const resultsWithTags = await Promise.all(
            searchResults.map(async (note) => {
                const noteTagsData = await db
                    .select({
                        id: tags.id,
                        name: tags.name,
                        color: tags.color,
                    })
                    .from(tags)
                    .innerJoin(noteTags, eq(noteTags.tagId, tags.id))
                    .where(eq(noteTags.noteId, note.id));

                // Generate snippet/highlight if we have a query
                let snippet = '';
                if (query.trim().length > 0 && note.plainText) {
                    const queryLower = query.toLowerCase();
                    const textLower = note.plainText.toLowerCase();
                    const index = textLower.indexOf(queryLower);
                    
                    if (index !== -1) {
                        const start = Math.max(0, index - 50);
                        const end = Math.min(note.plainText.length, index + query.length + 50);
                        snippet = (start > 0 ? '...' : '') +
                            note.plainText.slice(start, end) +
                            (end < note.plainText.length ? '...' : '');
                    } else {
                        snippet = note.plainText.slice(0, 100) + (note.plainText.length > 100 ? '...' : '');
                    }
                } else if (note.plainText) {
                    snippet = note.plainText.slice(0, 100) + (note.plainText.length > 100 ? '...' : '');
                }

                return {
                    ...note,
                    tags: noteTagsData,
                    snippet,
                };
            })
        );

        return NextResponse.json({
            success: true,
            results: resultsWithTags,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
            query: query,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Search notes error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

