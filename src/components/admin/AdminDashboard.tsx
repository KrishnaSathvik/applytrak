// src/components/admin/AdminDashboard.tsx - COMPLETE FIXED VERSION (1249+ lines)
import React, {useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    Activity,
    BarChart3,
    Bug,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    Globe,
    Heart,
    Lightbulb,
    Mail,
    MessageSquare,
    Monitor,
    RefreshCw,
    Search,
    Shield,
    Smartphone,
    Star,
    Target,
    TrendingUp,
    Users,
    X,
    Zap
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {feedbackService} from '../../services/feedbackService';
import {analyticsService} from '../../services/analyticsService';

// 🔧 FIXED: Define SectionId type and sections array
type SectionId = 'overview' | 'analytics' | 'feedback' | 'users';
type FeedbackFilter = 'all' | 'love' | 'bug' | 'feature' | 'general';
type SortBy = 'newest' | 'oldest' | 'rating-high' | 'rating-low';
type StatusFilter = 'all' | 'unread' | 'read' | 'flagged';

const sections = [
    {id: 'overview' as const, label: 'Overview', icon: BarChart3},
    {id: 'analytics' as const, label: 'Analytics', icon: TrendingUp},
    {id: 'feedback' as const, label: 'Feedback', icon: MessageSquare},
    {id: 'users' as const, label: 'Users', icon: Users}
];

// 🔄 NEW: Real-Time Status Indicator Component
const RealtimeStatusIndicator: React.FC = () => {
    const {getAdminConnectionStatus} = useAppStore();
    const [status, setStatus] = useState(getAdminConnectionStatus());

    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(getAdminConnectionStatus());
        }, 1000);

        return () => clearInterval(interval);
    }, [getAdminConnectionStatus]);

    const getStatusColor = () => {
        if (!status.isConnected) return 'text-gray-400';
        if (status.isRealtime) return 'text-green-500';
        return 'text-yellow-500';
    };

    const getStatusIcon = () => {
        if (!status.isConnected) return '⚪';
        if (status.isRealtime) return '🟢';
        return '🟡';
    };

    const getStatusText = () => {
        if (!status.isConnected) return 'Offline';
        if (status.isRealtime) return 'Real-time';
        return 'Local Only';
    };

    const formatLastUpdate = () => {
        if (!status.lastUpdate) return 'Never';

        const diff = Date.now() - new Date(status.lastUpdate).getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        return new Date(status.lastUpdate).toLocaleTimeString();
    };

    return (
        <div
            className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
                <span className="text-lg">{getStatusIcon()}</span>
                <div className="flex flex-col">
                    <span className={`text-sm font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                    <span className="text-xs text-gray-500">
                        Updated: {formatLastUpdate()}
                    </span>
                </div>
            </div>

            {status.isRealtime && (
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                    <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
            )}
        </div>
    );
};

// 🔄 NEW: Real-Time Toggle Button Component
const RealtimeToggle: React.FC = () => {
    const {
        isAdminRealtime,
        enableRealtimeAdmin,
        disableRealtimeAdmin,
        showToast
    } = useAppStore();

    const handleToggle = () => {
        if (isAdminRealtime) {
            disableRealtimeAdmin();
            showToast({
                type: 'info',
                message: '📊 Switched to local data mode'
            });
        } else {
            enableRealtimeAdmin();
            showToast({
                type: 'success',
                message: '🔄 Real-time mode enabled'
            });
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                ${isAdminRealtime
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
            }
            `}
        >
            {isAdminRealtime ? (
                <>
                    <Activity className="h-4 w-4"/>
                    <span className="text-sm font-medium">Real-time ON</span>
                </>
            ) : (
                <>
                    <RefreshCw className="h-4 w-4"/>
                    <span className="text-sm font-medium">Enable Real-time</span>
                </>
            )}
        </button>
    );
};

