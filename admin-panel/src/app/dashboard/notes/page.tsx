'use client';

import React, { useEffect, useState } from 'react';
import { Search, FileText, Calendar, Tag as TagIcon, Trash2, Eye, Pin, Archive, ChevronLeft, ChevronRight } from 'lucide-react';

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface Note {
    id: number;
    userId: number;
    title: string;
    content: any;
    plainText: string;
    isPinned: boolean;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    tags: Tag[];
    snippet?: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function NotesList() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [headingOnly, setHeadingOnly] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    // Available tags
    const [allTags, setAllTags] = useState<Tag[]>([]);

    // Selected note for preview
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    useEffect(() => {
        fetchTags();
    }, []);

    useEffect(() => {
        searchNotes();
    }, [pagination.page, showArchived]);

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/mobile/tags');
            const data = await res.json();
            if (data.success) {
                setAllTags(data.tags || []);
            }
        } catch (err) {
            console.error('Failed to fetch tags:', err);
        }
    };

    const searchNotes = async () => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams();
            // Using a default userId for admin view - in production, this would be handled differently
            params.set('userId', '1'); // Admin should see all notes or have a special endpoint
            params.set('page', pagination.page.toString());
            params.set('limit', pagination.limit.toString());
            
            if (searchQuery.trim()) {
                params.set('query', searchQuery.trim());
            }
            if (selectedTags.length > 0) {
                params.set('tags', selectedTags.join(','));
            }
            if (dateFrom) {
                params.set('from', dateFrom);
            }
            if (dateTo) {
                params.set('to', dateTo);
            }
            if (headingOnly) {
                params.set('headingOnly', 'true');
            }

            const endpoint = searchQuery.trim() || selectedTags.length > 0 || dateFrom || dateTo
                ? `/api/mobile/notes/search?${params.toString()}`
                : `/api/mobile/notes?${params.toString()}&isArchived=${showArchived}`;

            const res = await fetch(endpoint);
            const data = await res.json();

            if (data.success) {
                setNotes(data.notes || data.results || []);
                setPagination({
                    ...pagination,
                    total: data.pagination?.total || 0,
                    totalPages: data.pagination?.totalPages || 0,
                });
            } else {
                setError(data.error || 'Failed to fetch notes');
            }
        } catch (err) {
            setError('Failed to fetch notes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination({ ...pagination, page: 1 });
        searchNotes();
    };

    const deleteNote = async (noteId: number) => {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            const res = await fetch(`/api/mobile/notes/${noteId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                searchNotes();
                if (selectedNote?.id === noteId) {
                    setSelectedNote(null);
                }
            } else {
                setError(data.error || 'Failed to delete note');
            }
        } catch (err) {
            setError('Failed to delete note');
            console.error(err);
        }
    };

    const togglePin = async (note: Note) => {
        try {
            const res = await fetch(`/api/mobile/notes/${note.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !note.isPinned }),
            });
            const data = await res.json();
            if (data.success) {
                searchNotes();
            }
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const toggleArchive = async (note: Note) => {
        try {
            const res = await fetch(`/api/mobile/notes/${note.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: !note.isArchived }),
            });
            const data = await res.json();
            if (data.success) {
                searchNotes();
            }
        } catch (err) {
            console.error('Failed to toggle archive:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getPreviewText = (note: Note) => {
        if (note.snippet) return note.snippet;
        if (note.plainText) return note.plainText.slice(0, 150) + (note.plainText.length > 150 ? '...' : '');
        return 'No content';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Notes Manager</h1>
                <p className="text-gray-600">View and manage all notes in the system</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                    <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
                </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notes by title or content..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={headingOnly}
                                onChange={(e) => setHeadingOnly(e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Search headings only</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showArchived}
                                onChange={(e) => setShowArchived(e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Show archived</span>
                        </label>
                    </div>

                    {/* Tag Filter */}
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <TagIcon size={16} className="text-gray-400 mt-1" />
                            {allTags.map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => {
                                        if (selectedTags.includes(tag.name)) {
                                            setSelectedTags(selectedTags.filter(t => t !== tag.name));
                                        } else {
                                            setSelectedTags([...selectedTags, tag.name]);
                                        }
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        selectedTags.includes(tag.name)
                                            ? 'text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    style={{
                                        backgroundColor: selectedTags.includes(tag.name) ? tag.color : undefined,
                                    }}
                                >
                                    #{tag.name}
                                </button>
                            ))}
                        </div>
                    )}
                </form>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Notes List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">
                            Notes ({pagination.total})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading notes...</div>
                    ) : notes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>No notes found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                        selectedNote?.id === note.id ? 'bg-indigo-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {note.isPinned && (
                                                <Pin size={14} className="text-amber-500 fill-amber-500" />
                                            )}
                                            {note.isArchived && (
                                                <Archive size={14} className="text-gray-400" />
                                            )}
                                            <h3 className="font-medium text-gray-900 line-clamp-1">
                                                {note.title}
                                            </h3>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(note.updatedAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                        {getPreviewText(note)}
                                    </p>
                                    {note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {note.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="px-2 py-0.5 text-xs rounded-full text-white"
                                                    style={{ backgroundColor: tag.color }}
                                                >
                                                    #{tag.name}
                                                </span>
                                            ))}
                                            {note.tags.length > 3 && (
                                                <span className="px-2 py-0.5 text-xs text-gray-500">
                                                    +{note.tags.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    disabled={pagination.page <= 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Note Preview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Preview</h2>
                        {selectedNote && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => togglePin(selectedNote)}
                                    className={`p-1.5 rounded hover:bg-gray-100 ${
                                        selectedNote.isPinned ? 'text-amber-500' : 'text-gray-400'
                                    }`}
                                    title={selectedNote.isPinned ? 'Unpin' : 'Pin'}
                                >
                                    <Pin size={16} className={selectedNote.isPinned ? 'fill-current' : ''} />
                                </button>
                                <button
                                    onClick={() => toggleArchive(selectedNote)}
                                    className={`p-1.5 rounded hover:bg-gray-100 ${
                                        selectedNote.isArchived ? 'text-indigo-500' : 'text-gray-400'
                                    }`}
                                    title={selectedNote.isArchived ? 'Unarchive' : 'Archive'}
                                >
                                    <Archive size={16} />
                                </button>
                                <button
                                    onClick={() => deleteNote(selectedNote.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedNote ? (
                        <div className="p-6 max-h-[600px] overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                {selectedNote.title}
                            </h2>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <span>Created: {formatDate(selectedNote.createdAt)}</span>
                                <span>Updated: {formatDate(selectedNote.updatedAt)}</span>
                            </div>

                            {selectedNote.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {selectedNote.tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className="px-3 py-1 text-sm rounded-full text-white"
                                            style={{ backgroundColor: tag.color }}
                                        >
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="prose prose-sm max-w-none">
                                {selectedNote.plainText || (
                                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                        {JSON.stringify(selectedNote.content, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <Eye size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>Select a note to preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

