/**
 * AI Summarizer Service
 * Uses OpenRouter API to summarize article content for UPSC notes
 */

import { OPENROUTER_API_KEY, OPENROUTER_BASE_URL, SITE_CONFIG, AI_MODELS } from '../../../config/aiModels';

interface SummaryResult {
    summary: string;
    keyPoints: string[];
    relevantTopics: string[];
    suggestedTags: string[];
    error?: string;
}

interface UPSCAnalysis extends SummaryResult {
    mainsRelevance: {
        gs1?: string;
        gs2?: string;
        gs3?: string;
        gs4?: string;
    };
    prelims: string[];
    importantDates?: string[];
    importantPersons?: string[];
}

const SUMMARY_SYSTEM_PROMPT = `You are an expert UPSC exam coach and content summarizer. Your task is to analyze articles and extract UPSC-relevant information.

When summarizing content:
1. Focus on facts, data, and concepts relevant to UPSC Civil Services Exam
2. Identify key points for Prelims (factual) and Mains (analytical)
3. Suggest relevant GS paper associations (GS1: History/Geography/Culture, GS2: Polity/Governance/IR, GS3: Economy/S&T/Environment, GS4: Ethics)
4. Extract important dates, persons, places, and data points
5. Keep the summary concise but comprehensive (around 200-300 words)
6. Suggest appropriate tags for organization

Respond in JSON format.`;

/**
 * Generate a summary of the article content
 */
