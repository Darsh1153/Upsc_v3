import { useState, useRef, useCallback, useEffect } from 'react';
import { throttle } from '../../../utils/throttle';
import { createNote, updateNote } from '../services/notesApi';
import { Note, UpdateNotePayload, CreateNotePayload } from '../types';

interface UseSaveNoteOptions {
    userId: number;
    throttleMs?: number;
    onSaveSuccess?: (note: Note) => void;
    onSaveError?: (error: Error) => void;
}

interface SaveNoteState {
    isSaving: boolean;
    lastSaved: Date | null;
    error: Error | null;
    isDirty: boolean;
}

export function useSaveNote(options: UseSaveNoteOptions) {
    const { userId, throttleMs = 500, onSaveSuccess, onSaveError } = options;

    const [state, setState] = useState<SaveNoteState>({
        isSaving: false,
        lastSaved: null,
        error: null,
        isDirty: false,
    });

    const noteIdRef = useRef<number | null>(null);
    const pendingSaveRef = useRef<{
        title: string;
        plainText: string;
        tagIds: number[];
    } | null>(null);

    // Core save function - now accepts plainText string instead of LexicalRoot
    const doSave = useCallback(async (
        title: string,
        plainText: string,
        tagIds: number[] = []
    ): Promise<Note | null> => {
        if (!title.trim()) {
            console.log('[useSaveNote] Skipping save - empty title');
            return null;
        }

        setState(prev => ({ ...prev, isSaving: true, error: null }));

        try {
            let savedNote: Note;

            if (noteIdRef.current) {
                // Update existing note
                const payload: UpdateNotePayload = {
                    title,
                    plainText,
                    tagIds,
                };
                savedNote = await updateNote(noteIdRef.current, payload);
            } else {
                // Create new note
                const payload: CreateNotePayload = {
                    userId,
                    title,
                    plainText,
                    tagIds,
                };
                savedNote = await createNote(payload);
                noteIdRef.current = savedNote.id;
            }

            setState(prev => ({
                ...prev,
                isSaving: false,
                lastSaved: new Date(),
                isDirty: false,
            }));

            onSaveSuccess?.(savedNote);
            return savedNote;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Save failed');
            setState(prev => ({
                ...prev,
                isSaving: false,
                error: err,
            }));
            onSaveError?.(err);
            return null;
        }
    }, [userId, onSaveSuccess, onSaveError]);

    // Throttled save function
    const throttledSaveRef = useRef(
        throttle(
            (title: string, plainText: string, tagIds: number[]) => {
                doSave(title, plainText, tagIds);
            },
            throttleMs,
            { leading: false, trailing: true }
        )
    );

    // Update throttle when throttleMs changes
    useEffect(() => {
        throttledSaveRef.current = throttle(
            (title: string, plainText: string, tagIds: number[]) => {
                doSave(title, plainText, tagIds);
            },
            throttleMs,
            { leading: false, trailing: true }
        );
    }, [throttleMs, doSave]);

    // Autosave function (throttled)
    const save = useCallback((
        title: string,
        plainText: string,
        tagIds: number[] = []
    ) => {
        pendingSaveRef.current = { title, plainText, tagIds };
        setState(prev => ({ ...prev, isDirty: true }));
        throttledSaveRef.current(title, plainText, tagIds);
    }, []);

    // Immediate save (not throttled)
    const saveNow = useCallback(async (
        title: string,
        plainText: string,
        tagIds: number[] = []
    ): Promise<Note | null> => {
        pendingSaveRef.current = null;
        return doSave(title, plainText, tagIds);
    }, [doSave]);

    // Set note ID for existing notes
    const setNoteId = useCallback((id: number | null) => {
        noteIdRef.current = id;
    }, []);

    // Clear state (for new notes)
    const reset = useCallback(() => {
        noteIdRef.current = null;
        pendingSaveRef.current = null;
        setState({
            isSaving: false,
            lastSaved: null,
            error: null,
            isDirty: false,
        });
    }, []);

    // Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (pendingSaveRef.current && state.isDirty) {
                const { title, plainText, tagIds } = pendingSaveRef.current;
                doSave(title, plainText, tagIds);
            }
        };
    }, [doSave, state.isDirty]);

    return {
        save,
        saveNow,
        setNoteId,
        reset,
        noteId: noteIdRef.current,
        ...state,
    };
}

export default useSaveNote;

