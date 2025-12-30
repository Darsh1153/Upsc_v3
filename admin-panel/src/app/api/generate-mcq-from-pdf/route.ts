import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_KEY } from '@/lib/secure-config';
// Polyfill DOMMatrix for pdf-parse
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}

// @ts-ignore
const pdf = require('pdf-parse');

export const runtime = 'nodejs';

// CORS headers for mobile app access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}
// Next.js App Router API routes default to Node.js unless ‘edge’ is specified.

const DIFFICULTY_PROMPTS = {
    beginner: `Difficulty: Beginner (Basic factual knowledge, direct information)`,
    pro: `Difficulty: Moderate (UPSC Prelims level, conceptual understanding)`,
    advanced: `Difficulty: Advanced (High analytical ability, multi-statement questions, nuanced)`
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const numQuestions = formData.get('numQuestions') || '10';
        const difficulty = formData.get('difficulty') || 'pro';
        const language = formData.get('language') || 'english';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400, headers: corsHeaders });
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Extract Text
        let text = '';
        try {
            const data = await pdf(buffer);
            text = data.text;
        } catch (e) {
            console.error('PDF Parse Error:', e);
            return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500, headers: corsHeaders });
        }

        // Check if text is sufficient (detect scanned PDF)
        if (!text || text.trim().length < 100) {
            return NextResponse.json({
                error: 'Insufficient text found. Document might be scanned/image-based.',
                code: 'SCANNED_PDF'
            }, { status: 422, headers: corsHeaders });
        }

        // Truncate text if too long (OpenRouter limit)
        // Gemini Flash has huge context window (1M), so we can be generous.
        // But to stay safe and fast, let's limit to ~30k chars or so? or 80k.
        // Let's go with 50000 chars.
        const truncatedText = text.substring(0, 50000);

        const apiKey = OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 500, headers: corsHeaders });
        }

        const model = 'google/gemini-3-flash-preview';

        const prompt = `
You are an expert UPSC question setter.

Generate ${numQuestions} UPSC Prelims-style Multiple Choice Questions (MCQs) based on the provided content.

Result Language: ${language === 'hindi' ? 'Hindi (translation of everything)' : 'English'}
${DIFFICULTY_PROMPTS[difficulty as keyof typeof DIFFICULTY_PROMPTS] || 'Difficulty: Moderate'}

Rules:
•⁠  ⁠Questions must be strictly UPSC Prelims standard
•⁠  ⁠Each question must have exactly 4 options (A, B, C, D)
•⁠  ⁠Only ONE option must be correct
•⁠  ⁠Avoid factual ambiguity
•⁠  ⁠Provide a clear explanation for the correct answer

Output strictly in JSON format as below:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        { "text": "Option A", "isCorrect": false },
        { "text": "Option B", "isCorrect": true },
        { "text": "Option C", "isCorrect": false },
        { "text": "Option D", "isCorrect": false }
      ],
      "explanation": "Why option B is correct"
    }
  ]
}

CONTENT:
${truncatedText}
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://upsc-prep-app.com',
                'X-Title': 'UPSC AI MCQ Generator',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter API Error:', response.status, errText);
            throw new Error(`OpenRouter API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            const parsedContent = JSON.parse(content);
            return NextResponse.json(parsedContent, { headers: corsHeaders });
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500, headers: corsHeaders });
        }

    } catch (error: any) {
        console.error('Error generating MCQs from PDF:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}
