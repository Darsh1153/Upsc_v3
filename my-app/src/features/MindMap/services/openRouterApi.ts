/**
 * OpenRouter API Service for Gemini 3 Mind Map Generation
 */

// OpenRouter API Configuration
// Get your API key from https://openrouter.ai/keys
import { OPENROUTER_API_KEY } from '../../../utils/secureKey'; // process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

// Debug: Log API key status (not the full key for security)
console.log('[OpenRouter] API Key configured:', OPENROUTER_API_KEY ? `Yes (${OPENROUTER_API_KEY.substring(0, 10)}...)` : 'No');
console.log('[OpenRouter] API Key length:', OPENROUTER_API_KEY.length);

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-3-flash-preview'; // Gemini 3 Pro with reasoning

// Check if API key is configured
const isApiKeyConfigured = () => {
  return OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 10 && !OPENROUTER_API_KEY.includes('YOUR_');
};

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_details?: any;
}

export interface GenerateMindMapResponse {
  content: string;
  mermaidCode: string;
  reasoning_details?: any;
}

// System prompt for mind map generation
const SYSTEM_PROMPT = `You are an expert mind map creator specialized in creating Mermaid mindmap diagrams for UPSC (Union Public Service Commission) exam preparation.

When the user asks you to create or modify a mind map, you should:
1. Understand the topic thoroughly
2. Create a hierarchical structure suitable for learning
3. Generate valid Mermaid mindmap syntax

IMPORTANT RULES FOR MERMAID MINDMAP:
- Always start with \`mindmap\` keyword
- Use proper indentation (2 spaces for each level)
- Root node format: \`root((Topic Name))\`
- Child nodes can use: 
  - Round: \`(Node)\`
  - Square: \`[Node]\`
  - Bang: \`))Node((\`
  - Cloud: \`)Node(\`
  - Hexagon: \`{{Node}}\`
- Use concise labels (max 30 chars per node)
- Maximum 4-5 levels deep
- Group related concepts together

RESPONSE FORMAT:
Always respond with:
1. A brief explanation of the mind map structure
2. The Mermaid code block wrapped in \`\`\`mermaid and \`\`\`

Example:
\`\`\`mermaid
mindmap
  root((Indian Constitution))
    (Historical Background)
      [Government of India Act 1935]
      [Cabinet Mission Plan]
      [Independence Act 1947]
    (Salient Features)
      [Federal Structure]
      [Parliamentary System]
      [Fundamental Rights]
      [Directive Principles]
    (Parts and Schedules)
      [22 Parts]
      [12 Schedules]
\`\`\`

For modifications, update the existing diagram based on user requests (add nodes, reorganize, expand sections, etc.)`;

// Extract Mermaid code from response
const extractMermaidCode = (content: string): string => {
  // Try to find mermaid code block
  const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
  if (mermaidMatch) {
    return mermaidMatch[1].trim();
  }

  // Try to find code block without language
  const codeMatch = content.match(/```\n?([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().startsWith('mindmap')) {
    return codeMatch[1].trim();
  }

  // Check if content itself is mermaid code
  if (content.trim().startsWith('mindmap')) {
    return content.trim();
  }

  return '';
};

// Generate mind map using OpenRouter API
export const generateMindMap = async (
  userMessage: string,
  conversationHistory: Message[] = [],
  existingMermaidCode?: string
): Promise<GenerateMindMapResponse> => {
  // Check if API key is configured
  if (!isApiKeyConfigured()) {
    throw new Error(
      'OpenRouter API key not configured. Please add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file. Get your key from https://openrouter.ai/keys'
    );
  }

  // Build messages array
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Add conversation history
  conversationHistory.forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content,
      reasoning_details: msg.reasoning_details,
    });
  });

  // If there's existing code, include it for context
  let userContent = userMessage;
  if (existingMermaidCode) {
    userContent = `Current mind map:\n\`\`\`mermaid\n${existingMermaidCode}\n\`\`\`\n\nUser request: ${userMessage}`;
  }

  messages.push({ role: 'user', content: userContent });

  // Debug: Log what we're about to send
  console.log('[OpenRouter] Preparing request...');
  console.log('[OpenRouter] API Key present:', !!OPENROUTER_API_KEY);
  console.log('[OpenRouter] API Key first 15 chars:', OPENROUTER_API_KEY.substring(0, 15));
  console.log('[OpenRouter] Model:', MODEL);
  console.log('[OpenRouter] Message count:', messages.length);

  try {
    console.log('[OpenRouter] Sending request to:', API_URL);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://upsc-prep.app',
        'X-Title': 'UPSC Prep Mind Map',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          ...(m.reasoning_details ? { reasoning_details: m.reasoning_details } : {}),
        })),
        reasoning: { enabled: true }, // Enable reasoning for better mind map generation
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    console.log('[OpenRouter] Response status:', response.status);
    console.log('[OpenRouter] Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OpenRouter] API error response:', JSON.stringify(errorData, null, 2));
      console.error('[OpenRouter] Error status:', response.status);
      console.error('[OpenRouter] Error message:', errorData.error?.message);
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('[OpenRouter] Response received successfully');
    console.log('[OpenRouter] Response has choices:', !!data.choices);
    console.log('[OpenRouter] Choices count:', data.choices?.length);

    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage) {
      console.error('[OpenRouter] No assistant message in response');
      throw new Error('No response from AI');
    }

    console.log('[OpenRouter] Assistant message received');
    const content = assistantMessage.content || '';
    const mermaidCode = extractMermaidCode(content);
    console.log('[OpenRouter] Mermaid code extracted:', !!mermaidCode);

    return {
      content,
      mermaidCode,
      reasoning_details: assistantMessage.reasoning_details,
    };
  } catch (error) {
    console.error('[OpenRouter] Request failed:', error);
    console.error('[OpenRouter] Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Generate initial mind map from topic
export const generateInitialMindMap = async (
  topic: string,
  description?: string
): Promise<GenerateMindMapResponse> => {
  let prompt = `Create a comprehensive mind map for the UPSC topic: "${topic}"`;
  if (description) {
    prompt += `\n\nAdditional context: ${description}`;
  }
  prompt += '\n\nCreate a well-structured mind map that covers the key concepts, sub-topics, and important points for UPSC preparation.';

  return generateMindMap(prompt);
};

// Modify existing mind map
export const modifyMindMap = async (
  instruction: string,
  existingMermaidCode: string,
  conversationHistory: Message[] = []
): Promise<GenerateMindMapResponse> => {
  return generateMindMap(instruction, conversationHistory, existingMermaidCode);
};

// Suggest improvements for mind map
export const suggestImprovements = async (
  mermaidCode: string
): Promise<GenerateMindMapResponse> => {
  const prompt = `Analyze this mind map and suggest improvements. Add more relevant nodes, reorganize if needed, and ensure it covers all important aspects for UPSC preparation.`;
  return generateMindMap(prompt, [], mermaidCode);
};

// Expand a specific node
export const expandNode = async (
  nodeName: string,
  mermaidCode: string,
  conversationHistory: Message[] = []
): Promise<GenerateMindMapResponse> => {
  const prompt = `Expand the "${nodeName}" section in more detail. Add relevant sub-topics and concepts that would be important for UPSC preparation.`;
  return generateMindMap(prompt, conversationHistory, mermaidCode);
};

