/**
 * AI Model Configuration
 * Centralized configuration for all AI models used in the app
 * Easy to switch models in the future
 */

// OpenRouter API Key - Used for all AI operations
// Get your API key from https://openrouter.ai/keys
import { OPENROUTER_API_KEY as KEY } from '../utils/secureKey';
export const OPENROUTER_API_KEY = KEY; // process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Site metadata for OpenRouter
export const SITE_CONFIG = {
    url: 'https://upsc-prep-app.com',
    name: 'UPSC Prep App',
};

export const AI_MODELS = {
    // Gemini Models (Google) - Fastest for our use case
    GEMINI_FLASH: 'google/gemini-3-flash-preview',
    GEMINI_FLASH_LATEST: 'google/gemini-3-flash-preview',
    GEMINI_PRO: 'google/gemini-3-flash-preview',

    // Claude Models (Anthropic) - Best for analysis
    CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
    CLAUDE_HAIKU: 'anthropic/claude-3-haiku',

    // OpenAI Models
    GPT4_TURBO: 'openai/gpt-4-turbo',
    GPT4O_MINI: 'openai/gpt-4o-mini',

    // DeepSeek Models - Cost effective
    DEEPSEEK_CHAT: 'deepseek/deepseek-chat',
} as const;

// Current active models for each task
export const ACTIVE_MODELS = {
    // PDF Text Extraction - Use fastest model with vision
    PDF_EXTRACTION: AI_MODELS.GEMINI_FLASH_LATEST,

    // MCQ Generation - Use flash for speed
    MCQ_GENERATION: AI_MODELS.GEMINI_FLASH_LATEST,

    // Essay Evaluation - Pro for quality
    ESSAY_EVALUATION: AI_MODELS.GEMINI_PRO,

    // Mind Map Generation
    MIND_MAP: AI_MODELS.GEMINI_FLASH_LATEST,
};

// Model capabilities
export const MODEL_CAPABILITIES = {
    [AI_MODELS.GEMINI_FLASH]: { vision: true, speed: 'ultra-fast', maxTokens: 8192 },
    // [AI_MODELS.GEMINI_FLASH_LATEST]: { ... }, // Same as GEMINI_FLASH
    // [AI_MODELS.GEMINI_PRO]: { vision: true, speed: 'fast', maxTokens: 16384 }, // Same as GEMINI_FLASH
    [AI_MODELS.CLAUDE_SONNET]: { vision: true, speed: 'fast', maxTokens: 8192 },
    [AI_MODELS.CLAUDE_HAIKU]: { vision: true, speed: 'ultra-fast', maxTokens: 4096 },
    [AI_MODELS.GPT4_TURBO]: { vision: true, speed: 'medium', maxTokens: 4096 },
    [AI_MODELS.GPT4O_MINI]: { vision: true, speed: 'fast', maxTokens: 4096 },
    [AI_MODELS.DEEPSEEK_CHAT]: { vision: false, speed: 'fast', maxTokens: 8192 },
};

// Thread pool configuration for parallel processing
export const PARALLEL_CONFIG = {
    // Max concurrent API calls
    MAX_CONCURRENT_REQUESTS: 5,

    // Chunk size for splitting PDF text for parallel MCQ generation
    MCQ_BATCH_SIZE: 3, // Generate 3 MCQs per batch

    // Timeout for individual requests (ms)
    REQUEST_TIMEOUT: 30000,

    // Total timeout for entire operation (ms)
    TOTAL_TIMEOUT: 60000, // 1 minute max
};

export type AIModelKey = keyof typeof AI_MODELS;
export type ActiveModelKey = keyof typeof ACTIVE_MODELS;
