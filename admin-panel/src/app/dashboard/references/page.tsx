'use client';

import { useState, useEffect } from 'react';
import { Trash2, Edit2, Edit3, Plus, ArrowLeft, ChevronDown, ChevronUp, ChevronRight, X, Calendar, Globe, Building, Leaf, FlaskConical, DollarSign, Save, Eye, EyeOff, Smartphone, Check } from 'lucide-react';

// ==================== INTERFACES ====================
interface TimelineEvent {
    id: number;
    year: string;
    event: string;
    category: string;
    details?: string;
    order: number;
}

interface ReferenceEntry {
    key: string;
    type: string;
    title: string;
    data: any;
}

type ViewMode = 'list' | 'create' | 'edit' | 'editEntry';

// ==================== CATEGORIES ====================
const CATEGORIES = [
    { id: 'economy', name: 'Economy', icon: DollarSign, color: 'green' },
    { id: 'polity', name: 'Polity', icon: Building, color: 'blue' },
    { id: 'geography', name: 'Geography', icon: Globe, color: 'yellow' },
    { id: 'environment', name: 'Environment', icon: Leaf, color: 'emerald' },
    { id: 'scienceTech', name: 'Science & Tech', icon: FlaskConical, color: 'purple' },
    { id: 'history_timeline', name: 'History Timeline', icon: Calendar, color: 'orange' },
];

const HISTORY_TYPES = [
    { id: 'indian_prehistoric', label: 'Indian - Prehistoric' },
    { id: 'indian_ancient', label: 'Indian - Ancient' },
    { id: 'indian_medieval', label: 'Indian - Medieval' },
    { id: 'indian_modern', label: 'Indian - Modern' },
    { id: 'world_ancient_civilizations', label: 'World - Ancient' },
    { id: 'world_medieval_europe', label: 'World - Medieval' },
    { id: 'world_renaissance', label: 'World - Renaissance' },
    { id: 'world_industrial_revolution', label: 'World - Industrial' },
    { id: 'world_world_war', label: 'World - World Wars' },
    { id: 'world_modern_era', label: 'World - Modern' },
];

// ==================== DATA TYPES ====================
const DATA_TYPES = [
    {
        id: 'simpleList',
        name: 'Simple List',
        description: 'A list of text items (e.g., Types of Inflation, Pollution Types)',
        icon: '📋',
        example: ['Item 1', 'Item 2', 'Item 3']
    },
    {
        id: 'keyValue',
        name: 'Key-Value Definitions',
        description: 'Terms with definitions (e.g., GDP Definitions, Deficit Types)',
        icon: '📖',
        example: { 'Term 1': 'Definition 1', 'Term 2': 'Definition 2' }
    },
    {
        id: 'plansList',
        name: 'Plans/Timeline List',
        description: 'Items with name and focus/description (e.g., Five Year Plans)',
        icon: '📅',
        example: [{ plan: '1st Plan', focus: 'Agriculture' }]
    },
    {
        id: 'missionsList',
        name: 'Missions/Projects',
        description: 'Projects with name, year, type, description (e.g., ISRO Missions)',
        icon: '🚀',
        example: [{ name: 'Mission 1', year: 2024, type: 'Satellite', description: 'Description' }]
    },
    {
        id: 'scientistsList',
        name: 'People/Scientists',
        description: 'People with name, field, achievement (e.g., Indian Scientists)',
        icon: '👨‍🔬',
        example: [{ name: 'Name', field: 'Physics', achievement: 'Discovery' }]
    },
    {
        id: 'technologyList',
        name: 'Technologies',
        description: 'Technologies with name and description',
        icon: '💡',
        example: [{ name: 'AI', description: 'Artificial Intelligence' }]
    },
    {
        id: 'nestedLists',
        name: 'Categorized Lists',
        description: 'Multiple lists under categories (e.g., Physical Features, Rivers)',
        icon: '🗂️',
        example: { category1: ['item1', 'item2'], category2: ['item3'] }
    },
    {
        id: 'hierarchyTree',
        name: 'Hierarchy/Structure',
        description: 'Nested structure with properties (e.g., Constitution, Government)',
        icon: '🏛️',
        example: { level1: { property: 'value', subItems: [] } }
    },
    {
        id: 'vehiclesList',
        name: 'Vehicles/Equipment',
        description: 'Items with fullName, stages, firstLaunch (e.g., Launch Vehicles)',
        icon: '🚗',
        example: { 'PSLV': { fullName: 'Polar...', stages: 4, firstLaunch: 1993 } }
    },
    {
        id: 'missilesList',
        name: 'Defense/Missiles',
        description: 'Missiles with name, type, range',
        icon: '🎯',
        example: { missiles: [{ name: 'Agni', type: 'Ballistic', range: '5000km' }] }
    },
];

