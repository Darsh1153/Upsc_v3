import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roadmapTopics, roadmapSubtopics, roadmapSources } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const paper = searchParams.get('paper');

        let topics;
        if (paper && paper !== 'all') {
            topics = await db.select().from(roadmapTopics).where(eq(roadmapTopics.paper, paper)).orderBy(roadmapTopics.name);
        } else {
            topics = await db.select().from(roadmapTopics).orderBy(roadmapTopics.paper, roadmapTopics.name);
        }

        // Fetch subtopics and sources for each topic
        const topicsWithRelations = await Promise.all(
            topics.map(async (topic) => {
                const subtopics = await db
                    .select()
                    .from(roadmapSubtopics)
                    .where(eq(roadmapSubtopics.topicId, topic.id))
                    .orderBy(roadmapSubtopics.order);

                const sources = await db
                    .select()
                    .from(roadmapSources)
                    .where(eq(roadmapSources.topicId, topic.id))
                    .orderBy(roadmapSources.order);

                return { ...topic, subtopics, sources };
            })
        );

        return NextResponse.json({ topics: topicsWithRelations });
    } catch (error) {
        console.error('Get roadmap error:', error);
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
        const { topicId, name, paper, icon, estimatedHours, difficulty, priority, isRecurring, optional, subtopics, sources } = body;

        if (!topicId || !name || !paper || estimatedHours === undefined || estimatedHours === null || !difficulty || !priority) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create topic
        const [newTopic] = await db
            .insert(roadmapTopics)
            .values({
                topicId,
                name,
                paper,
                icon: icon || null,
                estimatedHours,
                difficulty,
                priority,
                isRecurring: isRecurring || false,
                optional: optional || null,
            })
            .returning();

        // Create subtopics if provided
        if (subtopics && subtopics.length > 0) {
            await db.insert(roadmapSubtopics).values(
                subtopics.map((st: any, index: number) => ({
                    subtopicId: st.id || `${topicId}_sub_${index}`,
                    topicId: newTopic.id,
                    name: st.name,
                    estimatedHours: st.estimatedHours,
                    order: index,
                }))
            );
        }

        // Create sources if provided
        if (sources && sources.length > 0) {
            await db.insert(roadmapSources).values(
                sources.map((src: any, index: number) => ({
                    topicId: newTopic.id,
                    type: src.type,
                    name: src.name,
                    link: src.link || null,
                    order: index,
                }))
            );
        }

        await logActivity('roadmap_topic_created', 'roadmap', newTopic.id, `Topic "${name}" was created`);

        return NextResponse.json({ topic: newTopic }, { status: 201 });
    } catch (error: any) {
        console.error('Create roadmap topic error:', error);
        // Check for unique constraint violation
        if (error.code === '23505') {
            return NextResponse.json({ error: 'A topic with this ID already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

