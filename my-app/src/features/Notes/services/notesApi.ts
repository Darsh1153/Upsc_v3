import { getMobileApiEndpoint } from '../../../config/api';
import {
    Note,
    NoteListItem,
    NotesListResponse,
    NoteResponse,
    TagsResponse,
    TagResponse,
    TagSuggestionsResponse,
    SearchResponse,
    CreateNotePayload,
    UpdateNotePayload,
    SearchNotesParams,
    Tag,
} from '../types';

// ==================== NOTES ====================

export const fetchUserNotes = async (
    userId: number,
    page: number = 1,
    limit: number = 20,
    isArchived: boolean = false
): Promise<NotesListResponse> => {
    try {
        const url = getMobileApiEndpoint(
            `/notes?userId=${userId}&page=${page}&limit=${limit}&isArchived=${isArchived}`
        );
        console.log('[NotesAPI] Fetching notes for user:', userId);

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch notes');
        }

        return data;
    } catch (error) {
        console.error('[NotesAPI] Error fetching notes:', error);
        throw error;
    }
};

export const fetchNote = async (noteId: number): Promise<Note> => {
    try {
        const url = getMobileApiEndpoint(`/notes/${noteId}`);
        console.log('[NotesAPI] Fetching note:', noteId);

        const response = await fetch(url);
        const data: NoteResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch note');
        }

        return data.note;
    } catch (error) {
        console.error('[NotesAPI] Error fetching note:', error);
        throw error;
    }
};

export const createNote = async (payload: CreateNotePayload): Promise<Note> => {
    try {
        const url = getMobileApiEndpoint('/notes');
        console.log('[NotesAPI] Creating note:', payload.title);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data: NoteResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to create note');
        }

        return data.note;
    } catch (error) {
        console.error('[NotesAPI] Error creating note:', error);
        throw error;
    }
};

export const updateNote = async (
    noteId: number,
    payload: UpdateNotePayload
): Promise<Note> => {
    try {
        const url = getMobileApiEndpoint(`/notes/${noteId}`);
        console.log('[NotesAPI] Updating note:', noteId);

        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data: NoteResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to update note');
        }

        return data.note;
    } catch (error) {
        console.error('[NotesAPI] Error updating note:', error);
        throw error;
    }
};

export const deleteNote = async (noteId: number): Promise<void> => {
    try {
        const url = getMobileApiEndpoint(`/notes/${noteId}`);
        console.log('[NotesAPI] Deleting note:', noteId);

        const response = await fetch(url, { method: 'DELETE' });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to delete note');
        }
    } catch (error) {
        console.error('[NotesAPI] Error deleting note:', error);
        throw error;
    }
};

export const searchNotes = async (params: SearchNotesParams): Promise<SearchResponse> => {
    try {
        const searchParams = new URLSearchParams();
        searchParams.set('userId', params.userId.toString());

        if (params.query) searchParams.set('query', params.query);
        if (params.tags && params.tags.length > 0) {
            searchParams.set('tags', params.tags.join(','));
        }
        if (params.from) searchParams.set('from', params.from);
        if (params.to) searchParams.set('to', params.to);
        if (params.headingOnly) searchParams.set('headingOnly', 'true');
        if (params.page) searchParams.set('page', params.page.toString());
        if (params.limit) searchParams.set('limit', params.limit.toString());

        const url = getMobileApiEndpoint(`/notes/search?${searchParams.toString()}`);
        console.log('[NotesAPI] Searching notes:', params.query);

        const response = await fetch(url);
        const data: SearchResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to search notes');
        }

        return data;
    } catch (error) {
        console.error('[NotesAPI] Error searching notes:', error);
        throw error;
    }
};

// ==================== TAGS ====================

export const fetchTags = async (
    sortBy: 'name' | 'usageCount' | 'createdAt' = 'name',
    order: 'asc' | 'desc' = 'asc'
): Promise<Tag[]> => {
    try {
        const url = getMobileApiEndpoint(`/tags?sortBy=${sortBy}&order=${order}`);
        console.log('[NotesAPI] Fetching tags');

        const response = await fetch(url);
        const data: TagsResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch tags');
        }

        return data.tags;
    } catch (error) {
        console.error('[NotesAPI] Error fetching tags:', error);
        throw error;
    }
};

export const createTag = async (name: string, color?: string): Promise<Tag> => {
    try {
        const url = getMobileApiEndpoint('/tags');
        console.log('[NotesAPI] Creating tag:', name);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color }),
        });

        const data: TagResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to create tag');
        }

        return data.tag;
    } catch (error) {
        console.error('[NotesAPI] Error creating tag:', error);
        throw error;
    }
};

export const fetchTagSuggestions = async (prefix: string = '', limit: number = 10): Promise<Tag[]> => {
    try {
        const url = getMobileApiEndpoint(`/tags/suggestions?prefix=${encodeURIComponent(prefix)}&limit=${limit}`);
        console.log('[NotesAPI] Fetching tag suggestions:', prefix);

        const response = await fetch(url);
        const data: TagSuggestionsResponse = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch tag suggestions');
        }

        return data.suggestions;
    } catch (error) {
        console.error('[NotesAPI] Error fetching tag suggestions:', error);
        throw error;
    }
};

export const deleteTag = async (tagId: number): Promise<void> => {
    try {
        const url = getMobileApiEndpoint(`/tags/${tagId}`);
        console.log('[NotesAPI] Deleting tag:', tagId);

        const response = await fetch(url, { method: 'DELETE' });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to delete tag');
        }
    } catch (error) {
        console.error('[NotesAPI] Error deleting tag:', error);
        throw error;
    }
};

