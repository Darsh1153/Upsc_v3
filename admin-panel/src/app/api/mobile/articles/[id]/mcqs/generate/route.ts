import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles, articleMcqs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

import { corsHeaders } from '../../../../_cors';

import { OPENROUTER_API_KEY } from '@/lib/secure-config'; // process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not defined in environment variables');
}

// Extract text content from article for RAG
function extractTextContent(contentBlocks: Array<{ type: string; content: string;[key: string]: any }>): string {
    const textParts: string[] = [];

    for (const block of contentBlocks) {
        if (block.type === 'heading' && block.content) {
            textParts.push(block.content);
        } else if (block.type === 'paragraph' && block.content) {
            textParts.push(block.content);
        } else if (block.type === 'quote' && block.content) {
            textParts.push(block.content);
        } else if ((block.type === 'unordered-list' || block.type === 'ordered-list') && block.items) {
            textParts.push(block.items.join(' '));
        } else if (block.content) {
            textParts.push(block.content);
        }
    }

    return textParts.join('\n\n');
}

// Parse MCQs from AI response
function parseMCQs(aiResponse: string): Array<{
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
}> {
    console.log('[parseMCQs] Starting to parse MCQs from AI response');
    console.log('[parseMCQs] Response length:', aiResponse?.length || 0);

    // Validate input
    if (!aiResponse || typeof aiResponse !== 'string') {
        console.error('[parseMCQs] Invalid AI response:', typeof aiResponse);
        return [];
    }

    const mcqs: Array<{
        question: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        correctAnswer: string;
        explanation?: string;
    }> = [];

    // Split by questions
    const sections = aiResponse.split(/(?:Question\s*\d+|^\d+\.)/m);
    console.log('[parseMCQs] Split into', sections.length, 'sections');

    for (const section of sections) {
        if (!section || typeof section !== 'string' || !section.trim()) continue;

        let currentQuestion = '';
        const currentOptions: { [key: string]: string } = {};
        let currentCorrect = '';
        let currentExplanation = '';

        // Extract question
        const questionMatch = section.match(/^([\s\S]+?)(?=\n[A-D]\.|Correct)/);
        if (questionMatch && questionMatch[1]) {
            currentQuestion = (questionMatch[1] || '')
                .trim()
                .replace(/^\d+\.\s*:\*\*/g, '') // Remove "1. :**" pattern
                .replace(/:\*\*/g, '') // Remove any remaining ":**"
                .replace(/\*\*/g, '') // Remove any markdown bold markers
                .replace(/\*/g, '') // Remove any asterisks
                .trim();
        }

        // Extract options
        const optionMatches = section.matchAll(/([A-D])\.\s*([\s\S]+?)(?=\n[A-D]\.|Correct|Explanation|$)/gi);
        for (const optMatch of optionMatches) {
            if (optMatch && optMatch[1] && optMatch[2]) {
                const optionValue = (optMatch[2] || '').trim();
                if (optionValue) {
                    currentOptions[optMatch[1]] = optionValue;
                }
            }
        }

        // Extract correct answer
        const correctMatch = section.match(/Correct\s*[Aa]nswer\s*[:\-]?\s*([A-D])/i);
        if (correctMatch && correctMatch[1]) {
            currentCorrect = (correctMatch[1] || '').toUpperCase();
        }

        // Extract explanation
        const expMatch = section.match(/Explanation\s*[:\-]?\s*([\s\S]+?)(?=\n\n|Question|\d+\.|$)/gi);
        if (expMatch && expMatch[1]) {
            currentExplanation = (expMatch[1] || '').trim();
        }

        // If we have all required fields, add MCQ
        if (currentQuestion && currentOptions.A && currentOptions.B && currentOptions.C && currentOptions.D && currentCorrect) {
            // Clean up all fields to remove formatting artifacts
            const cleanQuestion = currentQuestion
                .replace(/^\d+\.\s*:\*\*/g, '') // Remove "1. :**" pattern
                .replace(/:\*\*/g, '') // Remove any remaining ":**"
                .replace(/\*\*/g, '') // Remove markdown bold markers
                .replace(/\*/g, '') // Remove single asterisks
                .replace(/^Question\s*\d+:\s*/i, '') // Remove "Question 1:" prefix if present
                .replace(/^:\s*/, '') // Remove leading colon if present
                .trim();

            const cleanOptionA = (currentOptions.A || '').replace(/:\*\*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^:\s*/, '').trim();
            const cleanOptionB = (currentOptions.B || '').replace(/:\*\*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^:\s*/, '').trim();
            const cleanOptionC = (currentOptions.C || '').replace(/:\*\*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^:\s*/, '').trim();
            const cleanOptionD = (currentOptions.D || '').replace(/:\*\*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^:\s*/, '').trim();
            const cleanExplanation = currentExplanation
                ? currentExplanation.replace(/:\*\*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').trim()
                : undefined;

            if (cleanQuestion && cleanOptionA && cleanOptionB && cleanOptionC && cleanOptionD) {
                mcqs.push({
                    question: cleanQuestion,
                    optionA: cleanOptionA,
                    optionB: cleanOptionB,
                    optionC: cleanOptionC,
                    optionD: cleanOptionD,
                    correctAnswer: currentCorrect,
                    explanation: cleanExplanation,
                });
            }
        }
    }

    // If parsing failed, try JSON format
    if (mcqs.length === 0) {
        console.log('[parseMCQs] No MCQs parsed from text format, trying JSON format...');
        try {
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch && jsonMatch[0]) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    console.log('[parseMCQs] Found JSON array with', parsed.length, 'items');
                    const jsonMCQs = parsed.map((item: any) => ({
                        question: (item.question || item.q || '').toString().trim(),
                        optionA: (item.optionA || item.a || item.options?.A || '').toString().trim(),
                        optionB: (item.optionB || item.b || item.options?.B || '').toString().trim(),
                        optionC: (item.optionC || item.c || item.options?.C || '').toString().trim(),
                        optionD: (item.optionD || item.d || item.options?.D || '').toString().trim(),
                        correctAnswer: (item.correctAnswer || item.correct || item.answer || 'A').toString().toUpperCase().trim(),
                        explanation: item.explanation || item.exp || undefined,
                    })).filter((mcq: any) => mcq.question && mcq.optionA && mcq.optionB && mcq.optionC && mcq.optionD);

                    console.log('[parseMCQs] Parsed', jsonMCQs.length, 'MCQs from JSON format');
                    return jsonMCQs;
                }
            }
        } catch (e) {
            console.error('[parseMCQs] JSON parsing failed:', e);
        }
    }

    console.log('[parseMCQs] Returning', mcqs.length, 'MCQs');
    return mcqs;
}

