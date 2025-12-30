/**
 * Web Scraper Service - Local HTML Parsing
 * Uses parseHtmlToBlocks and extractMainContent directly
 * CORS proxy for web browser
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

/**
 * Main scraping function
 */
export const smartScrape = async (url: string): Promise<ScrapedArticle> => {
    try {
        console.log('[WebScraper] Starting scrape for:', url);

        // Use CORS proxy for web browser
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        console.log('[WebScraper] Using CORS proxy');

        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const html = await response.text();
        console.log('[WebScraper] Fetched HTML, length:', html.length);

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1].trim() : '';

        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitleMatch) title = ogTitleMatch[1];

        // Extract meta description
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

        // Extract author
        const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
        const author = authorMatch ? authorMatch[1] : undefined;

        // Extract published date
        const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
        const publishedDate = dateMatch ? dateMatch[1] : undefined;

        // Extract og:image
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        const featuredImage = ogImageMatch ? ogImageMatch[1] : undefined;

        // Extract main content using the two functions
        const mainContent = extractMainContent(html);
        const rawBlocks = parseHtmlToBlocks(mainContent);

        console.log('[WebScraper] Extracted', rawBlocks.length, 'content blocks');

        // Clean title
        const cleanedTitle = title.replace(/\s*[|\-–—]\s*[^|]*$/, '').trim();

        // Convert to ContentBlock format
        const contentBlocks: ContentBlock[] = rawBlocks.map(block => ({
            type: block.type === 'ordered-list' ? 'numbered' :
                block.type === 'unordered-list' ? 'bullet' :
                    block.type as ContentBlock['type'],
            content: block.content || '',
            level: block.level,
            items: block.items,
        }));

        // Build plain text
        const plainContent = contentBlocks
            .map(b => b.items ? b.items.join('\n') : b.content)
            .filter(c => c)
            .join('\n\n');

        return {
            url,
            title: cleanedTitle || 'Untitled',
            content: plainContent,
            contentBlocks,
            author,
            publishedDate,
            metaDescription,
            featuredImage,
        };
    } catch (error) {
        console.error('[WebScraper] Error:', error);
        return {
            url,
            title: 'Error',
            content: '',
            contentBlocks: [],
            error: error instanceof Error ? error.message : 'Failed to scrape URL',
        };
    }
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
};
