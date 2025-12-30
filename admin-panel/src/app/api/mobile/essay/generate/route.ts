import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_KEY } from '@/lib/secure-config';
import { corsHeaders } from '../../_cors';

// Helper to generate Essay using AI
async function generateEssayWithAI(topic: string, difficulty: string, language: string, length: string, apiKey: string) {
    const prompt = `Write a comprehensive UPSC-style essay on the topic: "${topic}".
    
    Parameters:
    - Level: ${difficulty}
    - Language: ${language}
    - Length: ${length} words approx.
    
    Structure:
    1. Title
    2. Introduction (linking with current context if relevant)
    3. Main Body (organized in paragraphs with subheadings)
    4. Critical Analysis / Dimensions (Social, Economic, Political, etc.)
    5. Way Forward / Solutions
    6. Conclusion
    
    Format: Use clear Markdown with bold headings.
    Tone: Formal, analytical, balanced, and suitable for Civil Services Examination.
    `;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://upsc-app-admin.vercel.app',
            'X-Title': 'UPSC Prep App',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, difficulty = 'Medium', language = 'English', length = '1000' } = body;

        // const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            console.error('OPENROUTER_API_KEY is missing');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500, headers: corsHeaders }
            );
        }

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const essay = await generateEssayWithAI(topic, difficulty, language, length, OPENROUTER_API_KEY);

        return NextResponse.json({
            success: true,
            essay: essay
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Essay Generator API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
