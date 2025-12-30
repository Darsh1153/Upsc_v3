import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { practiceQuestions } from '@/lib/db/schema';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { question, optionA, optionB, optionC, optionD, correctAnswer, explanation, questionSetId } = body;

        // Validation
        if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !explanation) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (!questionSetId) {
            return NextResponse.json({ error: 'Question Set ID is required' }, { status: 400 });
        }

        // Insert into database
        const result = await db.insert(practiceQuestions).values({
            questionSetId: parseInt(questionSetId),
            question,
            optionA,
            optionB,
            optionC,
            optionD,
            correctAnswer,
            explanation,
        }).returning();

        return NextResponse.json({ success: true, data: result[0] });

    } catch (error: any) {
        console.error('Error adding question:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
