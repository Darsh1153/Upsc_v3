import { useState, useCallback, useEffect } from 'react';
import { fetchNote } from '../services/notesApi';
import { Note, EMPTY_LEXICAL_STATE, LexicalRoot } from '../types';

interface UseLoadNoteOptions {
    noteId?: number | null;
    autoLoad?: boolean;
    onLoadSuccess?: (note: Note) => void;
    onLoadError?: (error: Error) => void;
}

interface LoadNoteState {
    note: Note | null;
    isLoading: boolean;
    error: Error | null;
}

export function useLoadNote(options: UseLoadNoteOptions = {}) {
    const { noteId, autoLoad = true, onLoadSuccess, onLoadError } = options;

    const [state, setState] = useState<LoadNoteState>({
        note: null,
        isLoading: false,
        error: null,
    });

    const load = useCallback(async (id?: number): Promise<Note | null> => {
        const targetId = id ?? noteId;
        
        if (!targetId) {
            console.log('[useLoadNote] No note ID to load');
            return null;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const note = await fetchNote(targetId);

            setState({
                note,
                isLoading: false,
                error: null,
            });

            onLoadSuccess?.(note);
            return note;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to load note');
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err,
            }));
            onLoadError?.(err);
            return null;
        }
    }, [noteId, onLoadSuccess, onLoadError]);

    const reset = useCallback(() => {
        setState({
            note: null,
            isLoading: false,
            error: null,
        });
    }, []);

    // Auto-load when noteId changes
    useEffect(() => {
        if (autoLoad && noteId) {
            load(noteId);
        } else if (!noteId) {
            reset();
        }
    }, [noteId, autoLoad, load, reset]);

    // Derive editor state
    const title = state.note?.title ?? '';
    const content = state.note?.content ?? EMPTY_LEXICAL_STATE;
    const tags = state.note?.tags ?? [];

    return {
        ...state,
        load,
        reset,
        title,
        content: content as LexicalRoot,
        tags,
    };
}

export default useLoadNote;

