'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2, Edit2, Plus, ArrowLeft, BookOpen, Clock, ChevronDown, ChevronUp, X, GripVertical } from 'lucide-react';

interface Subtopic {
    id?: number;
    subtopicId: string;
    name: string;
    estimatedHours: number;
}

interface Source {
    id?: number;
    type: string;
    name: string;
    link?: string;
}

interface Topic {
    id: number;
    topicId: string;
    name: string;
    paper: string;
    icon?: string;
    estimatedHours: number;
    difficulty: string;
    priority: string;
    isRecurring?: boolean;
    optional?: string;
    subtopics?: Subtopic[];
    sources?: Source[];
}

type ViewMode = 'list' | 'create' | 'edit';

const PAPERS = ['GS1', 'GS2', 'GS3', 'GS4', 'Current Affairs', 'Essay', 'Optional'];
const DIFFICULTIES = ['Basic', 'Moderate', 'Advanced'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const SOURCE_TYPES = ['NCERT', 'Book', 'Website', 'YouTube', 'PDF', 'Notes', 'Custom'];

export default function RoadmapPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedPaper, setSelectedPaper] = useState('all');
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
    const [saveLoading, setSaveLoading] = useState(false);

    const [formData, setFormData] = useState({
        topicId: '',
        name: '',
        paper: 'GS1',
        icon: '',
        estimatedHours: 0,
        difficulty: 'Moderate',
        priority: 'High',
        isRecurring: false,
        optional: '',
        subtopics: [] as Subtopic[],
        sources: [] as Source[],
    });

    useEffect(() => {
        if (viewMode === 'list') {
            fetchTopics();
        }
    }, [viewMode, selectedPaper]);

    const fetchTopics = async () => {
        setLoading(true);
        const token = localStorage.getItem('sb-access-token');
        try {
            const params = new URLSearchParams({ paper: selectedPaper });
            const res = await fetch(`/api/roadmap?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTopics(data.topics);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.topicId || !formData.name) {
            alert('Topic ID and Name are required');
            return;
        }
        setSaveLoading(true);
        const token = localStorage.getItem('sb-access-token');

        try {
            const url = editingTopic ? `/api/roadmap/${editingTopic.id}` : '/api/roadmap';
            const method = editingTopic ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                resetForm();
                setViewMode('list');
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.error || 'Failed to save topic'}`);
                console.error('Save failed:', errorData);
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save topic. Check console for details.');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete topic "${name}"? This will also delete all subtopics and sources.`)) return;
        const token = localStorage.getItem('sb-access-token');

        try {
            await fetch(`/api/roadmap/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTopics();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const openEdit = async (topic: Topic) => {
        const token = localStorage.getItem('sb-access-token');
        try {
            const res = await fetch(`/api/roadmap/${topic.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const t = data.topic;
                setEditingTopic(t);
                setFormData({
                    topicId: t.topicId,
                    name: t.name,
                    paper: t.paper,
                    icon: t.icon || '',
                    estimatedHours: t.estimatedHours,
                    difficulty: t.difficulty,
                    priority: t.priority,
                    isRecurring: t.isRecurring || false,
                    optional: t.optional || '',
                    subtopics: t.subtopics || [],
                    sources: t.sources || [],
                });
                setViewMode('edit');
            }
        } catch (error) {
            console.error('Fetch topic error:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            topicId: '',
            name: '',
            paper: 'GS1',
            icon: '',
            estimatedHours: 0,
            difficulty: 'Moderate',
            priority: 'High',
            isRecurring: false,
            optional: '',
            subtopics: [],
            sources: [],
        });
        setEditingTopic(null);
    };

    const toggleExpanded = (id: number) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedTopics(newExpanded);
    };

    const addSubtopic = () => {
        setFormData({
            ...formData,
            subtopics: [...formData.subtopics, { subtopicId: `sub_${Date.now()}`, name: '', estimatedHours: 1 }],
        });
    };

    const updateSubtopic = (index: number, field: string, value: any) => {
        const newSubtopics = [...formData.subtopics];
        newSubtopics[index] = { ...newSubtopics[index], [field]: value };
        setFormData({ ...formData, subtopics: newSubtopics });
    };

    const removeSubtopic = (index: number) => {
        setFormData({
            ...formData,
            subtopics: formData.subtopics.filter((_, i) => i !== index),
        });
    };

    const addSource = () => {
        setFormData({
            ...formData,
            sources: [...formData.sources, { type: 'Book', name: '', link: '' }],
        });
    };

    const updateSource = (index: number, field: string, value: any) => {
        const newSources = [...formData.sources];
        newSources[index] = { ...newSources[index], [field]: value };
        setFormData({ ...formData, sources: newSources });
    };

    const removeSource = (index: number) => {
        setFormData({
            ...formData,
            sources: formData.sources.filter((_, i) => i !== index),
        });
    };

    const groupedTopics = topics.reduce((acc, topic) => {
        if (!acc[topic.paper]) acc[topic.paper] = [];
        acc[topic.paper].push(topic);
        return acc;
    }, {} as Record<string, Topic[]>);

    // Create/Edit View
    if (viewMode === 'create' || viewMode === 'edit') {
        return (
            <div className="max-w-4xl mx-auto">
                <button onClick={() => { resetForm(); setViewMode('list'); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Roadmap
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    {editingTopic ? 'Edit Topic' : 'New Topic'}
                </h1>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic ID *</label>
                                <input
                                    type="text"
                                    value={formData.topicId}
                                    onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                                    placeholder="e.g., gs1_ancient_history"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={!!editingTopic}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="🏛️"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ancient Indian History"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paper *</label>
                                <select
                                    value={formData.paper}
                                    onChange={(e) => setFormData({ ...formData, paper: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {PAPERS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours *</label>
                                <input
                                    type="number"
                                    value={formData.estimatedHours}
                                    onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Optional Subject</label>
                                <input
                                    type="text"
                                    value={formData.optional}
                                    onChange={(e) => setFormData({ ...formData, optional: e.target.value })}
                                    placeholder="e.g., Political Science"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecurring}
                                        onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">Recurring (e.g., Current Affairs)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Subtopics */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Subtopics</h2>
                            <button
                                onClick={addSubtopic}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                            >
                                <Plus className="w-4 h-4" /> Add Subtopic
                            </button>
                        </div>
                        {formData.subtopics.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">No subtopics added yet</p>
                        ) : (
                            <div className="space-y-3">
                                {formData.subtopics.map((st, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={st.name}
                                            onChange={(e) => updateSubtopic(index, 'name', e.target.value)}
                                            placeholder="Subtopic name"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={st.estimatedHours}
                                            onChange={(e) => updateSubtopic(index, 'estimatedHours', parseInt(e.target.value) || 0)}
                                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="Hours"
                                        />
                                        <button onClick={() => removeSubtopic(index)} className="text-red-500 hover:text-red-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sources */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Study Sources</h2>
                            <button
                                onClick={addSource}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                            >
                                <Plus className="w-4 h-4" /> Add Source
                            </button>
                        </div>
                        {formData.sources.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">No sources added yet</p>
                        ) : (
                            <div className="space-y-3">
                                {formData.sources.map((src, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <select
                                            value={src.type}
                                            onChange={(e) => updateSource(index, 'type', e.target.value)}
                                            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            value={src.name}
                                            onChange={(e) => updateSource(index, 'name', e.target.value)}
                                            placeholder="Source name"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <input
                                            type="url"
                                            value={src.link || ''}
                                            onChange={(e) => updateSource(index, 'link', e.target.value)}
                                            placeholder="Link (optional)"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <button onClick={() => removeSource(index)} className="text-red-500 hover:text-red-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => { resetForm(); setViewMode('list'); }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saveLoading || !formData.topicId || !formData.name}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
                        >
                            {saveLoading ? 'Saving...' : editingTopic ? 'Update Topic' : 'Create Topic'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Study Roadmap</h1>
                    <p className="text-gray-600 mt-2">Manage UPSC study topics, subtopics, and sources</p>
                </div>
                <button
                    onClick={() => { resetForm(); setViewMode('create'); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
                >
                    <Plus className="w-5 h-5" /> Add Topic
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Filter by Paper:</span>
                    <select
                        value={selectedPaper}
                        onChange={(e) => setSelectedPaper(e.target.value)}
                        className="border border-gray-300 rounded-lg py-2 px-3"
                    >
                        <option value="all">All Papers</option>
                        {PAPERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {/* Topics List */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
            ) : topics.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No topics found</p>
                    <p className="text-xl font-semibold text-gray-800 mt-2">Coming Soon</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedTopics).map(([paper, paperTopics]) => (
                        <div key={paper} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-3 border-b">
                                <h2 className="font-semibold text-gray-900">{paper}</h2>
                            </div>
                            <div className="divide-y">
                                {paperTopics.map((topic) => (
                                    <div key={topic.id}>
                                        <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                            <div className="flex items-center gap-4 flex-1">
                                                <button onClick={() => toggleExpanded(topic.id)} className="text-gray-400 hover:text-gray-600">
                                                    {expandedTopics.has(topic.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>
                                                <span className="text-2xl">{topic.icon || '📚'}</span>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{topic.name}</h3>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {topic.estimatedHours}h
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${topic.difficulty === 'Advanced' ? 'bg-red-100 text-red-700' :
                                                                topic.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                            }`}>
                                                            {topic.difficulty}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${topic.priority === 'High' ? 'bg-purple-100 text-purple-700' :
                                                                topic.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {topic.priority}
                                                        </span>
                                                        {topic.subtopics && (
                                                            <span className="text-gray-400">{topic.subtopics.length} subtopics</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(topic)} className="text-blue-600 hover:text-blue-900 p-2">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(topic.id, topic.name)} className="text-red-600 hover:text-red-900 p-2">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {expandedTopics.has(topic.id) && (
                                            <div className="px-6 py-4 bg-gray-50 border-t">
                                                <div className="ml-12 space-y-4">
                                                    {topic.subtopics && topic.subtopics.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Subtopics</h4>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {topic.subtopics.map((st, i) => (
                                                                    <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm">
                                                                        <span>{st.name}</span>
                                                                        <span className="text-gray-400">{st.estimatedHours}h</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {topic.sources && topic.sources.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Sources</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {topic.sources.map((src, i) => (
                                                                    <span key={i} className="px-3 py-1 bg-white rounded-lg text-sm">
                                                                        <span className="text-gray-500">{src.type}:</span> {src.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

