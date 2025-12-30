'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    Map,
    FileText,
    LogOut,
    ChevronLeft,
    Menu,
    BookMarked,
    Route,
    BookOpen,
    FileQuestion
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Maps', href: '/dashboard/maps', icon: Map },
    { name: 'Articles', href: '/dashboard/articles', icon: FileText },
    { name: 'Roadmap', href: '/dashboard/roadmap', icon: Route },
    { name: 'References', href: '/dashboard/references', icon: BookOpen },
    { name: 'Question Paper', href: '/dashboard/question-paper', icon: FileQuestion },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('sb-access-token');
        if (!token) {
            router.push('/');
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300 z-40`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className={`p-4 border-b border-slate-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {!isSidebarCollapsed && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                                    <BookMarked className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">UPSC Prep</h1>
                                    <p className="text-xs text-slate-400">Admin Panel</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    title={isSidebarCollapsed ? item.name : undefined}
                                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${!isSidebarCollapsed && 'mr-3'}`} />
                                    {!isSidebarCollapsed && <span className="font-medium">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-700">
                        <button
                            onClick={handleLogout}
                            title={isSidebarCollapsed ? 'Logout' : undefined}
                            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors`}
                        >
                            <LogOut className={`w-5 h-5 ${!isSidebarCollapsed && 'mr-3'}`} />
                            {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`${isSidebarCollapsed ? 'ml-20' : 'ml-64'} p-8 transition-all duration-300`}>
                {children}
            </div>
        </div>
    );
}

