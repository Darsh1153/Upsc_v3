import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roadmapTopics, roadmapSubtopics, roadmapSources } from '@/lib/db/schema';
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
        const topicId = parseInt(params.id);
        const [topic] = await db.select().from(roadmapTopics).where(eq(roadmapTopics.id, topicId));

        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        const subtopics = await db
            .select()
            .from(roadmapSubtopics)
            .where(eq(roadmapSubtopics.topicId, topicId))
            .orderBy(roadmapSubtopics.order);

        const sources = await db
            .select()
            .from(roadmapSources)
            .where(eq(roadmapSources.topicId, topicId))
            .orderBy(roadmapSources.order);

        return NextResponse.json({ topic: { ...topic, subtopics, sources } });
    } catch (error) {
        console.error('Get topic error:', error);
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
        const topicId = parseInt(params.id);
        const body = await request.json();
        const { name, paper, icon, estimatedHours, difficulty, priority, isRecurring, optional, subtopics, sources } = body;

        // Update topic
        const [updatedTopic] = await db
            .update(roadmapTopics)
            .set({
                name,
                paper,
                icon,
                estimatedHours,
                difficulty,
                priority,
                isRecurring,
                optional,
                updatedAt: new Date(),
            })
            .where(eq(roadmapTopics.id, topicId))
            .returning();

        if (!updatedTopic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // Update subtopics - delete existing and recreate
        if (subtopics !== undefined) {
            await db.delete(roadmapSubtopics).where(eq(roadmapSubtopics.topicId, topicId));
            if (subtopics.length > 0) {
                await db.insert(roadmapSubtopics).values(
                    subtopics.map((st: any, index: number) => ({
                        subtopicId: st.subtopicId || st.id || `${updatedTopic.topicId}_sub_${index}`,
                        topicId: topicId,
                        name: st.name,
                        estimatedHours: st.estimatedHours,
                        order: index,
                    }))
                );
            }
        }

        // Update sources - delete existing and recreate
        if (sources !== undefined) {
            await db.delete(roadmapSources).where(eq(roadmapSources.topicId, topicId));
            if (sources.length > 0) {
                await db.insert(roadmapSources).values(
                    sources.map((src: any, index: number) => ({
                        topicId: topicId,
                        type: src.type,
                        name: src.name,
                        link: src.link || null,
                        order: index,
                    }))
                );
            }
        }

        await logActivity('roadmap_topic_updated', 'roadmap', topicId, `Topic "${updatedTopic.name}" was updated`);

        return NextResponse.json({ topic: updatedTopic });
    } catch (error) {
        console.error('Update topic error:', error);
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
        const topicId = parseInt(params.id);

        const [topic] = await db.select().from(roadmapTopics).where(eq(roadmapTopics.id, topicId));
        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // Delete cascades automatically for subtopics and sources
        await db.delete(roadmapTopics).where(eq(roadmapTopics.id, topicId));

        await logActivity('roadmap_topic_deleted', 'roadmap', topicId, `Topic "${topic.name}" was deleted`);

        return NextResponse.json({ message: 'Topic deleted successfully' });
    } catch (error) {
        console.error('Delete topic error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

