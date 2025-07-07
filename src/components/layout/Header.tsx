// src/components/layout/Header.tsx - MOBILE RESPONSIVE FIXED
import React, { useEffect } from 'react';
import { Briefcase, Menu, Moon, Sun, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const Header: React.FC = () => {
    const { ui, setTheme, toggleSidebar } = useAppStore();

    // FIXED: Ensure DOM class is always in sync with store
    useEffect(() => {
        const isDark = ui.theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        // Also update body for additional styling
        document.body.classList.toggle('dark', isDark);
    }, [ui.theme]);

    const handleThemeToggle = () => {
        const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        // FIXED: Immediate DOM update + localStorage persistence
        const isDark = newTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('theme', newTheme);

        // Force a style recalculation
        document.documentElement.style.colorScheme = newTheme;
    };

    return (
        <header className="glass-card relative z-10 border-b border-white/10 dark:border-black/10 backdrop-blur-md">
            <div className="container mx-auto px-3 sm:px-4">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Left Section - MOBILE OPTIMIZED */}
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
                        {/* Mobile Sidebar Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden btn btn-secondary p-2 hover:scale-105 transition-transform duration-200"
                            aria-label="Toggle sidebar"
                        >
                            {ui.sidebarOpen ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <Menu className="h-4 w-4" />
                            )}
                        </button>

                        {/* Logo and Title - ALWAYS VISIBLE */}
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                            <div className="glass rounded-lg sm:rounded-xl p-2 sm:p-3 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 hover:scale-110 transition-transform duration-300">
                                <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                {/* MOBILE: Always show ApplyTrak */}
                                <h1 className="text-lg sm:text-xl font-bold text-gradient bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent truncate">
                                    ApplyTrak
                                </h1>
                                {/* MOBILE: Hide subtitle on very small screens */}
                                <p className="text-xs text-gray-500 dark:text-gray-400 hidden xs:block sm:block truncate">
                                    Track your job search journey
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - MOBILE OPTIMIZED */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Application Stats - RESPONSIVE */}
                        <div className="hidden sm:flex items-center space-x-3 lg:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="hidden lg:inline">{useAppStore.getState().applications.length} Apps</span>
                                <span className="lg:hidden">{useAppStore.getState().applications.length}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                <span className="hidden lg:inline">{useAppStore.getState().filteredApplications.length} Shown</span>
                                <span className="lg:hidden">{useAppStore.getState().filteredApplications.length}</span>
                            </div>
                        </div>

                        {/* Theme Toggle - MOBILE FRIENDLY */}
                        <button
                            onClick={handleThemeToggle}
                            className="theme-toggle glass rounded-lg sm:rounded-xl p-2 sm:p-3 hover:scale-110 transition-all duration-300 group relative min-w-[40px] min-h-[40px] sm:min-w-[48px] sm:min-h-[48px]"
                            aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
                            title={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <div className="relative z-10 flex items-center justify-center">
                                {ui.theme === 'dark' ? (
                                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover:rotate-180 transition-transform duration-500" />
                                ) : (
                                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-hover:-rotate-12 transition-transform duration-500" />
                                )}
                            </div>

                            {/* Enhanced visual feedback */}
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-blue-400/0 group-hover:from-yellow-400/20 group-hover:to-blue-400/20 transition-all duration-300 rounded-lg sm:rounded-xl"></div>
                            <div className="absolute inset-0 bg-white/20 dark:bg-black/20 rounded-lg sm:rounded-xl scale-0 group-active:scale-100 transition-transform duration-200"></div>

                            {/* Theme indicator - SMALLER ON MOBILE */}
                            <div className={`absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                                ui.theme === 'dark'
                                    ? 'bg-yellow-400 shadow-yellow-400/50'
                                    : 'bg-blue-500 shadow-blue-500/50'
                            } shadow-lg`}></div>
                        </button>

                        {/* User Profile/Settings - HIDE ON MOBILE */}
                        <div className="hidden xl:flex items-center space-x-2">
                            <div className="glass rounded-xl p-2 px-4">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Welcome back! 👋
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile App Stats - SHOW BELOW ON MOBILE */}
                <div className="flex sm:hidden items-center justify-center space-x-4 pb-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span>{useAppStore.getState().applications.length} Applications</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <span>{useAppStore.getState().filteredApplications.length} Showing</span>
                    </div>
                </div>

                {/* Progress indicator for page loading */}
                {ui.isLoading && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-secondary-400 animate-pulse"></div>
                )}
            </div>
        </header>
    );
};

export default Header;