import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
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
        const userId = parseInt(params.id);
        const [foundUser] = await db.select().from(users).where(eq(users.id, userId));

        if (!foundUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: foundUser });
    } catch (error) {
        console.error('Get user error:', error);
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
        const userId = parseInt(params.id);
        const body = await request.json();
        const { name, email, phone, role, picture, isActive } = body;

        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;
        if (picture !== undefined) updateData.picture = picture;
        if (isActive !== undefined) updateData.isActive = isActive;

        const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await logActivity('user_updated', 'user', userId, `User "${updatedUser.name}" was updated`);

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Update user error:', error);
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
        const userId = parseInt(params.id);

        const [foundUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!foundUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await db.delete(users).where(eq(users.id, userId));

        await logActivity('user_deleted', 'user', userId, `User "${foundUser.name}" was deleted`);

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

