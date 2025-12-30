import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS is handled by middleware - no need to add headers here
export async function OPTIONS() {
    return new NextResponse(null, { status: 200 });
}

// Proxy endpoint for Supabase authentication to avoid CORS issues
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, name } = body;

        console.log('[Supabase Auth Proxy] Action:', action);
        console.log('[Supabase Auth Proxy] Email:', email);

        // Use anon key for user authentication (not service role key)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json(
                { success: false, error: 'Missing Supabase configuration' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        if (action === 'signIn') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('[Supabase Auth Proxy] Sign in error:', error);
                console.error('[Supabase Auth Proxy] Error details:', JSON.stringify(error, null, 2));
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 400 }
                );
            }

            if (!data || !data.user) {
                console.error('[Supabase Auth Proxy] No user data returned');
                return NextResponse.json(
                    { success: false, error: 'No user data returned' },
                    { status: 400 }
                );
            }

            console.log('[Supabase Auth Proxy] Sign in successful for:', data.user.email);
            console.log('[Supabase Auth Proxy] Session exists:', !!data.session);

            return NextResponse.json({
                success: true,
                user: data.user,
                session: data.session,
            });
        }

        if (action === 'signUp') {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        full_name: name,
                    },
                    emailRedirectTo: undefined,
                },
            });

            if (error) {
                console.error('[Supabase Auth Proxy] Sign up error:', error);
                console.error('[Supabase Auth Proxy] Error details:', JSON.stringify(error, null, 2));
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 400 }
                );
            }

            if (!data || !data.user) {
                console.error('[Supabase Auth Proxy] No user data returned');
                return NextResponse.json(
                    { success: false, error: 'No user data returned' },
                    { status: 400 }
                );
            }

            console.log('[Supabase Auth Proxy] Sign up successful for:', data.user.email);
            console.log('[Supabase Auth Proxy] Session exists:', !!data.session);

            return NextResponse.json({
                success: true,
                user: data.user,
                session: data.session,
            });
        }

        if (action === 'signOut') {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[Supabase Auth Proxy] Sign out error:', error);
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('[Supabase Auth Proxy] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

