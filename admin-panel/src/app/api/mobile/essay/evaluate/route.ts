import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_API_KEY } from '@/lib/secure-config';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// process.env.OPENROUTER_API_KEY;

// Handle preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Evaluate essay using Gemini 3 Pro directly via OpenRouter with reasoning
export async function POST(request: NextRequest) {
    console.log('[Essay Evaluate POST] Starting request...');

    try {
        const body = await request.json();
        const { topic, answerText, image, isHandwritten } = body;

        console.log('[Essay Evaluate POST] Topic:', topic?.substring(0, 50));
        console.log('[Essay Evaluate POST] Has Image:', !!image);
        console.log('[Essay Evaluate POST] Answer length:', answerText?.length);

        // key validation
        if (!OPENROUTER_API_KEY) {
            console.error('[Essay Evaluate POST] Missing OpenRouter API Key');
            return NextResponse.json(
                { error: 'Server configuration error: Missing API Key' },
                { status: 500, headers: corsHeaders }
            );
        }

        // Validation
        if (!topic) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!answerText && !image) {
            return NextResponse.json(
                { error: 'Either essay text or image is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (answerText && answerText.length < 50 && !image) {
            return NextResponse.json(
                { error: 'Essay is too short. Please write at least 50 words.' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Count words (approximation if image)
        const wordCount = answerText ? answerText.trim().split(/\s+/).length : 0;
        console.log('[Essay Evaluate POST] Word count (text):', wordCount);

        // Call Gemini 3 Pro via OpenRouter with reasoning enabled
        console.log('[Essay Evaluate POST] Calling Gemini 3 Pro via OpenRouter with reasoning...');

        // Construct message content based on input type (Text or Image)
        let messages;

        if (image) {
            // Multimodal Request (Text + Image)
            messages = [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are an expert UPSC essay examiner with 20+ years of experience. 
First, carefully TRANSCRIBE the handwritten essay in the image.
Then, evaluate the essay written for UPSC Mains examination based on the transcribed text.

**Essay Topic:** ${topic}

Please provide a comprehensive evaluation in the following JSON format (respond ONLY with valid JSON, no markdown or extra text):

{
  "ocrText": "<FULL_TRANSCRIPTION_OF_THE_ESSAY>",
  "score": <number between 0-100>,
  "examinerRemark": "<overall assessment in 2-3 sentences>",
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "weaknesses": [
    "<weakness 1>",
    "<weakness 2>",
    "<weakness 3>"
  ],
  "improvementPlan": [
    "<specific actionable improvement 1>",
    "<specific actionable improvement 2>",
    "<specific actionable improvement 3>"
  ],
  "rewrittenIntro": "<rewrite the introduction paragraph to make it more impactful>",
  "rewrittenConclusion": "<rewrite the conclusion paragraph to make it more powerful>",
  "detailedFeedback": {
    "content": "<feedback on content quality, depth, and relevance>",
    "structure": "<feedback on essay structure and organization>",
    "language": "<feedback on language, grammar, and expression>",
    "arguments": "<feedback on quality of arguments and examples>",
    "upscRelevance": "<how well it addresses UPSC requirements>"
  }
}

Evaluation Criteria:
1. **Content & Depth (30%)**: Relevance, depth of analysis, factual accuracy
2. **Structure & Organization (20%)**: Introduction, body paragraphs, conclusion, flow
3. **Arguments & Examples (25%)**: Quality of arguments, use of examples, case studies
4. **Language & Expression (15%)**: Grammar, vocabulary, clarity, coherence
5. **UPSC Relevance (10%)**: Multi-dimensional approach, balanced view, contemporary relevance

Be honest, constructive, and specific in your feedback.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${image}`
                            }
                        }
                    ]
                }
            ];
        } else {
            // Text-only Request
            messages = [
                {
                    role: 'user',
                    content: `You are an expert UPSC essay examiner with 20+ years of experience. Evaluate the following essay written for UPSC Mains examination.

**Essay Topic:** ${topic}

**Essay Answer:**
${answerText}

**Word Count:** ${wordCount} words

Please provide a comprehensive evaluation in the following JSON format (respond ONLY with valid JSON, no markdown or extra text):

{
  "score": <number between 0-100>,
  "examinerRemark": "<overall assessment in 2-3 sentences>",
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "weaknesses": [
    "<weakness 1>",
    "<weakness 2>",
    "<weakness 3>"
  ],
  "improvementPlan": [
    "<specific actionable improvement 1>",
    "<specific actionable improvement 2>",
    "<specific actionable improvement 3>"
  ],
  "rewrittenIntro": "<rewrite the introduction paragraph to make it more impactful>",
  "rewrittenConclusion": "<rewrite the conclusion paragraph to make it more powerful>",
  "detailedFeedback": {
    "content": "<feedback on content quality, depth, and relevance>",
    "structure": "<feedback on essay structure and organization>",
    "language": "<feedback on language, grammar, and expression>",
    "arguments": "<feedback on quality of arguments and examples>",
    "upscRelevance": "<how well it addresses UPSC requirements>"
  }
}

Evaluation Criteria:
1. **Content & Depth (30%)**: Relevance, depth of analysis, factual accuracy
2. **Structure & Organization (20%)**: Introduction, body paragraphs, conclusion, flow
3. **Arguments & Examples (25%)**: Quality of arguments, use of examples, case studies
4. **Language & Expression (15%)**: Grammar, vocabulary, clarity, coherence
5. **UPSC Relevance (10%)**: Multi-dimensional approach, balanced view, contemporary relevance

Be honest, constructive, and specific in your feedback. The score should reflect UPSC Mains standards.`
                }
            ];
        }

        const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://upsc-app-admin.vercel.app',
                'X-Title': 'UPSC Essay Evaluator',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'google/gemini-3-flash-preview', // Using Flash 3.0 for better vision capabilities
                messages: messages,
                reasoning: { enabled: true },
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('[Essay Evaluate POST] OpenRouter API error:', apiResponse.status, errorText);
            throw new Error(`OpenRouter API error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        console.log('[Essay Evaluate POST] Gemini 3 Pro response received');

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('[Essay Evaluate POST] Unexpected API response format');
            throw new Error('Unexpected response format from OpenRouter API');
        }

        // Extract the assistant message with reasoning_details
        const assistantMessage = data.choices[0].message;
        const content = assistantMessage.content;
        const reasoningDetails = assistantMessage.reasoning_details;

        console.log('[Essay Evaluate POST] Response content length:', content?.length);
        console.log('[Essay Evaluate POST] Reasoning enabled:', !!reasoningDetails);

        // Parse the JSON response
        let evaluation;
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                evaluation = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('[Essay Evaluate POST] JSON parsing error:', parseError);
            console.error('[Essay Evaluate POST] Response content:', content?.substring(0, 500));

            // Fallback: create a basic evaluation
            evaluation = {
                score: 60,
                examinerRemark: "Your essay shows promise but needs improvement in structure and depth.",
                strengths: [
                    "Attempted to address the topic",
                    "Basic understanding demonstrated",
                    "Reasonable word count"
                ],
                weaknesses: [
                    "Could benefit from stronger arguments",
                    "Needs more specific examples",
                    "Structure could be improved"
                ],
                improvementPlan: [
                    "Read more on the topic to deepen understanding",
                    "Practice writing structured essays",
                    "Include more current affairs examples"
                ],
                rewrittenIntro: "Consider starting with a powerful quote or statistic to grab attention.",
                rewrittenConclusion: "End with a forward-looking statement that ties back to the introduction.",
                detailedFeedback: {
                    content: "The essay addresses the topic but could go deeper into analysis.",
                    structure: "Work on creating a clearer introduction-body-conclusion structure.",
                    language: "Language is adequate but could be more sophisticated.",
                    arguments: "Arguments need to be supported with more concrete examples.",
                    upscRelevance: "Try to incorporate multiple perspectives and contemporary issues."
                }
            };
        }

        // Ensure score is within valid range
        if (typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 100) {
            evaluation.score = 60;
        }

        console.log('[Essay Evaluate POST] Evaluation score:', evaluation.score);

        return NextResponse.json({
            success: true,
            evaluation,
            wordCount,
            reasoning_used: !!reasoningDetails,
            model: 'google/gemini-3-flash-preview'
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('[Essay Evaluate POST] Error:', error);
        return NextResponse.json({
            error: 'Failed to evaluate essay',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500, headers: corsHeaders });
    }
}
