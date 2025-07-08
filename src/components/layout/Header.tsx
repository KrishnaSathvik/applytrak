// src/components/layout/Header.tsx - FIXED VERSION WITHOUT PERSISTENT DOTS
import React, { useEffect } from 'react';
import { Briefcase, Menu, Moon, Sun, X, Zap, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const Header: React.FC = () => {
    const { ui, setTheme, toggleSidebar, applications, filteredApplications, goalProgress } = useAppStore();

    useEffect(() => {
        const isDark = ui.theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
    }, [ui.theme]);

    const handleThemeToggle = () => {
        const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        const isDark = newTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('theme', newTheme);
        document.documentElement.style.colorScheme = newTheme;
    };

    // Calculate success metrics for enhanced stats
    const activeApplications = applications.filter(app => app.status !== 'Rejected').length;
    const successRate = applications.length > 0
        ? Math.round((applications.filter(app => app.status === 'Offer').length / applications.length) * 100)
        : 0;

    return (
        <header className="header-fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="h-full px-4 lg:px-6">
                <div className="flex items-center justify-between h-full">
                    {/* Left Section - Enhanced WITHOUT DOTS */}
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Mobile Sidebar Toggle - Enhanced WITHOUT DOTS */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 shadow-sm hover:shadow-md group"
                            aria-label="Toggle sidebar"
                        >
                            {ui.sidebarOpen ? (
                                <X className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-200" />
                            ) : (
                                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform duration-200" />
                            )}
                        </button>

                        {/* Logo and Title - Enhanced WITHOUT PERSISTENT DOTS */}
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {/* Enhanced Logo WITHOUT PERSISTENT PULSE DOT */}
                            <div className="relative">
                                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 group">
                                    <Briefcase className="h-5 w-5 sm:h-7 sm:w-7 text-white group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                {/* REMOVED: Persistent pulse indicator that was causing green dot */}
                            </div>

                            {/* Enhanced Title Section */}
                            <div className="min-w-0 flex-1">
                                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-gradient-static tracking-tight">
                                    ApplyTrak
                                </h1>
                                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:block truncate leading-tight">
                                    Your Personal Career Dashboard
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Center Section - Enhanced Stats WITHOUT PERSISTENT DOTS */}
                    <div className="hidden xl:flex items-center space-x-6 px-6">
                        {/* Applications Count WITHOUT PERSISTENT DOTS */}
                        <div className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50 shadow-sm">
                            <div className="flex items-center space-x-2">
                                {/* REMOVED: Persistent animate-pulse dot that was causing green dot */}
                                <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-blue leading-none">
                                    {applications.length}
                                </div>
                                <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest leading-none">
                                    Total Apps
                                </div>
                            </div>
                        </div>

                        {/* Active Applications WITHOUT PERSISTENT DOTS */}
                        <div className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                            <div className="flex items-center space-x-2">
                                {/* REMOVED: Persistent blue dot that was always showing */}
                                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-purple leading-none">
                                    {activeApplications}
                                </div>
                                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                                    Active
                                </div>
                            </div>
                        </div>

                        {/* Success Rate WITHOUT PERSISTENT DOTS */}
                        <div className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50 shadow-sm">
                            <div className="flex items-center space-x-2">
                                {/* REMOVED: Persistent purple dot */}
                                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-static leading-none">
                                    {successRate}%
                                </div>
                                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest leading-none">
                                    Success
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Enhanced WITHOUT PERSISTENT DOTS */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Application Stats - Tablet/Small Desktop Only WITHOUT PERSISTENT DOTS */}
                        <div className="hidden md:flex xl:hidden items-center space-x-3 text-sm">
                            <div className="flex items-center space-x-2.5 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50 shadow-sm">
                                {/* REMOVED: Persistent green animate-pulse dot */}
                                <span className="font-bold text-green-700 dark:text-green-300">
                                    <span className="font-extrabold text-gradient-blue">{applications.length}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider ml-1">Apps</span>
                                </span>
                            </div>
                            <div className="flex items-center space-x-2.5 px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                                {/* REMOVED: Persistent blue dot */}
                                <span className="font-bold text-blue-700 dark:text-blue-300">
                                    <span className="font-extrabold text-gradient-purple">{filteredApplications.length}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider ml-1">Shown</span>
                                </span>
                            </div>
                        </div>

                        {/* Enhanced Theme Toggle - KEEPING ONLY FUNCTIONAL INDICATOR */}
                        <button
                            onClick={handleThemeToggle}
                            className="relative p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 group shadow-lg hover:shadow-xl"
                            aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <div className="relative z-10 flex items-center justify-center">
                                {ui.theme === 'dark' ? (
                                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm" />
                                ) : (
                                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm" />
                                )}
                            </div>

                            {/* MODIFIED: Only show theme indicator when hovering, not persistent */}
                            <div className={`absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                                ui.theme === 'dark'
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50'
                            }`}></div>

                            {/* Hover glow effect */}
                            <div className={`absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                ui.theme === 'dark'
                                    ? 'bg-gradient-to-br from-yellow-400/10 to-orange-500/10'
                                    : 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10'
                            }`}></div>
                        </button>

                        {/* Enhanced Welcome Message - Large screens only */}
                        <div className="hidden 2xl:flex items-center">
                            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="text-2xl animate-bounce">👋</div>
                                    <div>
                                        <div className="text-sm font-bold text-gradient-static leading-tight tracking-wide">
                                            Welcome back!
                                        </div>
                                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 tracking-wider">
                                            Ready to apply?
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;