'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Map, FileText, Activity, Eye, Globe, ArrowRight } from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalMaps: number;
    totalArticles: number;
    publishedArticles: number;
}

interface ActivityLog {
    id: number;
    action: string;
    entityType: string;
    description: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('sb-access-token');
        console.log('Fetching dashboard data with token:', token ? 'Token present' : 'No token');
        try {
            const [statsRes, activityRes] = await Promise.all([
                fetch('/api/dashboard/stats', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/dashboard/activity?limit=10', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats);
            }

            if (activityRes.ok) {
                const activityData = await activityRes.json();
                setActivities(activityData.activities || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            name: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            href: '/dashboard/users',
        },
        {
            name: 'Maps Uploaded',
            value: stats?.totalMaps || 0,
            icon: Map,
            color: 'from-emerald-500 to-emerald-600',
            href: '/dashboard/maps',
        },
        {
            name: 'Total Articles',
            value: stats?.totalArticles || 0,
            icon: FileText,
            color: 'from-purple-500 to-purple-600',
            href: '/dashboard/articles',
        },
        {
            name: 'Published Articles',
            value: stats?.publishedArticles || 0,
            icon: Eye,
            color: 'from-amber-500 to-amber-600',
            href: '/dashboard/articles',
        },
    ];

    const formatTimeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome to UPSC Prep Admin Panel</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.name}
                            href={stat.href}
                            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{stat.name}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                                View all <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No recent activity</p>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">{activity.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatTimeAgo(activity.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                    <div className="space-y-4">
                        <Link
                            href="/dashboard/users"
                            className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Users className="w-8 h-8 text-blue-400" />
                            <div>
                                <h3 className="font-semibold text-white">Manage Users</h3>
                                <p className="text-sm text-slate-300">View and edit users</p>
                            </div>
                        </Link>
                        <Link
                            href="/dashboard/maps"
                            className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Map className="w-8 h-8 text-emerald-400" />
                            <div>
                                <h3 className="font-semibold text-white">Upload Map</h3>
                                <p className="text-sm text-slate-300">Add new map images</p>
                            </div>
                        </Link>
                        <Link
                            href="/dashboard/articles"
                            className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Globe className="w-8 h-8 text-purple-400" />
                            <div>
                                <h3 className="font-semibold text-white">Scrape Article</h3>
                                <p className="text-sm text-slate-300">Import new content</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

