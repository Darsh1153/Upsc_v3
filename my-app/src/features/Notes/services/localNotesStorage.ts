/**
 * Local Notes Storage Service using AsyncStorage
 * Stores all notes data locally on the device
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const STORAGE_KEYS = {
    NOTES: '@upsc_notes',
    TAGS: '@upsc_note_tags',
    LINKS: '@upsc_scraped_links',
    NOTE_COUNTER: '@upsc_note_counter',
    TAG_COUNTER: '@upsc_tag_counter',
};

// ==================== Types ====================

export interface LocalTag {
    id: number;
    name: string;
    color: string;
    category?: 'subject' | 'source' | 'topic' | 'custom';
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ScrapedLink {
    id: number;
    url: string;
    title: string;
    content: string;
    summary?: string;
    scrapedAt: string;
    noteId?: number;
}

export interface LocalNote {
    id: number;
    title: string;
    content: string; // Plain text / markdown content
    blocks: NoteBlock[]; // Notion-like blocks
    tags: LocalTag[];
    sourceType?: 'manual' | 'scraped' | 'ncert' | 'book' | 'current_affairs' | 'report';
    sourceUrl?: string;
    summary?: string;
    isPinned: boolean;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NoteBlock {
    id: string;
    type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'quote' | 'divider' | 'link' | 'callout' | 'code' | 'toggle' | 'image';
    content: string;
    metadata?: {
        url?: string;
        color?: string;
        language?: string;
        children?: NoteBlock[];
    };
}

// Default UPSC Tags
export const DEFAULT_UPSC_TAGS: Omit<LocalTag, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>[] = [
    // GS Papers
    { name: 'GS1', color: '#EF4444', category: 'subject' },
    { name: 'GS2', color: '#F97316', category: 'subject' },
    { name: 'GS3', color: '#EAB308', category: 'subject' },
    { name: 'GS4', color: '#22C55E', category: 'subject' },
    // Subjects
    { name: 'Polity', color: '#3B82F6', category: 'subject' },
    { name: 'Geography', color: '#10B981', category: 'subject' },
    { name: 'History', color: '#8B5CF6', category: 'subject' },
    { name: 'Economy', color: '#F59E0B', category: 'subject' },
    { name: 'Environment', color: '#06B6D4', category: 'subject' },
    { name: 'Science & Tech', color: '#EC4899', category: 'subject' },
    { name: 'Ethics', color: '#6366F1', category: 'subject' },
    { name: 'International Relations', color: '#14B8A6', category: 'subject' },
    // Source Types
    { name: 'NCERT', color: '#84CC16', category: 'source' },
    { name: 'Standard Book', color: '#0EA5E9', category: 'source' },
    { name: 'Current Affairs', color: '#F43F5E', category: 'source' },
    { name: 'Report', color: '#A855F7', category: 'source' },
    { name: 'Unique Insight', color: '#FBBF24', category: 'source' },
    { name: 'Web Article', color: '#64748B', category: 'source' },
];

// ==================== Helper Functions ====================

const generateId = async (counterKey: string): Promise<number> => {
    try {
        const currentId = await AsyncStorage.getItem(counterKey);
        const newId = (currentId ? parseInt(currentId, 10) : 0) + 1;
        await AsyncStorage.setItem(counterKey, newId.toString());
        return newId;
    } catch (error) {
        console.error('[LocalNotesStorage] Error generating ID:', error);
        return Date.now();
    }
};

const getTimestamp = (): string => new Date().toISOString();

// ==================== Notes CRUD ====================

export const getAllNotes = async (): Promise<LocalNote[]> => {
    try {
        const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
        const notes: LocalNote[] = notesJson ? JSON.parse(notesJson) : [];
        // Sort by pinned first, then by updatedAt
        return notes.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    } catch (error) {
        console.error('[LocalNotesStorage] Error getting notes:', error);
        return [];
    }
};

export const getNoteById = async (noteId: number): Promise<LocalNote | null> => {
    try {
        const notes = await getAllNotes();
        return notes.find(note => note.id === noteId) || null;
    } catch (error) {
        console.error('[LocalNotesStorage] Error getting note:', error);
        return null;
    }
};

export const createNote = async (noteData: Partial<LocalNote>): Promise<LocalNote> => {
    try {
        const notes = await getAllNotes();
        const id = await generateId(STORAGE_KEYS.NOTE_COUNTER);
        const timestamp = getTimestamp();

        const newNote: LocalNote = {
            id,
            title: noteData.title || 'Untitled',
            content: noteData.content || '',
            blocks: noteData.blocks || [{ id: '1', type: 'paragraph', content: '' }],
            tags: noteData.tags || [],
            sourceType: noteData.sourceType || 'manual',
            sourceUrl: noteData.sourceUrl,
            summary: noteData.summary,
            isPinned: noteData.isPinned || false,
            isArchived: noteData.isArchived || false,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        notes.push(newNote);
        await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

        // Update tag usage counts
        for (const tag of newNote.tags) {
            await incrementTagUsage(tag.id);
        }

        console.log('[LocalNotesStorage] Created note:', newNote.id);
        return newNote;
    } catch (error) {
        console.error('[LocalNotesStorage] Error creating note:', error);
        throw error;
    }
};

export const updateNote = async (noteId: number, updates: Partial<LocalNote>): Promise<LocalNote | null> => {
    try {
        const notes = await getAllNotes();
        const index = notes.findIndex(note => note.id === noteId);
        
        if (index === -1) {
            console.error('[LocalNotesStorage] Note not found:', noteId);
            return null;
        }

        const updatedNote: LocalNote = {
            ...notes[index],
            ...updates,
            updatedAt: getTimestamp(),
        };

        notes[index] = updatedNote;
        await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        
        console.log('[LocalNotesStorage] Updated note:', noteId);
        return updatedNote;
    } catch (error) {
        console.error('[LocalNotesStorage] Error updating note:', error);
        throw error;
    }
};

export const deleteNote = async (noteId: number): Promise<boolean> => {
    try {
        const notes = await getAllNotes();
        const filteredNotes = notes.filter(note => note.id !== noteId);
        
        if (filteredNotes.length === notes.length) {
            console.error('[LocalNotesStorage] Note not found:', noteId);
            return false;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filteredNotes));
        console.log('[LocalNotesStorage] Deleted note:', noteId);
        return true;
    } catch (error) {
        console.error('[LocalNotesStorage] Error deleting note:', error);
        return false;
    }
};

export const searchNotes = async (query: string, tagIds?: number[]): Promise<LocalNote[]> => {
    try {
        const notes = await getAllNotes();
        const lowerQuery = query.toLowerCase();

        return notes.filter(note => {
            // Filter by search query
            const matchesQuery = !query || 
                note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery) ||
                note.summary?.toLowerCase().includes(lowerQuery);

            // Filter by tags
            const matchesTags = !tagIds || tagIds.length === 0 ||
                tagIds.some(tagId => note.tags.some(tag => tag.id === tagId));

            return matchesQuery && matchesTags && !note.isArchived;
        });
    } catch (error) {
        console.error('[LocalNotesStorage] Error searching notes:', error);
        return [];
    }
};

export const getNotesByTag = async (tagId: number): Promise<LocalNote[]> => {
    try {
        const notes = await getAllNotes();
        return notes.filter(note => note.tags.some(tag => tag.id === tagId) && !note.isArchived);
    } catch (error) {
        console.error('[LocalNotesStorage] Error getting notes by tag:', error);
        return [];
    }
};

export const getNotesBySource = async (sourceType: LocalNote['sourceType']): Promise<LocalNote[]> => {
    try {
        const notes = await getAllNotes();
        return notes.filter(note => note.sourceType === sourceType && !note.isArchived);
    } catch (error) {
        console.error('[LocalNotesStorage] Error getting notes by source:', error);
        return [];
    }
};

// ==================== Tags CRUD ====================

export const getAllTags = async (): Promise<LocalTag[]> => {
    try {
        const tagsJson = await AsyncStorage.getItem(STORAGE_KEYS.TAGS);
        let tags: LocalTag[] = tagsJson ? JSON.parse(tagsJson) : [];
        
        // Initialize default tags if empty
        if (tags.length === 0) {
            tags = await initializeDefaultTags();
        }
        
        return tags.sort((a, b) => b.usageCount - a.usageCount);
    } catch (error) {
        console.error('[LocalNotesStorage] Error getting tags:', error);
        return [];
    }
};

export const initializeDefaultTags = async (): Promise<LocalTag[]> => {
    try {
        const tags: LocalTag[] = [];
        const timestamp = getTimestamp();

        for (const defaultTag of DEFAULT_UPSC_TAGS) {
            const id = await generateId(STORAGE_KEYS.TAG_COUNTER);
            tags.push({
                id,
                ...defaultTag,
                usageCount: 0,
                createdAt: timestamp,
                updatedAt: timestamp,
            });
        }

        await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
        console.log('[LocalNotesStorage] Initialized default tags');
        return tags;
    } catch (error) {
        console.error('[LocalNotesStorage] Error initializing tags:', error);
        return [];
    }
};

export const createTag = async (name: string, color?: string, category?: LocalTag['category']): Promise<LocalTag> => {
    try {
        const tags = await getAllTags();
        
        // Check if tag already exists
        const existingTag = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
        if (existingTag) {
            return existingTag;
        }

        const id = await generateId(STORAGE_KEYS.TAG_COUNTER);
        const timestamp = getTimestamp();

        const newTag: LocalTag = {
            id,
            name: name.trim(),
            color: color || '#6B7280',
            category: category || 'custom',
            usageCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        tags.push(newTag);
        await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
        
        console.log('[LocalNotesStorage] Created tag:', newTag.name);
        return newTag;
    } catch (error) {
        console.error('[LocalNotesStorage] Error creating tag:', error);
        throw error;
    }
};

export const incrementTagUsage = async (tagId: number): Promise<void> => {
    try {
        const tagsJson = await AsyncStorage.getItem(STORAGE_KEYS.TAGS);
        const tags: LocalTag[] = tagsJson ? JSON.parse(tagsJson) : [];
        
        const index = tags.findIndex(tag => tag.id === tagId);
        if (index !== -1) {
            tags[index].usageCount++;
            tags[index].updatedAt = getTimestamp();
            await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
        }
    } catch (error) {
        console.error('[LocalNotesStorage] Error incrementing tag usage:', error);
    }
};

export const deleteTag = async (tagId: number): Promise<boolean> => {
    try {
        const tags = await getAllTags();
        const filteredTags = tags.filter(tag => tag.id !== tagId);
        
        if (filteredTags.length === tags.length) {
            return false;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(filteredTags));
        
        // Remove tag from all notes
        const notes = await getAllNotes();
        for (const note of notes) {
            const updatedTags = note.tags.filter(tag => tag.id !== tagId);
            if (updatedTags.length !== note.tags.length) {
                await updateNote(note.id, { tags: updatedTags });
            }
        }

        console.log('[LocalNotesStorage] Deleted tag:', tagId);
        return true;
    } catch (error) {
        console.error('[LocalNotesStorage] Error deleting tag:', error);
        return false;
    }
};

// ==================== Scraped Links ====================

export const saveScrapedLink = async (linkData: Omit<ScrapedLink, 'id' | 'scrapedAt'>): Promise<ScrapedLink> => {
    try {
        const linksJson = await AsyncStorage.getItem(STORAGE_KEYS.LINKS);
        const links: ScrapedLink[] = linksJson ? JSON.parse(linksJson) : [];
        
        // Check if link already exists
        const existingLink = links.find(link => link.url === linkData.url);
        if (existingLink) {
            return existingLink;
        }

        const id = Date.now();
        const newLink: ScrapedLink = {
            id,
            ...linkData,
            scrapedAt: getTimestamp(),
        };

        links.push(newLink);
        await AsyncStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
        
        console.log('[LocalNotesStorage] Saved scraped link:', linkData.url);
        return newLink;
    } catch (error) {
        console.error('[LocalNotesStorage] Error saving scraped link:', error);
        throw error;
    }
};

export const getScrapedLinks = async (): Promise<ScrapedLink[]> => {
    try {
        const linksJson = await AsyncStorage.getItem(STORAGE_KEYS.LINKS);
        return linksJson ? JSON.parse(linksJson) : [];
    } catch (error) {
        console.error('[LocalNotesStorage] Error getting scraped links:', error);
        return [];
    }
};

// ==================== Utility ====================

export const clearAllNotesData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.NOTES,
            STORAGE_KEYS.TAGS,
            STORAGE_KEYS.LINKS,
            STORAGE_KEYS.NOTE_COUNTER,
            STORAGE_KEYS.TAG_COUNTER,
        ]);
        console.log('[LocalNotesStorage] Cleared all notes data');
    } catch (error) {
        console.error('[LocalNotesStorage] Error clearing data:', error);
    }
};

export const getNotesStats = async (): Promise<{
    totalNotes: number;
    pinnedNotes: number;
    archivedNotes: number;
    scrapedNotes: number;
    tagCount: number;
}> => {
    try {
        const notes = await getAllNotes();
        const tags = await getAllTags();

        return {
            totalNotes: notes.filter(n => !n.isArchived).length,
            pinnedNotes: notes.filter(n => n.isPinned && !n.isArchived).length,
            archivedNotes: notes.filter(n => n.isArchived).length,
            scrapedNotes: notes.filter(n => n.sourceType === 'scraped').length,
            tagCount: tags.length,
        };
    } catch (error) {
        console.error('[LocalNotesStorage] Error getting stats:', error);
        return { totalNotes: 0, pinnedNotes: 0, archivedNotes: 0, scrapedNotes: 0, tagCount: 0 };
    }
};

export default {
    getAllNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getNotesByTag,
    getNotesBySource,
    getAllTags,
    createTag,
    deleteTag,
    saveScrapedLink,
    getScrapedLinks,
    clearAllNotesData,
    getNotesStats,
};
