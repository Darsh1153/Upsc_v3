import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maps } from '@/lib/db/schema';
import { eq, asc, ilike, or } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to get full image URL
function getFullImageUrl(imageUrl: string, request: NextRequest): string {
    // If already a full URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // For local uploads, prepend the base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    return `${protocol}://${host}${imageUrl}`;
}

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filterSection = searchParams.get('section');

        const allMaps = await db
            .select()
            .from(maps)
            .where(eq(maps.isPublished, true))
            .orderBy(asc(maps.createdAt));

        // Group maps by their category (which acts as the section)
        const sections: Record<string, any[]> = {};
        const sectionOrder: string[] = [];

        for (const map of allMaps) {
            // Use category as the section name
            const section = map.category || 'Other';
            
            // If filtering by section, skip non-matching
            if (filterSection && filterSection !== 'all' && section !== filterSection) {
                continue;
            }

            // Initialize section if needed
            if (!sections[section]) {
                sections[section] = [];
                sectionOrder.push(section);
            }

            // Transform to mobile app format with full image URL
            const transformedMap = {
                id: `map-${map.id}`,
                title: map.title,
                subtitle: map.description || '',
                image: getFullImageUrl(map.imageUrl, request),
                icon: getIconForCategory(section),
                color: getColorForCategory(section),
                section: section,
                tags: map.tags || [],
                hotspots: map.hotspots || [],
            };

            sections[section].push(transformedMap);
        }

        return NextResponse.json({
            success: true,
            sections: sections,
            sectionOrder: sectionOrder,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get maps error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

function getIconForCategory(category: string): string {
    const categoryLower = category.toLowerCase();
    // Check for keywords in category name
    if (categoryLower.includes('india')) return 'flag';
    if (categoryLower.includes('world') || categoryLower.includes('global')) return 'globe';
    if (categoryLower.includes('political')) return 'map';
    if (categoryLower.includes('physical')) return 'earth';
    if (categoryLower.includes('climate') || categoryLower.includes('weather')) return 'partly-sunny';
    if (categoryLower.includes('economic') || categoryLower.includes('economy')) return 'cash';
    if (categoryLower.includes('histor')) return 'time';
    if (categoryLower.includes('cultur')) return 'people';
    if (categoryLower.includes('river') || categoryLower.includes('water')) return 'water';
    if (categoryLower.includes('mountain')) return 'triangle';
    if (categoryLower.includes('state')) return 'location';
    return 'map';
}

function getColorForCategory(category: string): string {
    const categoryLower = category.toLowerCase();
    // Generate consistent colors based on category name
    if (categoryLower.includes('india')) return '#FF9933'; // Saffron
    if (categoryLower.includes('world') || categoryLower.includes('global')) return '#3B82F6'; // Blue
    if (categoryLower.includes('political')) return '#3B82F6';
    if (categoryLower.includes('physical')) return '#10B981';
    if (categoryLower.includes('climate') || categoryLower.includes('weather')) return '#F59E0B';
    if (categoryLower.includes('economic') || categoryLower.includes('economy')) return '#8B5CF6';
    if (categoryLower.includes('histor')) return '#EC4899';
    if (categoryLower.includes('cultur')) return '#06B6D4';
    if (categoryLower.includes('river') || categoryLower.includes('water')) return '#0EA5E9';
    if (categoryLower.includes('mountain')) return '#78716C';
    if (categoryLower.includes('state')) return '#22C55E';
    // Generate a color based on string hash for other categories
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444', '#22C55E'];
    return colors[Math.abs(hash) % colors.length];
}
