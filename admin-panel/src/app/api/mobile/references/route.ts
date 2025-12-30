import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visualReferences, historyTimelineEvents } from '@/lib/db/schema';
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
        const category = searchParams.get('category');

        // Special handling for history timeline
        if (category === 'history_timeline') {
            const events = await db
                .select()
                .from(historyTimelineEvents)
                .orderBy(asc(historyTimelineEvents.order));
            
            return NextResponse.json({ 
                references: events.map(e => ({
                    year: e.year,
                    event: e.event,
                    category: e.category,
                    details: e.details,
                })),
                type: 'timeline' 
            }, { headers: corsHeaders });
        }

        let references;
        if (category && category !== 'all') {
            references = await db
                .select()
                .from(visualReferences)
                .where(eq(visualReferences.category, category))
                .orderBy(asc(visualReferences.order));
            
            // For a specific category, return the data directly
            // Data is stored as a single JSON blob per category
            if (references.length > 0) {
                return NextResponse.json({ 
                    references: references[0].data,
                    type: 'reference' 
                }, { headers: corsHeaders });
            }
            return NextResponse.json({ 
                references: {},
                type: 'reference' 
            }, { headers: corsHeaders });
        } else {
            references = await db
                .select()
                .from(visualReferences)
                .orderBy(visualReferences.category, asc(visualReferences.order));
        }

        // Group references by category
        const grouped = references.reduce((acc, ref) => {
            acc[ref.category] = ref.data;
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({ 
            references: grouped,
            type: 'reference' 
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get references error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

