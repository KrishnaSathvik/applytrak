// src/components/admin/AdminDashboard.tsx - PRODUCTION READY
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    BarChart3,
    Bug,
    Database,
    Download,
    FileText,
    Heart,
    Lightbulb,
    MessageSquare,
    RefreshCw,
    Shield,
    Star,
    TrendingUp,
    Users,
    X
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {feedbackService} from '../../services/feedbackService';
import {analyticsService} from '../../services/analyticsService';


// Type definitions
type SectionId = 'overview' | 'analytics' | 'feedback' | 'users';
type FeedbackFilter = 'all' | 'love' | 'bug' | 'feature' | 'general';
type SortBy = 'newest' | 'oldest' | 'rating-high' | 'rating-low';
type StatusFilter = 'all' | 'unread' | 'read' | 'flagged';

// Constants
const FEEDBACK_PER_PAGE = 20;
const AUTO_REFRESH_INTERVAL = 30;

// Navigation sections configuration
const sections = [
    {id: 'overview' as const, label: 'Overview', icon: BarChart3},
    {id: 'analytics' as const, label: 'Analytics', icon: TrendingUp},
    {id: 'feedback' as const, label: 'Feedback', icon: MessageSquare},
    {id: 'users' as const, label: 'Users', icon: Users},
];

// Enhanced metrics overview component
const EnhancedMetricsOverview: React.FC<{
    isRealtime: boolean;
    isAuthenticated: boolean
}> = ({isRealtime, isAuthenticated}) => {
    const {adminAnalytics, applications} = useAppStore();

    const enhancedMetrics = useMemo(() => {
        const totalUsers = adminAnalytics?.userMetrics?.totalUsers || 1;
        const activeDaily = adminAnalytics?.userMetrics?.activeUsers?.daily || (isAuthenticated ? 1 : 0);
        const activeWeekly = adminAnalytics?.userMetrics?.activeUsers?.weekly || (isAuthenticated ? 1 : 0);
        const totalSessions = adminAnalytics?.usageMetrics?.totalSessions || 0;
        const avgSessionDuration = adminAnalytics?.usageMetrics?.averageSessionDuration || 0;
        const totalAppsCreated = adminAnalytics?.usageMetrics?.totalApplicationsCreated || applications.length;

        return {
            totalUsers,
            activeDaily,
            activeWeekly,
            totalSessions,
            avgSessionDuration,
            totalAppsCreated
        };
    }, [isRealtime, isAuthenticated, adminAnalytics, applications.length]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
                    {enhancedMetrics.totalUsers}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {isRealtime && isAuthenticated ? "Platform Users" : "Total Users"}
                </div>
            </div>
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
                    {enhancedMetrics.activeDaily}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Active Today</div>
            </div>
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mb-1">
                    {enhancedMetrics.totalSessions}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Sessions</div>
            </div>
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1">
                    {enhancedMetrics.totalAppsCreated}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Applications</div>
            </div>
        </div>
    );
};

