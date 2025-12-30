'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2, Edit2, Globe, Eye, EyeOff, FileText, Link2, Filter, PenLine, Plus, ArrowLeft, ExternalLink, Calendar, User, Tag, BookOpen, Brain } from 'lucide-react';

interface ContentBlock {
    type: string;
    content?: string;
    level?: number;
    items?: string[];
}

interface Article {
    id: number;
    title: string;
    author?: string;
    sourceUrl?: string;
    summary?: string;
    gsPaper?: string;
    subject?: string;
    tags?: string[];
    isPublished: boolean;
    createdAt: string;
}

interface FullArticle extends Article {
    content?: ContentBlock[];
    metaDescription?: string;
    publishedDate?: string;
}

type ViewMode = 'list' | 'scrape' | 'create' | 'edit' | 'preview';

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [search, setSearch] = useState('');
    const [gsPaperFilter, setGsPaperFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [previewArticle, setPreviewArticle] = useState<FullArticle | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [generatingMCQs, setGeneratingMCQs] = useState(false);

    // Form state
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [scrapeLoading, setScrapeLoading] = useState(false);
    const [scrapeError, setScrapeError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        summary: '',
        sourceUrl: '',
        gsPaper: '',
        subject: '',
        tags: '',
        publishedDate: new Date().toISOString().split('T')[0], // Default to today
        isPublished: true, // Default to published so articles appear in mobile app
        content: [] as any[],
    });
    const [saveLoading, setSaveLoading] = useState(false);

    const sources = ['The Economic Times', 'The Hindu', 'Press Information Bureau'];
    const subjects = ['Polity', 'Economy', 'Geography', 'History', 'Science & Technology', 'Environment', 'Current Affairs', 'Other'];

    useEffect(() => {
        if (viewMode === 'list') {
            fetchArticles();
        }
    }, [page, search, gsPaperFilter, subjectFilter, statusFilter, viewMode]);

    const fetchArticles = async () => {
        setLoading(true);
        const token = localStorage.getItem('sb-access-token');
        console.log('Fetching articles with token:', token ? 'Token present' : 'No token');
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
                gsPaper: gsPaperFilter,
                subject: subjectFilter,
                status: statusFilter,
            });
            const res = await fetch(`/api/articles?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScrape = async () => {
        if (!scrapeUrl) return;
        setScrapeLoading(true);
        setScrapeError('');
        const token = localStorage.getItem('sb-access-token');
        console.log('Scraping article with token:', token ? 'Token present' : 'No token');

        try {
            const res = await fetch('/api/articles/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ url: scrapeUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                setScrapeError(data.error || 'Failed to scrape');
                return;
            }

            setFormData({
                title: data.article.title || '',
                author: data.article.author || '',
                summary: data.article.summary || '',
                sourceUrl: data.article.sourceUrl || '',
                gsPaper: '',
                subject: '',
                tags: '',
                publishedDate: new Date().toISOString().split('T')[0],
                isPublished: true, // Default to published so articles appear in mobile app
                content: data.article.content || [],
            });
            setViewMode('create');
        } catch (error) {
            setScrapeError('Failed to scrape article');
        } finally {
            setScrapeLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) return;
        setSaveLoading(true);
        const token = localStorage.getItem('sb-access-token');
        console.log('Saving article with token:', token ? 'Token present' : 'No token');

        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            };

            const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles';
            const method = editingArticle ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                resetForm();
                setViewMode('list');
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;
        const token = localStorage.getItem('sb-access-token');

        try {
            await fetch(`/api/articles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchArticles();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleTogglePublish = async (id: number) => {
        const token = localStorage.getItem('sb-access-token');
        try {
            const res = await fetch(`/api/articles/${id}/toggle-publish`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                // Update preview article if we're viewing it
                if (previewArticle && previewArticle.id === id) {
                    setPreviewArticle(data.article);
                }
            }
            fetchArticles();
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const openEdit = async (article: Article) => {
        const token = localStorage.getItem('sb-access-token');
        try {
            const res = await fetch(`/api/articles/${article.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const fullArticle = data.article;
                setEditingArticle(fullArticle);
                setFormData({
                    title: fullArticle.title,
                    author: fullArticle.author || '',
                    summary: fullArticle.summary || '',
                    sourceUrl: fullArticle.sourceUrl || '',
                    gsPaper: fullArticle.gsPaper || '',
                    subject: fullArticle.subject || '',
                    tags: fullArticle.tags?.join(', ') || '',
                    publishedDate: fullArticle.publishedDate ? new Date(fullArticle.publishedDate).toISOString().split('T')[0] : '',
                    isPublished: fullArticle.isPublished,
                    content: fullArticle.content || [],
                });
                setViewMode('edit');
            }
        } catch (error) {
            console.error('Fetch article error:', error);
        }
    };

    const openPreview = async (articleId: number) => {
        setPreviewLoading(true);
        setViewMode('preview');
        const token = localStorage.getItem('sb-access-token');
        try {
            const res = await fetch(`/api/articles/${articleId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPreviewArticle(data.article);
            }
        } catch (error) {
            console.error('Fetch article error:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleGenerateMCQs = async (articleId: number) => {
        if (!confirm('Generate 10 MCQs for this article using AI?')) return;

        setGeneratingMCQs(true);
        const token = localStorage.getItem('sb-access-token');
        try {
            const res = await fetch(`/api/articles/${articleId}/mcqs/generate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                alert('MCQs generated successfully!');
                // We could refresh or redirect here
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to generate MCQs'}`);
            }
        } catch (error) {
            console.error('Generate MCQs error:', error);
            alert('An error occurred while generating MCQs');
        } finally {
            setGeneratingMCQs(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const renderContentBlock = (block: ContentBlock, index: number) => {
        switch (block.type) {
            case 'heading':
                const HeadingTag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
                const headingClass = block.level === 1
                    ? 'text-2xl font-bold mt-8 mb-4'
                    : block.level === 2
                        ? 'text-xl font-semibold mt-6 mb-3'
                        : 'text-lg font-semibold mt-4 mb-2';
                return (
                    <HeadingTag key={index} className={`${headingClass} text-gray-900`}>
                        {block.content}
                    </HeadingTag>
                );
            case 'paragraph':
                return (
                    <p key={index} className="text-gray-700 leading-relaxed mb-4">
                        {block.content}
                    </p>
                );
            case 'quote':
                return (
                    <blockquote key={index} className="border-l-4 border-blue-500 pl-4 my-6 italic text-gray-600">
                        {block.content}
                    </blockquote>
                );
            case 'unordered-list':
            case 'ordered-list':
                const ListTag = block.type === 'ordered-list' ? 'ol' : 'ul';
                return (
                    <ListTag key={index} className={`mb-4 pl-6 ${block.type === 'ordered-list' ? 'list-decimal' : 'list-disc'}`}>
                        {(block.items || []).map((item, i) => (
                            <li key={i} className="text-gray-700 mb-2 leading-relaxed">
                                {item}
                            </li>
                        ))}
                    </ListTag>
                );
            default:
                if (block.content) {
                    return (
                        <p key={index} className="text-gray-700 leading-relaxed mb-4">
                            {block.content}
                        </p>
                    );
                }
                return null;
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            author: '',
            summary: '',
            sourceUrl: '',
            gsPaper: '',
            subject: '',
            tags: '',
            publishedDate: new Date().toISOString().split('T')[0],
            isPublished: true, // Default to published so articles appear in mobile app
            content: [],
        });
        setEditingArticle(null);
        setScrapeUrl('');
        setScrapeError('');
    };

    // Scrape View
    if (viewMode === 'scrape') {
        return (
            <div className="max-w-2xl mx-auto">
                <button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Articles
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Scrape Article</h1>
                <p className="text-gray-600 mb-8">Paste an article URL to extract content</p>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Globe className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Web Scraper</h2>
                            <p className="text-sm text-gray-500">Extract article content from any URL</p>
                        </div>
                    </div>

                    {scrapeError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {scrapeError}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Article URL</label>
                        <input
                            type="url"
                            value={scrapeUrl}
                            onChange={(e) => setScrapeUrl(e.target.value)}
                            placeholder="https://example.com/article"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setViewMode('list')}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleScrape}
                            disabled={scrapeLoading || !scrapeUrl}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {scrapeLoading ? 'Scraping...' : <><Globe className="w-4 h-4" /> Scrape</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Create/Edit View
    if (viewMode === 'create' || viewMode === 'edit') {
        return (
            <div className="max-w-3xl mx-auto">
                <button onClick={() => { resetForm(); setViewMode('list'); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Articles
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    {editingArticle ? 'Edit Article' : 'New Article'}
                </h1>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                                <input
                                    type="url"
                                    value={formData.sourceUrl}
                                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4">Categorization</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                <select
                                    value={formData.gsPaper}
                                    onChange={(e) => setFormData({ ...formData, gsPaper: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select</option>
                                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="Separate with commas"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
                                <input
                                    type="date"
                                    value={formData.publishedDate}
                                    onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4">Summary</h2>
                        <textarea
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief summary of the article..."
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isPublished}
                                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600"
                            />
                            <div>
                                <span className="font-medium">Publish immediately</span>
                                <p className="text-sm text-gray-500">Article will be visible in the mobile app</p>
                            </div>
                        </label>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { resetForm(); setViewMode('list'); }}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveLoading || !formData.title}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
                            >
                                {saveLoading ? 'Saving...' : editingArticle ? 'Update' : 'Save Article'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Preview View - Shows article exactly as it appears in the mobile app
    if (viewMode === 'preview') {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => { setPreviewArticle(null); setViewMode('list'); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4" /> Back to Articles
                    </button>
                    {previewArticle && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => openEdit(previewArticle)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button
                                onClick={() => handleTogglePublish(previewArticle.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${previewArticle.isPublished
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                {previewArticle.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {previewArticle.isPublished ? 'Unpublish' : 'Publish'}
                            </button>

                            {/* 
                            <button
                                onClick={() => handleGenerateMCQs(previewArticle.id)}
                                disabled={generatingMCQs}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                <Brain className="w-4 h-4" />
                                {generatingMCQs ? 'Generating...' : 'Generate MCQs'}
                            </button>
                            */}
                        </div>
                    )}
                </div>

                {previewLoading ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading article...</p>
                    </div>
                ) : previewArticle ? (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {/* Mobile App Preview Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                                <BookOpen className="w-4 h-4" />
                                <span>Mobile App Preview</span>
                                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${previewArticle.isPublished ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                                    }`}>
                                    {previewArticle.isPublished ? 'Published' : 'Draft'}
                                </span>
                            </div>
                        </div>

                        {/* Article Content - Styled like mobile app */}
                        <div className="p-8">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {previewArticle.gsPaper && (
                                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg">
                                        {previewArticle.gsPaper}
                                    </span>
                                )}
                                {previewArticle.subject && (
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                                        {previewArticle.subject}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-6">
                                {previewArticle.title}
                            </h1>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-500">
                                {previewArticle.author && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span>{previewArticle.author}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(previewArticle.publishedDate || previewArticle.createdAt)}</span>
                                </div>
                                {previewArticle.sourceUrl && (
                                    <a
                                        href={previewArticle.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Source</span>
                                    </a>
                                )}
                            </div>

                            {/* Tags */}
                            {previewArticle.tags && previewArticle.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {previewArticle.tags.map((tag, index) => (
                                        <span key={index} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Summary / Key Takeaway */}
                            {previewArticle.summary && (
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-8">
                                    <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                        </svg>
                                        Key Takeaway
                                    </div>
                                    <p className="text-amber-800 italic">{previewArticle.summary}</p>
                                </div>
                            )}

                            {/* Divider */}
                            <hr className="border-gray-200 mb-8" />

                            {/* Content */}
                            <div className="prose prose-lg max-w-none">
                                {previewArticle.content && previewArticle.content.length > 0 ? (
                                    previewArticle.content.map((block, index) => renderContentBlock(block, index))
                                ) : (
                                    <p className="text-gray-500 italic">No content available for this article.</p>
                                )}
                            </div>

                            {/* Source Link */}
                            {previewArticle.sourceUrl && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <a
                                        href={previewArticle.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                    >
                                        <Link2 className="w-5 h-5" />
                                        <span className="font-medium">Read Original Article</span>
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Content Stats */}
                        <div className="bg-gray-50 px-8 py-4 border-t">
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                                <span>
                                    <strong className="text-gray-700">{previewArticle.content?.length || 0}</strong> content blocks
                                </span>
                                <span>
                                    <strong className="text-gray-700">{previewArticle.tags?.length || 0}</strong> tags
                                </span>
                                <span>
                                    Created: <strong className="text-gray-700">{formatDate(previewArticle.createdAt)}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Article not found</p>
                    </div>
                )}
            </div>
        );
    }

    // List View
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
                    <p className="text-gray-600 mt-2">Manage UPSC-related articles</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setViewMode('scrape')}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg"
                    >
                        <Globe className="w-5 h-5" /> Scrape
                    </button>
                    <button
                        onClick={() => { resetForm(); setViewMode('create'); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
                    >
                        <PenLine className="w-5 h-5" /> Write
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={gsPaperFilter}
                        onChange={(e) => setGsPaperFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg py-2 px-3"
                    >
                        <option value="all">All Sources</option>
                        {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg py-2 px-3"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : articles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    No articles found
                                </td>
                            </tr>
                        ) : (
                            articles.map((article) => (
                                <tr key={article.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="max-w-md">
                                            <button
                                                onClick={() => openPreview(article.id)}
                                                className="font-medium text-gray-900 line-clamp-1 hover:text-blue-600 text-left transition-colors"
                                            >
                                                {article.title}
                                            </button>
                                            {article.sourceUrl && (
                                                <a href={article.sourceUrl} target="_blank" className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                                    <Link2 className="w-3 h-3" /> Source
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {article.gsPaper && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full w-fit">
                                                    {article.gsPaper}
                                                </span>
                                            )}
                                            {article.subject && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full w-fit">
                                                    {article.subject}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleTogglePublish(article.id)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${article.isPublished
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {article.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {article.isPublished ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(article.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openPreview(article.id)} className="text-purple-600 hover:text-purple-900 mr-3" title="Preview">
                                            <BookOpen className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openEdit(article)} className="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(article.id, article.title)} className="text-red-600 hover:text-red-900" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                        <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

