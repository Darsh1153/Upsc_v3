import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Get user profile by ID
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            success: true,
            user,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Update user profile
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, name, phone, picture } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);

        if (!existingUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        const [updatedUser] = await db
            .update(users)
            .set({
                ...(name && { name }),
                ...(phone !== undefined && { phone }),
                ...(picture !== undefined && { picture }),
                updatedAt: new Date(),
            })
            .where(eq(users.id, parseInt(userId)))
            .returning();

        return NextResponse.json({
            success: true,
            user: updatedUser,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Delete user account (soft delete by deactivating)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);

        if (!existingUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Soft delete - deactivate the account
        await db
            .update(users)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(users.id, parseInt(userId)));

        return NextResponse.json({
            success: true,
            message: 'Account deactivated successfully',
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

