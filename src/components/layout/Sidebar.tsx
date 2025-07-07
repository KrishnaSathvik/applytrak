import React, { useEffect, useState } from 'react';
import { BarChart3, Briefcase, Target, TrendingUp, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const Sidebar: React.FC = () => {
    // 🔧 FIXED: Use goalProgress instead of progress
    const { ui, setSelectedTab, goalProgress, toggleSidebar } = useAppStore();
    const [isDesktop, setIsDesktop] = useState(false);

    // Handle responsive behavior
    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

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
        // Close sidebar on mobile after selection
        if (!isDesktop) {
            toggleSidebar();
        }
    };

    // Determine if we should show full content (text, descriptions, etc.)
    const showFullContent = !isDesktop || ui.sidebarOpen;

    // Calculate sidebar width
    const sidebarWidth = isDesktop
        ? (ui.sidebarOpen ? '256px' : '64px')
        : '320px';

    return (
        <>
            {/* Mobile Overlay - Only show on mobile when sidebar is open */}
            {ui.sidebarOpen && !isDesktop && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-16 left-0 z-50 h-[calc(100vh-4rem)]
                    bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg
                    border-r border-gray-200/50 dark:border-gray-700/50
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${!isDesktop
                    ? (ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full')
                    : 'translate-x-0'
                }
                `}
                style={{ width: sidebarWidth }}
            >
                <div className="flex flex-col h-full">
                    {/* Header Section */}
                    <div className="shrink-0">
                        {/* Mobile Header */}
                        {!isDesktop && (
                            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                                <h2 className="font-display text-xl font-bold text-gradient-static tracking-wide">
                                    Navigation
                                </h2>
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="Close sidebar"
                                >
                                    <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        )}

                        {/* Desktop Header */}
                        {isDesktop && (
                            <div className={`flex p-3 border-b border-gray-200/50 dark:border-gray-700/50 ${ui.sidebarOpen ? 'justify-between items-center' : 'justify-center'}`}>
                                {ui.sidebarOpen && (
                                    <h2 className="font-display text-base font-bold text-gradient-static tracking-wide">
                                        Navigation
                                    </h2>
                                )}
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="Toggle sidebar"
                                >
                                    <ChevronRight
                                        className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${
                                            ui.sidebarOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = ui.selectedTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`
                                        w-full flex items-center rounded-lg transition-all duration-200
                                        ${showFullContent
                                        ? 'px-3 py-3 space-x-3 text-left'
                                        : 'p-3 justify-center'
                                    }
                                        ${isActive
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }
                                    `}
                                    title={!showFullContent ? item.label : undefined}
                                >
                                    {/* Icon with explicit rendering */}
                                    <div className={`flex items-center justify-center ${showFullContent ? 'w-5 h-5' : 'w-6 h-6'}`}>
                                        <Icon
                                            className={`
                                                ${showFullContent ? 'h-5 w-5' : 'h-6 w-6'} 
                                                ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}
                                            `}
                                            strokeWidth={2}
                                        />
                                    </div>

                                    {showFullContent && (
                                        <>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-display font-bold text-base ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'} truncate tracking-tight`}>
                                                    {item.label}
                                                </div>
                                                <div className={`text-xs font-medium ${isActive ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'} truncate tracking-wider`}>
                                                    {item.description}
                                                </div>
                                            </div>

                                            {item.count !== null && (
                                                <span className={`
                                                    px-2 py-1 text-xs rounded-full font-bold shrink-0 tracking-wide
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

                    {/* Goal Progress Section - Only show when expanded */}
                    {showFullContent && (
                        <div className="shrink-0 p-3 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-3 border border-blue-200/30 dark:border-blue-700/30">
                                <div className="flex items-center space-x-2 mb-3">
                                    <div className="flex items-center justify-center w-4 h-4">
                                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                                    </div>
                                    <span className="font-display text-base font-bold text-gradient-static tracking-tight">
                                        Goal Progress
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {/* Total Progress - 🔧 FIXED: Use goalProgress */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase">
                                                Total Goal
                                            </span>
                                            <span className="font-display font-extrabold text-lg text-gradient-blue">
                                                {goalProgress.totalProgress}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(goalProgress.totalProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1 tracking-normal">
                                            <span className="font-bold text-gradient-purple">{goalProgress.totalApplications}</span> / <span className="font-bold text-gradient-blue">{useAppStore.getState().goals.totalGoal}</span> applications
                                        </div>
                                    </div>

                                    {/* Weekly Progress - 🔧 FIXED: Use goalProgress */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase">
                                                Weekly Goal
                                            </span>
                                            <span className="font-extrabold text-gradient-purple">
                                                {goalProgress.weeklyProgress}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(goalProgress.weeklyProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="font-bold text-gradient-blue">{goalProgress.weeklyApplications}</span> / <span className="font-bold text-gradient-purple">{useAppStore.getState().goals.weeklyGoal}</span> this week
                                        </div>
                                    </div>

                                    {/* Weekly Streak - 🔧 FIXED: Use goalProgress */}
                                    {goalProgress.weeklyStreak > 0 && (
                                        <div className="flex items-center justify-center space-x-2 pt-2 border-t border-blue-200/30 dark:border-blue-700/30">
                                            <div className="flex items-center justify-center w-3 h-3">
                                                <TrendingUp className="h-3 w-3 text-orange-500" strokeWidth={2} />
                                            </div>
                                            <span className="text-xs font-bold text-gradient-static tracking-wide">
                                                {goalProgress.weeklyStreak} week streak! 🔥
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Collapsed State Progress Indicator - Only on desktop when collapsed */}
                    {isDesktop && !ui.sidebarOpen && (
                        <div className="shrink-0 p-2 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <span className="font-display text-sm font-extrabold text-white">
                                        {goalProgress.totalApplications}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-1 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(goalProgress.totalProgress, 100)}%` }}
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