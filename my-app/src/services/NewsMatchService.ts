import { getAllNotes } from '../features/Notes/services/localNotesStorage';
import { MOBILE_API_URL } from '../config/api';

export interface MatchedArticle {
    noteId: number;
    noteTitle: string;
    articleId: number;
    articleTitle: string;
    articleSummary: string;
    matchReason: string; // "Matched topic: Polity"
}

export const checkNewsMatches = async (): Promise<MatchedArticle[]> => {
    try {
        // 1. Get all local notes
        const notes = await getAllNotes();
        if (notes.length === 0) return [];

        // Extract potential topics/keywords from notes
        // Use titles and tags
        const keywords = new Set<string>();
        const noteMap = new Map<string, { id: number; title: string }>();

        notes.forEach(note => {
            // Use clean title (remove common words if needed, but simple for now)
            if (note.title && note.title !== 'Untitled') {
                const cleanTitle = note.title.trim().toLowerCase();
                if (cleanTitle.length > 3) {
                    keywords.add(cleanTitle);
                    noteMap.set(cleanTitle, { id: note.id, title: note.title });
                }
            }

            // Use tags
            note.tags.forEach(tag => {
                const cleanTag = tag.name.trim().toLowerCase();
                if (cleanTag.length > 3) {
                    keywords.add(cleanTag);
                    noteMap.set(cleanTag, { id: note.id, title: `Tag: ${tag.name}` });
                }
            });
        });

        if (keywords.size === 0) return [];

        // 2. Fetch latest news articles
        // Fetch last 50 items to check matches
        const response = await fetch(`${MOBILE_API_URL}/articles?page=1&limit=50`);
        const data = await response.json();
        const articles = data.articles || [];

        // 3. Match logic
        const matches: MatchedArticle[] = [];
        const processedArticleIds = new Set<number>();

        for (const article of articles) {
            if (processedArticleIds.has(article.id)) continue;

            const articleTitleLower = article.title.toLowerCase();
            const articleSummaryLower = article.summary ? article.summary.toLowerCase() : '';

            for (const keyword of Array.from(keywords)) {
                if (articleTitleLower.includes(keyword) || articleSummaryLower.includes(keyword)) {
                    // Found a match!
                    const noteInfo = noteMap.get(keyword);
                    matches.push({
                        noteId: noteInfo?.id || 0,
                        noteTitle: noteInfo?.title || 'Unknown Note',
                        articleId: article.id,
                        articleTitle: article.title,
                        articleSummary: article.summary,
                        matchReason: `Matched topic: "${keyword}"`,
                    });
                    processedArticleIds.add(article.id);
                    break; // One match per article is enough
                }
            }
        }

        return matches;

    } catch (error) {
        console.error('Error checking news matches:', error);
        return [];
    }
};
