/**
 * Lightning Fast PDF MCQ Generator
 * Uses OCR for text extraction + Gemini 2.5 Flash for MCQ generation
 * Implements parallel execution for sub-minute completion
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
    callAI,
    executeParallel,
    withTimeout,
    withRetry,
    ACTIVE_MODELS,
    PARALLEL_CONFIG,
} from '../../../services/aiService';

// OCR API Configuration
const OCR_API_KEY = 'K85553321788957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

// Types
export interface MCQ {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
}

export interface ProcessingStatus {
    stage: 'picking' | 'reading' | 'extracting' | 'generating' | 'parsing' | 'complete' | 'error';
    progress: number; // 0-100
    message: string;
    startTime: number;
    estimatedTimeRemaining?: number;
}

export interface ProcessingResult {
    success: boolean;
    mcqs: MCQ[];
    fileName: string;
    processingTimeMs: number;
    textLength?: number;
    error?: string;
}

type StatusCallback = (status: ProcessingStatus) => void;

/**
 * Pick a PDF file from device
 */
export async function pickPDFFile(): Promise<{
    success: boolean;
    file?: {
        uri: string;
        name: string;
        size: number;
        mimeType: string;
    };
    error?: string;
    canceled?: boolean;
}> {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return { success: false, canceled: true };
        }

        const file = result.assets[0];
        return {
            success: true,
            file: {
                uri: file.uri,
                name: file.name || 'document.pdf',
                size: file.size || 0,
                mimeType: file.mimeType || 'application/pdf',
            },
        };
    } catch (error: any) {
        console.error('[pickPDFFile] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Read file as base64
 */
async function readFileAsBase64(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
    });
    return base64;
}

/**
 * Extract text from PDF/Image using OCR.space API (fast and reliable)
 */
async function extractTextWithOCR(
    base64Data: string,
    mimeType: string,
    onStatus?: StatusCallback
): Promise<string> {
    const startTime = Date.now();

    onStatus?.({
        stage: 'extracting',
        progress: 15,
        message: '🔍 Scanning document with OCR...',
        startTime,
    });

    const isPDF = mimeType === 'application/pdf';
    const dataPrefix = isPDF
        ? 'data:application/pdf;base64,'
        : `data:${mimeType || 'image/png'};base64,`;

    // Create form data for OCR API
    const formData = new FormData();
    formData.append('base64Image', dataPrefix + base64Data);
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', isPDF ? 'PDF' : 'Auto');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const response = await fetch(OCR_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`OCR API Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.OCRExitCode === 1 && result.ParsedResults && result.ParsedResults.length > 0) {
        const fullText = result.ParsedResults
            .map((page: any) => page.ParsedText || '')
            .join('\n\n');

        if (fullText.trim().length === 0) {
            throw new Error('No text found in document');
        }

        onStatus?.({
            stage: 'extracting',
            progress: 30,
            message: `📝 Extracted ${fullText.length} characters`,
            startTime,
        });

        return fullText;
    } else {
        const errorMsg = result.ErrorMessage ||
            result.ParsedResults?.[0]?.ErrorMessage ||
            'OCR could not process the file';
        throw new Error(errorMsg);
    }
}

/**
 * Generate all MCQs in a single fast API call
 */
async function generateMCQsFast(
    text: string,
    totalQuestions: number = 10,
    onStatus?: StatusCallback
): Promise<MCQ[]> {
    const startTime = Date.now();

    onStatus?.({
        stage: 'generating',
        progress: 40,
        message: '🤖 AI generating MCQs...',
        startTime,
    });

    // Truncate text to stay within token limits
    const truncatedText = text.substring(0, 15000);

    const prompt = `You are an expert UPSC exam question creator. Based on the following content, create exactly ${totalQuestions} Multiple Choice Questions (MCQs).

CONTENT:
${truncatedText}

REQUIREMENTS:
- Create exactly ${totalQuestions} high-quality MCQs
- Bilingual: English followed by Hindi translation (separated by " / ")
- Each MCQ has 4 options (A, B, C, D)
- One correct answer per question
- Brief explanation for each

FORMAT (STRICT - follow exactly for each question):
Question 1: [English Question] / [Hindi Question]
A. [Option in English] / [Hindi]
B. [Option in English] / [Hindi]
C. [Option in English] / [Hindi]
D. [Option in English] / [Hindi]
Correct Answer: [A/B/C/D]
Explanation: [Brief explanation]

Generate ${totalQuestions} MCQs now:`;

    const response = await withRetry(async () => {
        const res = await callAI(prompt, {
            model: ACTIVE_MODELS.MCQ_GENERATION,
            maxTokens: 8192,
            temperature: 0.7,
            timeout: 45000,
        });

        if (!res.success || !res.content) {
            throw new Error(res.error || 'Failed to generate MCQs');
        }

        return res.content;
    }, 2, 1000);

    onStatus?.({
        stage: 'parsing',
        progress: 80,
        message: '✨ Parsing generated MCQs...',
        startTime,
    });

    const mcqs = parseMCQsFromResponse(response);

    console.log(`[generateMCQsFast] Generated ${mcqs.length} MCQs`);

    return mcqs;
}