export const summarizeArticle = async (content: string, title?: string): Promise<SummaryResult> => {
    try {
        if (!OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key not configured');
        }

        if (!content || content.length < 50) {
            throw new Error('Content too short to summarize');
        }

        // Truncate content if too long (max 8000 chars)
        const truncatedContent = content.length > 8000
            ? content.substring(0, 8000) + '...[truncated]'
            : content;

        const userPrompt = `Please summarize the following article for UPSC preparation:

${title ? `Title: ${title}\n\n` : ''}Content:
${truncatedContent}

Provide your response in the following JSON format:
{
    "summary": "A comprehensive 200-300 word summary focusing on UPSC-relevant information",
    "keyPoints": ["List of 5-7 key bullet points for quick revision"],
    "relevantTopics": ["List of UPSC syllabus topics this relates to"],
    "suggestedTags": ["Suggested tags like GS1, Geography, Environment, etc."]
}`;

        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_CONFIG.url,
                'X-Title': SITE_CONFIG.name,
            },
            body: JSON.stringify({
                model: AI_MODELS.GEMINI_FLASH,
                messages: [
                    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 2048,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        const responseContent = data.choices?.[0]?.message?.content;

        if (!responseContent) {
            throw new Error('No response content from AI');
        }

        // Parse JSON response
        const parsed = JSON.parse(responseContent);

        return {
            summary: parsed.summary || 'Summary not available',
            keyPoints: parsed.keyPoints || [],
            relevantTopics: parsed.relevantTopics || [],
            suggestedTags: parsed.suggestedTags || [],
        };
    } catch (error) {
        console.error('[AISummarizer] Error summarizing article:', error);
        return {
            summary: '',
            keyPoints: [],
            relevantTopics: [],
            suggestedTags: [],
            error: error instanceof Error ? error.message : 'Failed to summarize',
        };
    }
};

/**
 * Generate detailed UPSC analysis of the content
 */
export const analyzeForUPSC = async (content: string, title?: string): Promise<UPSCAnalysis> => {
    try {
        if (!OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key not configured');
        }

        const truncatedContent = content.length > 8000
            ? content.substring(0, 8000) + '...[truncated]'
            : content;

        const userPrompt = `Analyze the following content for UPSC Civil Services Exam preparation:

${title ? `Title: ${title}\n\n` : ''}Content:
${truncatedContent}

Provide detailed analysis in the following JSON format:
{
    "summary": "200-300 word comprehensive summary",
    "keyPoints": ["5-7 key points for revision"],
    "relevantTopics": ["Related UPSC syllabus topics"],
    "suggestedTags": ["Tags for organization"],
    "mainsRelevance": {
        "gs1": "Relevance to GS1 (History, Geography, Culture, Society) if any",
        "gs2": "Relevance to GS2 (Polity, Governance, IR, Social Justice) if any",
        "gs3": "Relevance to GS3 (Economy, S&T, Environment, Security) if any",
        "gs4": "Relevance to GS4 (Ethics, Integrity, Aptitude) if any"
    },
    "prelims": ["Factual points for Prelims MCQs"],
    "importantDates": ["Any significant dates mentioned"],
    "importantPersons": ["Key persons/personalities mentioned"]
}

Only include paper relevance if genuinely applicable. Respond with valid JSON only.`;

        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_CONFIG.url,
                'X-Title': SITE_CONFIG.name,
            },
            body: JSON.stringify({
                model: AI_MODELS.GEMINI_FLASH,
                messages: [
                    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 3000,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        const responseContent = data.choices?.[0]?.message?.content;

        if (!responseContent) {
            throw new Error('No response content from AI');
        }

        const parsed = JSON.parse(responseContent);

        return {
            summary: parsed.summary || '',
            keyPoints: parsed.keyPoints || [],
            relevantTopics: parsed.relevantTopics || [],
            suggestedTags: parsed.suggestedTags || [],
            mainsRelevance: parsed.mainsRelevance || {},
            prelims: parsed.prelims || [],
            importantDates: parsed.importantDates || [],
            importantPersons: parsed.importantPersons || [],
        };
    } catch (error) {
        console.error('[AISummarizer] Error analyzing for UPSC:', error);
        return {
            summary: '',
            keyPoints: [],
            relevantTopics: [],
            suggestedTags: [],
            mainsRelevance: {},
            prelims: [],
            error: error instanceof Error ? error.message : 'Failed to analyze',
        };
    }
};

/**
 * Generate answer from multiple notes sources (200 words)
 */
export const generateAnswerFromNotes = async (
    topic: string,
    notes: Array<{ title: string; content: string; source?: string }>
): Promise<{ answer: string; sources: string[]; error?: string }> => {
    try {
        if (!OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key not configured');
        }

        const notesContext = notes.map((note, i) =>
            `[Source ${i + 1}: ${note.source || note.title}]\n${note.content.substring(0, 1500)}`
        ).join('\n\n---\n\n');

        const userPrompt = `Based on the following notes/sources, write a comprehensive UPSC Mains-style answer on the topic: "${topic}"

Sources:
${notesContext}

Requirements:
1. Write exactly 200 words (UPSC standard)
2. Structure: Introduction → Body → Conclusion
3. Use facts and data from the sources
4. Maintain exam-appropriate language
5. Include relevant examples

Respond in JSON format:
{
    "answer": "Your 200-word structured answer",
    "sources": ["List of sources used"]
}`;

        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_CONFIG.url,
                'X-Title': SITE_CONFIG.name,
            },
            body: JSON.stringify({
                model: AI_MODELS.GEMINI_FLASH,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert UPSC Mains answer writer. Write structured, fact-based answers using the provided sources.'
                    },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.4,
                max_tokens: 1500,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        const responseContent = data.choices?.[0]?.message?.content;

        if (!responseContent) {
            throw new Error('No response content from AI');
        }

        const parsed = JSON.parse(responseContent);

        return {
            answer: parsed.answer || '',
            sources: parsed.sources || notes.map(n => n.title),
        };
    } catch (error) {
        console.error('[AISummarizer] Error generating answer:', error);
        return {
            answer: '',
            sources: [],
            error: error instanceof Error ? error.message : 'Failed to generate answer',
        };
    }
};

export default {
    summarizeArticle,
    analyzeForUPSC,
    generateAnswerFromNotes,
};
