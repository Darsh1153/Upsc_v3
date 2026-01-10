/**
 * Web Scraper Service
 * Handles scraping of article content from URLs using local HTML parsing
 * Uses AllOrigins CORS proxy for web compatibility
 */

export interface ScrapedArticle {
    url: string;
    title: string;
    content: string;
    contentBlocks: ContentBlock[];
    author?: string;
    publishedDate?: string;
    metaDescription?: string;
    featuredImage?: string;
    error?: string;
}

export interface ContentBlock {
    type: 'heading' | 'paragraph' | 'bullet' | 'numbered' | 'quote';
    content: string;
    level?: number;
    items?: string[];
}

import { NoteBlock } from './localNotesStorage';

/**
 * Helper to convert scraped blocks to NoteBlocks
 */
export const contentBlocksToNoteBlocks = (blocks: ContentBlock[]): NoteBlock[] => {
    return blocks.map((block) => {
        let type: NoteBlock['type'] = 'paragraph';

        if (block.type === 'heading') {
            type = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
        } else if (block.type === 'numbered') {
            type = 'numbered';
        } else if (block.type === 'bullet') {
            type = 'bullet';
        } else if (block.type === 'quote') {
            type = 'quote';
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: block.items ? block.items.join('\n') : block.content,
        };
    });
};

/**
 * Parses HTML string into structured ContentBlocks
 */
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

/**
 * Main scraping function
 */
export const smartScrape = async (url: string): Promise<ScrapedArticle> => {
    try {
        console.log('[WebScraper] Starting scrape for:', url);

        // Try Primary Proxy (AllOrigins)
        try {
            console.log('[WebScraper] Trying Primary Proxy (AllOrigins)...');
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const html = await response.text();
            if (!html || html.length < 100) throw new Error('Empty response');
            return processHtml(html, url);
        } catch (primaryError) {
            console.warn('[WebScraper] Primary proxy failed:', primaryError);

            // Try Secondary Proxy (CORSProxy.io)
            try {
                console.log('[WebScraper] Trying Secondary Proxy (CORSProxy.io)...');
                const fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const response = await fetch(fallbackUrl);
                if (!response.ok) throw new Error(`Status: ${response.status}`);
                const html = await response.text();
                if (!html || html.length < 100) throw new Error('Empty response');
                return processHtml(html, url);
            } catch (secondaryError) {
                console.warn('[WebScraper] Secondary proxy failed:', secondaryError);

                // Try Tertiary Proxy (CodeTabs)
                try {
                    console.log('[WebScraper] Trying Tertiary Proxy (CodeTabs)...');
                    const tertiaryUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
                    const response = await fetch(tertiaryUrl);
                    if (!response.ok) throw new Error(`Status: ${response.status}`);
                    const html = await response.text();
                    if (!html || html.length < 100) throw new Error('Empty response');
                    return processHtml(html, url);
                } catch (tertiaryError) {
                    console.error('[WebScraper] All proxies failed:', tertiaryError);
                    throw new Error('Could not fetch article. The website might be blocking automated access.');
                }
            }
        }
    } catch (error) {
        console.error('[WebScraper] Error:', error);
        return {
            url,
            title: 'Error Scraping Article',
            content: '',
            contentBlocks: [],
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Helper to process HTML and return ScrapedArticle
 */
const processHtml = (html: string, url: string): ScrapedArticle => {
    console.log('[WebScraper] Fetched HTML, length:', html.length);

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) title = ogTitleMatch[1];
    const cleanedTitle = title.replace(/\s*[|\-–—]\s*[^|]*$/, '').trim();

    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : undefined;

    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1] : undefined;

    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
    const publishedDate = dateMatch ? dateMatch[1] : undefined;

    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const featuredImage = ogImageMatch ? ogImageMatch[1] : undefined;

    // Process Content
    const mainContent = extractMainContent(html);
    const rawBlocks = parseHtmlToBlocks(mainContent);

    // Map to typed ContentBlocks
    const contentBlocks: ContentBlock[] = rawBlocks.map(block => ({
        type: block.type === 'ordered-list' ? 'numbered' :
            block.type === 'unordered-list' ? 'bullet' :
                block.type as ContentBlock['type'],
        content: block.content,
        level: block.level,
        items: block.items
    }));

    // Generate plain text content
    const plainContent = contentBlocks
        .map(b => b.items ? b.items.join('\n') : b.content)
        .join('\n\n');

    return {
        url,
        title: cleanedTitle || 'Untitled Article',
        content: plainContent,
        contentBlocks,
        author,
        publishedDate,
        metaDescription,
        featuredImage
    };

};

/**
 * Check if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Extract domain from URL
 */
export const extractDomain = (url: string): string => {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url;
    }
};

export default {
    smartScrape,
    isValidUrl,
    extractDomain,
    contentBlocksToNoteBlocks, // Export it
};
