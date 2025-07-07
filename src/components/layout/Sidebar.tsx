// src/components/layout/Sidebar.tsx - MATCHES YOUR CSS SYSTEM
import React from 'react';
import { BarChart3, Briefcase, Target, TrendingUp, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const Sidebar: React.FC = () => {
    const { ui, setSelectedTab, progress, toggleSidebar } = useAppStore();

    const navigationItems = [
        {
            id: 'tracker' as const,
            label: 'Tracker',
            icon: Briefcase,
            description: 'Manage applications',
            count: useAppStore.getState().applications.length
        },
        {
            id: 'analytics' as const,
            label: 'Analytics',
            icon: BarChart3,
            description: 'View insights',
            count: null
        }
    ];

    const handleNavClick = (itemId: 'tracker' | 'analytics') => {
        setSelectedTab(itemId);
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            toggleSidebar();
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {ui.sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-16 left-0 z-50 h-[calc(100vh-4rem)]
                glass-card border-r border-gray-200/50 dark:border-gray-700/50
                sidebar-transition
                ${ui.sidebarOpen
                ? 'w-80 translate-x-0'
                : 'w-80 -translate-x-full'
            }
                lg:${ui.sidebarOpen ? 'w-64' : 'w-16'}
                lg:translate-x-0
            `}>
                <div className="flex flex-col h-full sidebar-content">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 lg:hidden">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Navigation
                        </h2>
                        <button
                            onClick={toggleSidebar}
                            className="btn btn-secondary btn-sm"
                            aria-label="Close sidebar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden lg:flex p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className={`flex items-center w-full ${ui.sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                            {ui.sidebarOpen && (
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                                    Navigation
                                </h2>
                            )}
                            <button
                                onClick={toggleSidebar}
                                className="btn btn-secondary btn-sm"
                                aria-label="Toggle sidebar"
                            >
                                <ChevronRight
                                    className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
                                        ui.sidebarOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = ui.selectedTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`
                                        w-full flex items-center rounded-lg transition-all duration-200 interactive
                                        ${ui.sidebarOpen
                                        ? 'px-4 py-3 space-x-3'
                                        : 'p-3 justify-center'
                                    }
                                        ${isActive
                                        ? 'btn-primary'
                                        : 'btn-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }
                                    `}
                                    title={!ui.sidebarOpen ? item.label : undefined}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />

                                    {ui.sidebarOpen && (
                                        <>
                                            <div className="flex-1 text-left">
                                                <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {item.label}
                                                </div>
                                                <div className={`text-xs ${
                                                    isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {item.description}
                                                </div>
                                            </div>

                                            {item.count !== null && (
                                                <span className={`
                                                    px-2 py-1 text-xs rounded-full font-medium
                                                    ${isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                }
                                                `}>
                                                    {item.count}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Goal Progress Section */}
                    {ui.sidebarOpen && (
                        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="glass rounded-lg p-4 border border-blue-200/30 dark:border-blue-700/30">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Goal Progress
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {/* Total Progress */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">Total Goal</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {progress.totalProgress}%
                                            </span>
                                        </div>
                                        <div className="progress-container">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${progress.totalProgress}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {progress.totalApplications} / {useAppStore.getState().goals.totalGoal} applications
                                        </div>
                                    </div>

                                    {/* Weekly Progress */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">Weekly Goal</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {progress.weeklyProgress}%
                                            </span>
                                        </div>
                                        <div className="progress-container">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${progress.weeklyProgress}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {progress.weeklyApplications} / {useAppStore.getState().goals.weeklyGoal} this week
                                        </div>
                                    </div>

                                    {/* Weekly Streak */}
                                    {progress.weeklyStreak > 0 && (
                                        <div className="flex items-center justify-center space-x-2 pt-2 border-t border-blue-200/30 dark:border-blue-700/30">
                                            <TrendingUp className="h-3 w-3 text-orange-500" />
                                            <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                                {progress.weeklyStreak} week streak! 🔥
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Collapsed State Progress Indicator */}
                    {!ui.sidebarOpen && (
                        <div className="hidden lg:block p-2 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                        {progress.totalApplications}
                                    </span>
                                </div>
                                <div className="progress-container h-1">
                                    <div
                                        className="progress-bar h-1"
                                        style={{ width: `${progress.totalProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;