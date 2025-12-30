'use client';

import { useState, useEffect } from 'react';
import { Search, Trash2, Edit2, Upload, MapPin, Eye, EyeOff, X } from 'lucide-react';

interface MapItem {
    id: number;
    title: string;
    description?: string;
    category: string;
    imageUrl: string;
    tags?: string[];
    isPublished: boolean;
    createdAt: string;
}

export default function MapsPage() {
    const [maps, setMaps] = useState<MapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingMap, setEditingMap] = useState<MapItem | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        isPublished: true
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [saveLoading, setSaveLoading] = useState(false);

    const categories = ['Political', 'Physical', 'Climate', 'Economic', 'Historical', 'Cultural', 'Other'];

    useEffect(() => {
        fetchMaps();
    }, [search]);

    const fetchMaps = async () => {
        setLoading(true);
        const token = localStorage.getItem('sb-access-token');
        try {
            const params = new URLSearchParams({ search });
            const res = await fetch(`/api/maps?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMaps(data.maps || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingMap(null);
        setFormData({ title: '', description: '', category: '', tags: '', isPublished: true });
        setSelectedFile(null);
        setPreviewUrl('');
        setShowModal(true);
    };

    const openEditModal = (map: MapItem) => {
        setEditingMap(map);
        setFormData({
            title: map.title,
            description: map.description || '',
            category: map.category,
            tags: map.tags?.join(', ') || '',
            isPublished: map.isPublished,
        });
        setPreviewUrl(map.imageUrl);
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.category) return;
        if (!editingMap && !selectedFile) return;

        setSaveLoading(true);
        const token = localStorage.getItem('sb-access-token');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('tags', formData.tags);
            formDataToSend.append('isPublished', formData.isPublished.toString());
            if (selectedFile) {
                formDataToSend.append('image', selectedFile);
            }

            const url = editingMap ? `/api/maps/${editingMap.id}` : '/api/maps';
            const method = editingMap ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: formDataToSend,
            });

            if (res.ok) {
                setShowModal(false);
                fetchMaps();
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`Delete map "${title}"?`)) return;
        const token = localStorage.getItem('sb-access-token');

        try {
            await fetch(`/api/maps/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchMaps();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleTogglePublish = async (id: number) => {
        const token = localStorage.getItem('sb-access-token');
        try {
            await fetch(`/api/maps/${id}/toggle-publish`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchMaps();
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Maps</h1>
                    <p className="text-gray-600 mt-2">Manage UPSC map resources</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg"
                >
                    <Upload className="w-5 h-5" /> Upload Map
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search maps..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {/* Maps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
                ) : maps.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No maps found</p>
                        <p className="text-xl font-semibold text-gray-800 mt-2">Coming Soon</p>
                    </div>
                ) : (
                    maps.map((map) => (
                        <div key={map.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
                            <div className="relative aspect-video bg-gray-100">
                                <img
                                    src={map.imageUrl}
                                    alt={map.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(map)}
                                            className="p-2 bg-white rounded-lg hover:bg-gray-100"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-700" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(map.id, map.title)}
                                            className="p-2 bg-white rounded-lg hover:bg-gray-100"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTogglePublish(map.id)}
                                    className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${map.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {map.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    {map.isPublished ? 'Published' : 'Draft'}
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{map.title}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{map.description}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                        {map.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold">{editingMap ? 'Edit Map' : 'Upload Map'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    {previewUrl ? (
                                        <div className="relative">
                                            <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded" />
                                            <button
                                                onClick={() => { setPreviewUrl(''); setSelectedFile(null); }}
                                                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <span className="text-sm text-gray-500">Click to upload</span>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="Separate with commas"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                    className="w-4 h-4 rounded text-emerald-600"
                                />
                                <span className="text-sm font-medium text-gray-700">Publish immediately</span>
                            </label>
                        </div>
                        <div className="flex gap-3 p-6 border-t">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveLoading || !formData.title || !formData.category || (!editingMap && !selectedFile)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
                            >
                                {saveLoading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