// System health panel component
const SystemHealthPanel: React.FC<{
    isRealtime: boolean;
    isAuthenticated: boolean
}> = ({isRealtime, isAuthenticated}) => {
    const {adminAnalytics} = useAppStore();

    const healthMetrics = useMemo(() => {
        const sessionsCount = adminAnalytics?.usageMetrics?.totalSessions || 0;
        const featuresUsed = adminAnalytics?.usageMetrics?.featuresUsage
            ? Object.keys(adminAnalytics.usageMetrics.featuresUsage).length
            : 0;

        return {
            analyticsService: 'Active',
            dataStorage: isRealtime ? 'Cloud + Local' : 'Local Storage',
            userSessions: `${sessionsCount} tracked`,
            featuresActive: `${featuresUsed} features`,
            authService: isAuthenticated ? 'Authenticated' : 'Guest Mode',
            systemMode: isRealtime
                ? (isAuthenticated ? 'Multi-User SaaS' : 'Real-time Local')
                : 'Single-User Local'
        };
    }, [isRealtime, isAuthenticated, adminAnalytics]);

    const getStatusColor = useCallback((key: string, value: string) => {
        if (key === 'systemMode') {
            if (value.includes('Multi-User')) return 'text-blue-600 dark:text-blue-400';
            if (value.includes('Real-time')) return 'text-green-600 dark:text-green-400';
            return 'text-gray-600 dark:text-gray-300 dark:text-gray-400';
        }
        if (value.includes('Active') || value.includes('Authenticated') || value === 'Cloud + Local') {
            return 'text-green-600 dark:text-green-400';
        }
        if (value.includes('Guest') || value === 'Local Storage') {
            return 'text-yellow-600 dark:text-yellow-400';
        }
        return 'text-gray-600 dark:text-gray-300 dark:text-gray-400';
    }, []);

    const getDotColor = useCallback((key: string, value: string) => {
        const textColor = getStatusColor(key, value);
        if (textColor.includes('green')) return 'bg-green-500';
        if (textColor.includes('blue')) return 'bg-blue-500';
        if (textColor.includes('yellow')) return 'bg-yellow-500';
        return 'bg-gray-500';
    }, [getStatusColor]);

    return (
        <div className="glass-card">
            <div className="mb-2 sm:mb-3">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Database className="h-4 w-4 sm:h-5 sm:w-5"/>
                    System Health
                    {isRealtime && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">LIVE</span>
                    )}
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-300">System status and configuration</p>
            </div>
            <div className="space-y-3">
                {Object.entries(healthMetrics).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${getStatusColor(key, value)}`}>
                            <div className={`w-2 h-2 rounded-full ${getDotColor(key, value)}`}/>
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main AdminDashboard component
const AdminDashboard: React.FC = () => {
    const {
        ui,
        applications,
        goals,
        goalProgress,
        analytics,
        closeAdminDashboard,
        setAdminSection,
        adminAnalytics,
        adminFeedback,
        showToast,
        refreshAllAdminData,
        resetRefreshErrors,
        getGlobalRefreshStatus,
        enableAutoRefresh,
        disableAutoRefresh,

        isAdminRealtime,
        auth,
        loadRealtimeAdminAnalytics,
        loadRealtimeFeedbackSummary
    } = useAppStore();

    // Local state
    const [isExporting, setIsExporting] = useState(false);
    const [timeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [typeFilter] = useState<FeedbackFilter>('all');
    const [statusFilter] = useState<StatusFilter>('all');
    const [sortBy] = useState<SortBy>('newest');
    const [searchQuery] = useState('');
    const [currentPage] = useState(1);

    // Derived state
    const isDashboardOpen = ui.admin.dashboardOpen;
    const isAuthenticated = auth.isAuthenticated;
    const currentSection = ui.admin.currentSection;
    const globalRefreshStatus = getGlobalRefreshStatus();

    // Admin state validation
    const adminState = useMemo(() => {
        return {
            isDashboardOpen,
            isAuthenticated,
            currentSection,
            globalRefreshStatus
        };
    }, [isDashboardOpen, isAuthenticated, currentSection, globalRefreshStatus]);

    // Feedback processing and pagination
    const paginatedFeedback = useMemo(() => {
        if (!adminFeedback?.recentFeedback) return { items: [], totalPages: 0, totalItems: 0 };

        let filtered = [...adminFeedback.recentFeedback];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(feedback =>
                feedback.message.toLowerCase().includes(query) ||
                feedback.type.toLowerCase().includes(query) ||
                feedback.userAgent?.toLowerCase().includes(query)
            );
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(feedback => feedback.type === typeFilter);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(feedback => {
                switch (statusFilter) {
                    case 'unread':
                        return !feedback.metadata?.read;
                    case 'read':
                        return feedback.metadata?.read;
                    case 'flagged':
                        return feedback.metadata?.flagged;
                    default:
                        return true;
                }
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                case 'oldest':
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                case 'rating-high':
                    return b.rating - a.rating;
                case 'rating-low':
                    return a.rating - b.rating;
                default:
                    return 0;
            }
        });

        // Apply pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / FEEDBACK_PER_PAGE);
        const startIndex = (currentPage - 1) * FEEDBACK_PER_PAGE;
        const endIndex = startIndex + FEEDBACK_PER_PAGE;
        const items = filtered.slice(startIndex, endIndex);

        return { items, totalPages, totalItems };
    }, [adminFeedback?.recentFeedback, searchQuery, typeFilter, statusFilter, sortBy, currentPage]);

    // Unified admin system initialization
    useEffect(() => {
        if (!isDashboardOpen || !isAuthenticated) return;

        console.log('🚀 Initializing unified admin dashboard system...');
        console.log('📊 Admin dashboard initialization state:', {
            isDashboardOpen,
            isAuthenticated,
            isAdminRealtime,
            hasAdminFeedback: !!adminFeedback,
            feedbackCount: adminFeedback?.recentFeedback?.length || 0
        });

        let autoRefreshInterval: NodeJS.Timeout | null = null;
        let retryTimeout: NodeJS.Timeout | null = null;
        let debounceTimeout: NodeJS.Timeout | null = null;

        const startUnifiedAdminSystem = async () => {
            console.log('🔄 Starting unified admin system...');

            try {
                // Initial data load with error handling
                await refreshAllAdminData();
            } catch (error) {
                console.error('❌ Initial admin data load failed:', error);
                showToast({
                    type: 'warning',
                    message: 'Some admin data could not be loaded. Using local data.',
                    duration: 5000
                });
            }

            // Auto-refresh setup
            if (globalRefreshStatus.autoRefreshEnabled) {
                autoRefreshInterval = setInterval(async () => {
                    console.log('🔄 Auto-refresh triggered');
                    try {
                        await refreshAllAdminData();
                    } catch (error) {
                        console.error('❌ Auto-refresh failed:', error);
                        // Don't show toast for auto-refresh failures to avoid spam
                    }
                }, AUTO_REFRESH_INTERVAL * 1000);
            }

            // Realtime admin setup
            if (isAdminRealtime) {
                // Note: Realtime updates are handled by the store's enableRealtimeAdmin method
                console.log('🔄 Realtime admin mode enabled');
            }
        };

        startUnifiedAdminSystem();

        return () => {
            console.log('🧹 Cleaning up unified admin dashboard system...');

            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            if (retryTimeout) clearTimeout(retryTimeout);
            if (debounceTimeout) clearTimeout(debounceTimeout);

            if (globalRefreshStatus.autoRefreshEnabled && !isDashboardOpen) {
                console.log('⏹️ Disabling global auto-refresh - dashboard closing');
                disableAutoRefresh();
            }
        };
    }, [isDashboardOpen, isAuthenticated, globalRefreshStatus.autoRefreshEnabled, isAdminRealtime, refreshAllAdminData, loadRealtimeAdminAnalytics, loadRealtimeFeedbackSummary, showToast, disableAutoRefresh]);

    // Visibility change handling
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (globalRefreshStatus.autoRefreshEnabled) {
                    console.log('⏸️ Pausing auto-refresh - tab hidden');
                    disableAutoRefresh();
                }
            } else {
                if (isDashboardOpen && isAuthenticated) {
                    console.log('▶️ Resuming auto-refresh - tab visible');
                    enableAutoRefresh(AUTO_REFRESH_INTERVAL);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isDashboardOpen, isAuthenticated, globalRefreshStatus.autoRefreshEnabled, enableAutoRefresh, disableAutoRefresh]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isDashboardOpen || !isAuthenticated) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'r':
                        e.preventDefault();
                        handleUnifiedRefresh();
                        break;
                    case 'e':
                        e.preventDefault();
                        handleExportData();
                        break;
                }
            }

            if (e.key === 'Escape') {
                closeAdminDashboard();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isDashboardOpen, isAuthenticated]);

    // Event handlers
    const handleUnifiedRefresh = useCallback(async () => {
        console.log('🔄 Unified global refresh initiated from UI');

        if (globalRefreshStatus.refreshErrors.length > 0) {
            resetRefreshErrors();
        }

        try {
            await refreshAllAdminData();
        } catch (error) {
            console.error('❌ Unified refresh failed from UI:', error);
            showToast({
                type: 'error',
                message: 'Global refresh failed from UI layer'
            });
        }
    }, [globalRefreshStatus.refreshErrors.length, resetRefreshErrors, refreshAllAdminData, showToast]);

    const handleExportData = useCallback(async () => {
        setIsExporting(true);
        try {
            const analyticsData = analyticsService.exportAnalyticsData();
            const feedbackData = feedbackService.exportFeedbackData();

            const exportData = {
                exportDate: new Date().toISOString(),
                timeRange,
                mode: isAdminRealtime
                    ? (auth.isAuthenticated ? 'Multi-User SaaS Cloud' : 'Real-time Local')
                    : 'Single-User Local',
                analytics: analyticsData,
                feedback: feedbackData,
                applyTrakData: {
                    totalApplications: applications.length,
                    goals,
                    goalProgress,
                    analytics
                },
                saasMetrics: isAdminRealtime && auth.isAuthenticated ? {
                    totalUsers: adminAnalytics?.userMetrics?.totalUsers || 1,
                    activeUsersDaily: adminAnalytics?.userMetrics?.activeUsers?.daily || 0,
                    totalSessions: adminAnalytics?.usageMetrics?.totalSessions || 0
                } : null,
                refreshMetadata: {
                    autoRefreshEnabled: globalRefreshStatus.autoRefreshEnabled,
                    realtimeEnabled: isAdminRealtime
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applytrak-admin-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: 'Admin data exported successfully'
            });
        } catch (error) {
            console.error('Export failed:', error);
            showToast({
                type: 'error',
                message: 'Failed to export admin data'
            });
        } finally {
            setIsExporting(false);
        }
    }, [timeRange, isAdminRealtime, auth.isAuthenticated, applications.length, goals, goalProgress, analytics, adminAnalytics, globalRefreshStatus, showToast]);

    const handleLogout = useCallback(() => {
        closeAdminDashboard();
        showToast({
            type: 'info',
            message: 'Admin dashboard closed'
        });
    }, [closeAdminDashboard, showToast]);

    const getFeedbackTypeIcon = (type: string) => {
        switch (type) {
            case 'love': return Heart;
            case 'bug': return Bug;
            case 'feature': return Lightbulb;
            default: return MessageSquare;
        }
    };

    const getFeedbackTypeColor = (type: string) => {
        switch (type) {
            case 'love': return 'text-red-600 bg-red-100';
            case 'bug': return 'text-red-600 bg-red-100';
            case 'feature': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-blue-600 bg-blue-100';
        }
    };

    // Early returns for error states
    if (!adminState) {
        console.error('Admin state not initialized in store');
        return createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="glass-card p-6">
                    <p className="text-red-600">Admin state not initialized. Please refresh the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    if (!isDashboardOpen || !isAuthenticated) {
        return null;
    }

    // Main admin dashboard content
    const adminContent = (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm overflow-hidden">
            <div className="flex h-full">
                {/* Main Content */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto relative z-10">
                    <div className="space-y-2 md:space-y-4 p-4">
                        {/* Header Section */}
                        <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3">
                                <div className="space-y-0.5 sm:space-y-1">
                                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                                        Admin Dashboard
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-base">
                                        {isAdminRealtime && auth.isAuthenticated ? 'SaaS Analytics & Management' : 'Job Application Analytics'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500">
                                        <span>Mode: {isAdminRealtime ? (auth.isAuthenticated ? 'Multi-User SaaS' : 'Real-time Local') : 'Single-User Local'}</span>
                                        {isAdminRealtime && (
                                            <span className="text-green-600 font-semibold">● LIVE</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                    <button
                                        onClick={handleUnifiedRefresh}
                                        disabled={globalRefreshStatus.isRefreshing}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors flex items-center justify-center min-h-[36px] sm:min-h-[40px] disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${globalRefreshStatus.isRefreshing ? 'animate-spin' : ''}`} />
                                        <span className="text-xs sm:text-sm">Refresh</span>
                                    </button>
                                    <button
                                        onClick={handleExportData}
                                        disabled={isExporting}
                                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors flex items-center justify-center min-h-[36px] sm:min-h-[40px] disabled:opacity-50"
                                    >
                                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        <span className="text-xs sm:text-sm">{isExporting ? 'Exporting...' : 'Export'}</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors flex items-center justify-center min-h-[36px] sm:min-h-[40px]"
                                    >
                                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        <span className="text-xs sm:text-sm">Close</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="glass-card">
                            <div className="flex items-center justify-center">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex items-center">
                                    {sections.map(({id, label, icon: Icon}) => (
                                        <button
                                            key={id}
                                            onClick={() => setAdminSection(id as SectionId)}
                                            className={`px-3 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 ${
                                                currentSection === id 
                                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                                                    : 'text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="hidden sm:inline">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {currentSection === 'overview' && (
                            <div className="space-y-2 md:space-y-4">
                                {/* Quick Stats */}
                                <EnhancedMetricsOverview 
                                    isRealtime={isAdminRealtime} 
                                    isAuthenticated={auth.isAuthenticated} 
                                />

                                {/* System Health */}
                                <SystemHealthPanel 
                                    isRealtime={isAdminRealtime} 
                                    isAuthenticated={auth.isAuthenticated} 
                                />

                                {/* Job Application Metrics */}
                                <div className="glass-card">
                                    <div className="mb-2 sm:mb-3">
                                        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Job Application Metrics</h2>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">Current application statistics and trends</p>
                                    </div>
                                    
                                    {applications.length === 0 ? (
                                        <div className="text-center py-6 sm:py-8 md:py-12">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                <FileText className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
                                            </div>
                                            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">
                                                No applications tracked
                                            </h3>
                                            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 px-4">
                                                Start tracking applications to see detailed analytics here!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
                                            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
                                                    {applications.filter(app => app.status === 'Applied').length}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Applied</div>
                                            </div>
                                            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 mb-1">
                                                    {applications.filter(app => app.status === 'Interview').length}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Interviews</div>
                                            </div>
                                            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
                                                    {applications.filter(app => app.status === 'Offer').length}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Offers</div>
                                            </div>
                                            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-1">
                                                    {applications.filter(app => app.status === 'Rejected').length}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Rejected</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Activity */}
                                {adminFeedback?.recentFeedback && adminFeedback.recentFeedback.length > 0 && (
                                    <div className="glass-card">
                                        <div className="mb-2 sm:mb-3">
                                            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Recent Activity</h2>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">Latest system events and feedback</p>
                                        </div>
                                        <div className="space-y-3">
                                            {adminFeedback.recentFeedback.slice(0, 5).map((feedback) => {
                                                const IconComponent = getFeedbackTypeIcon(feedback.type);
                                                return (
                                                    <div key={feedback.id} className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getFeedbackTypeColor(feedback.type)}`}>
                                                            <IconComponent className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                New {feedback.type} feedback received
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(feedback.timestamp).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Analytics Section */}
                        {currentSection === 'analytics' && (
                            <div className="space-y-2 md:space-y-4">
                                <div className="glass-card">
                                    <div className="mb-2 sm:mb-3">
                                        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Analytics Overview</h2>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">Detailed analytics and insights</p>
                                    </div>
                                    
                                    {adminAnalytics ? (
                                        <div className="space-y-4">
                                            {/* Usage Metrics */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
                                                <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
                                                        {adminAnalytics.usageMetrics?.totalSessions || 0}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Sessions</div>
                                                </div>
                                                <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
                                                        {Math.round(adminAnalytics.usageMetrics?.averageSessionDuration || 0)}m
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Avg Session</div>
                                                </div>
                                                <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mb-1">
                                                        {adminAnalytics.usageMetrics?.totalApplicationsCreated || 0}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Applications</div>
                                                </div>
                                                <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1">
                                                        {adminAnalytics.usageMetrics?.featuresUsage ? Object.keys(adminAnalytics.usageMetrics.featuresUsage).length : 0}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Features Used</div>
                                                </div>
                                            </div>

                                            {/* Device Metrics */}
                                            <div className="glass-card p-4">
                                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Device Usage</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-lg sm:text-xl font-bold text-blue-600 mb-1">
                                                            {adminAnalytics.deviceMetrics?.desktop || 0}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Desktop</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">
                                                            {adminAnalytics.deviceMetrics?.mobile || 0}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Mobile</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features Usage */}
                                            {adminAnalytics.usageMetrics?.featuresUsage && Object.keys(adminAnalytics.usageMetrics.featuresUsage).length > 0 && (
                                                <div className="glass-card p-4">
                                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Feature Usage</h3>
                                                    <div className="space-y-2">
                                                        {Object.entries(adminAnalytics.usageMetrics.featuresUsage).map(([feature, count]) => (
                                                            <div key={feature} className="flex justify-between items-center">
                                                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 capitalize">
                                                                    {feature.replace(/_/g, ' ')}
                                                                </span>
                                                                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                    {count}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 sm:py-8 md:py-12">
                                            <BarChart3 className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">
                                                Loading Analytics...
                                            </h3>
                                            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                                                Analytics data is being loaded.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Feedback Section */}
                        {currentSection === 'feedback' && (
                            <div className="space-y-2 md:space-y-4">
                                <div className="glass-card">
                                    <div className="mb-2 sm:mb-3">
                                        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">User Feedback</h2>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">Manage and review user feedback</p>
                                    </div>
                                    
                                    {!adminFeedback?.recentFeedback || adminFeedback.recentFeedback.length === 0 ? (
                                        <div className="text-center py-6 sm:py-8 md:py-12">
                                            <MessageSquare className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">
                                                No feedback received
                                            </h3>
                                            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                                                User feedback will appear here when available.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {paginatedFeedback.items.map((feedback) => {
                                                const IconComponent = getFeedbackTypeIcon(feedback.type);
                                                return (
                                                    <div key={feedback.id} className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getFeedbackTypeColor(feedback.type)}`}>
                                                                <IconComponent className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize">
                                                                        {feedback.type} Feedback
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {new Date(feedback.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                    {feedback.rating > 0 && (
                                                                        <div className="flex items-center gap-1">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <Star 
                                                                                    key={i} 
                                                                                    className={`h-3 w-3 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                                    {feedback.message}
                                                                </p>
                                                                {feedback.userAgent && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {feedback.userAgent}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Users Section */}
                        {currentSection === 'users' && (
                            <div className="space-y-2 md:space-y-4">
                                <div className="glass-card">
                                    <div className="mb-2 sm:mb-3">
                                        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">User Analytics</h2>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">User behavior and engagement metrics</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
                                        <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
                                                {adminAnalytics?.userMetrics?.totalUsers || 1}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                                {isAdminRealtime && auth.isAuthenticated ? "Platform Users" : "Total Users"}
                                            </div>
                                        </div>
                                        <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
                                                {adminAnalytics?.userMetrics?.activeUsers?.daily || 0}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Active Today</div>
                                        </div>
                                        <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mb-1">
                                                {adminAnalytics?.usageMetrics?.totalSessions || 0}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Sessions</div>
                                        </div>
                                        <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
                                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1">
                                                {adminAnalytics?.usageMetrics?.featuresUsage ? Object.keys(adminAnalytics.usageMetrics.featuresUsage).length : 0}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Features Used</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy Notice */}
                                <div className="glass-card bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"/>
                                        <div>
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">
                                                {isAdminRealtime && auth.isAuthenticated
                                                    ? 'Enterprise-Grade SaaS Privacy & Security'
                                                    : 'Privacy-First ApplyTrak Analytics'
                                                }
                                            </h4>
                                            <p className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm leading-relaxed">
                                                {isAdminRealtime && auth.isAuthenticated
                                                    ? 'Multi-user data is encrypted, isolated per user account, and stored securely in the cloud. Full GDPR compliance with user data portability and deletion rights. Admin analytics are aggregated and anonymized for business intelligence.'
                                                    : 'All user data is anonymized and stored locally. No personal information is tracked or transmitted. Users can opt-out of analytics at any time. Data includes job application patterns, feature usage, and session information only to improve the ApplyTrak experience.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(adminContent, document.body);
};

export default AdminDashboard;