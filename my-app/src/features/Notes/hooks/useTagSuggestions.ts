import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from '../../../utils/throttle';
import { getAllTags, createTag } from '../services/localNotesStorage';
import { LocalTag } from '../services/localNotesStorage';

interface UseTagSuggestionsOptions {
    debounceMs?: number;
    limit?: number;
    onError?: (error: Error) => void;
}

export function useTagSuggestions(options: UseTagSuggestionsOptions = {}) {
    const { debounceMs = 300, limit = 10, onError } = options;

    const [suggestions, setSuggestions] = useState<LocalTag[]>([]);
    const [allTags, setAllTags] = useState<LocalTag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Fetch all tags (for initial load)
    const loadAllTags = useCallback(async () => {
        try {
            setIsLoading(true);
            const tags = await getAllTags();
            setAllTags(tags);
            setSuggestions(tags.slice(0, limit));
            setError(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to load tags');
            setError(error);
            onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [limit, onError]);

    // Search suggestions by prefix - Local implementation
    const searchSuggestions = useCallback(async (prefix: string) => {
        try {
            setIsLoading(true);
            // Local search from allTags
            // Since allTags might not be fresh if this is called directly, we could fetch again or use state
            // For better consistency, let's fetch fresh
            const tags = await getAllTags();
            const lowerPrefix = prefix.toLowerCase();
            const filtered = tags.filter(tag =>
                tag.name.toLowerCase().includes(lowerPrefix)
            );
            setSuggestions(filtered.slice(0, limit));
            setError(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to search tags');
            setError(error);
            onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [limit, onError]);

    // Debounced search
    const debouncedSearchRef = useRef(
        debounce((prefix: string) => {
            if (prefix.length > 0) {
                searchSuggestions(prefix);
            } else {
                setSuggestions(allTags.slice(0, limit));
            }
        }, debounceMs)
    );

    // Update debounce when debounceMs changes
    useEffect(() => {
        debouncedSearchRef.current = debounce((prefix: string) => {
            if (prefix.length > 0) {
                searchSuggestions(prefix);
            } else {
                setSuggestions(allTags.slice(0, limit));
            }
        }, debounceMs);
    }, [debounceMs, searchSuggestions, allTags, limit]);

    // Search function (debounced)
    const search = useCallback((prefix: string) => {
        debouncedSearchRef.current(prefix);
    }, []);

    // Immediate search (not debounced)
    const searchNow = useCallback(async (prefix: string) => {
        if (prefix.length > 0) {
            await searchSuggestions(prefix);
        } else {
            setSuggestions(allTags.slice(0, limit));
        }
    }, [searchSuggestions, allTags, limit]);

    // Create a new tag
    const createNewTag = useCallback(async (name: string, color?: string): Promise<LocalTag | null> => {
        try {
            setIsLoading(true);
            const tag = await createTag(name, color);
            setAllTags(prev => [tag, ...prev]);
            setError(null);
            return tag;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create tag');
            setError(error);
            onError?.(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [onError]);

    // Load all tags on mount
    useEffect(() => {
        loadAllTags();
    }, [loadAllTags]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSuggestions(allTags.slice(0, limit));
    }, [allTags, limit]);

    return {
        suggestions,
        allTags,
        isLoading,
        error,
        search,
        searchNow,
        clearSearch,
        loadAllTags,
        createNewTag,
    };
}

export default useTagSuggestions;

