'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, AlertCircle, ChevronRight, Calendar, ArrowRight } from 'lucide-react';

interface QuestionSet {
    id: number;
    title: string;
    description: string;
    year: number;
    createdAt: string;
}

export default function QuestionSetsPage() {
    const [sets, setSets] = useState<QuestionSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSet, setNewSet] = useState({ title: '', description: '', year: new Date().getFullYear().toString() });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const res = await fetch('/api/question-sets');
            const data = await res.json();
            if (Array.isArray(data)) {
                setSets(data);
            }
        } catch (error) {
            console.error('Failed to fetch sets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/question-sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSet)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setNewSet({ title: '', description: '', year: new Date().getFullYear().toString() });
                fetchSets();
            }
        } catch (error) {
            console.error('Failed to create set:', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Question Banks</h1>
                    <p className="text-slate-500 mt-1">Manage creating question sets and adding questions to them</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Create Question Bank
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            ) : sets.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Question Banks Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first question bank to start adding questions for aspirants.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-blue-600 font-medium hover:text-blue-700"
                    >
                        Create Now &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sets.map((set) => (
                        <Link
                            href={`/dashboard/question-paper/${set.id}`}
                            key={set.id}
                            className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {set.year}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {set.title}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-grow">
                                {set.description || 'No description provided.'}
                            </p>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium">
                                <span className="text-slate-500">Manage Questions</span>
                                <ArrowRight className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Create New Question Bank</h3>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newSet.title}
                                    onChange={(e) => setNewSet({ ...newSet, title: e.target.value })}
                                    placeholder="e.g. UPSC Prelims 2024 - GS Paper I"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Year</label>
                                <input
                                    type="number"
                                    required
                                    value={newSet.year}
                                    onChange={(e) => setNewSet({ ...newSet, year: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={newSet.description}
                                    onChange={(e) => setNewSet({ ...newSet, description: e.target.value })}
                                    rows={3}
                                    placeholder="Optional description..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
                                >
                                    {creating ? 'Creating...' : 'Create Bank'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
