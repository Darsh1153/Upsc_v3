import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = parseInt(params.id);

        const [foundUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!foundUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const [updatedUser] = await db
            .update(users)
            .set({ isActive: !foundUser.isActive, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();

        await logActivity(
            foundUser.isActive ? 'user_deactivated' : 'user_activated',
            'user',
            userId,
            `User "${updatedUser.name}" was ${foundUser.isActive ? 'deactivated' : 'activated'}`
        );

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Toggle active error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