/**
 * Parse MCQs from AI response
 */
function parseMCQsFromResponse(response: string): MCQ[] {
    if (!response || typeof response !== 'string') {
        console.error('[parseMCQsFromResponse] Invalid response');
        return [];
    }

    const mcqs: MCQ[] = [];

    // Split by question markers
    const sections = response.split(/(?=Question\s*\d+[:.:])/gi);

    for (const section of sections) {
        if (!section.trim() || section.length < 50) continue;

        try {
            const mcq = parseQuestionSection(section);
            if (mcq) {
                mcqs.push(mcq);
            }
        } catch (e) {
            console.warn('[parseMCQsFromResponse] Failed to parse section:', e);
            continue;
        }
    }

    console.log(`[parseMCQsFromResponse] Parsed ${mcqs.length} MCQs from response`);
    return mcqs;
}

/**
 * Parse a single question section
 */
function parseQuestionSection(section: string): MCQ | null {
    // Extract question (everything before options)
    const questionMatch = section.match(/Question\s*\d+[:.:]?\s*(.+?)(?=\n\s*A[.\)])/is);
    if (!questionMatch) {
        // Try alternative pattern
        const altMatch = section.match(/^\d+[:.]\s*(.+?)(?=\n\s*A[.\)])/is);
        if (!altMatch) return null;
    }

    const question = (questionMatch?.[1] || section.split('\n')[0]).replace(/^Question\s*\d+[:.:]?\s*/i, '').trim();
    if (!question || question.length < 10) return null;

    // Extract options
    const options: { [key: string]: string } = {};

    // Try multiple patterns for options
    const optionPatterns = [
        /([A-D])[.\)]\s*(.+?)(?=\n\s*[A-D][.\)]|\nCorrect|\nExplanation|$)/gi,
        /^([A-D])\.\s*(.+)$/gim,
    ];

    for (const pattern of optionPatterns) {
        let match;
        while ((match = pattern.exec(section)) !== null) {
            const label = match[1].toUpperCase();
            const text = match[2].trim();
            if (text && text.length > 0) {
                options[label] = text;
            }
        }
        if (Object.keys(options).length >= 4) break;
    }

    // Need at least 4 options
    if (!options.A || !options.B || !options.C || !options.D) {
        console.warn('[parseQuestionSection] Missing options:', Object.keys(options));
        return null;
    }

    // Extract correct answer
    const correctMatch = section.match(/Correct\s*Answer[:\s]*([A-D])/i);
    const correctAnswer = correctMatch ? correctMatch[1].toUpperCase() : 'A';

    // Extract explanation
    const explanationMatch = section.match(/Explanation[:\s]*(.+?)(?=Question\s*\d+|$)/is);
    const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;

    return {
        question,
        optionA: options.A,
        optionB: options.B,
        optionC: options.C,
        optionD: options.D,
        correctAnswer,
        explanation,
    };
}

/**
 * MAIN FUNCTION: Process PDF and generate MCQs in under 1 minute
 * Uses OCR + Gemini Flash
 */
import { API_BASE_URL } from '../../../config/api';

/**
 * Attempt to generate MCQs using the fast backend API (Native PDF parsing)
 */
