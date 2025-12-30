import { Alert } from 'react-native';

import { OPENROUTER_API_KEY } from './secureKey';
const SITE_URL = 'https://upsc-prep-app.com';
const SITE_NAME = 'UPSC Prep App';

export interface MCQ {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
    userAnswer?: string;
}

// Parse MCQs from AI response
function parseMCQs(aiResponse: string): MCQ[] {
    console.log('[parseMCQs] Starting to parse MCQs from AI response');

    if (!aiResponse || typeof aiResponse !== 'string') {
        return [];
    }

    const mcqs: MCQ[] = [];
    const sections = aiResponse.split(/(?:Question\s*\d+|^\d+\.)/m);

    for (const section of sections) {
        if (!section || typeof section !== 'string' || !section.trim()) continue;

        let currentQuestion = '';
        const currentOptions: { [key: string]: string } = {};
        let currentCorrect = '';
        let currentExplanation = '';

        // Extract question (matches everything until the first option)
        const questionMatch = section.match(/^([\s\S]+?)(?=\n[A-D]\.|Correct)/);
        if (questionMatch && questionMatch[1]) {
            currentQuestion = (questionMatch[1] || '').trim();
        }

        // Extract options
        const optionMatches = section.matchAll(/([A-D])\.\s*([\s\S]+?)(?=\n[A-D]\.|Correct|Explanation|$)/gi);
        for (const optMatch of optionMatches) {
            if (optMatch && optMatch[1] && optMatch[2]) {
                const optionValue = (optMatch[2] || '').trim();
                currentOptions[optMatch[1]] = optionValue;
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

        if (currentQuestion && currentOptions.A && currentOptions.B && currentOptions.C && currentOptions.D && currentCorrect) {
            mcqs.push({
                question: currentQuestion.replace(/^\d+\.\s*/, '').trim(),
                optionA: currentOptions.A,
                optionB: currentOptions.B,
                optionC: currentOptions.C,
                optionD: currentOptions.D,
                correctAnswer: currentCorrect,
                explanation: currentExplanation,
            });
        }
    }

    return mcqs.slice(0, 10);
}

export const generateMCQsFromText = async (text: string): Promise<MCQ[]> => {
    try {
        // Increase limit to 200k chars for larger PDFs
        const truncatedText = text.substring(0, 200000);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": `You are an expert UPSC exam question creator. Based on the following PDF content, create exactly 10 Multiple Choice Questions (MCQs) with 4 options each (A, B, C, D).

                    CRITICAL REQUIREMENT: provide ALL content in BOTH English and Hindi (Bilingual).

                    PDF Content:
                    ${truncatedText}

                    Requirements:
                    - Create exactly 10 MCQs
                    - Analyze the ENTIRE provided content to cover all key topics
                    - Each MCQ must have 4 options (A, B, C, D)
                    - Format: English text followed by Hindi text (separated by " / " or new lines)
                    - One option must be clearly correct
                    - Use formal UPSC terminology in both languages

                    Format each MCQ exactly as follows:

                    Question 1: [English Question]
                    [Hindi Question]
                    A. [English Option] / [Hindi Option]
                    B. [English Option] / [Hindi Option]
                    C. [English Option] / [Hindi Option]
                    D. [English Option] / [Hindi Option]
                    Correct Answer: [A/B/C/D]
                    Explanation: [English Explanation]
                    [Hindi Explanation]

                    Generate exactly 10 MCQs now.`
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`AI API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content received from AI');
        }

        const mcqs = parseMCQs(content);

        if (mcqs.length === 0) {
            throw new Error('Failed to parse MCQs from response. Please try again.');
        }

        return mcqs;

    } catch (error) {
        console.error('generateMCQsFromText error:', error);
        throw error;
    }
};
