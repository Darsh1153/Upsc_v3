import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('Login attempt received');
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        console.log('Verifying credentials for:', email);

        // Sign in with Supabase to get session
        const supabase = createServerClient();
        let { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // If email is not confirmed, auto-confirm it using service role
        if (sessionError && (sessionError.message?.includes('Email not confirmed') || sessionError.message?.includes('not been confirmed'))) {
            console.log('Email not confirmed, auto-confirming...');

            // Get the user first
            const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
            const user = users?.find(u => u.email === email);

            if (!getUserError && user && !user.email_confirmed_at) {
                // Auto-confirm the email using admin API
                const { error: confirmError } = await supabase.auth.admin.updateUserById(
                    user.id,
                    { email_confirm: true }
                );

                if (confirmError) {
                    console.error('Error confirming email:', confirmError);
                } else {
                    console.log('Email auto-confirmed, retrying login...');
                    // Retry login after confirming
                    const retryResult = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (!retryResult.error && retryResult.data?.session && retryResult.data?.user) {
                        sessionData = retryResult.data;
                        sessionError = null;
                    }
                }
            }
        }

        if (sessionError || !sessionData?.session || !sessionData?.user) {
            console.log('Invalid credentials:', sessionError?.message);
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Get user info
        const userMetadata = sessionData.user.user_metadata || {};
        const userRole = userMetadata.role || 'user';
        const user = {
            id: sessionData.user.id,
            email: sessionData.user.email!,
            name: userMetadata.name || userMetadata.full_name || sessionData.user.email?.split('@')[0] || 'Admin',
            role: userRole,
        };

        // Create response with user data and token
        const response = NextResponse.json({
            token: sessionData.session.access_token,
            refreshToken: sessionData.session.refresh_token,
            user
        });

        // Set cookies for session management
        response.cookies.set('sb-access-token', sessionData.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        response.cookies.set('sb-refresh-token', sessionData.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        console.log('Login successful for:', email);
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

