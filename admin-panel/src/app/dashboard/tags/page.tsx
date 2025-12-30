'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Hash, TrendingUp, X, Check } from 'lucide-react';

interface Tag {
    id: number;
    name: string;
    color: string;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export default function TagsManager() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366F1');
    const [creating, setCreating] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'usageCount' | 'createdAt'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const colorOptions = [
        '#EF4444', // Red
        '#F97316', // Orange
        '#F59E0B', // Amber
        '#84CC16', // Lime
        '#22C55E', // Green
        '#14B8A6', // Teal
        '#06B6D4', // Cyan
        '#3B82F6', // Blue
        '#6366F1', // Indigo
        '#8B5CF6', // Violet
        '#A855F7', // Purple
        '#EC4899', // Pink
        '#64748B', // Slate
    ];

    useEffect(() => {
        fetchTags();
    }, [sortBy, sortOrder]);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/mobile/tags?sortBy=${sortBy}&order=${sortOrder}`);
            const data = await res.json();
            if (data.success) {
                setTags(data.tags || []);
            } else {
                setError(data.error || 'Failed to fetch tags');
            }
        } catch (err) {
            setError('Failed to fetch tags');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createTag = async () => {
        if (!newTagName.trim()) return;

        try {
            setCreating(true);
            const res = await fetch('/api/mobile/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName, color: newTagColor }),
            });
            const data = await res.json();
            if (data.success) {
                setNewTagName('');
                setNewTagColor('#6366F1');
                fetchTags();
            } else {
                setError(data.error || 'Failed to create tag');
            }
        } catch (err) {
            setError('Failed to create tag');
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const updateTag = async () => {
        if (!editingTag || !editName.trim()) return;

        try {
            const res = await fetch(`/api/mobile/tags/${editingTag.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, color: editColor }),
            });
            const data = await res.json();
            if (data.success) {
                setEditingTag(null);
                fetchTags();
            } else {
                setError(data.error || 'Failed to update tag');
            }
        } catch (err) {
            setError('Failed to update tag');
            console.error(err);
        }
    };

    const deleteTag = async (tagId: number) => {
        if (!confirm('Are you sure you want to delete this tag? This will remove it from all notes.')) {
            return;
        }

        try {
            const res = await fetch(`/api/mobile/tags/${tagId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                fetchTags();
            } else {
                setError(data.error || 'Failed to delete tag');
            }
        } catch (err) {
            setError('Failed to delete tag');
            console.error(err);
        }
    };

    const startEditing = (tag: Tag) => {
        setEditingTag(tag);
        setEditName(tag.name);
        setEditColor(tag.color);
    };

    const cancelEditing = () => {
        setEditingTag(null);
        setEditName('');
        setEditColor('');
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Tags Manager</h1>
                <p className="text-gray-600">Manage tags for organizing notes</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                    <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Create New Tag */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Create New Tag</h2>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                        <div className="relative">
                            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Enter tag name"
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                onKeyDown={(e) => e.key === 'Enter' && createTag()}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex gap-1">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewTagColor(color)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                        newTagColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={createTag}
                        disabled={creating || !newTagName.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                        {creating ? 'Creating...' : 'Create Tag'}
                    </button>
                </div>
            </div>

            {/* Tags List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">All Tags ({tags.length})</h2>
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="usageCount">Sort by Usage</option>
                            <option value="createdAt">Sort by Created</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading tags...</div>
                ) : tags.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No tags yet. Create your first tag above.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {tags.map((tag) => (
                            <div key={tag.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                {editingTag?.id === tag.id ? (
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            {colorOptions.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setEditColor(color)}
                                                    className={`w-5 h-5 rounded-full border-2 ${
                                                        editColor === color ? 'border-gray-900' : 'border-transparent'
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={updateTag}
                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={cancelEditing}
                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            <span className="font-medium text-gray-900">#{tag.name}</span>
                                            <span className="flex items-center gap-1 text-sm text-gray-500">
                                                <TrendingUp size={14} />
                                                {tag.usageCount} notes
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => startEditing(tag)}
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteTag(tag.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

