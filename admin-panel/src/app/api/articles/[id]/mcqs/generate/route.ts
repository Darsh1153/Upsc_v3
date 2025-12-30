import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, articleMcqs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

import { OPENROUTER_API_KEY } from '@/lib/secure-config'; // Previously hardcoded key replaced

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
    const mcqs: Array<{
        question: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        correctAnswer: string;
        explanation?: string;
    }> = [];

    // Try to parse structured format
    const questionRegex = /(?:Question\s*(\d+)|(\d+)\.)\s*(.+?)(?=\n[A-D]\.|Question|\n\n|$)/gis;
    const optionRegex = /([A-D])\.\s*(.+?)(?=\n[A-D]\.|Correct|Explanation|$)/gis;
    const correctRegex = /Correct\s*[Aa]nswer\s*[:\-]?\s*([A-D])/i;
    const explanationRegex = /Explanation\s*[:\-]?\s*(.+?)(?=\n\n|Question|\d+\.|$)/gis;

    let match;
    let currentQuestion = '';
    let currentOptions: { [key: string]: string } = {};
    let currentCorrect = '';
    let currentExplanation = '';

    // Split by questions
    const sections = aiResponse.split(/(?:Question\s*\d+|^\d+\.)/m);

    for (const section of sections) {
        if (!section.trim()) continue;

        // Extract question
        const questionMatch = section.match(/^(.+?)(?=\n[A-D]\.|Correct)/s);
        if (questionMatch) {
            currentQuestion = questionMatch[1].trim();
        }

        // Extract options
        const optionMatches = section.matchAll(/([A-D])\.\s*(.+?)(?=\n[A-D]\.|Correct|Explanation|$)/gis);
        for (const optMatch of optionMatches) {
            currentOptions[optMatch[1]] = optMatch[2].trim();
        }

        // Extract correct answer
        const correctMatch = section.match(/Correct\s*[Aa]nswer\s*[:\-]?\s*([A-D])/i);
        if (correctMatch) {
            currentCorrect = correctMatch[1].toUpperCase();
        }

        // Extract explanation
        const expMatch = section.match(/Explanation\s*[:\-]?\s*(.+?)(?=\n\n|Question|\d+\.|$)/gis);
        if (expMatch) {
            currentExplanation = expMatch[1].trim();
        }

        // If we have all required fields, add MCQ
        if (currentQuestion && currentOptions.A && currentOptions.B && currentOptions.C && currentOptions.D && currentCorrect) {
            mcqs.push({
                question: currentQuestion,
                optionA: currentOptions.A,
                optionB: currentOptions.B,
                optionC: currentOptions.C,
                optionD: currentOptions.D,
                correctAnswer: currentCorrect,
                explanation: currentExplanation || undefined,
            });

            // Reset for next question
            currentQuestion = '';
            currentOptions = {};
            currentCorrect = '';
            currentExplanation = '';
        }
    }

    // If parsing failed, try JSON format
    if (mcqs.length === 0) {
        try {
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    return parsed.map((item: any) => ({
                        question: item.question || item.q || '',
                        optionA: item.optionA || item.a || item.options?.A || '',
                        optionB: item.optionB || item.b || item.options?.B || '',
                        optionC: item.optionC || item.c || item.options?.C || '',
                        optionD: item.optionD || item.d || item.options?.D || '',
                        correctAnswer: (item.correctAnswer || item.correct || item.answer || 'A').toString().toUpperCase(),
                        explanation: item.explanation || item.exp || undefined,
                    })).filter((mcq: any) => mcq.question && mcq.optionA && mcq.optionB && mcq.optionC && mcq.optionD);
                }
            }
        } catch (e) {
            console.error('JSON parsing failed:', e);
        }
    }

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
- Format each MCQ as follows:

Question 1: [Your question here]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
Correct Answer: [A/B/C/D]
Explanation: [Brief explanation of why the correct answer is correct]

Question 2: [Your question here]
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
        console.log('OpenRouter API response received');

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const generatedText = data.choices[0].message.content.trim();
            console.log('Generated MCQs text length:', generatedText.length);

            const parsedMCQs = parseMCQs(generatedText);
            console.log('Parsed MCQs count:', parsedMCQs.length);

            if (parsedMCQs.length === 0) {
                throw new Error('Failed to parse MCQs from AI response');
            }

            return parsedMCQs.slice(0, 10); // Ensure max 10 MCQs
        } else {
            console.error('Unexpected OpenRouter API response format:', data);
            throw new Error('Unexpected response format from OpenRouter API');
        }
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        throw error;
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const articleId = parseInt(params.id);

        if (isNaN(articleId)) {
            return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
        }

        // Fetch article
        const [article] = await db
            .select()
            .from(articles)
            .where(eq(articles.id, articleId));

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Check if MCQs already exist
        const existingMCQs = await db
            .select()
            .from(articleMcqs)
            .where(eq(articleMcqs.articleId, articleId));

        if (existingMCQs.length > 0) {
            return NextResponse.json({
                error: 'MCQs already exist for this article. Delete existing MCQs first.',
                mcqs: existingMCQs
            }, { status: 400 });
        }

        // Extract text content
        const articleText = extractTextContent(article.content || []);

        if (articleText.length < 50) {
            return NextResponse.json({ error: 'Article content too short to generate MCQs' }, { status: 400 });
        }

        // Generate MCQs
        const generatedMCQs = await generateMCQs(
            articleText,
            article.title,
            article.summary || ''
        );

        // Save MCQs to database
        const savedMCQs = [];
        for (const mcq of generatedMCQs) {
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
        }

        console.log(`Successfully generated and saved ${savedMCQs.length} MCQs for article ${articleId}`);

        return NextResponse.json({
            success: true,
            mcqs: savedMCQs,
            count: savedMCQs.length
        });
    } catch (error) {
        console.error('Generate MCQs error:', error);
        return NextResponse.json({
            error: 'Failed to generate MCQs',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

