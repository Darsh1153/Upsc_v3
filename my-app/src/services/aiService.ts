/**
 * AI Service - Unified AI API Client
 * Provides a simple interface for all AI operations
 * Supports parallel execution with thread pool pattern
 */

import {
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    SITE_CONFIG,
    ACTIVE_MODELS,
    PARALLEL_CONFIG,
    AI_MODELS,
} from '../config/aiModels';

interface AIRequestOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
}

interface AIResponse {
    success: boolean;
    content?: string;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/**
 * Simple semaphore for controlling concurrent requests
 */
class Semaphore {
    private permits: number;
    private waiting: (() => void)[] = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            this.waiting.push(resolve);
        });
    }

    release(): void {
        if (this.waiting.length > 0) {
            const next = this.waiting.shift();
            if (next) next();
        } else {
            this.permits++;
        }
    }
}

// Global semaphore for rate limiting
const requestSemaphore = new Semaphore(PARALLEL_CONFIG.MAX_CONCURRENT_REQUESTS);

/**
 * Make an AI API call with automatic rate limiting
 */
export async function callAI(
    prompt: string,
    options: AIRequestOptions = {}
): Promise<AIResponse> {
    const {
        model = ACTIVE_MODELS.MCQ_GENERATION,
        maxTokens = 4096,
        temperature = 0.7,
        timeout = PARALLEL_CONFIG.REQUEST_TIMEOUT,
    } = options;

    await requestSemaphore.acquire();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_CONFIG.url,
                'X-Title': SITE_CONFIG.name,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        return {
            success: true,
            content,
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            } : undefined,
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, error: 'Request timed out' };
        }
        return { success: false, error: error.message || 'Unknown error' };
    } finally {
        requestSemaphore.release();
    }
}

/**
 * Call AI with image/PDF (vision capability)
 */
export async function callAIWithVision(
    prompt: string,
    base64Data: string,
    mimeType: string = 'application/pdf',
    options: AIRequestOptions = {}
): Promise<AIResponse> {
    const {
        model = ACTIVE_MODELS.PDF_EXTRACTION,
        maxTokens = 8192,
        temperature = 0.3,
        timeout = PARALLEL_CONFIG.REQUEST_TIMEOUT,
    } = options;

    await requestSemaphore.acquire();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Format for vision models
        const dataUrl = `data:${mimeType};base64,${base64Data}`;

        const response = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_CONFIG.url,
                'X-Title': SITE_CONFIG.name,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: dataUrl } },
                    ],
                }],
                max_tokens: maxTokens,
                temperature,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        return {
            success: true,
            content,
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            } : undefined,
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, error: 'Request timed out' };
        }
        return { success: false, error: error.message || 'Unknown error' };
    } finally {
        requestSemaphore.release();
    }
}

/**
 * Execute multiple AI calls in parallel with thread pool
 * @param tasks Array of task functions that return promises
 * @param maxConcurrent Maximum concurrent tasks (default from config)
 */
export async function executeParallel<T>(
    tasks: (() => Promise<T>)[],
    maxConcurrent: number = PARALLEL_CONFIG.MAX_CONCURRENT_REQUESTS
): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        const p = Promise.resolve().then(async () => {
            const result = await task();
            results[i] = result;
        });

        executing.push(p);

        // If we've reached max concurrency, wait for one to complete
        if (executing.length >= maxConcurrent) {
            await Promise.race(executing);
            // Remove completed promises
            for (let j = executing.length - 1; j >= 0; j--) {
                const isSettled = await Promise.race([
                    executing[j].then(() => true),
                    Promise.resolve(false),
                ]);
                if (isSettled) {
                    executing.splice(j, 1);
                }
            }
        }
    }

    // Wait for all remaining tasks
    await Promise.all(executing);

    return results;
}

/**
 * Execute with timeout wrapper
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}

/**
 * Retry wrapper for API calls
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    delayMs: number = 500
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
            }
        }
    }

    throw lastError;
}

export { AI_MODELS, ACTIVE_MODELS, PARALLEL_CONFIG };
