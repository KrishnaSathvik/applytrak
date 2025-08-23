// src/components/layout/Header.tsx
import React, {useEffect, useState} from 'react';
import {
    Briefcase,
    CheckCircle,
    ChevronDown,
    Cloud,
    LogIn,
    LogOut,
    Menu,
    Monitor,
    Moon,
    Shield,
    Smartphone,
    Sun,
    TrendingUp,
    UserPlus,
    X,
    Zap
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import ApplyTrakLogo from '../ui/ApplyTrakLogo';
import {createPortal} from 'react-dom';

// ============================================================================
// Types
// ============================================================================

interface UserMenuProps {
    user: any;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onSignOut: () => void;
    onPrivacySettings: () => void;
}

interface AuthButtonsProps {
    onLogin: () => void;
    onSignup: () => void;
    isLoading?: boolean;
}

interface AuthStatusProps {
    isAuthenticated: boolean;
    isLoading: boolean;
}

// ============================================================================
// User Menu Component
// ============================================================================

const UserMenu: React.FC<UserMenuProps> = ({
                                               user,
                                               isOpen,
                                               onToggle,
                                               onClose,
                                               onSignOut,
                                               onPrivacySettings
                                           }) => {
    const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

    const displayName = user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        'User';
    const email = user?.email || '';

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen &&
                !(event.target as Element).closest('.user-menu-container') &&
                !(event.target as Element).closest('.user-dropdown-portal')) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Calculate dropdown position
    const getDropdownPosition = () => {
        if (!buttonRef) return {top: 0, right: 0};

        const rect = buttonRef.getBoundingClientRect();
        return {
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
        };
    };

    const handleSignOutClick = () => {
        onClose();
        onSignOut();
    };

    const handlePrivacyClick = () => {
        onClose();
        onPrivacySettings();
    };

    return (
        <div className="user-menu-container relative">
            {/* User Menu Button */}
            <button
                ref={setButtonRef}
                onClick={onToggle}
                className="
          flex items-center gap-3 p-2.5 rounded-xl
          bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20
          border border-green-200/50 dark:border-green-700/50
          hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30
          transition-all duration-200 shadow-sm hover:shadow-md group
        "
                title={`Signed in as ${displayName}`}
            >
                {/* User Avatar */}
                <div
                    className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                </div>

                {/* User Info (Hidden on mobile) */}
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                        {displayName}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <Cloud className="h-3 w-3"/>
                        Synced
                    </div>
                </div>

                {/* Dropdown Arrow */}
                <ChevronDown
                    className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Portal-based Dropdown */}
            {isOpen && buttonRef && createPortal(
                <div
                    className="user-dropdown-portal fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-80"
                    style={{
                        top: getDropdownPosition().top,
                        right: getDropdownPosition().right,
                        zIndex: 99999
                    }}
                >
                    {/* User Info Header */}
                    <div
                        className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {displayName}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {email}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <CheckCircle className="h-3 w-3 text-green-500"/>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Cloud Sync Active
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        {/* Sync Status */}
                        <div
                            className="px-3 py-2.5 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg my-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Cloud className="h-4 w-4 text-green-600 dark:text-green-400"/>
                                <span className="font-medium text-green-800 dark:text-green-200">Sync Status</span>
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300 mt-1 flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <Monitor className="h-3 w-3"/>
                                    <span>Desktop</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Smartphone className="h-3 w-3"/>
                                    <span>Mobile</span>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                            </div>
                        </div>

                        {/* Privacy Settings */}
                        <button
                            onClick={handlePrivacyClick}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Privacy Settings
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Manage your data preferences
                                </div>
                            </div>
                        </button>

                        {/* Sign Out */}
                        <button
                            onClick={handleSignOutClick}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                            <LogOut className="h-4 w-4"/>
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// ============================================================================
// Authentication Buttons Component
// ============================================================================

const AuthButtons: React.FC<AuthButtonsProps> = ({onLogin, onSignup, isLoading = false}) => {
    return (
        <div className="flex items-center gap-1 sm:gap-2">
            {/* Sign In Button */}
            <button
                onClick={onLogin}
                disabled={isLoading}
                className="
          flex items-center justify-center gap-1 sm:gap-2
          px-2 sm:px-3 py-2 sm:py-2.5
          text-xs sm:text-sm font-medium
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          border border-gray-200 dark:border-gray-700
          rounded-lg sm:rounded-xl
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          min-w-[44px] min-h-[44px]
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
          flex items-center justify-center gap-1 sm:gap-2
          px-2 sm:px-3 py-2 sm:py-2.5
          text-xs sm:text-sm font-medium text-white
          bg-gradient-to-r from-blue-600 to-purple-600
          hover:from-blue-700 hover:to-purple-700
          border border-blue-500
          rounded-lg sm:rounded-xl
          transition-all duration-200 shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed group
          min-w-[44px] min-h-[44px]
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
// Authentication Status Component
// ============================================================================

const AuthStatus: React.FC<AuthStatusProps> = ({isAuthenticated, isLoading}) => {
    if (isLoading) {
        return (
            <div
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md sm:rounded-lg">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-pulse"/>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Loading…</span>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 dark:bg-green-900/20 rounded-md sm:rounded-lg border border-green-200/50 dark:border-green-700/50">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"/>
                <span
                    className="text-xs text-green-600 dark:text-green-400 font-medium hidden sm:inline">Cloud Sync</span>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium sm:hidden">🌐</span>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md sm:rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full"/>
            <span
                className="text-xs text-yellow-600 dark:text-yellow-400 font-medium hidden sm:inline">Local Only</span>
            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium sm:hidden">💾</span>
        </div>
    );
};

// ============================================================================
// Main Header Component
// ============================================================================

const Header: React.FC = () => {
    const {
        ui,
        setTheme,
        toggleSidebar,
        applications,
        auth,
        openAuthModal,
        signOut,
        showToast,
        openPrivacySettings
    } = useAppStore();

    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Theme management
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

    // Authentication handlers
    const handleSignOut = async () => {
        try {
            await signOut();
            setUserMenuOpen(false);
        } catch (error) {
            console.error('Sign out error:', error);
            showToast({
                type: 'error',
                message: 'Failed to sign out. Please try again.'
            });
        }
    };

    const handleLogin = () => {
        setUserMenuOpen(false);
        openAuthModal('login');
    };

    const handleSignup = () => {
        setUserMenuOpen(false);
        openAuthModal('signup');
    };

    const handlePrivacySettings = () => {
        openPrivacySettings();
    };

    // Calculate metrics
    const activeApplications = applications.filter(app => app.status !== 'Rejected').length;
    const successRate = applications.length > 0
        ? Math.round((applications.filter(app => app.status === 'Offer').length / applications.length) * 100)
        : 0;

    return (
        <header
            className="header-fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="h-full px-3 sm:px-4 lg:px-6">
                <div className="flex items-center justify-between h-full">

                    {/* LEFT SECTION */}
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                        {/* Mobile Sidebar Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
                            aria-label="Toggle sidebar"
                        >
                            {ui.sidebarOpen ? (
                                <X className="h-5 w-5 text-gray-700 dark:text-gray-300"/>
                            ) : (
                                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300"/>
                            )}
                        </button>

                        {/* Logo and Title */}
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className="relative">
                                <div
                                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
                                    <ApplyTrakLogo size="sm" className="transition-transform duration-300"/>
                                </div>
                                {auth.isAuthenticated && (
                                    <div
                                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-900 animate-pulse"/>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-extrabold text-gradient-static tracking-tight truncate">
                                    ApplyTrak
                                </h1>
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:block truncate leading-tight">
                                    Your Personal Career Dashboard
                                </p>
                            </div>
                        </div>

                        {/* Mobile Stats */}
                        <div className="hidden sm:flex md:hidden items-center space-x-2">
                            <div
                                className="flex items-center space-x-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200/50 dark:border-green-800/50">
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  {applications.length}
                </span>
                                <span className="text-xs text-green-600 dark:text-green-400">Apps</span>
                                {auth.isAuthenticated && <Cloud className="h-3 w-3 text-green-500"/>}
                            </div>
                        </div>
                    </div>

                    {/* CENTER SECTION - Tablet Stats */}
                    <div className="hidden md:flex lg:hidden items-center space-x-3 px-4">
                        <div
                            className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                            <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400"/>
                            <span className="text-sm font-bold text-green-700 dark:text-green-300">
                {applications.length} Apps
              </span>
                            {auth.isAuthenticated && <Cloud className="h-3 w-3 text-green-500"/>}
                        </div>

                        <div
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {successRate}%
              </span>
                        </div>
                    </div>

                    {/* Desktop Stats */}
                    <div className="hidden lg:flex items-center space-x-4 px-6">
                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50 shadow-sm">
                            <div className="flex items-center space-x-2">
                                <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400"/>
                                {auth.isAuthenticated && <Cloud className="h-3 w-3 text-green-500"/>}
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-blue leading-none">
                                    {applications.length}
                                </div>
                                <div
                                    className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest leading-none">
                                    Total Applications
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-purple leading-none">
                                    {activeApplications}
                                </div>
                                <div
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                                    Active
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50 shadow-sm">
                            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-static leading-none">
                                    {successRate}%
                                </div>
                                <div
                                    className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest leading-none">
                                    Success
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <AuthStatus isAuthenticated={auth.isAuthenticated} isLoading={auth.isLoading}/>
                        </div>
                    </div>

                    {/* RIGHT SECTION */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        {/* Mobile Status */}
                        <div className="sm:hidden">
                            <AuthStatus isAuthenticated={auth.isAuthenticated} isLoading={auth.isLoading}/>
                        </div>

                        {/* Authentication */}
                        <div className="flex items-center">
                            {auth.isAuthenticated ? (
                                <UserMenu
                                    user={auth.user}
                                    isOpen={userMenuOpen}
                                    onToggle={() => setUserMenuOpen(!userMenuOpen)}
                                    onClose={() => setUserMenuOpen(false)}
                                    onSignOut={handleSignOut}
                                    onPrivacySettings={handlePrivacySettings}
                                />
                            ) : (
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
                            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                            aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {ui.theme === 'dark' ? (
                                <Sun
                                    className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 transition-transform duration-500"/>
                            ) : (
                                <Moon
                                    className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 transition-transform duration-500"/>
                            )}
                        </button>

                        {/* Welcome Message - 2XL screens only */}
                        <div className="hidden 2xl:flex items-center">
                            <div
                                className="px-5 py-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="text-2xl animate-bounce">👋</div>
                                    <div>
                                        <div
                                            className="text-sm font-bold text-gradient-static leading-tight tracking-wide">
                                            {auth.isAuthenticated
                                                ? `Welcome back, ${auth.user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!`
                                                : 'Welcome back!'
                                            }
                                        </div>
                                        <div
                                            className="text-xs font-semibold text-blue-700 dark:text-blue-300 tracking-wider">
                                            {auth.isAuthenticated ? 'Your data is synced!' : 'Ready to apply?'}
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