// Generate MCQs using OpenRouter API
async function generateMCQs(articleText: string, title: string, summary: string): Promise<Array<{
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
}>> {
    console.log('Calling OpenRouter API to generate MCQs...');
    console.log('Article title:', title);
    console.log('Article text length:', articleText.length);

    try {
        // Truncate article text if too long
        const maxTextLength = 8000;
        const truncatedText = articleText.length > maxTextLength
            ? articleText.substring(0, maxTextLength) + '...'
            : articleText;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://upsc-app-admin.vercel.app',
                'X-Title': 'UPSC App Admin Panel',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'google/gemini-3-flash-preview',
                messages: [
                    {
                        role: 'user',
                        content: `You are an expert UPSC exam question creator. Based on the following article, create exactly 10 Multiple Choice Questions (MCQs) with 4 options each (A, B, C, D).

Article Title: "${title}"

Article Summary:
${summary}

Article Content:
${truncatedText}

Requirements:
- Create exactly 10 MCQs
- Each MCQ must have exactly 4 options labeled A, B, C, D
- Questions should test understanding of key concepts, facts, and analysis from the article
- Make questions relevant to UPSC exam preparation
- One option must be clearly correct, others should be plausible but incorrect
- IMPORTANT: Do NOT use any special formatting like ":**" or markdown bold/italic in questions
- Questions should be clean text only, no formatting symbols
- Format each MCQ as follows:

Question 1: [Your question here - plain text only, no formatting]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
Correct Answer: [A/B/C/D]
Explanation: [Brief explanation of why the correct answer is correct]

Question 2: [Your question here - plain text only]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
Correct Answer: [A/B/C/D]
Explanation: [Brief explanation]

...and so on for all 10 questions.

Generate the 10 MCQs now:`
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', response.status, errorText);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[generateMCQs] OpenRouter API response received');
        console.log('[generateMCQs] Response structure:', JSON.stringify(data, null, 2).substring(0, 500));

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            console.log('[generateMCQs] Content type:', typeof content);
            console.log('[generateMCQs] Content exists:', !!content);

            if (!content || typeof content !== 'string') {
                console.error('[generateMCQs] Invalid content from API:', content);
                throw new Error('AI response content is invalid or empty');
            }

            const generatedText = content.trim();
            console.log('[generateMCQs] Generated MCQs text length:', generatedText.length);
            console.log('[generateMCQs] First 200 chars:', generatedText.substring(0, 200));

            const parsedMCQs = parseMCQs(generatedText);
            console.log('[generateMCQs] Parsed MCQs count:', parsedMCQs.length);

            if (parsedMCQs.length === 0) {
                console.error('[generateMCQs] Failed to parse any MCQs. Full response:', generatedText.substring(0, 1000));
                throw new Error('Failed to parse MCQs from AI response');
            }

            return parsedMCQs.slice(0, 10); // Ensure max 10 MCQs
        } else {
            console.error('[generateMCQs] Unexpected OpenRouter API response format:', JSON.stringify(data, null, 2));
            throw new Error('Unexpected response format from OpenRouter API');
        }
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        throw error;
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Public endpoint - no auth required (for mobile app)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    console.log('[MCQs Generate POST] Starting request...');
    try {
        // Handle both Promise and direct params (Next.js 13+ vs 15)
        const resolvedParams = params instanceof Promise ? await params : params;
        console.log('[MCQs Generate POST] Params:', resolvedParams);

        const articleId = parseInt(resolvedParams.id);
        console.log('[MCQs Generate POST] Parsed article ID:', articleId);

        if (isNaN(articleId)) {
            console.error('[MCQs Generate POST] Invalid article ID:', resolvedParams.id);
            return NextResponse.json({ error: 'Invalid article ID' }, { status: 400, headers: corsHeaders });
        }

        if (!OPENROUTER_API_KEY) {
            console.error('[MCQs Generate POST] OPENROUTER_API_KEY not configured');
            return NextResponse.json({ error: 'Server configuration error: API key missing' }, { status: 500, headers: corsHeaders });
        }

        // Fetch article (must be published)
        console.log('[MCQs Generate POST] Fetching article from database...');
        const [article] = await db
            .select()
            .from(articles)
            .where(and(eq(articles.id, articleId), eq(articles.isPublished, true)));

        if (!article) {
            console.error('[MCQs Generate POST] Article not found or not published:', articleId);
            return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: corsHeaders });
        }

        console.log('[MCQs Generate POST] Article found:', article.title);
        console.log('[MCQs Generate POST] Article content blocks:', article.content?.length || 0);

        // Check if MCQs already exist
        console.log('[MCQs Generate POST] Checking for existing MCQs...');
        let existingMCQs;
        try {
            existingMCQs = await db
                .select()
                .from(articleMcqs)
                .where(eq(articleMcqs.articleId, articleId));
        } catch (dbError) {
            console.error('[MCQs Generate POST] Database query error (checking existing):', dbError);
            console.error('[MCQs Generate POST] Error type:', dbError instanceof Error ? dbError.constructor.name : typeof dbError);
            throw dbError;
        }

        if (existingMCQs.length > 0) {
            console.log('[MCQs Generate POST] MCQs already exist:', existingMCQs.length);
            return NextResponse.json({
                error: 'MCQs already exist for this article',
                mcqs: existingMCQs
            }, { status: 400, headers: corsHeaders });
        }

        // Extract text content
        console.log('[MCQs Generate POST] Extracting text content...');
        const articleText = extractTextContent(article.content || []);
        console.log('[MCQs Generate POST] Extracted text length:', articleText.length);

        // Check total available content (body + summary)
        const totalContentLength = articleText.length + (article.summary?.length || 0);

        if (totalContentLength < 50) {
            console.error('[MCQs Generate POST] Article content too short');
            return NextResponse.json({ error: 'Article content too short to generate MCQs' }, { status: 400, headers: corsHeaders });
        }

        // Generate MCQs
        console.log('[MCQs Generate POST] Calling generateMCQs function...');
        const generatedMCQs = await generateMCQs(
            articleText,
            article.title,
            article.summary || ''
        );
        console.log('[MCQs Generate POST] Generated MCQs count:', generatedMCQs.length);

        // Save MCQs to database
        console.log('[MCQs Generate POST] Saving MCQs to database...');
        const savedMCQs = [];
        for (let i = 0; i < generatedMCQs.length; i++) {
            const mcq = generatedMCQs[i];
            console.log(`[MCQs Generate POST] Saving MCQ ${i + 1}/${generatedMCQs.length}:`, mcq.question.substring(0, 50) + '...');

            try {
                const [saved] = await db
                    .insert(articleMcqs)
                    .values({
                        articleId,
                        question: mcq.question,
                        optionA: mcq.optionA,
                        optionB: mcq.optionB,
                        optionC: mcq.optionC,
                        optionD: mcq.optionD,
                        correctAnswer: mcq.correctAnswer,
                        explanation: mcq.explanation || null,
                    })
                    .returning();

                savedMCQs.push(saved);
                console.log(`[MCQs Generate POST] MCQ ${i + 1} saved successfully`);
            } catch (dbError) {
                console.error(`[MCQs Generate POST] Error saving MCQ ${i + 1}:`, dbError);
                console.error(`[MCQs Generate POST] MCQ data:`, {
                    question: mcq.question?.substring(0, 50),
                    optionA: mcq.optionA?.substring(0, 30),
                    correctAnswer: mcq.correctAnswer
                });
                console.error(`[MCQs Generate POST] Error type:`, dbError instanceof Error ? dbError.constructor.name : typeof dbError);
                console.error(`[MCQs Generate POST] Error message:`, dbError instanceof Error ? dbError.message : String(dbError));
                throw dbError;
            }
        }

        console.log(`[MCQs Generate POST] Successfully generated and saved ${savedMCQs.length} MCQs for article ${articleId}`);

        return NextResponse.json({
            success: true,
            mcqs: savedMCQs,
            count: savedMCQs.length
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('[MCQs Generate POST] Error details:', error);
        console.error('[MCQs Generate POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json({
            error: 'Failed to generate MCQs',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500, headers: corsHeaders });
    }
}

