import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_KEY } from '@/lib/secure-config';
import { corsHeaders } from '../_cors';

// Polyfill DOMMatrix for pdf-parse (backend only)
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}

export const runtime = 'nodejs';

// Increase body size limit for this route if possible (Next.js 14 App Router)
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

// Generate MCQs using AI
async function generateMCQsWithAI(count: number, apiKey: string, mimeType: string, fileBase64: string) {
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    let userContent: any[] = [
        {
            type: "text",
            text: `You are an expert UPSC question setter.

Generate ${count} UPSC Prelims-style Multiple Choice Questions (MCQs) based on the provided content.

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
      "correctAnswer": "B",
      "explanation": "Why option B is correct"
    }
  ]
}`
        }
    ];

    if (isImage || isPdf) {
        userContent.push({
            type: "image_url", // OpenRouter/Gemini accepts PDF in the same container often, or handles it automatically if mimeType is right
            image_url: {
                url: `data:${mimeType};base64,${fileBase64}`
            }
        });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://upsc-prep-app.com',
            'X-Title': 'UPSC AI MCQ Generator',
        },
        body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: userContent }],
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Backend-PDF] AI API Error: ${response.status}`, errorText);
        throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '{}';
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
    console.log('[Backend-PDF] POST request received');
    try {
        // We use a more robust way to handle the body which might be large
        let body;
        try {
            // Check content length header
            const contentLength = parseInt(req.headers.get('content-length') || '0');
            console.log(`[Backend-PDF] Content-Length: ${contentLength} bytes`);

            // Try to get raw text first to avoid potential req.json() limits/issues
            const rawBody = await req.text();
            body = JSON.parse(rawBody);
            console.log('[Backend-PDF] Request body parsed successfully');
        } catch (error: any) {
            console.error('[Backend-PDF] Body Parsing Error:', error.message);
            return NextResponse.json(
                { error: 'File data is too large for the server. Please try a smaller file (under 4MB).' },
                { status: 413, headers: corsHeaders }
            );
        }

        const { fileBase64, count = 10, mimeType, fileName } = body;

        if (!fileBase64) {
            console.error('[Backend-PDF] Error: No fileBase64 provided');
            return NextResponse.json({ error: 'No file data provided' }, { status: 400, headers: corsHeaders });
        }

        console.log(`[Backend-PDF] Processing: ${fileName} (${mimeType}), Count: ${count}, Base64 Length: ${fileBase64.length}`);

        // const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            console.error('[Backend-PDF] Error: OPENROUTER_API_KEY missing');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
        }

        console.log('[Backend-PDF] Calling OpenRouter AI with direct document input...');
        try {
            const jsonContent = await generateMCQsWithAI(count, OPENROUTER_API_KEY, mimeType || 'application/pdf', fileBase64);

            let parsedData;
            try {
                parsedData = JSON.parse(jsonContent);
                console.log(`[Backend-PDF] AI responded with ${parsedData.questions?.length || 0} questions`);
            } catch (e) {
                console.error('[Backend-PDF] AI JSON Parse Error:', e, 'Raw:', jsonContent);
                return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500, headers: corsHeaders });
            }

            // Transform to expected client format (MCQ[])
            const mcqs = (parsedData.questions || []).map((q: any, i: number) => {
                const correctOpt = q.options?.find((o: any) => o.isCorrect);
                let correctLetter = q.correctAnswer || (correctOpt ?
                    (q.options.indexOf(correctOpt) === 0 ? 'A' :
                        q.options.indexOf(correctOpt) === 1 ? 'B' :
                            q.options.indexOf(correctOpt) === 2 ? 'C' : 'D') : 'A');

                return {
                    id: i + 1,
                    question: q.question,
                    optionA: q.options?.[0]?.text || '',
                    optionB: q.options?.[1]?.text || '',
                    optionC: q.options?.[2]?.text || '',
                    optionD: q.options?.[3]?.text || '',
                    correctAnswer: correctLetter,
                    explanation: q.explanation || ''
                };
            });

            console.log(`[Backend-PDF] Success! Returning ${mcqs.length} MCQs`);
            return NextResponse.json({
                success: true,
                mcqs: mcqs,
                count: mcqs.length
            }, { headers: corsHeaders });

        } catch (aiError: any) {
            console.error('[Backend-PDF] AI Error:', aiError.message);
            return NextResponse.json({ error: `AI Error: ${aiError.message}` }, { status: 500, headers: corsHeaders });
        }

    } catch (error: any) {
        console.error('[Backend-PDF] Global Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