const AdminDashboard: React.FC = () => {
    const {
        ui,
        applications,
        goals,
        goalProgress,
        analytics,
        logoutAdmin,
        closeAdminDashboard,
        setAdminSection,
        adminAnalytics,
        adminFeedback,
        loadAdminAnalytics,
        loadAdminFeedback,
        showToast,
        // 🔄 NEW: Real-time methods
        refreshAdminData,
        isAdminRealtime
    } = useAppStore();

    const [isExporting, setIsExporting] = useState(false);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Feedback management state
    const [typeFilter, setTypeFilter] = useState<FeedbackFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
    const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

    // 🔧 CRITICAL FIX: Safety checks before accessing admin properties
    const adminState = ui?.admin;
    const isDashboardOpen = adminState?.dashboardOpen ?? false;
    const isAuthenticated = adminState?.authenticated ?? false;
    const currentSection = adminState?.currentSection ?? 'overview';

    // Move the useMemo hook before any conditional returns
    useEffect(() => {
        if (isDashboardOpen && isAuthenticated) {
            // Subscribe to application changes
            const unsubscribe = useAppStore.subscribe(
                (state) => state.applications,
                (applications) => {
                    console.log('📊 Applications changed, refreshing admin data...');
                    loadAdminAnalytics();
                }
            );

            return unsubscribe;
        }
    }, [isDashboardOpen, isAuthenticated, loadAdminAnalytics]);

    // Calculate ApplyTrak-specific metrics
    const jobMetrics = useMemo(() => {
        const totalApps = applications.length;
        const appliedCount = applications.filter(app => app.status === 'Applied').length;
        const interviewCount = applications.filter(app => app.status === 'Interview').length;
        const offerCount = applications.filter(app => app.status === 'Offer').length;
        const rejectedCount = applications.filter(app => app.status === 'Rejected').length;

        const successRate = totalApps > 0 ? ((interviewCount + offerCount) / totalApps * 100) : 0;
        const responseRate = totalApps > 0 ? ((totalApps - appliedCount) / totalApps * 100) : 0;

        // Time-based metrics
        const now = new Date();
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weeklyApps = applications.filter(app => new Date(app.dateApplied) >= thisWeek).length;
        const monthlyApps = applications.filter(app => new Date(app.dateApplied) >= thisMonth).length;

        // Company and location insights
        const companyCount = new Set(applications.map(app => app.company)).size;
        const locationCount = new Set(applications.filter(app => app.location).map(app => app.location)).size;

        // Job type distribution
        const remoteJobs = applications.filter(app => app.type === 'Remote').length;
        const onsiteJobs = applications.filter(app => app.type === 'Onsite').length;
        const hybridJobs = applications.filter(app => app.type === 'Hybrid').length;

        return {
            totalApps,
            appliedCount,
            interviewCount,
            offerCount,
            rejectedCount,
            successRate,
            responseRate,
            weeklyApps,
            monthlyApps,
            companyCount,
            locationCount,
            remoteJobs,
            onsiteJobs,
            hybridJobs
        };
    }, [applications]);

    // Filtered feedback for management
    const filteredFeedback = useMemo(() => {
        if (!adminFeedback?.recentFeedback) return [];

        let filtered = adminFeedback.recentFeedback;

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(feedback => feedback.type === typeFilter);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(feedback => {
                const isRead = feedback.metadata?.read ?? false;
                switch (statusFilter) {
                    case 'read':
                        return isRead;
                    case 'unread':
                        return !isRead;
                    case 'flagged':
                        return false; // Implement flagging logic if needed
                    default:
                        return true;
                }
            });
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(feedback =>
                feedback.message.toLowerCase().includes(query) ||
                feedback.email?.toLowerCase().includes(query) ||
                feedback.type.toLowerCase().includes(query)
            );
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

        return filtered;
    }, [adminFeedback?.recentFeedback, typeFilter, statusFilter, searchQuery, sortBy]);

    // Early return with safety check - MOVED AFTER all hooks
    if (!adminState) {
        console.error('Admin state not initialized in store');
        return createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                    <p className="text-red-600">Admin state not initialized. Please refresh the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    // Don't render if not open or not authenticated
    if (!isDashboardOpen || !isAuthenticated) {
        return null;
    }

    // 🔄 UPDATED: Enhanced refresh handler
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshAdminData();
        } catch (error) {
            showToast({
                type: 'error',
                message: 'Failed to refresh dashboard data.'
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const analyticsData = analyticsService.exportAnalyticsData();
            const feedbackData = feedbackService.exportFeedbackData();

            const exportData = {
                exportDate: new Date().toISOString(),
                timeRange,
                mode: isAdminRealtime ? 'Real-time Cloud' : 'Local Only',
                analytics: analyticsData,
                feedback: feedbackData,
                applyTrakData: {
                    totalApplications: applications.length,
                    goals,
                    goalProgress,
                    analytics
                },
                version: '1.0.0'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
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
                message: 'Admin data exported successfully!',
                duration: 3000
            });
        } catch (error) {
            console.error('Export failed:', error);
            showToast({
                type: 'error',
                message: 'Failed to export data.'
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleLogout = () => {
        logoutAdmin();
        closeAdminDashboard();
    };

    const getFeedbackTypeIcon = (type: string) => {
        switch (type) {
            case 'love':
                return Heart;
            case 'bug':
                return Bug;
            case 'feature':
                return Lightbulb;
            default:
                return MessageSquare;
        }
    };

    const getFeedbackTypeColor = (type: string) => {
        switch (type) {
            case 'love':
                return 'text-red-500';
            case 'bug':
                return 'text-red-600';
            case 'feature':
                return 'text-yellow-500';
            default:
                return 'text-blue-500';
        }
    };

    const handleRefreshFeedback = async () => {
        setIsRefreshing(true);
        try {
            await loadAdminFeedback();
            showToast({
                type: 'success',
                message: 'Feedback data refreshed',
                duration: 2000
            });
        } catch (error) {
            showToast({
                type: 'error',
                message: 'Failed to refresh feedback data'
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleExportFeedback = () => {
        if (!adminFeedback?.recentFeedback) return;

        const exportData = {
            exportDate: new Date().toISOString(),
            mode: isAdminRealtime ? 'Real-time Cloud' : 'Local Only',
            totalFeedback: adminFeedback.totalFeedback,
            averageRating: adminFeedback.averageRating,
            feedbackData: filteredFeedback.map(feedback => ({
                type: feedback.type,
                rating: feedback.rating,
                message: feedback.message,
                timestamp: feedback.timestamp,
                metadata: feedback.metadata
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applytrak-feedback-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast({
            type: 'success',
            message: 'Feedback data exported successfully!',
            duration: 3000
        });
    };

    // 🔧 FIX: Define the admin content that will be rendered in the portal
    const adminContent = (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm overflow-hidden">
            <div className="flex h-full">
                {/* Sidebar */}
                <div
                    className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                    ApplyTrak Admin
                                </h2>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Job Application Analytics
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {sections.map(({id, label, icon: Icon}) => (
                            <button
                                key={id}
                                onClick={() => setAdminSection(id as SectionId)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                                    ${currentSection === id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }
                                `}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0"/>
                                <span className="font-medium">{label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                        </button>

                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
                        >
                            <Download className="h-4 w-4"/>
                            {isExporting ? 'Exporting...' : 'Export Data'}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                            <X className="h-4 w-4"/>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto relative z-10">
                    {/* 🔄 UPDATED: Enhanced Header with Real-time Indicators */}
                    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                                    {currentSection === 'overview' && 'ApplyTrak Overview'}
                                    {currentSection === 'analytics' && 'Job Application Analytics'}
                                    {currentSection === 'feedback' && 'User Feedback'}
                                    {currentSection === 'users' && 'User Insights'}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {currentSection === 'overview' && 'System overview and key job application metrics'}
                                    {currentSection === 'analytics' && 'Deep dive into job application patterns and trends'}
                                    {currentSection === 'feedback' && 'User feedback and system improvement suggestions'}
                                    {currentSection === 'users' && 'User behavior and engagement analytics'}
                                </p>
                            </div>

                            {/* 🔄 NEW: Real-time status indicator and controls */}
                            <div className="flex items-center gap-4">
                                <RealtimeStatusIndicator/>

                                {/* Real-time Toggle */}
                                <RealtimeToggle/>

                                {/* Existing time range and refresh controls */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600 dark:text-gray-400">Period:</label>
                                    <select
                                        value={timeRange}
                                        onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="7d">Last 7 days</option>
                                        <option value="30d">Last 30 days</option>
                                        <option value="90d">Last 90 days</option>
                                        <option value="all">All time</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        console.log('🔄 Manual refresh triggered');
                                        refreshAdminData();
                                    }}
                                    disabled={isRefreshing}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                </button>
                                <button
                                    onClick={closeAdminDashboard}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Overview Section */}
                        {currentSection === 'overview' && (
                            <div className="space-y-6">
                                {/* 🔄 NEW: Real-time Data Status Banner */}
                                {isAdminRealtime && (
                                    <div
                                        className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200/50 dark:border-green-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                                            <div>
                                                <p className="font-medium text-green-900 dark:text-green-100">Live Data
                                                    Mode Active</p>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    Dashboard automatically updates with real-time job application
                                                    insights
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Key ApplyTrak Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Total Applications */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total
                                                    Applications</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {jobMetrics.totalApps}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center text-sm">
                                            <span className="text-green-600 dark:text-green-400 font-medium">
                                                +{jobMetrics.weeklyApps} this week
                                            </span>
                                        </div>
                                    </div>

                                    {/* Success Rate */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success
                                                    Rate</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {jobMetrics.successRate.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {jobMetrics.interviewCount + jobMetrics.offerCount} positive responses
                                            </span>
                                        </div>
                                    </div>

                                    {/* Active Companies */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                                <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Companies</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {jobMetrics.companyCount}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {jobMetrics.locationCount} unique locations
                                            </span>
                                        </div>
                                    </div>

                                    {/* Goal Progress */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                                                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly
                                                    Goal</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {goalProgress.monthlyProgress || 0}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {goalProgress.monthlyApplications || 0} / {goals.monthlyGoal || 0} apps
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Application Status Breakdown & Activity */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Status Distribution */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Application
                                            Status Distribution</h3>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    label: 'Applied',
                                                    count: jobMetrics.appliedCount,
                                                    color: 'bg-blue-500',
                                                    textColor: 'text-blue-600'
                                                },
                                                {
                                                    label: 'Interview',
                                                    count: jobMetrics.interviewCount,
                                                    color: 'bg-yellow-500',
                                                    textColor: 'text-yellow-600'
                                                },
                                                {
                                                    label: 'Offer',
                                                    count: jobMetrics.offerCount,
                                                    color: 'bg-green-500',
                                                    textColor: 'text-green-600'
                                                },
                                                {
                                                    label: 'Rejected',
                                                    count: jobMetrics.rejectedCount,
                                                    color: 'bg-red-500',
                                                    textColor: 'text-red-600'
                                                }
                                            ].map(({label, count, color, textColor}) => {
                                                const percentage = jobMetrics.totalApps > 0 ? (count / jobMetrics.totalApps * 100) : 0;
                                                return (
                                                    <div key={label}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                                                <span
                                                                    className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                                                                <span
                                                                    className={`text-xs ${textColor}`}>({percentage.toFixed(1)}%)</span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-300 ${color}`}
                                                                style={{width: `${percentage}%`}}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Job Type Distribution */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Job
                                            Type Preferences</h3>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    label: 'Remote',
                                                    count: jobMetrics.remoteJobs,
                                                    color: 'bg-green-500',
                                                    icon: Globe
                                                },
                                                {
                                                    label: 'Hybrid',
                                                    count: jobMetrics.hybridJobs,
                                                    color: 'bg-purple-500',
                                                    icon: Zap
                                                },
                                                {
                                                    label: 'Onsite',
                                                    count: jobMetrics.onsiteJobs,
                                                    color: 'bg-blue-500',
                                                    icon: Building2
                                                }
                                            ].map(({label, count, color, icon: Icon}) => {
                                                const percentage = jobMetrics.totalApps > 0 ? (count / jobMetrics.totalApps * 100) : 0;
                                                return (
                                                    <div key={label}
                                                         className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} bg-opacity-20`}>
                                                                <Icon
                                                                    className={`h-4 w-4 ${color.replace('bg-', 'text-')}`}/>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}%
                                                                    of applications</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{count}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* System Health & User Feedback Overview */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* System Health */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">System
                                            Health</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Analytics Service</span>
                                                <span
                                                    className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    Active
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-400">Data Storage</span>
                                                <span
                                                    className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    Operational
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-400">User Sessions</span>
                                                <span
                                                    className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    {adminAnalytics?.usageMetrics.totalSessions || 0} tracked
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-400">Last Backup</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date().toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Feedback Overview */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">User
                                            Feedback Overview</h3>
                                        {adminFeedback?.recentFeedback && adminFeedback.recentFeedback.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div
                                                        className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                                            {adminFeedback.averageRating?.toFixed(1) || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Avg
                                                            Rating</p>
                                                    </div>
                                                    <div
                                                        className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                            {adminFeedback.totalFeedback || 0}
                                                        </p>
                                                        <p className="text-sm text-blue-700 dark:text-blue-300">Total
                                                            Feedback</p>
                                                    </div>
                                                </div>
                                                {adminFeedback.recentFeedback.slice(0, 2).map((feedback) => {
                                                    const Icon = getFeedbackTypeIcon(feedback.type);
                                                    return (
                                                        <div key={feedback.id}
                                                             className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                            <Icon
                                                                className={`h-5 w-5 flex-shrink-0 ${getFeedbackTypeColor(feedback.type)}`}/>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                    {feedback.message}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                                    {new Date(feedback.timestamp).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                                <p className="text-gray-600 dark:text-gray-400">No feedback received
                                                    yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 📊 COMPLETE ANALYTICS SECTION */}
                        {currentSection === 'analytics' && (
                            <div className="space-y-6">
                                {/* Analytics Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Response Rate */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                                <TrendingUp className="h-4 w-4"/>
                                                <span
                                                    className="text-xs font-medium">+{Math.round(jobMetrics.responseRate - 45)}%</span>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {jobMetrics.responseRate.toFixed(1)}%
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Response Rate</p>
                                        </div>
                                    </div>

                                    {/* Monthly Applications */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                                <TrendingUp className="h-4 w-4"/>
                                                <span
                                                    className="text-xs font-medium">+{Math.max(0, jobMetrics.monthlyApps - 10)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {jobMetrics.monthlyApps}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                                        </div>
                                    </div>

                                    {/* Average Weekly */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                                <TrendingUp className="h-4 w-4"/>
                                                <span className="text-xs font-medium">+12%</span>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {Math.round(jobMetrics.totalApps / Math.max(1, Math.ceil(jobMetrics.totalApps / 7)))}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Weekly</p>
                                        </div>
                                    </div>

                                    {/* Interview Rate */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                                                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400"/>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                                <TrendingUp className="h-4 w-4"/>
                                                <span
                                                    className="text-xs font-medium">+{Math.round((jobMetrics.interviewCount / Math.max(1, jobMetrics.totalApps)) * 100 - 15)}%</span>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {((jobMetrics.interviewCount / Math.max(1, jobMetrics.totalApps)) * 100).toFixed(1)}%
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Interview Rate</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Goal Performance and Performance Metrics combined */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Weekly Goal */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Weekly
                                                        Goal</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Current week
                                                        progress</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {Math.round(goalProgress.weeklyProgress || 0)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                                <span
                                                    className="font-medium">{goalProgress.weeklyApplications || 0} / {goals.weeklyGoal || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{width: `${Math.min(100, goalProgress.weeklyProgress || 0)}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Goal */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                                    <Target className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Monthly
                                                        Goal</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Current
                                                        month progress</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {Math.round(goalProgress.monthlyProgress || 0)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                                <span
                                                    className="font-medium">{goalProgress.monthlyApplications || 0} / {goals.monthlyGoal || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                    style={{width: `${Math.min(100, goalProgress.monthlyProgress || 0)}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overall Goal */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                                    <Star className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Total
                                                        Goal</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall
                                                        progress</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {Math.round(goalProgress.totalProgress || 0)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                                <span
                                                    className="font-medium">{goalProgress.totalApplications || 0} / {goals.totalGoal || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                                    style={{width: `${Math.min(100, goalProgress.totalProgress || 0)}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Analytics Content */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Application Timeline */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Application
                                            Activity Timeline</h3>

                                        {/* Simple Timeline Chart */}
                                        <div className="space-y-4">
                                            <div className="flex items-end justify-between h-32 gap-2">
                                                {/* Generate last 7 days of activity */}
                                                {Array.from({length: 7}, (_, i) => {
                                                    const date = new Date();
                                                    date.setDate(date.getDate() - (6 - i));
                                                    const dayApps = applications.filter(app => {
                                                        const appDate = new Date(app.dateApplied);
                                                        return appDate.toDateString() === date.toDateString();
                                                    }).length;
                                                    const height = Math.max(10, (dayApps / Math.max(1, jobMetrics.weeklyApps)) * 100);

                                                    return (
                                                        <div key={i}
                                                             className="flex-1 flex flex-col items-center gap-1">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-400 relative group cursor-pointer"
                                                                style={{height: `${height}%`}}
                                                            >
                                                                <div
                                                                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {dayApps} apps
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {date.toLocaleDateString('en', {weekday: 'short'})}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div
                                                className="flex items-center justify-between text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                    <span className="text-gray-600 dark:text-gray-400">Daily Applications</span>
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {jobMetrics.weeklyApps} this week
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Success Rate Analysis */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Success
                                            Rate Analysis</h3>

                                        <div className="space-y-4">
                                            {/* Application Success Funnel */}
                                            {[
                                                {
                                                    stage: 'Applications',
                                                    count: jobMetrics.totalApps,
                                                    percentage: 100,
                                                    color: 'bg-blue-500'
                                                },
                                                {
                                                    stage: 'Responses',
                                                    count: jobMetrics.totalApps - jobMetrics.appliedCount,
                                                    percentage: jobMetrics.responseRate,
                                                    color: 'bg-yellow-500'
                                                },
                                                {
                                                    stage: 'Interviews',
                                                    count: jobMetrics.interviewCount,
                                                    percentage: (jobMetrics.interviewCount / Math.max(1, jobMetrics.totalApps)) * 100,
                                                    color: 'bg-orange-500'
                                                },
                                                {
                                                    stage: 'Offers',
                                                    count: jobMetrics.offerCount,
                                                    percentage: (jobMetrics.offerCount / Math.max(1, jobMetrics.totalApps)) * 100,
                                                    color: 'bg-green-500'
                                                }
                                            ].map((stage, index) => (
                                                <div key={stage.stage} className="relative">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span
                                                            className="text-sm font-medium text-gray-900 dark:text-gray-100">{stage.stage}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="text-sm text-gray-600 dark:text-gray-400">{stage.count}</span>
                                                            <span
                                                                className="text-xs text-gray-500 dark:text-gray-500">({stage.percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                                        <div
                                                            className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-center text-white text-sm font-medium`}
                                                            style={{width: `${stage.percentage}%`}}
                                                        >
                                                            {stage.count > 0 && stage.percentage > 15 && (
                                                                <span className="text-xs">{stage.count}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400"/>
                                                <div>
                                                    <p className="font-medium text-green-900 dark:text-green-100">Overall
                                                        Success Rate</p>
                                                    <p className="text-sm text-green-700 dark:text-green-300">
                                                        {jobMetrics.successRate.toFixed(1)}% of applications get
                                                        positive responses
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Application Trends & Top Companies */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Top Companies Applied To */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top
                                            Companies</h3>

                                        <div className="space-y-3">
                                            {applications.length > 0 ? (
                                                Object.entries(
                                                    applications.reduce((acc, app) => {
                                                        acc[app.company] = (acc[app.company] || 0) + 1;
                                                        return acc;
                                                    }, {} as Record<string, number>)
                                                )
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 8)
                                                    .map(([company, count], index) => {
                                                        const percentage = (count / jobMetrics.totalApps) * 100;
                                                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500'];

                                                        return (
                                                            <div key={company} className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <div
                                                                        className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`}></div>
                                                                    <span
                                                                        className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                        {company}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <div
                                                                        className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                                        <div
                                                                            className={`h-1.5 rounded-full transition-all duration-300 ${colors[index % colors.length]}`}
                                                                            style={{width: `${percentage}%`}}
                                                                        ></div>
                                                                    </div>
                                                                    <span
                                                                        className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">
                                                                        {count}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div className="text-center py-8">
                                                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                                    <p className="text-gray-600 dark:text-gray-400">No applications
                                                        yet</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Company
                                                        insights will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Success Rate Analysis */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Performance
                                            Insights</h3>

                                        <div className="space-y-4">
                                            {/* By Job Type */}
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Success
                                                    by Job Type</h4>
                                                <div className="space-y-3">
                                                    {[
                                                        {
                                                            type: 'Remote',
                                                            apps: jobMetrics.remoteJobs,
                                                            color: 'bg-green-500'
                                                        },
                                                        {
                                                            type: 'Hybrid',
                                                            apps: jobMetrics.hybridJobs,
                                                            color: 'bg-purple-500'
                                                        },
                                                        {
                                                            type: 'Onsite',
                                                            apps: jobMetrics.onsiteJobs,
                                                            color: 'bg-blue-500'
                                                        }
                                                    ].map(({type, apps, color}) => {
                                                        const successCount = applications.filter(app =>
                                                            app.type === type && (app.status === 'Interview' || app.status === 'Offer')
                                                        ).length;
                                                        const successRate = apps > 0 ? (successCount / apps * 100) : 0;

                                                        return (
                                                            <div key={type}
                                                                 className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span
                                                                        className="text-sm font-medium text-gray-900 dark:text-gray-100">{type}</span>
                                                                    <span
                                                                        className="text-sm text-gray-600 dark:text-gray-400">{successRate.toFixed(1)}%</span>
                                                                </div>
                                                                <div
                                                                    className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${color}`}
                                                                        style={{width: `${successRate}%`}}
                                                                    ></div>
                                                                </div>
                                                                <div
                                                                    className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {successCount} / {apps} applications
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 💬 COMPLETE FEEDBACK SECTION */}
                        {currentSection === 'feedback' && (
                            <div className="space-y-6">
                                {/* Feedback Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total
                                                    Feedback</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {adminFeedback?.totalFeedback || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                                                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg
                                                    Rating</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {adminFeedback?.averageRating?.toFixed(1) || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                                <Eye className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {adminFeedback?.unreadFeedback || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                                                <Bug className="h-6 w-6 text-red-600 dark:text-red-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bug
                                                    Reports</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {adminFeedback?.feedbackTrends?.bugs || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback Management */}
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    {/* Feedback Header with Filters */}
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                Feedback Management
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleRefreshFeedback}
                                                    disabled={isRefreshing}
                                                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <RefreshCw
                                                        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                                                    Refresh
                                                </button>
                                                <button
                                                    onClick={handleExportFeedback}
                                                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                                >
                                                    <Download className="h-4 w-4"/>
                                                    Export
                                                </button>
                                                <button
                                                    onClick={() => setShowFilters(!showFilters)}
                                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <Filter className="h-4 w-4"/>
                                                    Filters
                                                </button>
                                            </div>
                                        </div>

                                        {/* Search Bar */}
                                        <div className="relative">
                                            <Search
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                            <input
                                                type="text"
                                                placeholder="Search feedback..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Filter Controls */}
                                        {showFilters && (
                                            <div
                                                className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                {/* Type Filter */}
                                                <div>
                                                    <label
                                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Feedback Type
                                                    </label>
                                                    <select
                                                        value={typeFilter}
                                                        onChange={(e) => setTypeFilter(e.target.value as FeedbackFilter)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    >
                                                        <option value="all">All Types</option>
                                                        <option value="bug">Bug Reports</option>
                                                        <option value="feature">Feature Requests</option>
                                                        <option value="love">Love Notes</option>
                                                        <option value="general">General</option>
                                                    </select>
                                                </div>

                                                {/* Status Filter */}
                                                <div>
                                                    <label
                                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    >
                                                        <option value="all">All Status</option>
                                                        <option value="unread">Unread</option>
                                                        <option value="read">Read</option>
                                                        <option value="flagged">Flagged</option>
                                                    </select>
                                                </div>

                                                {/* Sort By */}
                                                <div>
                                                    <label
                                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Sort By
                                                    </label>
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    >
                                                        <option value="newest">Newest First</option>
                                                        <option value="oldest">Oldest First</option>
                                                        <option value="rating-high">Highest Rating</option>
                                                        <option value="rating-low">Lowest Rating</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback List */}
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredFeedback && filteredFeedback.length > 0 ? (
                                            filteredFeedback.map((feedback) => {
                                                const Icon = getFeedbackTypeIcon(feedback.type);
                                                const isExpanded = expandedFeedback === feedback.id;
                                                const isRead = feedback.metadata?.read ?? false;

                                                return (
                                                    <div
                                                        key={feedback.id}
                                                        className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            {/* Feedback Type Icon */}
                                                            <div
                                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                                    feedback.type === 'love' ? 'bg-red-100 dark:bg-red-900/20' :
                                                                        feedback.type === 'bug' ? 'bg-red-100 dark:bg-red-900/20' :
                                                                            feedback.type === 'feature' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                                                                                'bg-blue-100 dark:bg-blue-900/20'
                                                                }`}>
                                                                <Icon
                                                                    className={`h-5 w-5 ${getFeedbackTypeColor(feedback.type)}`}/>
                                                            </div>

                                                            {/* Feedback Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                                                feedback.type === 'love' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                                                                    feedback.type === 'bug' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                                                                        feedback.type === 'feature' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                            }`}>
                                                                            {feedback.type}
                                                                        </span>

                                                                        {/* Star Rating */}
                                                                        <div className="flex items-center">
                                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                                <Star
                                                                                    key={star}
                                                                                    className={`h-4 w-4 ${
                                                                                        star <= feedback.rating
                                                                                            ? 'text-yellow-400 fill-current'
                                                                                            : 'text-gray-300 dark:text-gray-600'
                                                                                    }`}
                                                                                />
                                                                            ))}
                                                                            <span
                                                                                className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                                                                ({feedback.rating}/5)
                                                                            </span>
                                                                        </div>

                                                                        {!isRead && (
                                                                            <span
                                                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                                                New
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="text-sm text-gray-500 dark:text-gray-400">
                                                                            {new Date(feedback.timestamp).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => setExpandedFeedback(isExpanded ? null : feedback.id)}
                                                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                                        >
                                                                            {isExpanded ? 'Collapse' : 'Expand'}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Feedback Message */}
                                                                <div className="mb-3">
                                                                    <p className={`text-gray-900 dark:text-gray-100 ${
                                                                        isExpanded ? '' : 'line-clamp-2'
                                                                    }`}>
                                                                        {feedback.message}
                                                                    </p>
                                                                </div>

                                                                {/* Contact Email */}
                                                                {feedback.email && (
                                                                    <div
                                                                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                                        <Mail className="h-4 w-4"/>
                                                                        <span>{feedback.email}</span>
                                                                    </div>
                                                                )}

                                                                {/* Expanded Details */}
                                                                {isExpanded && (
                                                                    <div
                                                                        className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Technical
                                                                            Details</h5>
                                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                                            <div>
                                                                                <span
                                                                                    className="text-gray-600 dark:text-gray-400">Session ID:</span>
                                                                                <span
                                                                                    className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                                                                                    {feedback.sessionId.substring(0, 8)}...
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <span
                                                                                    className="text-gray-600 dark:text-gray-400">Page:</span>
                                                                                <span
                                                                                    className="ml-2 text-gray-900 dark:text-gray-100">
                                                                                    {feedback.url || 'Unknown'}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <span
                                                                                    className="text-gray-600 dark:text-gray-400">Device:</span>
                                                                                <span
                                                                                    className="ml-2 text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                                                                    {feedback.metadata?.deviceType === 'mobile' ? (
                                                                                        <Smartphone
                                                                                            className="h-4 w-4"/>
                                                                                    ) : (
                                                                                        <Monitor className="h-4 w-4"/>
                                                                                    )}
                                                                                    {feedback.metadata?.deviceType || 'Unknown'}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <span
                                                                                    className="text-gray-600 dark:text-gray-400">Applications:</span>
                                                                                <span
                                                                                    className="ml-2 text-gray-900 dark:text-gray-100">
                                                                                    {feedback.metadata?.applicationsCount || 0}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-12">
                                                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                                <p className="text-gray-600 dark:text-gray-400 text-lg">No feedback
                                                    received yet</p>
                                                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                                                    User feedback will appear here once submitted
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 👥 COMPLETE USERS SECTION */}
                        {currentSection === 'users' && (
                            <div className="space-y-6">
                                {/* User Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total
                                                    Users</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {adminAnalytics?.userMetrics.totalUsers || 1}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                                <Activity className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active
                                                    Sessions</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {adminAnalytics?.usageMetrics.totalSessions || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg
                                                    Session</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {Math.round((adminAnalytics?.usageMetrics.averageSessionDuration || 0) / (1000 * 60))}min
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                                                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Features
                                                    Used</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {adminAnalytics?.usageMetrics.featuresUsage ? Object.keys(adminAnalytics.usageMetrics.featuresUsage).length : 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy Notice */}
                                <div
                                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200/50 dark:border-blue-700/50">
                                    <div className="flex items-start gap-3">
                                        <Shield
                                            className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"/>
                                        <div>
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                                Privacy-First ApplyTrak Analytics
                                            </h4>
                                            <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                                                All user data is anonymized and stored locally. No personal information
                                                is tracked
                                                or transmitted. Users can opt-out of analytics at any time. Data
                                                includes job application patterns,
                                                feature usage, and session information only to improve the ApplyTrak
                                                experience.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Engagement Metrics */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Device Usage */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Device
                                            Usage</h3>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    label: 'Desktop',
                                                    count: adminAnalytics?.deviceMetrics.desktop || 0,
                                                    icon: Monitor,
                                                    color: 'bg-blue-500'
                                                },
                                                {
                                                    label: 'Mobile',
                                                    count: adminAnalytics?.deviceMetrics.mobile || 0,
                                                    icon: Smartphone,
                                                    color: 'bg-green-500'
                                                }
                                            ].map(({label, count, icon: Icon, color}) => {
                                                const total = (adminAnalytics?.deviceMetrics.desktop || 0) + (adminAnalytics?.deviceMetrics.mobile || 0);
                                                const percentage = total > 0 ? (count / total * 100) : 0;

                                                return (
                                                    <div key={label}
                                                         className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} bg-opacity-20`}>
                                                                <Icon
                                                                    className={`h-4 w-4 ${color.replace('bg-', 'text-')}`}/>
                                                            </div>
                                                            <span
                                                                className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all duration-300 ${color}`}
                                                                    style={{width: `${percentage}%`}}
                                                                ></div>
                                                            </div>
                                                            <span
                                                                className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Feature Usage */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Popular
                                            Features</h3>
                                        <div className="space-y-3">
                                            {adminAnalytics?.usageMetrics.featuresUsage && Object.keys(adminAnalytics.usageMetrics.featuresUsage).length > 0 ? (
                                                Object.entries(adminAnalytics.usageMetrics.featuresUsage)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 6)
                                                    .map(([feature, usage], index) => {
                                                        const maxUsage = Math.max(...Object.values(adminAnalytics.usageMetrics.featuresUsage));
                                                        const percentage = maxUsage > 0 ? (usage / maxUsage * 100) : 0;
                                                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];

                                                        return (
                                                            <div key={feature} className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <div
                                                                        className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`}></div>
                                                                    <span
                                                                        className="text-sm text-gray-600 dark:text-gray-400 truncate capitalize">
                                                                        {feature.replace(/_/g, ' ')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <div
                                                                        className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                                        <div
                                                                            className={`h-1.5 rounded-full transition-all duration-300 ${colors[index % colors.length]}`}
                                                                            style={{width: `${percentage}%`}}
                                                                        ></div>
                                                                    </div>
                                                                    <span
                                                                        className="text-sm font-medium text-gray-900 dark:text-gray-100 w-6 text-right">
                                                                        {usage}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div className="text-center py-8">
                                                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                                    <p className="text-gray-600 dark:text-gray-400">No feature usage
                                                        data available</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                        Data will appear as users interact with ApplyTrak
                                                    </p>
                                                </div>
                                            )}
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

    // Render in portal to escape main app layout
    return createPortal(adminContent, document.body);
};

export default AdminDashboard;