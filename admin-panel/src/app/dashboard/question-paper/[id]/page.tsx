'use client';

import { useState } from 'react';
import { Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function QuestionPaperPage({ params }: { params: { id: string } }) {
    const questionSetId = params.id;
    const [formData, setFormData] = useState({
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        explanation: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const response = await fetch('/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, questionSetId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save question');
            }

            console.log('Saved Question:', data);

            setStatus({ type: 'success', message: 'Question saved successfully!' });

            // Reset form
            setFormData({
                question: '',
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: '',
                correctAnswer: 'A',
                explanation: ''
            });
        } catch (error: any) {
            console.error('Submit Error:', error);
            setStatus({ type: 'error', message: error.message || 'Failed to save question.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Question Paper Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage questions for the UPSC examination</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        New Question
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Question */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Question Text <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-y text-slate-800 placeholder:text-slate-400"
                                placeholder="Enter the question text here..."
                            />
                        </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                            <div key={opt} className="relative group">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Option {opt} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-sm font-bold text-slate-600 border border-slate-200">
                                        {opt}
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData[`option${opt}` as keyof typeof formData]}
                                        onChange={(e) => setFormData({ ...formData, [`option${opt}`]: e.target.value })}
                                        className="w-full pl-14 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder={`Enter option ${opt}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Correct Answer & Explanation */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Correct Answer <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.correctAnswer}
                                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none bg-white cursor-pointer appearance-none"
                                >
                                    {['A', 'B', 'C', 'D'].map((opt) => (
                                        <option key={opt} value={opt}>Option {opt}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Explanation <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                                placeholder="Explain the reasoning behind the correct answer..."
                            />
                        </div>
                    </div>

                    {/* Status Messages */}
                    {status && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                            <div>
                                <p className="font-semibold">{status.type === 'success' ? 'Success' : 'Error'}</p>
                                <p className="text-sm opacity-90">{status.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '' })}
                            className="px-6 py-2.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium transition-all"
                        >
                            Clear Form
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transform active:scale-95"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {loading ? 'Saving...' : 'Save Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
