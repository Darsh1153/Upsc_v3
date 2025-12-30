import { NextResponse } from 'next/server';

export async function GET() {
    const gsPapers = ['GS1', 'GS2', 'GS3', 'GS4'];
    const subjects = [
        'Polity',
        'Economy',
        'Geography',
        'History',
        'Art & Culture',
        'Science & Technology',
        'Environment',
        'International Relations',
        'Social Issues',
        'Ethics',
        'Current Affairs',
        'Other',
    ];
    return NextResponse.json({ gsPapers, subjects });
}

