import { NextResponse } from 'next/server';
import { OPENROUTER_API_KEY } from '@/lib/secure-config';

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
const DIFFICULTY_PROMPTS = {
    beginner: `Difficulty: Beginner (Basic factual knowledge, direct information)`,
    pro: `Difficulty: Moderate (UPSC Prelims level, conceptual understanding)`,
    advanced: `Difficulty: Advanced (High analytical ability, multi-statement questions, nuanced)`
};

const PAPER_TOPICS: Record<string, string> = {
    GS1: 'History, Geography, Art & Culture, Indian Society',
    GS2: 'Polity, Governance, Constitution, International Relations, Social Justice',
    GS3: 'Economy, Environment, Science & Technology, Disaster Management, Security',
    GS4: 'Ethics, Integrity, Aptitude, Case Studies',
    Optional: 'General Knowledge across all subjects'
};

export async function POST(req: Request) {
    try {
        const { examType, paperType, difficulty, language, numQuestions, preferences } = await req.json();

        // Debug: Log incoming request
        console.log('📝 [API] Received MCQ Generation Request');
        console.log('   Params:', { examType, paperType, difficulty, language, numQuestions });

        const apiKey = OPENROUTER_API_KEY;

        console.log('🔑 [API] Key Status:', apiKey ? 'Present' : 'MISSING');
        if (apiKey) console.log('   Key starts with:', apiKey.substring(0, 10) + '...');

        if (!apiKey) {
            console.error('❌ [API] CRITICAL: OpenRouter API Key is missing in environment variables');
            return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 500, headers: corsHeaders });
        }

        // const model = 'google/gemini-2.0-flash-exp'; // Fallback to a stable model if 3-flash isn't working well, or keep it.
        // NOTE: Keeping the model as is for now, but logging it.
        // const targetModel = 'google/gemini-2.0-flash-lite-preview-02-05:free'; // Using a known free/working model reference or the one in code. 
        // actually let's stick to what was there but maybe updated or just log it. 
        // The previous code had 'google/gemini-3-flash-preview'. 
        // I will use 'google/gemini-2.0-flash-exp:free' or similar if I want to be safe, but let's stick to the prompt's model or a standard one.
        // Let's use a very standard one to test: 'google/gemini-2.0-flash-001' or just what was there.
        // Actually, let's keep 'google/gemini-3-flash-preview' but log it.
        const modelToUse = 'google/gemini-3-flash-preview';

        const topicText = `${PAPER_TOPICS[paperType] || paperType}. ${preferences ? `Focus on: ${preferences}` : ''}`;

        const prompt = `
You are an expert UPSC question setter.

Generate ${numQuestions} UPSC Prelims-style Multiple Choice Questions (MCQs).

Topic: ${topicText}
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
`;

        console.log('🚀 [API] Sending request to OpenRouter...');
        console.log('   Model:', modelToUse);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://upsc-prep-app.com',
                'X-Title': 'UPSC AI MCQ Generator',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            })
        });

        console.log('📡 [API] OpenRouter Response Status:', response.status);

        if (!response.ok) {
            const errText = await response.text();
            console.error('❌ [API] OpenRouter Error Body:', errText);
            throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        console.log('✅ [API] OpenRouter Response received');

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ [API] Unexpected response structure:', JSON.stringify(data).substring(0, 200));
            throw new Error('Invalid response structure from OpenRouter');
        }

        const content = data.choices[0].message.content;
        console.log('📄 [API] Content length:', content.length);

        try {
            const parsedContent = JSON.parse(content);
            console.log('✅ [API] JSON parsed successfully. Question count:', parsedContent.questions?.length);
            return NextResponse.json(parsedContent, { headers: corsHeaders });
        } catch (e) {
            console.error('❌ [API] Failed to parse JSON content:', content.substring(0, 200) + '...');
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500, headers: corsHeaders });
        }

    } catch (error: any) {
        console.error('💥 [API] Unhandled Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}
