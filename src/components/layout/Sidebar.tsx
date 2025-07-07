// src/components/layout/Sidebar.tsx - COMPLETELY FIXED
import React from 'react';
import { BarChart3, Briefcase, Target, TrendingUp, ChevronRight } from 'lucide-react';
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

    return (
        <>
            {/* Mobile Overlay */}
            {ui.sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* FIXED: Sidebar with proper width and positioning */}
            <aside className={`
                fixed top-16 left-0 z-40 h-[calc(100vh-4rem)]
                bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
                border-r border-gray-200/50 dark:border-gray-700/50
                transition-all duration-300 ease-in-out
                ${ui.sidebarOpen
                ? 'w-64 translate-x-0'
                : 'w-16 -translate-x-full lg:translate-x-0'
            }
                lg:relative lg:top-0 lg:h-[calc(100vh-4rem)]
                shadow-lg
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className={`flex items-center ${ui.sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                            {ui.sidebarOpen && (
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                                    Navigation
                                </h2>
                            )}
                            {/* Toggle button for large screens */}
                            <button
                                onClick={toggleSidebar}
                                className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                                    onClick={() => setSelectedTab(item.id)}
                                    className={`
                                        w-full flex items-center rounded-lg transition-all duration-200
                                        ${ui.sidebarOpen ? 'px-3 py-3 space-x-3' : 'p-3 justify-center'}
                                        ${isActive
                                        ? 'bg-primary-600 text-white shadow-lg'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                                                    isActive ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
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

                    {/* Goal Progress Section - Only when sidebar is open */}
                    {ui.sidebarOpen && (
                        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200/30 dark:border-blue-700/30">
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
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
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
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
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
                        <div className="p-2 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                        {progress.totalApplications}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-1 rounded-full transition-all duration-500"
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