export default function ReferencesPage() {
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedCategory, setSelectedCategory] = useState('economy');
    const [referenceData, setReferenceData] = useState<any>({});
    const [showPreview, setShowPreview] = useState(true);

    // Entry editing state
    const [editingEntry, setEditingEntry] = useState<ReferenceEntry | null>(null);
    const [entryForm, setEntryForm] = useState({
        key: '',
        type: 'simpleList',
        title: '',
        data: null as any,
    });

    // Timeline state
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
    const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
    const [eventFormData, setEventFormData] = useState({
        year: '',
        event: '',
        category: 'indian_ancient',
        details: '',
        order: 0,
    });

    useEffect(() => {
        fetchData();
    }, [selectedCategory]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('sb-access-token');
        try {
            const res = await fetch(`/api/references?category=${selectedCategory}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.type === 'timeline') {
                    setTimelineEvents(data.references || []);
                    setReferenceData({});
                } else {
                    setReferenceData(data.references || {});
                    setTimelineEvents([]);
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==================== TIMELINE HANDLERS ====================
    const handleSaveEvent = async () => {
        setSaveLoading(true);
        const token = localStorage.getItem('sb-access-token');
        try {
            const payload = { ...eventFormData, type: 'timeline' };
            const url = editingEvent ? `/api/references/${editingEvent.id}` : '/api/references';
            const method = editingEvent ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                resetEventForm();
                setViewMode('list');
                fetchData();
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDeleteEvent = async (event: TimelineEvent) => {
        if (!confirm(`Delete "${event.event}"?`)) return;
        const token = localStorage.getItem('sb-access-token');
        try {
            await fetch(`/api/references/${event.id}?type=timeline`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const openEditEvent = (event: TimelineEvent) => {
        setEditingEvent(event);
        setEventFormData({
            year: event.year,
            event: event.event,
            category: event.category,
            details: event.details || '',
            order: event.order,
        });
        setViewMode('edit');
    };

    const resetEventForm = () => {
        setEventFormData({ year: '', event: '', category: 'indian_ancient', details: '', order: timelineEvents.length });
        setEditingEvent(null);
    };

    // ==================== ENTRY HANDLERS ====================
    const getDefaultDataForType = (type: string) => {
        switch (type) {
            case 'simpleList': return [];
            case 'keyValue': return {};
            case 'plansList': return [];
            case 'missionsList': return [];
            case 'scientistsList': return [];
            case 'technologyList': return [];
            case 'nestedLists': return {};
            case 'hierarchyTree': return {};
            case 'vehiclesList': return {};
            case 'missilesList': return { missiles: [] };
            default: return [];
        }
    };

    const openCreateEntry = () => {
        setEditingEntry(null);
        setEntryForm({
            key: '',
            type: 'simpleList',
            title: '',
            data: getDefaultDataForType('simpleList'),
        });
        setViewMode('editEntry');
    };

    const openEditEntry = (key: string, data: any) => {
        const detectedType = detectDataType(data);
        setEditingEntry({ key, type: detectedType, title: key, data });
        setEntryForm({
            key,
            type: detectedType,
            title: formatKeyToTitle(key),
            data: JSON.parse(JSON.stringify(data)),
        });
        setViewMode('editEntry');
    };

    const detectDataType = (data: any): string => {
        if (Array.isArray(data)) {
            if (data.length === 0) return 'simpleList';
            const first = data[0];
            if (typeof first === 'string') return 'simpleList';
            if (first.plan && first.focus) return 'plansList';
            if (first.year && first.type && first.description) return 'missionsList';
            if (first.field && first.achievement) return 'scientistsList';
            if (first.name && first.description && !first.year) return 'technologyList';
            return 'simpleList';
        }
        if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            if (keys.length === 0) return 'keyValue';
            const firstVal = data[keys[0]];
            if (typeof firstVal === 'string') return 'keyValue';
            if (Array.isArray(firstVal) && (firstVal.length === 0 || typeof firstVal[0] === 'string')) return 'nestedLists';
            if (firstVal?.fullName !== undefined) return 'vehiclesList';
            if (data.missiles) return 'missilesList';
            return 'hierarchyTree';
        }
        return 'simpleList';
    };

    const formatKeyToTitle = (key: string): string => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
            .trim();
    };

    const formatTitleToKey = (title: string): string => {
        return title
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    };

    const handleDeleteEntry = async (key: string) => {
        if (!confirm(`Delete "${formatKeyToTitle(key)}"?`)) return;
        const newData = { ...referenceData };
        delete newData[key];
        await saveReferenceData(newData);
    };

    const handleSaveEntry = async () => {
        setSaveLoading(true);
        try {
            const key = entryForm.key || formatTitleToKey(entryForm.title);
            const newData = { ...referenceData };

            // If editing and key changed, remove old key
            if (editingEntry && editingEntry.key !== key) {
                delete newData[editingEntry.key];
            }

            newData[key] = entryForm.data;
            await saveReferenceData(newData);
            setViewMode('list');
            setEditingEntry(null);
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setSaveLoading(false);
        }
    };

    const saveReferenceData = async (data: any) => {
        const token = localStorage.getItem('sb-access-token');
        const payload = {
            category: selectedCategory,
            title: `${selectedCategory}Reference`,
            data,
            order: 1,
        };
        const res = await fetch('/api/references', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            fetchData();
        } else {
            throw new Error('Save failed');
        }
    };

    // ==================== EDITORS ====================
    const SimpleListEditor = ({ items, onChange }: { items: string[], onChange: (items: string[]) => void }) => (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-gray-400 text-sm">{i + 1}.</span>
                    <input type="text" value={item} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter item..." />
                    <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                </div>
            ))}
            <button onClick={() => onChange([...items, ''])} className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 mt-2">
                <Plus className="w-4 h-4" /> Add Item
            </button>
        </div>
    );

    const KeyValueEditor = ({ data, onChange }: { data: Record<string, string>, onChange: (data: Record<string, string>) => void }) => {
        const entries = Object.entries(data);
        return (
            <div className="space-y-3">
                {entries.map(([key, value], i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                            <input type="text" value={key} onChange={(e) => { const n = { ...data }; delete n[key]; n[e.target.value] = value; onChange(n); }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-medium" placeholder="Term name" />
                            <button onClick={() => { const n = { ...data }; delete n[key]; onChange(n); }} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                        </div>
                        <textarea value={value} onChange={(e) => onChange({ ...data, [key]: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Definition or description..." />
                    </div>
                ))}
                <button onClick={() => onChange({ ...data, '': '' })} className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                    <Plus className="w-4 h-4" /> Add Definition
                </button>
            </div>
        );
    };

    const PlansListEditor = ({ plans, onChange }: { plans: Array<{ plan: string, focus: string }>, onChange: (p: any[]) => void }) => (
        <div className="space-y-3">
            {plans.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <input type="text" value={p.plan} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], plan: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Plan (e.g., 1st 1951-56)" />
                        <input type="text" value={p.focus} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], focus: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Focus area" />
                    </div>
                    <button onClick={() => onChange(plans.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                </div>
            ))}
            <button onClick={() => onChange([...plans, { plan: '', focus: '' }])} className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                <Plus className="w-4 h-4" /> Add Plan
            </button>
        </div>
    );

    const MissionsListEditor = ({ missions, onChange }: { missions: any[], onChange: (m: any[]) => void }) => (
        <div className="space-y-3">
            {missions.map((m, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700">#{i + 1}</span>
                        <button onClick={() => onChange(missions.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={m.name || ''} onChange={(e) => { const n = [...missions]; n[i] = { ...n[i], name: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Name" />
                        <input type="number" value={m.year || ''} onChange={(e) => { const n = [...missions]; n[i] = { ...n[i], year: parseInt(e.target.value) || 0 }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Year" />
                        <input type="text" value={m.type || ''} onChange={(e) => { const n = [...missions]; n[i] = { ...n[i], type: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Type" />
                        <input type="text" value={m.description || ''} onChange={(e) => { const n = [...missions]; n[i] = { ...n[i], description: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Description" />
                    </div>
                </div>
            ))}
            <button onClick={() => onChange([...missions, { name: '', year: new Date().getFullYear(), type: '', description: '' }])} className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                <Plus className="w-4 h-4" /> Add Mission
            </button>
        </div>
    );

    const ScientistsListEditor = ({ scientists, onChange }: { scientists: any[], onChange: (s: any[]) => void }) => (
        <div className="space-y-3">
            {scientists.map((s, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700">#{i + 1}</span>
                        <button onClick={() => onChange(scientists.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <input type="text" value={s.name || ''} onChange={(e) => { const n = [...scientists]; n[i] = { ...n[i], name: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Name" />
                        <input type="text" value={s.field || ''} onChange={(e) => { const n = [...scientists]; n[i] = { ...n[i], field: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Field" />
                        <input type="text" value={s.achievement || ''} onChange={(e) => { const n = [...scientists]; n[i] = { ...n[i], achievement: e.target.value }; onChange(n); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Achievement" />
                    </div>
                </div>
            ))}
            <button onClick={() => onChange([...scientists, { name: '', field: '', achievement: '' }])} className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                <Plus className="w-4 h-4" /> Add Person
            </button>
        </div>
    );

    const TechnologyListEditor = ({ technologies, onChange }: { technologies: any[], onChange: (t: any[]) => void }) => (
        <div className="space-y-3">
            {technologies.map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                        <input type="text" value={t.name || ''} onChange={(e) => { const n = [...technologies]; n[i] = { ...n[i], name: e.target.value }; onChange(n); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-medium" placeholder="Name" />
                        <input type="text" value={t.description || ''} onChange={(e) => { const n = [...technologies]; n[i] = { ...n[i], description: e.target.value }; onChange(n); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Description" />
                    </div>
                    <button onClick={() => onChange(technologies.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                </div>
            ))}
            <button onClick={() => onChange([...technologies, { name: '', description: '' }])} className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                <Plus className="w-4 h-4" /> Add Technology
            </button>
        </div>
    );

    const NestedListsEditor = ({ data, onChange }: { data: Record<string, string[]>, onChange: (d: any) => void }) => {
        const categories = Object.entries(data);
        return (
            <div className="space-y-4">
                {categories.map(([cat, items], i) => (
                    <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                            <input type="text" value={cat} onChange={(e) => { const n = { ...data }; const v = n[cat]; delete n[cat]; n[e.target.value] = v; onChange(n); }} className="font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none" placeholder="Category name" />
                            <button onClick={() => { const n = { ...data }; delete n[cat]; onChange(n); }} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-4">
                            <SimpleListEditor items={items || []} onChange={(newItems) => onChange({ ...data, [cat]: newItems })} />
                        </div>
                    </div>
                ))}
                <button onClick={() => onChange({ ...data, [`New Category ${Object.keys(data).length + 1}`]: [] })} className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                    <Plus className="w-4 h-4" /> Add Category
                </button>
            </div>
        );
    };

    const VehiclesListEditor = ({ data, onChange }: { data: Record<string, any>, onChange: (d: any) => void }) => {
        const vehicles = Object.entries(data);
        return (
            <div className="space-y-3">
                {vehicles.map(([key, val], i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                            <input type="text" value={key} onChange={(e) => { const n = { ...data }; const v = n[key]; delete n[key]; n[e.target.value] = v; onChange(n); }} className="font-medium px-2 py-1 border border-gray-300 rounded bg-white" placeholder="Vehicle code" />
                            <button onClick={() => { const n = { ...data }; delete n[key]; onChange(n); }} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <input type="text" value={val?.fullName || ''} onChange={(e) => onChange({ ...data, [key]: { ...val, fullName: e.target.value } })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Full Name" />
                            <input type="number" value={val?.stages || 0} onChange={(e) => onChange({ ...data, [key]: { ...val, stages: parseInt(e.target.value) || 0 } })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Stages" />
                            <input type="number" value={val?.firstLaunch || 0} onChange={(e) => onChange({ ...data, [key]: { ...val, firstLaunch: parseInt(e.target.value) || 0 } })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="First Launch Year" />
                        </div>
                    </div>
                ))}
                <button onClick={() => onChange({ ...data, [`NEW_${Date.now()}`]: { fullName: '', stages: 0, firstLaunch: 0 } })} className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                    <Plus className="w-4 h-4" /> Add Vehicle
                </button>
            </div>
        );
    };

    const MissilesListEditor = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => {
        const missiles = data?.missiles || [];
        return (
            <div className="space-y-3">
                {missiles.map((m: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-500">#{i + 1}</span>
                            <button onClick={() => onChange({ ...data, missiles: missiles.filter((_: any, idx: number) => idx !== i) })} className="text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <input type="text" value={m.name || ''} onChange={(e) => { const n = [...missiles]; n[i] = { ...n[i], name: e.target.value }; onChange({ ...data, missiles: n }); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Name" />
                            <input type="text" value={m.type || ''} onChange={(e) => { const n = [...missiles]; n[i] = { ...n[i], type: e.target.value }; onChange({ ...data, missiles: n }); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Type" />
                            <input type="text" value={m.range || ''} onChange={(e) => { const n = [...missiles]; n[i] = { ...n[i], range: e.target.value }; onChange({ ...data, missiles: n }); }} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Range" />
                        </div>
                    </div>
                ))}
                <button onClick={() => onChange({ ...data, missiles: [...missiles, { name: '', type: '', range: '' }] })} className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                    <Plus className="w-4 h-4" /> Add Missile
                </button>
            </div>
        );
    };

    // Recursive tree node component for hierarchy editing
    const TreeNodeEditor = ({
        nodeKey,
        nodeValue,
        path,
        onUpdate,
        onDelete,
        level = 0
    }: {
        nodeKey: string;
        nodeValue: any;
        path: string[];
        onUpdate: (path: string[], key: string, value: any) => void;
        onDelete: (path: string[]) => void;
        level?: number;
    }) => {
        const [isExpanded, setIsExpanded] = useState(level < 2);
        const [isEditing, setIsEditing] = useState(false);
        const [editKey, setEditKey] = useState(nodeKey);
        const [editValue, setEditValue] = useState(typeof nodeValue === 'string' ? nodeValue : '');

        const isObject = typeof nodeValue === 'object' && nodeValue !== null && !Array.isArray(nodeValue);
        const isArray = Array.isArray(nodeValue);
        const isPrimitive = !isObject && !isArray;

        const levelColors = [
            'border-blue-400 bg-blue-50',
            'border-emerald-400 bg-emerald-50',
            'border-purple-400 bg-purple-50',
            'border-amber-400 bg-amber-50',
            'border-pink-400 bg-pink-50',
        ];
        const colorClass = levelColors[level % levelColors.length];

        const handleKeyChange = () => {
            if (editKey !== nodeKey) {
                onUpdate(path.slice(0, -1), editKey, nodeValue);
                onDelete(path);
            }
            setIsEditing(false);
        };

        const handleValueChange = () => {
            onUpdate(path.slice(0, -1), nodeKey, editValue);
            setIsEditing(false);
        };

        const addChild = () => {
            const newKey = `newItem_${Date.now()}`;
            if (isObject) {
                onUpdate(path, newKey, 'New value');
            } else if (isArray) {
                onUpdate(path.slice(0, -1), nodeKey, [...nodeValue, 'New item']);
            }
        };

        return (
            <div className={`border-l-4 ${colorClass} rounded-lg mb-2 overflow-hidden`}>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/50">
                    {(isObject || isArray) && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500 hover:text-gray-700">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                    {isPrimitive && <span className="w-4" />}

                    {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={editKey}
                                onChange={(e) => setEditKey(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                                placeholder="Key"
                            />
                            {isPrimitive && (
                                <>
                                    <span className="text-gray-400">:</span>
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Value"
                                    />
                                </>
                            )}
                            <button onClick={isPrimitive ? handleValueChange : handleKeyChange} className="p-1 text-green-600 hover:text-green-700">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsEditing(false)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <span className="font-medium text-gray-800 text-sm">{nodeKey}</span>
                            {isPrimitive && (
                                <>
                                    <span className="text-gray-400 mx-1">:</span>
                                    <span className="text-gray-600 text-sm truncate max-w-[200px]">{String(nodeValue)}</span>
                                </>
                            )}
                            {isArray && <span className="text-xs text-gray-400 ml-1">({nodeValue.length} items)</span>}
                            {isObject && <span className="text-xs text-gray-400 ml-1">({Object.keys(nodeValue).length} fields)</span>}

                            <div className="ml-auto flex items-center gap-1">
                                <button onClick={() => { setIsEditing(true); setEditKey(nodeKey); setEditValue(typeof nodeValue === 'string' ? nodeValue : ''); }} className="p-1 text-gray-400 hover:text-blue-600" title="Edit">
                                    <Edit3 className="w-3 h-3" />
                                </button>
                                {(isObject || isArray) && (
                                    <button onClick={addChild} className="p-1 text-gray-400 hover:text-green-600" title="Add child">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                )}
                                <button onClick={() => onDelete(path)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {isExpanded && isObject && (
                    <div className="pl-4 pr-2 py-2 bg-white/30">
                        {Object.entries(nodeValue).map(([key, val]) => (
                            <TreeNodeEditor
                                key={key}
                                nodeKey={key}
                                nodeValue={val}
                                path={[...path, key]}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                level={level + 1}
                            />
                        ))}
                        {Object.keys(nodeValue).length === 0 && (
                            <p className="text-xs text-gray-400 italic py-2">Empty object - click + to add fields</p>
                        )}
                    </div>
                )}

                {isExpanded && isArray && (
                    <div className="pl-4 pr-2 py-2 bg-white/30">
                        {nodeValue.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                                <input
                                    type="text"
                                    value={typeof item === 'string' ? item : JSON.stringify(item)}
                                    onChange={(e) => {
                                        const newArr = [...nodeValue];
                                        newArr[index] = e.target.value;
                                        onUpdate(path.slice(0, -1), nodeKey, newArr);
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                                />
                                <button
                                    onClick={() => {
                                        const newArr = nodeValue.filter((_: any, i: number) => i !== index);
                                        onUpdate(path.slice(0, -1), nodeKey, newArr);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {nodeValue.length === 0 && (
                            <p className="text-xs text-gray-400 italic py-2">Empty array - click + to add items</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const HierarchyTreeEditor = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => {
        const updateNode = (path: string[], key: string, value: any) => {
            if (path.length === 0) {
                // Root level update
                const newData = { ...data };
                newData[key] = value;
                onChange(newData);
                return;
            }

            const newData = JSON.parse(JSON.stringify(data));
            let current = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            const parentKey = path[path.length - 1];
            if (typeof current[parentKey] === 'object' && current[parentKey] !== null) {
                current[parentKey][key] = value;
            }
            onChange(newData);
        };

        const deleteNode = (path: string[]) => {
            if (path.length === 0) return;

            const newData = JSON.parse(JSON.stringify(data));
            let current = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            const keyToDelete = path[path.length - 1];
            if (Array.isArray(current)) {
                current.splice(parseInt(keyToDelete), 1);
            } else {
                delete current[keyToDelete];
            }
            onChange(newData);
        };

        const addRootNode = () => {
            const newKey = `newSection_${Date.now()}`;
            onChange({ ...data, [newKey]: {} });
        };

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Click on nodes to expand/collapse. Use buttons to edit, add children, or delete.</p>
                    <button onClick={addRootNode} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                        <Plus className="w-4 h-4" /> Add Section
                    </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-[500px] overflow-y-auto">
                    {Object.entries(data || {}).map(([key, value]) => (
                        <TreeNodeEditor
                            key={key}
                            nodeKey={key}
                            nodeValue={value}
                            path={[key]}
                            onUpdate={updateNode}
                            onDelete={deleteNode}
                            level={0}
                        />
                    ))}
                    {Object.keys(data || {}).length === 0 && (
                        <p className="text-gray-400 text-center py-8">No data yet. Click "Add Section" to start building.</p>
                    )}
                </div>
            </div>
        );
    };

    const renderEditor = () => {
        const { type, data } = entryForm;
        const setData = (newData: any) => setEntryForm({ ...entryForm, data: newData });

        switch (type) {
            case 'simpleList': return <SimpleListEditor items={data || []} onChange={setData} />;
            case 'keyValue': return <KeyValueEditor data={data || {}} onChange={setData} />;
            case 'plansList': return <PlansListEditor plans={data || []} onChange={setData} />;
            case 'missionsList': return <MissionsListEditor missions={data || []} onChange={setData} />;
            case 'scientistsList': return <ScientistsListEditor scientists={data || []} onChange={setData} />;
            case 'technologyList': return <TechnologyListEditor technologies={data || []} onChange={setData} />;
            case 'nestedLists': return <NestedListsEditor data={data || {}} onChange={setData} />;
            case 'vehiclesList': return <VehiclesListEditor data={data || {}} onChange={setData} />;
            case 'missilesList': return <MissilesListEditor data={data || { missiles: [] }} onChange={setData} />;
            case 'hierarchyTree': return <HierarchyTreeEditor data={data || {}} onChange={setData} />;
            default: return <SimpleListEditor items={data || []} onChange={setData} />;
        }
    };

    // ==================== PREVIEW ====================
    const MobilePreview = ({ type, data, title }: { type: string, data: any, title: string }) => {
        return (
            <div className="w-[320px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-[15px] font-semibold text-gray-900">{title || 'Preview'}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 py-3 overflow-y-auto max-h-[500px] bg-white">
                    {renderMobileContent(type, data)}
                </div>
            </div>
        );
    };

    const renderMobileContent = (type: string, data: any) => {
        if (!data) return <p className="text-gray-400 text-sm text-center py-8">No data to preview</p>;

        const getItemColor = (index: number): string => {
            const colors = ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
            return colors[index % colors.length];
        };

        switch (type) {
            case 'simpleList':
                // Matches ListSection in mobile app - horizontal scrolling cards
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">📋</div>
                            <span className="text-[15px] font-semibold text-gray-900 flex-1">Items</span>
                            <span className="text-xs text-gray-400">Swipe →</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            {(data || []).slice(0, 6).map((item: string, i: number) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 w-[200px] p-4 rounded-2xl border border-gray-200 bg-white flex flex-col items-center"
                                >
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg mb-3"
                                        style={{ background: `linear-gradient(135deg, ${getItemColor(i)}, ${getItemColor(i)}CC)` }}
                                    >
                                        {i + 1}
                                    </div>
                                    <span className="text-[13px] font-semibold text-gray-900 text-center leading-tight">{item || 'Item'}</span>
                                    <span
                                        className="text-[11px] font-medium mt-2 px-3 py-1 rounded-full"
                                        style={{ backgroundColor: `${getItemColor(i)}15`, color: getItemColor(i) }}
                                    >
                                        #{i + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {(data || []).length > 6 && <p className="text-xs text-gray-400 text-center">+{data.length - 6} more</p>}
                    </div>
                );

            case 'keyValue':
                // Matches KeyValueSection - definitions with badges
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">📖</div>
                            <span className="text-[15px] font-semibold text-gray-900">Definitions</span>
                        </div>
                        {Object.entries(data || {}).slice(0, 5).map(([key, value], i) => (
                            <div key={i} className="flex items-start gap-3 p-3.5 bg-white border border-gray-200 rounded-[14px]">
                                <div
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0"
                                    style={{ backgroundColor: '#10B98115', color: '#10B981' }}
                                >
                                    {key.replace(/([A-Z])/g, ' $1').trim().slice(0, 15)}
                                </div>
                                <p className="text-[13px] text-gray-600 leading-[19px] flex-1">
                                    {String(value).slice(0, 80)}{String(value).length > 80 ? '...' : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                );

            case 'plansList':
                // Matches PlansSection - horizontal scrolling plan cards
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">📅</div>
                            <span className="text-[15px] font-semibold text-gray-900 flex-1">Plans</span>
                            <span className="text-xs text-gray-400">Swipe →</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            {(data || []).slice(0, 8).map((p: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 w-[140px] p-3.5 rounded-[14px] border border-gray-200 bg-white flex flex-col items-center"
                                >
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-bold mb-2.5"
                                        style={{ backgroundColor: '#10B98115', color: '#10B981' }}
                                    >
                                        {i + 1}
                                    </div>
                                    <span className="text-[12px] font-semibold text-gray-900 text-center mb-1">{p.plan}</span>
                                    <span className="text-[11px] text-gray-500 text-center leading-[15px]">{p.focus}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'missionsList':
                // Matches MissionsSection
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">🚀</div>
                            <span className="text-[15px] font-semibold text-gray-900">Missions</span>
                        </div>
                        {(data || []).slice(0, 4).map((m: any, i: number) => (
                            <div key={i} className="p-3.5 bg-white border border-gray-200 rounded-[14px]">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[15px] font-semibold text-gray-900">{m.name}</span>
                                    <span
                                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                                        style={{ backgroundColor: '#10B98115', color: '#10B981' }}
                                    >
                                        {m.year}
                                    </span>
                                </div>
                                <span className="text-[12px] font-medium text-emerald-600">{m.type}</span>
                                <p className="text-[12px] text-gray-500 leading-[17px] mt-1">{m.description}</p>
                            </div>
                        ))}
                    </div>
                );

            case 'scientistsList':
                // Matches PeopleSection
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">👨‍🔬</div>
                            <span className="text-[15px] font-semibold text-gray-900">People</span>
                        </div>
                        {(data || []).slice(0, 4).map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-[14px]">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                                    style={{ backgroundColor: '#10B981' }}
                                >
                                    {s.name?.[0] || '?'}
                                </div>
                                <div className="flex-1">
                                    <span className="text-[15px] font-semibold text-gray-900 block">{s.name}</span>
                                    <span className="text-[12px] font-medium text-emerald-600">{s.field}</span>
                                    <p className="text-[12px] text-gray-500 leading-[17px] mt-1">{s.achievement}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'technologyList':
                // Matches TechnologiesSection - grid layout
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">💡</div>
                            <span className="text-[15px] font-semibold text-gray-900">Technologies</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {(data || []).slice(0, 6).map((t: any, i: number) => (
                                <div key={i} className="p-3.5 bg-white border border-gray-200 rounded-[14px]">
                                    <span className="text-[14px] font-semibold text-gray-900 block mb-1.5">{t.name}</span>
                                    <p className="text-[12px] text-gray-500 leading-[17px] line-clamp-2">{t.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'nestedLists':
                // Matches categorized lists
                return (
                    <div className="space-y-4">
                        {Object.entries(data || {}).slice(0, 3).map(([cat, items]: [string, any], i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
                                <div className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-200">
                                    <span className="text-[13px] font-semibold text-gray-900">{cat}</span>
                                </div>
                                <div className="p-3 flex flex-wrap gap-1.5">
                                    {(items || []).slice(0, 5).map((item: string, j: number) => (
                                        <span key={j} className="text-[11px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{item}</span>
                                    ))}
                                    {(items || []).length > 5 && <span className="text-[11px] text-gray-400 px-2 py-1">+{items.length - 5}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'vehiclesList':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">🚗</div>
                            <span className="text-[15px] font-semibold text-gray-900">Vehicles</span>
                        </div>
                        {Object.entries(data || {}).slice(0, 4).map(([key, val]: [string, any], i) => (
                            <div key={i} className="p-3.5 bg-white border border-gray-200 rounded-[14px]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-900">{key}</span>
                                    <span
                                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                                        style={{ backgroundColor: '#6366F115', color: '#6366F1' }}
                                    >
                                        {val?.firstLaunch}
                                    </span>
                                </div>
                                <p className="text-[12px] text-gray-600">{val?.fullName}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{val?.stages} stages</p>
                            </div>
                        ))}
                    </div>
                );

            case 'missilesList':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 text-emerald-500">🎯</div>
                            <span className="text-[15px] font-semibold text-gray-900">Defense</span>
                        </div>
                        {(data?.missiles || []).slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-[14px]">
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg">🎯</div>
                                <div className="flex-1">
                                    <span className="text-[14px] font-semibold text-gray-900 block">{m.name}</span>
                                    <span className="text-[12px] text-gray-500">{m.type} • {m.range}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                return (
                    <div className="bg-white border border-gray-200 rounded-[14px] p-3">
                        <p className="text-[12px] text-gray-500 font-mono whitespace-pre-wrap">
                            {JSON.stringify(data, null, 2).slice(0, 400)}
                        </p>
                    </div>
                );
        }
    };

    const isTimeline = selectedCategory === 'history_timeline';
    const currentCat = CATEGORIES.find(c => c.id === selectedCategory);
    const entries = Object.entries(referenceData);

    // ==================== EDIT ENTRY VIEW ====================
    if (viewMode === 'editEntry') {
        const selectedType = DATA_TYPES.find(t => t.id === entryForm.type);
        return (
            <div className="max-w-7xl mx-auto">
                <button onClick={() => { setViewMode('list'); setEditingEntry(null); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to {currentCat?.name}
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{editingEntry ? 'Edit Entry' : 'New Entry'}</h1>
                <p className="text-gray-600 mb-8">Create or edit reference data with live mobile preview</p>

                <div className="flex gap-8">
                    {/* Editor */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                            {/* Title & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={entryForm.title}
                                        onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value, key: editingEntry ? entryForm.key : formatTitleToKey(e.target.value) })}
                                        placeholder="e.g., Types of Inflation"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Type *</label>
                                    <select
                                        value={entryForm.type}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            setEntryForm({
                                                ...entryForm,
                                                type: newType,
                                                data: getDefaultDataForType(newType)
                                            });
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {DATA_TYPES.map(t => (
                                            <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Type Description */}
                            {selectedType && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-700">{selectedType.description}</p>
                                </div>
                            )}

                            {/* Data Editor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Data</label>
                                {renderEditor()}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setViewMode('list'); setEditingEntry(null); }} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                            <button onClick={handleSaveEntry} disabled={saveLoading || !entryForm.title} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Entry'}
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex-shrink-0">
                        <div className="sticky top-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" /> Mobile Preview
                                </h3>
                                <button onClick={() => setShowPreview(!showPreview)} className="text-gray-400 hover:text-gray-600">
                                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {showPreview && <MobilePreview type={entryForm.type} data={entryForm.data} title={entryForm.title} />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== TIMELINE EVENT VIEW ====================
    if ((viewMode === 'create' || viewMode === 'edit') && isTimeline) {
        return (
            <div className="max-w-4xl mx-auto">
                <button onClick={() => { resetEventForm(); setViewMode('list'); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Timeline
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{editingEvent ? 'Edit Timeline Event' : 'New Timeline Event'}</h1>

                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input type="text" value={eventFormData.year} onChange={(e) => setEventFormData({ ...eventFormData, year: e.target.value })} placeholder="e.g., 326 BCE or 1947" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select value={eventFormData.category} onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                                {HISTORY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                            <input type="text" value={eventFormData.event} onChange={(e) => setEventFormData({ ...eventFormData, event: e.target.value })} placeholder="e.g., Battle of Plassey" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                            <textarea value={eventFormData.details} onChange={(e) => setEventFormData({ ...eventFormData, details: e.target.value })} rows={4} placeholder="Additional details..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={() => { resetEventForm(); setViewMode('list'); }} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleSaveEvent} disabled={saveLoading || !eventFormData.year || !eventFormData.event} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg disabled:opacity-50">
                        {saveLoading ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                    </button>
                </div>
            </div>
        );
    }

    // ==================== LIST VIEW ====================
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Visual References</h1>
                    <p className="text-gray-600 mt-2">Manage reference data for the mobile app</p>
                </div>
                <button
                    onClick={isTimeline ? () => { resetEventForm(); setViewMode('create'); } : openCreateEntry}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
                >
                    <Plus className="w-5 h-5" /> Add {isTimeline ? 'Event' : 'Entry'}
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                            <Icon className="w-4 h-4" /> {cat.name}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
            ) : isTimeline ? (
                timelineEvents.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No timeline events found</p>
                        <p className="text-gray-400 text-sm mt-2">Click "Add Event" to create your first event</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {timelineEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{event.year}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{event.event}</div>
                                            {event.details && <div className="text-sm text-gray-500 line-clamp-1">{event.details}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.category.includes('ancient') ? 'bg-amber-100 text-amber-700' : event.category.includes('medieval') ? 'bg-blue-100 text-blue-700' : event.category.includes('modern') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {HISTORY_TYPES.find(t => t.id === event.category)?.label || event.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openEditEvent(event)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteEvent(event)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : entries.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-500 text-lg">No entries yet for {currentCat?.name}</p>
                    <p className="text-gray-400 text-sm mt-2">Click "Add Entry" to create your first reference data</p>
                    <p className="text-xl font-semibold text-gray-800 mt-2">Coming Soon</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {entries.map(([key, data]) => {
                        const type = detectDataType(data);
                        const typeInfo = DATA_TYPES.find(t => t.id === type);
                        const itemCount = Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data || {}).length : 0;

                        return (
                            <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{formatKeyToTitle(key)}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-lg">{typeInfo?.icon || '📄'}</span>
                                                <span className="text-xs text-gray-500">{typeInfo?.name || 'Data'}</span>
                                                <span className="text-xs text-gray-400">• {itemCount} items</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini Preview */}
                                    <div className="mt-3 p-2 bg-gray-50 rounded-lg h-20 overflow-hidden">
                                        {renderMiniPreview(type, data)}
                                    </div>
                                </div>

                                <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-2">
                                    <button onClick={() => openEditEntry(key, data)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => handleDeleteEntry(key)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    function renderMiniPreview(type: string, data: any) {
        if (!data) return null;

        switch (type) {
            case 'simpleList':
                return (
                    <div className="flex flex-wrap gap-1">
                        {(data || []).slice(0, 3).map((item: string, i: number) => (
                            <span key={i} className="text-xs bg-white px-2 py-0.5 rounded border truncate max-w-[100px]">{item}</span>
                        ))}
                        {data.length > 3 && <span className="text-xs text-gray-400">+{data.length - 3}</span>}
                    </div>
                );
            case 'keyValue':
                return (
                    <div className="text-xs text-gray-600 space-y-1">
                        {Object.keys(data || {}).slice(0, 2).map((key, i) => (
                            <div key={i} className="truncate"><span className="font-medium">{key}:</span> {String(data[key]).slice(0, 30)}...</div>
                        ))}
                    </div>
                );
            default:
                return <div className="text-xs text-gray-400">Preview available in editor</div>;
        }
    }
}
