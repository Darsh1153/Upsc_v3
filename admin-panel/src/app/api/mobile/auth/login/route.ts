import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createServerClient } from '@/lib/supabase';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Login user by email (syncs with Supabase user)
// This route syncs Supabase auth users with the local users table
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, accessToken } = body;

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // If access token is provided, verify with Supabase
        let supabaseUser = null;
        if (accessToken) {
            const supabase = createServerClient();
            const { data: { user }, error } = await supabase.auth.getUser(accessToken);
            
            if (error || !user) {
                return NextResponse.json(
                    { success: false, error: 'Invalid authentication token' },
                    { status: 401, headers: corsHeaders }
                );
            }
            
            supabaseUser = user;
        }

        // Find user by email in local database
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

        if (existingUser) {
            // Check if user is active
            if (!existingUser.isActive) {
                return NextResponse.json(
                    { success: false, error: 'Account is deactivated. Please contact support.' },
                    { status: 403, headers: corsHeaders }
                );
            }

            // Update last login
            await db
                .update(users)
                .set({
                    lastLogin: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(users.id, existingUser.id));

            // Fetch updated user
            const [updatedUser] = await db
                .select()
                .from(users)
                .where(eq(users.id, existingUser.id))
                .limit(1);

            return NextResponse.json({
                success: true,
                user: updatedUser,
                isNewUser: false,
            }, { headers: corsHeaders });
        }

        // User doesn't exist - create new account from Supabase user
        if (!supabaseUser) {
            return NextResponse.json(
                { success: false, error: 'User not found. Please sign up first.' },
                { status: 404, headers: corsHeaders }
            );
        }

        const userMetadata = supabaseUser.user_metadata || {};
        const [newUser] = await db
            .insert(users)
            .values({
                email: supabaseUser.email!.toLowerCase(),
                name: userMetadata.name || userMetadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
                phone: userMetadata.phone || null,
                picture: userMetadata.avatar_url || null,
                provider: supabaseUser.app_metadata?.provider || 'email',
                role: 'student',
                isGuest: false,
                isActive: true,
                lastLogin: new Date(),
            })
            .returning();

        return NextResponse.json({
            success: true,
            user: newUser,
            isNewUser: true,
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

