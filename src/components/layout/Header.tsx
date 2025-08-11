// src/components/layout/Header.tsx - ENHANCED WITH AUTHENTICATION INTEGRATION + CONSISTENT STYLING
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
    Settings,
    Smartphone,
    Sun,
    TrendingUp,
    UserPlus,
    X,
    Zap
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import ApplyTrakLogo from '../ui/ApplyTrakLogo';

// ============================================================================
// 🔐 USER MENU DROPDOWN COMPONENT - Authentication user interface
// ============================================================================

interface UserMenuProps {
    user: any; // Supabase User type
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onSignOut: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({user, isOpen, onToggle, onClose, onSignOut}) => {
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !(event.target as Element).closest('.user-menu-container')) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Get user display name and email
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const email = user?.email || '';

    return (
        <div className="user-menu-container relative">
            {/* User Menu Button */}
            <button
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
                    className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="
                    absolute right-0 mt-2 w-80
                    bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
                    border border-gray-200/50 dark:border-gray-700/50
                    rounded-2xl shadow-2xl z-50
                    animate-slideDown origin-top-right
                ">
                    {/* User Info Header */}
                    <div
                        className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
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
                        {/* Account Settings */}
                        <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                            onClick={() => {
                                onClose();
                                // TODO: Implement account settings
                                console.log('Account settings clicked');
                            }}
                        >
                            <Settings className="h-4 w-4 text-gray-500"/>
                            <span className="text-sm font-medium">Account Settings</span>
                        </button>

                        {/* Sync Status */}
                        <div
                            className="px-3 py-2.5 border-l-2 border-green-500 bg-green-50/50 dark:bg-green-900/20 rounded-lg my-1">
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
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={() => {
                                onClose();
                                onSignOut();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                            <LogOut className="h-4 w-4"/>
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// 🔐 AUTHENTICATION BUTTONS COMPONENT - Consistent with Design System
// ============================================================================

interface AuthButtonsProps {
    onLogin: () => void;
    onSignup: () => void;
    isLoading?: boolean;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({onLogin, onSignup, isLoading = false}) => {
    return (
        <div className="flex items-center gap-2">
            {/* Sign In Button - Using Design System */}
            <button
                onClick={onLogin}
                disabled={isLoading}
                className="
                    btn btn-secondary btn-sm
                    flex items-center gap-2 text-sm font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                "
                title="Sign in to sync across devices"
            >
                <LogIn className="h-4 w-4"/>
                <span className="hidden sm:inline">Sign In</span>
            </button>

            {/* Sign Up Button - Using Design System */}
            <button
                onClick={onSignup}
                disabled={isLoading}
                className="
                    btn btn-primary btn-sm
                    flex items-center gap-2 text-sm font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed group
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
// 🔐 AUTHENTICATION STATUS INDICATOR - Visual sync status
// ============================================================================

interface AuthStatusProps {
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthStatus: React.FC<AuthStatusProps> = ({isAuthenticated, isLoading}) => {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"/>
                <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Cloud Sync</span>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"/>
            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Local Only</span>
        </div>
    );
};

// ============================================================================
// MAIN HEADER COMPONENT - ENHANCED WITH AUTHENTICATION INTEGRATION
// ============================================================================

const Header: React.FC = () => {
    const {
        ui,
        setTheme,
        toggleSidebar,
        applications,
        filteredApplications,
        goalProgress,
        // ✨ NEW: Authentication state and actions
        auth,
        openAuthModal,
        signOut,
        showToast
    } = useAppStore();

    // ✨ NEW: User menu state management
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // ============================================================================
    // 🎨 THEME MANAGEMENT - Enhanced with authentication awareness
    // ============================================================================

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

    // ============================================================================
    // ✨ NEW: Authentication handlers
    // ============================================================================

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

    // ============================================================================
    // 📊 ENHANCED METRICS CALCULATION - Authentication-aware
    // ============================================================================

    // Calculate success metrics for enhanced stats
    const activeApplications = applications.filter(app => app.status !== 'Rejected').length;
    const successRate = applications.length > 0
        ? Math.round((applications.filter(app => app.status === 'Offer').length / applications.length) * 100)
        : 0;

    // ✨ NEW: Enhanced metrics with authentication context
    const enhancedMetrics = {
        totalApps: applications.length,
        activeApps: activeApplications,
        successRate,
        syncStatus: auth.isAuthenticated ? 'cloud' : 'local',
        deviceCount: auth.isAuthenticated ? '📱💻' : '💻'
    };

    return (
        <header
            className="header-fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="h-full px-4 lg:px-6">
                <div className="flex items-center justify-between h-full">

                    {/* ============================================================================
                        🏠 LEFT SECTION - Logo, Title, and Mobile Menu
                        ============================================================================ */}

                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Enhanced Mobile Sidebar Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 shadow-sm hover:shadow-md group"
                            aria-label="Toggle sidebar"
                        >
                            {ui.sidebarOpen ? (
                                <X className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-200"/>
                            ) : (
                                <Menu
                                    className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform duration-200"/>
                            )}
                        </button>

                        {/* Enhanced Logo and Title Section */}
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {/* Logo Container with Authentication Status */}
                            <div className="relative">
                                <div
                                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                                    <ApplyTrakLogo
                                        size="sm"
                                        className="group-hover:scale-110 transition-transform duration-300"
                                        priority={true}
                                    />
                                </div>

                                {/* ✨ NEW: Authentication status indicator on logo */}
                                {auth.isAuthenticated && (
                                    <div
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                                )}
                            </div>

                            {/* Title and Subtitle */}
                            <div className="min-w-0 flex-1">
                                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-gradient-static tracking-tight">
                                    ApplyTrak
                                </h1>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:block truncate leading-tight">
                                        Your Personal Career Dashboard
                                    </p>
                                    {/* ✨ NEW: Auth status in subtitle area (mobile) */}
                                    <div className="sm:hidden">
                                        <AuthStatus
                                            isAuthenticated={auth.isAuthenticated}
                                            isLoading={auth.isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================================
                        📊 CENTER SECTION - Enhanced Stats with Authentication Context
                        ============================================================================ */}

                    <div className="hidden xl:flex items-center space-x-6 px-6">
                        {/* Total Applications - Enhanced */}
                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50 shadow-sm">
                            <div className="flex items-center space-x-2">
                                <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400"/>
                                {/* ✨ NEW: Authentication-aware icon */}
                                {auth.isAuthenticated && <Cloud className="h-3 w-3 text-green-500"/>}
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-blue leading-none">
                                    {enhancedMetrics.totalApps}
                                </div>
                                <div
                                    className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest leading-none">
                                    Total Applications
                                </div>
                            </div>
                        </div>

                        {/* Active Applications - Enhanced */}
                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                            <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-purple leading-none">
                                    {enhancedMetrics.activeApps}
                                </div>
                                <div
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                                    Active
                                </div>
                            </div>
                        </div>

                        {/* Success Rate - Enhanced */}
                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50 shadow-sm">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-extrabold text-gradient-static leading-none">
                                    {enhancedMetrics.successRate}%
                                </div>
                                <div
                                    className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest leading-none">
                                    Success
                                </div>
                            </div>
                        </div>

                        {/* ✨ NEW: Authentication Status Card */}
                        <div
                            className="flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <AuthStatus
                                isAuthenticated={auth.isAuthenticated}
                                isLoading={auth.isLoading}
                            />
                        </div>
                    </div>

                    {/* ============================================================================
                        🔧 RIGHT SECTION - Enhanced with Authentication Controls
                        ============================================================================ */}

                    <div className="flex items-center space-x-2 sm:space-x-4">

                        {/* Application Stats - Tablet/Small Desktop (Enhanced) */}
                        <div className="hidden md:flex xl:hidden items-center space-x-3 text-sm">
                            <div
                                className="flex items-center space-x-2.5 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-800/50 shadow-sm">
                                <span className="font-bold text-green-700 dark:text-green-300">
                                    <span className="font-extrabold text-gradient-blue">{applications.length}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider ml-1">Apps</span>
                                </span>
                                {/* ✨ NEW: Sync indicator */}
                                {auth.isAuthenticated && <Cloud className="h-3 w-3 text-green-500"/>}
                            </div>

                            <div
                                className="flex items-center space-x-2.5 px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                                <span className="font-bold text-blue-700 dark:text-blue-300">
                                    <span
                                        className="font-extrabold text-gradient-purple">{filteredApplications.length}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider ml-1">Shown</span>
                                </span>
                            </div>
                        </div>

                        {/* ✨ NEW: Authentication Section */}
                        <div className="flex items-center space-x-2">
                            {auth.isAuthenticated ? (
                                /* 👤 Authenticated User Menu */
                                <UserMenu
                                    user={auth.user}
                                    isOpen={userMenuOpen}
                                    onToggle={() => setUserMenuOpen(!userMenuOpen)}
                                    onClose={() => setUserMenuOpen(false)}
                                    onSignOut={handleSignOut}
                                />
                            ) : (
                                /* 🔐 Authentication Buttons */
                                <AuthButtons
                                    onLogin={handleLogin}
                                    onSignup={handleSignup}
                                    isLoading={auth.isLoading}
                                />
                            )}
                        </div>

                        {/* Enhanced Theme Toggle */}
                        <button
                            onClick={handleThemeToggle}
                            className="relative p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 group shadow-lg hover:shadow-xl"
                            aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            <div className="relative z-10 flex items-center justify-center">
                                {ui.theme === 'dark' ? (
                                    <Sun
                                        className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm"/>
                                ) : (
                                    <Moon
                                        className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm"/>
                                )}
                            </div>

                            {/* Theme indicator */}
                            <div
                                className={`absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                                    ui.theme === 'dark'
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50'
                                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50'
                                }`}></div>

                            {/* Hover glow effect */}
                            <div
                                className={`absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                    ui.theme === 'dark'
                                        ? 'bg-gradient-to-br from-yellow-400/10 to-orange-500/10'
                                        : 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10'
                                }`}></div>
                        </button>

                        {/* Enhanced Welcome Message - Large screens only */}
                        <div className="hidden 2xl:flex items-center">
                            <div
                                className="px-5 py-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="text-2xl animate-bounce">👋</div>
                                    <div>
                                        <div
                                            className="text-sm font-bold text-gradient-static leading-tight tracking-wide">
                                            {auth.isAuthenticated ? `Welcome back, ${auth.user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!` : 'Welcome back!'}
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