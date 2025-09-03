// src/components/layout/Header.tsx - SIMPLIFIED HEADER WITH ESSENTIAL TABS
import React, {useEffect, useState} from 'react';
import {
    LogIn,
    Menu,
    Moon,
    Sun,
    UserPlus
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import ApplyTrakLogo from '../ui/ApplyTrakLogo';




// ============================================================================
// Types
// ============================================================================



interface AuthButtonsProps {
    onLogin: () => void;
    onSignup: () => void;
    isLoading?: boolean;
}





// ============================================================================
// Authentication Buttons Component - Improved
// ============================================================================

const AuthButtons: React.FC<AuthButtonsProps> = ({onLogin, onSignup, isLoading = false}) => {
    return (
        <div className="flex items-center gap-1.5">
            {/* Sign In Button */}
            <button
                onClick={onLogin}
                disabled={isLoading}
                className="
                    flex items-center justify-center gap-1.5
                    px-3 py-2 sm:px-4 sm:py-2.5
                    text-sm font-medium
                    bg-gray-100 dark:bg-gray-800
                    hover:bg-gray-200 dark:hover:bg-gray-700
                    border border-gray-200 dark:border-gray-700
                    rounded-lg
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    min-h-[44px] min-w-[44px]
                "
                title="Sign in to sync across devices"
            >
                <LogIn className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                <span className="hidden sm:inline text-gray-700 dark:text-gray-300">Sign In</span>
            </button>

            {/* Sign Up Button */}
            <button
                onClick={onSignup}
                disabled={isLoading}
                className="
                    flex items-center justify-center gap-1.5
                    px-3 py-2 sm:px-4 sm:py-2.5
                    text-sm font-medium text-white
                    bg-gradient-to-r from-blue-600 to-purple-600
                    hover:from-blue-700 hover:to-purple-700
                    border border-blue-500
                    rounded-lg
                    transition-all duration-200 shadow-sm hover:shadow-md
                    disabled:opacity-50 disabled:cursor-not-allowed group
                    min-h-[44px] min-w-[44px]
                "
                title="Create account for cloud sync"
            >
                <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform"/>
                <span className="hidden sm:inline">Sign Up</span>
            </button>
        </div>
    );
};



// ============================================================================
// Main Header Component - SIMPLIFIED
// ============================================================================

const Header: React.FC = () => {
    const {
        ui,
        setTheme,
        auth,
        openAuthModal,
        setSelectedTab
    } = useAppStore();
    


    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileMenuOpen]);

    const handleThemeToggle = () => {
        const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    // Authentication handlers
    const handleLogin = () => {
        openAuthModal('login');
    };

    const handleSignup = () => {
        openAuthModal('signup');
    };

    // Tab navigation handlers
    const handleTabClick = (tab: 'home' | 'applications' | 'goals' | 'analytics' | 'profile' | 'features') => {
        setSelectedTab(tab);
    };

    return (
        <>
        <header
            className="header-fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm mobile-menu-container z-40">
            <div className="h-full px-3 sm:px-4 lg:px-6">
                <div className="flex items-center justify-between h-full">

                    {/* LEFT SECTION - Brand and Navigation Tabs */}
                    <div className="flex items-center space-x-6 flex-1 min-w-0">
                        {/* Brand Section */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <ApplyTrakLogo size="sm" className="transition-transform duration-300 hover:scale-110" showText={false} />
                            <div className="min-w-0">
                                <h1 className="font-display text-base sm:text-lg lg:text-xl font-bold text-gradient-static tracking-tight truncate">
                                    ApplyTrak
                                </h1>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="hidden md:flex items-center space-x-1">
                            <button
                                onClick={() => handleTabClick('home')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    ui.selectedTab === 'home'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Home
                            </button>
                            <button
                                onClick={() => handleTabClick('applications')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    ui.selectedTab === 'applications'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Applications
                            </button>
                            <button
                                onClick={() => handleTabClick('goals')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    ui.selectedTab === 'goals'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Goals
                            </button>
                            <button
                                onClick={() => handleTabClick('analytics')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    ui.selectedTab === 'analytics'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Analytics
                            </button>
                            {auth.isAuthenticated && (
                                <button
                                    onClick={() => handleTabClick('profile')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        ui.selectedTab === 'profile'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    Profile
                                </button>
                            )}
                            <button
                                onClick={() => handleTabClick('features')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    ui.selectedTab === 'features'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Features
                            </button>

                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Toggle mobile menu"
                        >
                            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>

                    {/* RIGHT SECTION - Auth and Theme */}
                    <div className="flex items-center space-x-2">
                        {/* Authentication Section */}
                        <div className="flex items-center">
                            {!auth.isAuthenticated && (
                                <AuthButtons
                                    onLogin={handleLogin}
                                    onSignup={handleSignup}
                                    isLoading={auth.isLoading}
                                />
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={handleThemeToggle}
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {ui.theme === 'dark' ? (
                                <Sun className="h-4 w-4 text-yellow-500 transition-transform duration-500"/>
                            ) : (
                                <Moon className="h-4 w-4 text-blue-600 transition-transform duration-500"/>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-lg z-50 mobile-menu-dropdown">
                    <div className="px-4 py-3 space-y-2">
                        <button
                            onClick={() => {
                                handleTabClick('home');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center ${
                                ui.selectedTab === 'home'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            Home
                        </button>
                        <button
                            onClick={() => {
                                handleTabClick('applications');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center ${
                                ui.selectedTab === 'applications'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            Applications
                        </button>
                        <button
                            onClick={() => {
                                handleTabClick('goals');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center ${
                                ui.selectedTab === 'goals'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            Goals
                        </button>
                        <button
                            onClick={() => {
                                handleTabClick('analytics');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center ${
                                ui.selectedTab === 'analytics'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            Analytics
                        </button>
                        {auth.isAuthenticated && (
                            <button
                                onClick={() => {
                                    handleTabClick('profile');
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center ${
                                    ui.selectedTab === 'profile'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Profile
                            </button>
                        )}
                        <button
                            onClick={() => {
                                handleTabClick('features');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center ${
                                ui.selectedTab === 'features'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            Features
                        </button>


                    </div>
                </div>
            )}
        </header>
        

    </>
    );
};

export default Header;