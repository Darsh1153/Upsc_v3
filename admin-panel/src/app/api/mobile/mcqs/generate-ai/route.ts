import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_KEY } from '@/lib/secure-config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            topic,
            difficulty = "Medium",
            numQuestions = 1,
            sourceContent = "",
            language = "English",
            includeCurrentAffairs = false
        } = body;

        // const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'Server configuration error: API key missing' }, { status: 500 });
        }

        const prompt = `
You are an expert UPSC question setter.

Generate ${numQuestions} UPSC Prelims-style Multiple Choice Questions (MCQs) based on the content below.

Topic: ${topic || 'General UPSC'}
Difficulty: ${difficulty}
Language: ${language}

Rules:
•⁠  ⁠Questions must be strictly UPSC Prelims standard
•⁠  ⁠Each question must have exactly 4 options (A, B, C, D)
•⁠  ⁠Only ONE option must be correct
•⁠  ⁠Avoid factual ambiguity
•⁠  ⁠Avoid repeating concepts
•⁠  ⁠If "includeCurrentAffairs" is true, link static concepts to recent events
•⁠  ⁠Provide a clear explanation for the correct answer

${includeCurrentAffairs ? "•⁠  ⁠Link static concepts to recent events where applicable" : ""}

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
${sourceContent || topic || 'No specific content provided, generate based on topic.'}
`;

        console.log('[MCQ-AI] Generating with params:', { topic, difficulty, count: numQuestions, lang: language });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://upsc-app-admin.vercel.app',
                'X-Title': 'UPSC Prep App'
            },
            body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[MCQ-AI] OpenRouter API error:', response.status, errorText);
            return NextResponse.json({ error: `AI Provider Error: ${response.status}` }, { status: 502 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
        }

        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(content);
        } catch (e) {
            // Try to find JSON block if wrapped in markdown
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsedData = JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    throw new Error('Failed to parse AI response as JSON');
                }
            } else {
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        return NextResponse.json(parsedData);

    } catch (error: any) {
        console.error('[MCQ-AI] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
