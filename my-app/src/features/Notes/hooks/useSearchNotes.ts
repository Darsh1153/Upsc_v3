import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from '../../../utils/throttle';
import { searchNotes } from '../services/notesApi';
import { NoteSearchResult, SearchNotesParams, Pagination } from '../types';

interface UseSearchNotesOptions {
    userId: number;
    debounceMs?: number;
    limit?: number;
    onError?: (error: Error) => void;
}

interface SearchState {
    results: NoteSearchResult[];
    pagination: Pagination;
    isSearching: boolean;
    error: Error | null;
    query: string;
}

const initialPagination: Pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
};

export function useSearchNotes(options: UseSearchNotesOptions) {
    const { userId, debounceMs = 300, limit = 20, onError } = options;

    const [state, setState] = useState<SearchState>({
        results: [],
        pagination: initialPagination,
        isSearching: false,
        error: null,
        query: '',
    });

    const [filters, setFilters] = useState<{
        tags: string[];
        from: string;
        to: string;
        headingOnly: boolean;
    }>({
        tags: [],
        from: '',
        to: '',
        headingOnly: false,
    });

    // Core search function
    const doSearch = useCallback(async (
        query: string,
        page: number = 1,
        additionalFilters?: Partial<typeof filters>
    ) => {
        const currentFilters = { ...filters, ...additionalFilters };

        setState(prev => ({ ...prev, isSearching: true, error: null }));

        try {
            const params: SearchNotesParams = {
                userId,
                query: query || undefined,
                page,
                limit,
                ...currentFilters,
            };

            const response = await searchNotes(params);

            setState(prev => ({
                ...prev,
                results: response.results,
                pagination: response.pagination,
                isSearching: false,
                query,
            }));
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Search failed');
            setState(prev => ({
                ...prev,
                isSearching: false,
                error,
            }));
            onError?.(error);
        }
    }, [userId, limit, filters, onError]);

    // Debounced search
    const debouncedSearchRef = useRef(
        debounce((query: string) => {
            doSearch(query, 1);
        }, debounceMs)
    );

    // Update debounce when debounceMs changes
    useEffect(() => {
        debouncedSearchRef.current = debounce((query: string) => {
            doSearch(query, 1);
        }, debounceMs);
    }, [debounceMs, doSearch]);

    // Search function (debounced)
    const search = useCallback((query: string) => {
        setState(prev => ({ ...prev, query }));
        debouncedSearchRef.current(query);
    }, []);

    // Immediate search (not debounced)
    const searchNow = useCallback((query: string) => {
        setState(prev => ({ ...prev, query }));
        return doSearch(query, 1);
    }, [doSearch]);

    // Load next page
    const loadMore = useCallback(() => {
        const { pagination, query } = state;
        if (pagination.page < pagination.totalPages && !state.isSearching) {
            return doSearch(query, pagination.page + 1);
        }
    }, [state, doSearch]);

    // Load previous page
    const loadPrevious = useCallback(() => {
        const { pagination, query } = state;
        if (pagination.page > 1 && !state.isSearching) {
            return doSearch(query, pagination.page - 1);
        }
    }, [state, doSearch]);

    // Go to specific page
    const goToPage = useCallback((page: number) => {
        const { pagination, query } = state;
        if (page >= 1 && page <= pagination.totalPages && !state.isSearching) {
            return doSearch(query, page);
        }
    }, [state, doSearch]);

    // Update filters
    const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        // Trigger new search with updated filters
        doSearch(state.query, 1, newFilters);
    }, [state.query, doSearch]);

    // Clear search
    const clearSearch = useCallback(() => {
        setState({
            results: [],
            pagination: initialPagination,
            isSearching: false,
            error: null,
            query: '',
        });
        setFilters({
            tags: [],
            from: '',
            to: '',
            headingOnly: false,
        });
    }, []);

    // Refresh current search
    const refresh = useCallback(() => {
        return doSearch(state.query, state.pagination.page);
    }, [state.query, state.pagination.page, doSearch]);

    return {
        ...state,
        filters,
        search,
        searchNow,
        loadMore,
        loadPrevious,
        goToPage,
        updateFilters,
        clearSearch,
        refresh,
        hasMore: state.pagination.page < state.pagination.totalPages,
    };
}

export default useSearchNotes;