async function attemptBackendGeneration(
    fileUri: string,
    fileName: string,
    onStatus?: StatusCallback
): Promise<ProcessingResult | null> {
    try {
        onStatus?.({
            stage: 'reading',
            progress: 10,
            message: '🚀 Uploading to fast server...',
            startTime: Date.now(),
        });

        // Create FormData
        const formData = new FormData();
        formData.append('file', {
            uri: fileUri,
            name: fileName,
            type: 'application/pdf',
        } as any);
        formData.append('numQuestions', '10');
        formData.append('difficulty', 'pro');

        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}/generate-mcq-from-pdf`, {
            method: 'POST',
            body: formData,
            headers: {
                // 'Content-Type': 'multipart/form-data', // Do NOT set this manually, let fetch handle it with boundary
            },
        });

        if (response.status === 422) {
            // Scanned PDF, fallback to OCR
            console.log('Backend returned 422 (Scanned PDF), falling back to OCR');
            return null;
        }

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.questions) throw new Error('Invalid response from server');

        // Map response
        const mcqs: MCQ[] = data.questions.map((q: any) => ({
            question: q.question,
            optionA: q.options[0].text,
            optionB: q.options[1].text,
            optionC: q.options[2].text,
            optionD: q.options[3].text,
            correctAnswer: q.options.find((o: any) => o.isCorrect) ? (['A', 'B', 'C', 'D'][q.options.findIndex((o: any) => o.isCorrect)]) : 'A',
            explanation: q.explanation
        }));

        const processingTimeMs = Date.now() - startTime;

        onStatus?.({
            stage: 'complete',
            progress: 100,
            message: `✅ Generated ${mcqs.length} MCQs in ${(processingTimeMs / 1000).toFixed(1)}s`,
            startTime,
        });

        return {
            success: true,
            mcqs,
            fileName,
            processingTimeMs,
            textLength: 1000,
        };

    } catch (e: any) {
        console.warn('Backend generation failed, falling back to client OCR:', e);
        return null;
    }
}

/**
 * MAIN FUNCTION: Process PDF and generate MCQs
 * Tries Fast Backend First -> Falls back to Client OCR
 */
export async function processAndGenerateMCQs(
    fileUri: string,
    fileName: string,
    mimeType: string = 'application/pdf',
    onStatus?: StatusCallback
): Promise<ProcessingResult> {

    // 1. Try Fast Backend
    if (mimeType === 'application/pdf') {
        const fastResult = await attemptBackendGeneration(fileUri, fileName, onStatus);
        if (fastResult) {
            return fastResult;
        }
    }

    // 2. Fallback to Original OCR Method
    const startTime = Date.now();

    try {
        // Stage 1: Read file
        onStatus?.({
            stage: 'reading',
            progress: 5,
            message: '📄 Reading file (OCR Fallback)...',
            startTime,
        });

        console.log('[processAndGenerateMCQs] Reading file:', fileName);

        const base64Data = await withTimeout(
            readFileAsBase64(fileUri),
            10000,
            'Failed to read file'
        );

        if (!base64Data || base64Data.length === 0) {
            throw new Error('File is empty');
        }

        console.log('[processAndGenerateMCQs] File read, size:', base64Data.length);

        // Stage 2: Extract text with OCR
        onStatus?.({
            stage: 'extracting',
            progress: 10,
            message: '🔍 Extracting text from PDF...',
            startTime,
        });

        const extractedText = await withTimeout(
            extractTextWithOCR(base64Data, mimeType, onStatus),
            60000, // Increased timeout for OCR
            'Text extraction timed out'
        );

        if (!extractedText || extractedText.length < 50) {
            throw new Error('Could not extract sufficient text from PDF. Please try a clearer document.');
        }

        console.log('[processAndGenerateMCQs] Extracted text length:', extractedText.length);

        onStatus?.({
            stage: 'generating',
            progress: 35,
            message: `📝 Extracted ${extractedText.length} chars, generating MCQs...`,
            startTime,
        });

        // Stage 3: Generate MCQs with AI
        const mcqs = await withTimeout(
            generateMCQsFast(extractedText, 10, onStatus),
            60000,
            'MCQ generation timed out'
        );

        if (mcqs.length === 0) {
            throw new Error('Could not generate MCQs from PDF content. Please try a different document.');
        }

        const processingTimeMs = Date.now() - startTime;

        console.log('[processAndGenerateMCQs] Success! Generated', mcqs.length, 'MCQs in', processingTimeMs, 'ms');

        onStatus?.({
            stage: 'complete',
            progress: 100,
            message: `✅ Generated ${mcqs.length} MCQs in ${(processingTimeMs / 1000).toFixed(1)}s`,
            startTime,
        });

        return {
            success: true,
            mcqs,
            fileName,
            processingTimeMs,
            textLength: extractedText.length,
        };

    } catch (error: any) {
        const processingTimeMs = Date.now() - startTime;

        console.error('[processAndGenerateMCQs] Error:', error.message);

        onStatus?.({
            stage: 'error',
            progress: 0,
            message: `❌ ${error.message}`,
            startTime,
        });

        return {
            success: false,
            mcqs: [],
            fileName,
            processingTimeMs,
            error: error.message,
        };
    }
}

/**
 * Quick single-step process: Pick PDF + Generate MCQs
 * Complete pipeline in one function call
 */
export async function quickProcessPDF(
    onStatus?: StatusCallback
): Promise<ProcessingResult | null> {
    onStatus?.({
        stage: 'picking',
        progress: 0,
        message: '📁 Select a PDF file...',
        startTime: Date.now(),
    });

    const pickResult = await pickPDFFile();

    if (pickResult.canceled) {
        return null;
    }

    if (!pickResult.success || !pickResult.file) {
        return {
            success: false,
            mcqs: [],
            fileName: 'Unknown',
            processingTimeMs: 0,
            error: pickResult.error || 'Failed to pick file',
        };
    }

    // Check file size (max 5MB for OCR)
    if (pickResult.file.size > 5 * 1024 * 1024) {
        return {
            success: false,
            mcqs: [],
            fileName: pickResult.file.name,
            processingTimeMs: 0,
            error: 'PDF too large. Maximum size is 5MB for fast processing.',
        };
    }

    console.log('[quickProcessPDF] Processing file:', pickResult.file.name, 'Size:', pickResult.file.size);

    return processAndGenerateMCQs(
        pickResult.file.uri,
        pickResult.file.name,
        pickResult.file.mimeType,
        onStatus
    );
}
