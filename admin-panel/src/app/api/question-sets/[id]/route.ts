import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questionSets, practiceQuestions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        // Get the set details
        const set = await db.select().from(questionSets).where(eq(questionSets.id, id)).limit(1);

        if (!set.length) {
            return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
        }

        // Get questions for this set
        const questions = await db.select()
            .from(practiceQuestions)
            .where(eq(practiceQuestions.questionSetId, id))
            .orderBy(desc(practiceQuestions.createdAt));

        return NextResponse.json({
            ...set[0],
            questions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
