// src/components/layout/Header.tsx - FIXED RESPONSIVE VERSION
import React, { useEffect } from 'react';
import { Briefcase, Menu, Moon, Sun, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const Header: React.FC = () => {
    const { ui, setTheme, toggleSidebar, applications, filteredApplications } = useAppStore();

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

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="h-full px-4 lg:px-6">
                <div className="flex items-center justify-between h-full">
                    {/* Left Section */}
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Mobile Sidebar Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            {ui.sidebarOpen ? (
                                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            ) : (
                                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            )}
                        </button>

                        {/* Logo and Title */}
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                                <Briefcase className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                                    ApplyTrak
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block truncate">
                                    Your Personal Career Dashboard
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        {/* Application Stats - Desktop */}
                        <div className="hidden sm:flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-700 dark:text-green-400 font-medium">
                                    <span className="hidden lg:inline">{applications.length} Apps</span>
                                    <span className="lg:hidden">{applications.length}</span>
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-blue-700 dark:text-blue-400 font-medium">
                                    <span className="hidden lg:inline">{filteredApplications.length} Shown</span>
                                    <span className="lg:hidden">{filteredApplications.length}</span>
                                </span>
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={handleThemeToggle}
                            className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 group"
                            aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <div className="relative z-10 flex items-center justify-center">
                                {ui.theme === 'dark' ? (
                                    <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-180 transition-transform duration-500" />
                                ) : (
                                    <Moon className="h-5 w-5 text-blue-600 group-hover:-rotate-12 transition-transform duration-500" />
                                )}
                            </div>

                            {/* Status indicator */}
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300 ${
                                ui.theme === 'dark'
                                    ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                                    : 'bg-blue-500 shadow-lg shadow-blue-500/50'
                            }`}></div>
                        </button>

                        {/* Welcome Message - Large screens only */}
                        <div className="hidden xl:flex items-center">
                            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Welcome back! 👋
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile App Stats - Below main header */}
                <div className="flex sm:hidden items-center justify-center space-x-4 pb-2 text-xs">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-700 dark:text-green-400 font-medium">{applications.length} Applications</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-700 dark:text-blue-400 font-medium">{filteredApplications.length} Showing</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;