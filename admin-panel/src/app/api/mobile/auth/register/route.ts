import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Register a new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, phone, picture, provider = 'email' } = body;

        if (!email || !name) {
            return NextResponse.json(
                { success: false, error: 'Email and name are required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if user already exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

        if (existingUser) {
            // Return existing user (login behavior)
            await db
                .update(users)
                .set({ lastLogin: new Date(), updatedAt: new Date() })
                .where(eq(users.id, existingUser.id));

            return NextResponse.json({
                success: true,
                user: existingUser,
                message: 'User already exists, logged in',
            }, { headers: corsHeaders });
        }

        // Create new user
        const [newUser] = await db
            .insert(users)
            .values({
                email: email.toLowerCase(),
                name,
                phone: phone || null,
                picture: picture || null,
                provider,
                role: 'student',
                isGuest: false,
                isActive: true,
                lastLogin: new Date(),
            })
            .returning();

        return NextResponse.json({
            success: true,
            user: newUser,
            message: 'User registered successfully',
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

