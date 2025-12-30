import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roadmapTopics, roadmapSubtopics, roadmapSources } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const paper = searchParams.get('paper');

        let topics;
        if (paper && paper !== 'all') {
            topics = await db.select().from(roadmapTopics).where(eq(roadmapTopics.paper, paper)).orderBy(asc(roadmapTopics.name));
        } else {
            topics = await db.select().from(roadmapTopics).orderBy(asc(roadmapTopics.paper), asc(roadmapTopics.name));
        }

        // Fetch subtopics and sources for each topic
        const topicsWithRelations = await Promise.all(
            topics.map(async (topic) => {
                const subtopics = await db
                    .select()
                    .from(roadmapSubtopics)
                    .where(eq(roadmapSubtopics.topicId, topic.id))
                    .orderBy(asc(roadmapSubtopics.order));

                const sources = await db
                    .select()
                    .from(roadmapSources)
                    .where(eq(roadmapSources.topicId, topic.id))
                    .orderBy(asc(roadmapSources.order));

                return {
                    ...topic,
                    subtopics: subtopics.map(st => ({
                        id: st.subtopicId,
                        name: st.name,
                        estimatedHours: st.estimatedHours,
                    })),
                    sources: sources.map(src => ({
                        type: src.type,
                        name: src.name,
                        link: src.link,
                    })),
                };
            })
        );

        return NextResponse.json({ topics: topicsWithRelations }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Get roadmap error:', error);
        console.error('Get roadmap error details:', error.message);
        console.error('Get roadmap error stack:', error.stack);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500, headers: corsHeaders });
    }
}

