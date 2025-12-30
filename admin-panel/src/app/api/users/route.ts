import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, like, or, desc, count, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const offset = (page - 1) * limit;

        let conditions = [];

        if (search) {
            conditions.push(or(
                like(users.name, `%${search}%`),
                like(users.email, `%${search}%`)
            ));
        }

        if (role && role !== 'all') {
            conditions.push(eq(users.role, role));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const allUsers = await db
            .select()
            .from(users)
            .where(whereClause)
            .orderBy(desc(users.createdAt))
            .limit(limit)
            .offset(offset);

        const [{ count: totalCount }] = await db.select({ count: count() }).from(users).where(whereClause);

        return NextResponse.json({
            users: allUsers,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, name, phone, role, picture } = body;

        if (!email || !name) {
            return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
        }

        const [existingUser] = await db.select().from(users).where(eq(users.email, email));
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const [newUser] = await db
            .insert(users)
            .values({
                email,
                name,
                phone: phone || null,
                role: role || 'student',
                picture: picture || null,
                provider: 'manual',
            })
            .returning();

        await logActivity('user_created', 'user', newUser.id, `User "${newUser.name}" was created`);

        return NextResponse.json({ user: newUser }, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

