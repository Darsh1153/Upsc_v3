import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualReferences, historyTimelineEvents } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// Categories for visual references
// Categories for visual references
const REFERENCE_CATEGORIES = [
    'polity',
    'economy',
    'geography',
    'environment',
    'scienceTech',
    'science_tech', // Legacy support
    'history_timeline'
];

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const includeId = searchParams.get('includeId');

        // Special handling for history timeline
        if (category === 'history_timeline') {
            const events = await db
                .select()
                .from(historyTimelineEvents)
                .orderBy(asc(historyTimelineEvents.order));
            return NextResponse.json({ references: events, type: 'timeline' });
        }

        let references;
        if (category && category !== 'all') {
            references = await db
                .select()
                .from(visualReferences)
                .where(eq(visualReferences.category, category))
                .orderBy(asc(visualReferences.order));

            // If we have references for this category, return the data directly
            // The data is stored as a single JSON blob per category
            if (references.length > 0) {
                const ref = references[0];
                if (includeId) {
                    return NextResponse.json({ references: ref.data, id: ref.id, type: 'reference' });
                }
                return NextResponse.json({ references: ref.data, type: 'reference' });
            }
            return NextResponse.json({ references: {}, type: 'reference' });
        } else {
            references = await db
                .select()
                .from(visualReferences)
                .orderBy(visualReferences.category, asc(visualReferences.order));
        }

        return NextResponse.json({ references, type: 'reference' });
    } catch (error) {
        console.error('Get references error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { category, subcategory, title, data, order, type } = body;

        // Special handling for history timeline
        if (category === 'history_timeline' || type === 'timeline') {
            const { year, event, details } = body;
            if (!year || !event) {
                return NextResponse.json({ error: 'Year and event are required for timeline' }, { status: 400 });
            }

            const [newEvent] = await db
                .insert(historyTimelineEvents)
                .values({
                    year,
                    event,
                    category: body.category === 'history_timeline' ? (subcategory || 'indian_ancient') : category,
                    details: details || null,
                    order: order || 0,
                })
                .returning();

            await logActivity('timeline_event_created', 'reference', newEvent.id, `Timeline event "${event}" was created`);

            return NextResponse.json({ reference: newEvent }, { status: 201 });
        }

        if (!category || !title || !data) {
            return NextResponse.json({ error: 'Category, title, and data are required' }, { status: 400 });
        }

        // Check if reference for this category already exists (upsert logic)
        const existing = await db
            .select()
            .from(visualReferences)
            .where(eq(visualReferences.category, category));

        if (existing.length > 0) {
            // Update existing reference
            const [updated] = await db
                .update(visualReferences)
                .set({
                    title,
                    data,
                    subcategory: subcategory || null,
                    order: order || 0,
                    updatedAt: new Date(),
                })
                .where(eq(visualReferences.id, existing[0].id))
                .returning();

            await logActivity('reference_updated', 'reference', updated.id, `Reference "${title}" was updated`);
            return NextResponse.json({ reference: updated });
        }

        // Create new reference
        const [newReference] = await db
            .insert(visualReferences)
            .values({
                category,
                subcategory: subcategory || null,
                title,
                data,
                order: order || 0,
            })
            .returning();

        await logActivity('reference_created', 'reference', newReference.id, `Reference "${title}" was created`);

        return NextResponse.json({ reference: newReference }, { status: 201 });
    } catch (error) {
        console.error('Create reference error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

