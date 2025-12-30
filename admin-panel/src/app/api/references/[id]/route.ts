import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualReferences, historyTimelineEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const id = parseInt(params.id);

        if (type === 'timeline') {
            const [event] = await db.select().from(historyTimelineEvents).where(eq(historyTimelineEvents.id, id));
            if (!event) {
                return NextResponse.json({ error: 'Event not found' }, { status: 404 });
            }
            return NextResponse.json({ reference: event, type: 'timeline' });
        }

        const [reference] = await db.select().from(visualReferences).where(eq(visualReferences.id, id));
        if (!reference) {
            return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
        }

        return NextResponse.json({ reference, type: 'reference' });
    } catch (error) {
        console.error('Get reference error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const { type } = body;

        if (type === 'timeline') {
            const { year, event, category, details, order } = body;
            const [updated] = await db
                .update(historyTimelineEvents)
                .set({
                    year,
                    event,
                    category,
                    details,
                    order,
                    updatedAt: new Date(),
                })
                .where(eq(historyTimelineEvents.id, id))
                .returning();

            if (!updated) {
                return NextResponse.json({ error: 'Event not found' }, { status: 404 });
            }

            await logActivity('timeline_event_updated', 'reference', id, `Timeline event "${event}" was updated`);
            return NextResponse.json({ reference: updated });
        }

        const { category, subcategory, title, data, order } = body;
        const [updated] = await db
            .update(visualReferences)
            .set({
                category,
                subcategory,
                title,
                data,
                order,
                updatedAt: new Date(),
            })
            .where(eq(visualReferences.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
        }

        await logActivity('reference_updated', 'reference', id, `Reference "${title}" was updated`);
        return NextResponse.json({ reference: updated });
    } catch (error) {
        console.error('Update reference error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const id = parseInt(params.id);

        if (type === 'timeline') {
            const [event] = await db.select().from(historyTimelineEvents).where(eq(historyTimelineEvents.id, id));
            if (!event) {
                return NextResponse.json({ error: 'Event not found' }, { status: 404 });
            }
            await db.delete(historyTimelineEvents).where(eq(historyTimelineEvents.id, id));
            await logActivity('timeline_event_deleted', 'reference', id, `Timeline event "${event.event}" was deleted`);
            return NextResponse.json({ message: 'Event deleted successfully' });
        }

        const [reference] = await db.select().from(visualReferences).where(eq(visualReferences.id, id));
        if (!reference) {
            return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
        }

        await db.delete(visualReferences).where(eq(visualReferences.id, id));
        await logActivity('reference_deleted', 'reference', id, `Reference "${reference.title}" was deleted`);

        return NextResponse.json({ message: 'Reference deleted successfully' });
    } catch (error) {
        console.error('Delete reference error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

