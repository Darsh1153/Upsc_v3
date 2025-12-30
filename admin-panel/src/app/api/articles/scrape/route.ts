import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { OPENROUTER_API_KEY } from '@/lib/secure-config';

// Simple HTML parser to extract content blocks
function parseHtmlToBlocks(html: string): Array<{ type: string; content: string;[key: string]: any }> {
    const blocks: Array<{ type: string; content: string;[key: string]: any }> = [];

    let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Extract headings
    const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match;
    while ((match = headingRegex.exec(cleanHtml)) !== null) {
        const level = parseInt(match[1]);
        const content = match[2].replace(/<[^>]+>/g, '').trim();
        if (content) {
            blocks.push({ type: 'heading', level, content });
        }
    }

    // Extract paragraphs
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((match = paragraphRegex.exec(cleanHtml)) !== null) {
        const content = match[1].replace(/<[^>]+>/g, '').trim();
        if (content && content.length > 20) {
            blocks.push({ type: 'paragraph', content });
        }
    }

    // Extract lists
    const listRegex = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
    while ((match = listRegex.exec(cleanHtml)) !== null) {
        const listType = match[1];
        const listItems = match[2].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        const items = listItems.map(item => item.replace(/<[^>]+>/g, '').trim()).filter(item => item);
        if (items.length > 0) {
            blocks.push({ type: listType === 'ol' ? 'ordered-list' : 'unordered-list', items, content: items.join(', ') });
        }
    }

    // Extract blockquotes
    const blockquoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
    while ((match = blockquoteRegex.exec(cleanHtml)) !== null) {
        const content = match[1].replace(/<[^>]+>/g, '').trim();
        if (content) {
            blocks.push({ type: 'quote', content });
        }
    }

    return blocks;
}

// Extract main content from HTML
function extractMainContent(html: string): string {
    let content = html;

    const removePatterns = [
        /<nav\b[^>]*>[\s\S]*?<\/nav>/gi,
        /<header\b[^>]*>[\s\S]*?<\/header>/gi,
        /<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
        /<aside\b[^>]*>[\s\S]*?<\/aside>/gi,
        /<div[^>]*class="[^"]*(?:sidebar|advertisement|ads|comments|related|social|share)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        /<!--[\s\S]*?-->/g,
    ];

    for (const pattern of removePatterns) {
        content = content.replace(pattern, '');
    }

    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) return articleMatch[1];

    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) return mainMatch[1];

    return content;
}

// Extract all text content from content blocks for RAG
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

// Call OpenRouter API to generate 15 bullet points
async function generateParaphrasedSummary(articleText: string, title: string): Promise<string> {
    // const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        console.error('OPENROUTER_API_KEY is not defined in environment variables');
        return 'Error generating AI summary: API key missing';
    }

    console.log('Calling OpenRouter API to generate paraphrased summary...');
    console.log('Article title:', title);
    console.log('Article text length:', articleText.length);

    try {
        // Truncate article text if too long (OpenRouter has token limits)
        const maxTextLength = 8000; // Reasonable limit for context
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
                        content: `You are an expert content analyst specializing in UPSC (Union Public Service Commission) exam preparation. 

Based on the following article titled "${title}", analyze the content and create exactly 15 insightful bullet points that paraphrase and summarize the key information. 

Requirements:
- Create exactly 15 numbered bullet points (1 to 15)
- Each bullet point should be insightful and capture important information
- Focus on key concepts, facts, analysis, and implications relevant to UPSC preparation
- Use clear, concise language
- Ensure the bullet points cover different aspects of the article comprehensively
- Format as: "1. [insightful point]\n2. [insightful point]\n..." etc.

Article Content:
${truncatedText}

Generate the 15 bullet points now:`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
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
            console.log('Generated summary length:', generatedText.length);
            return generatedText;
        } else {
            console.error('Unexpected OpenRouter API response format:', data);
            throw new Error('Unexpected response format from OpenRouter API');
        }
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        // Return a fallback message instead of throwing
        return `Error generating AI summary: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: 400 });
        }

        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1].trim() : '';

        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitleMatch) title = ogTitleMatch[1];

        // Extract meta description
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

        // Extract og:description as summary
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const summary = ogDescMatch ? ogDescMatch[1] : metaDescription;

        // Extract author
        const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
        const author = authorMatch ? authorMatch[1] : null;

        // Extract published date
        const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
        const publishedDate = dateMatch ? new Date(dateMatch[1]) : null;

        // Extract og:image
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        const featuredImage = ogImageMatch ? ogImageMatch[1] : null;

        // Extract main content
        const mainContent = extractMainContent(html);
        const contentBlocks = parseHtmlToBlocks(mainContent);

        // Extract images
        const images: Array<{ url: string; alt?: string }> = [];
        if (featuredImage) {
            images.push({ url: featuredImage, alt: 'Featured image' });
        }

        const cleanedTitle = title.replace(/\s*[|\-–—]\s*[^|]*$/, '').trim();
        const filteredContent = contentBlocks.filter(b => b.type !== 'image');

        // Extract text content for RAG (mini dataset)
        const articleText = extractTextContent(filteredContent);
        console.log('Extracted article text for paraphrasing, length:', articleText.length);

        // Generate paraphrased summary with 15 bullet points using OpenRouter API
        let paraphrasedSummary = summary; // Fallback to original summary
        if (articleText && articleText.length > 50) { // Only call API if we have substantial content
            try {
                paraphrasedSummary = await generateParaphrasedSummary(articleText, cleanedTitle);
                console.log('Successfully generated paraphrased summary');
            } catch (error) {
                console.error('Failed to generate paraphrased summary, using original:', error);
                // Keep original summary as fallback
            }
        } else {
            console.log('Article text too short, skipping AI paraphrasing');
        }

        const scrapedData = {
            title: cleanedTitle,
            author,
            publishedDate,
            summary: paraphrasedSummary, // Use AI-generated summary
            metaDescription,
            content: filteredContent,
            images,
            sourceUrl: url,
        };

        return NextResponse.json({ article: scrapedData });
    } catch (error) {
        console.error('Scrape error:', error);
        return NextResponse.json({ error: 'Failed to scrape article' }, { status: 500 });
    }
}

