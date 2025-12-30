import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Create a guest user for quick access without registration
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { deviceId } = body;

        // Generate unique guest identifier
        const guestId = deviceId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const guestEmail = `guest_${guestId}@guest.local`;

        // Check if this guest already exists
        const [existingGuest] = await db
            .select()
            .from(users)
            .where(eq(users.email, guestEmail))
            .limit(1);

        if (existingGuest) {
            // Update last login
            await db
                .update(users)
                .set({ lastLogin: new Date(), updatedAt: new Date() })
                .where(eq(users.id, existingGuest.id));

            return NextResponse.json({
                success: true,
                user: existingGuest,
                message: 'Guest session restored',
            }, { headers: corsHeaders });
        }

        // Create new guest user
        const [newGuest] = await db
            .insert(users)
            .values({
                email: guestEmail,
                name: `Guest User`,
                provider: 'guest',
                role: 'student',
                isGuest: true,
                isActive: true,
                lastLogin: new Date(),
            })
            .returning();

        return NextResponse.json({
            success: true,
            user: newGuest,
            message: 'Guest account created',
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Guest login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

