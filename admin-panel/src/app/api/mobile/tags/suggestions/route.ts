import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { ilike, desc, or, sql } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/mobile/tags/suggestions?prefix= - Get tag suggestions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const prefix = searchParams.get('prefix') || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        let suggestions;

        if (prefix.length > 0) {
            // Search for tags matching the prefix
            suggestions = await db
                .select()
                .from(tags)
                .where(ilike(tags.name, `${prefix}%`))
                .orderBy(desc(tags.usageCount), tags.name)
                .limit(limit);

            // If not enough suggestions, also search for tags containing the prefix
            if (suggestions.length < limit) {
                const containingSuggestions = await db
                    .select()
                    .from(tags)
                    .where(
                        sql`${tags.name} ILIKE ${'%' + prefix + '%'} AND ${tags.name} NOT ILIKE ${prefix + '%'}`
                    )
                    .orderBy(desc(tags.usageCount), tags.name)
                    .limit(limit - suggestions.length);

                suggestions = [...suggestions, ...containingSuggestions];
            }
        } else {
            // Return most popular tags when no prefix
            suggestions = await db
                .select()
                .from(tags)
                .orderBy(desc(tags.usageCount), tags.name)
                .limit(limit);
        }

        return NextResponse.json({
            success: true,
            suggestions,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Tag suggestions error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

