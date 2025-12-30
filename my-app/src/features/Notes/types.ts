// Lexical Node Types
export interface LexicalNode {
    type: string;
    version?: number;
    children?: LexicalNode[];
    text?: string;
    format?: number;
    style?: string;
    direction?: string | null;
    indent?: number;
    tag?: string;
    mode?: string;
    detail?: number;
}

export interface LexicalRoot {
    root: {
        children: LexicalNode[];
        direction: string | null;
        format: string;
        indent: number;
        type: 'root';
        version: number;
    };
}

// Tag Types
export interface Tag {
    id: number;
    name: string;
    color: string;
    usageCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

// Note Types
export interface Note {
    id: number;
    userId: number;
    title: string;
    content: LexicalRoot | null;
    plainText: string | null;
    isPinned: boolean;
    isArchived: boolean;
    tags: Tag[];
    createdAt: string;
    updatedAt: string;
}

export interface NoteListItem {
    id: number;
    userId: number;
    title: string;
    plainText: string | null;
    isPinned: boolean;
    isArchived: boolean;
    tags: Tag[];
    createdAt: string;
    updatedAt: string;
}

export interface NoteSearchResult extends NoteListItem {
    snippet?: string;
    rank?: number;
}

// API Response Types
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface NotesListResponse {
    success: boolean;
    notes: NoteListItem[];
    pagination: Pagination;
    error?: string;
}

export interface NoteResponse {
    success: boolean;
    note: Note;
    error?: string;
}

export interface TagsResponse {
    success: boolean;
    tags: Tag[];
    error?: string;
}

export interface TagResponse {
    success: boolean;
    tag: Tag;
    isExisting?: boolean;
    error?: string;
}

export interface TagSuggestionsResponse {
    success: boolean;
    suggestions: Tag[];
    error?: string;
}

export interface SearchResponse {
    success: boolean;
    results: NoteSearchResult[];
    pagination: Pagination;
    query: string;
    error?: string;
}

// Create/Update Types
export interface CreateNotePayload {
    userId: number;
    title: string;
    content?: LexicalRoot | null;
    plainText?: string;
    tagIds?: number[];
}

export interface UpdateNotePayload {
    title?: string;
    content?: LexicalRoot | null;
    plainText?: string;
    tagIds?: number[];
    isPinned?: boolean;
    isArchived?: boolean;
}

export interface SearchNotesParams {
    userId: number;
    query?: string;
    tags?: string[];
    from?: string;
    to?: string;
    headingOnly?: boolean;
    page?: number;
    limit?: number;
}

// Editor State Types
export interface EditorState {
    noteId: number | null;
    title: string;
    content: LexicalRoot | null;
    tags: Tag[];
    isDirty: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
}

// Default empty Lexical state
export const EMPTY_LEXICAL_STATE: LexicalRoot = {
    root: {
        children: [
            {
                type: 'paragraph',
                version: 1,
                children: [],
                direction: null,
                format: '',
                indent: 0,
            },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
    },
};

