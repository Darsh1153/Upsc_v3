import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questionSets } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
    try {
        const sets = await db.select().from(questionSets).orderBy(desc(questionSets.createdAt));
        return NextResponse.json(sets);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, description, year } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const result = await db.insert(questionSets).values({
            title,
            description,
            year: year ? parseInt(year) : new Date().getFullYear(),
            isPublished: false,
        }).returning();

        return NextResponse.json(result[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
