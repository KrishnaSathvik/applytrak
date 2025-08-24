// src/components/admin/AdminDashboard.tsx - PRODUCTION READY
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    Activity,
    AlertCircle,
    BarChart3,
    Bug,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Database,
    Download,
    Eye,
    FileText,
    Filter,
    Globe,
    Heart,
    Lightbulb,
    MessageSquare,
    Pause,
    Play,
    RefreshCw,
    Search,
    Shield,
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
import {realtimeAdminService} from '../../services/realtimeAdminService';

// Type definitions
type SectionId = 'overview' | 'analytics' | 'feedback' | 'users';
type FeedbackFilter = 'all' | 'love' | 'bug' | 'feature' | 'general';
type SortBy = 'newest' | 'oldest' | 'rating-high' | 'rating-low';
type StatusFilter = 'all' | 'unread' | 'read' | 'flagged';

// Constants
const FEEDBACK_PER_PAGE = 20;
const MAX_RETRIES = 3;
const PING_INTERVAL = 30000;
const POLLING_INTERVAL = 20000;
const DEBOUNCE_DELAY = 1000;
const AUTO_REFRESH_INTERVAL = 30;

// Navigation sections configuration
const sections = [
    {id: 'overview' as const, label: 'Overview', icon: BarChart3},
    {id: 'analytics' as const, label: 'Analytics', icon: TrendingUp},
    {id: 'feedback' as const, label: 'Feedback', icon: MessageSquare},
    {id: 'users' as const, label: 'Users', icon: Users},
];

// Real-time status indicator component
const RealtimeStatusIndicator: React.FC = () => {
    const {getAdminConnectionStatus, getGlobalRefreshStatus, isAdminRealtime} = useAppStore();
    const [status, setStatus] = useState(getAdminConnectionStatus());
    const [refreshStatus, setRefreshStatus] = useState(getGlobalRefreshStatus());
    const [userCount, setUserCount] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(getAdminConnectionStatus());
            setRefreshStatus(getGlobalRefreshStatus());

            const store = useAppStore.getState();
            const realUserCount = store.auth?.isAuthenticated
                ? (store.adminAnalytics?.userMetrics?.totalUsers || 1)
                : 1;
            setUserCount(realUserCount);
        }, 1000);

        return () => clearInterval(interval);
    }, [getAdminConnectionStatus, getGlobalRefreshStatus]);

    const getStatusConfig = useCallback(() => {
        if (!status.isConnected) {
            return {
                color: 'text-gray-400',
                icon: '⚪',
                text: 'Offline'
            };
        }
        if (status.isRealtime) {
            return {
                color: 'text-green-500',
                icon: '🟢',
                text: 'Live SaaS Mode'
            };
        }
        return {
            color: 'text-yellow-500',
            icon: '🟡',
            text: 'Local Mode'
        };
    }, [status]);

    const formatLastUpdate = useCallback(() => {
        const timestamp = refreshStatus.lastRefreshTimestamp || status.lastUpdate;
        if (!timestamp) return 'Never';

        const diff = Date.now() - new Date(timestamp).getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        return new Date(timestamp).toLocaleTimeString();
    }, [refreshStatus.lastRefreshTimestamp, status.lastUpdate]);

    const getRefreshStatusIcon = useCallback(() => {
        if (refreshStatus.isRefreshing) {
            return <RefreshCw className="h-3 w-3 animate-spin text-blue-500"/>;
        }
        if (refreshStatus.refreshStatus === 'error') {
            return <AlertCircle className="h-3 w-3 text-red-500"/>;
        }
        if (refreshStatus.refreshStatus === 'success') {
            return <CheckCircle className="h-3 w-3 text-green-500"/>;
        }
        return null;
    }, [refreshStatus]);

    const statusConfig = getStatusConfig();

    return (
        <div
            className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
                <span className="text-lg">{statusConfig.icon}</span>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${statusConfig.color}`}>
                            {statusConfig.text}
                        </span>
                        {getRefreshStatusIcon()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                            {isAdminRealtime ? `${userCount} users • ` : ''}
                            Updated: {formatLastUpdate()}
                        </span>
                        {refreshStatus.autoRefreshEnabled && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                Auto: {refreshStatus.autoRefreshInterval}s
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {status.isRealtime && (
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                    <span className="text-xs text-green-600 font-medium">MULTI-USER</span>
                </div>
            )}

            {refreshStatus.refreshErrors.length > 0 && (
                <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500"/>
                    <span className="text-xs text-red-600 font-medium">
                        {refreshStatus.refreshErrors.length} errors
                    </span>
                </div>
            )}
        </div>
    );
};

// Connection health monitor component
const ConnectionHealthMonitor: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastPing, setLastPing] = useState<Date | null>(null);
    const [pingStatus, setPingStatus] = useState<'good' | 'slow' | 'error'>('good');

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Network ping test
        const pingInterval = setInterval(async () => {
            if (!isOnline) return;

            const startTime = Date.now();
            try {
                await fetch('/favicon.ico', {mode: 'no-cors'});
                const pingTime = Date.now() - startTime;
                setLastPing(new Date());
                setPingStatus(pingTime < 1000 ? 'good' : 'slow');
            } catch {
                setPingStatus('error');
            }
        }, PING_INTERVAL);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(pingInterval);
        };
    }, [isOnline]);

    if (!isOnline) {
        return (
            <div
                className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"/>
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">Offline</span>
            </div>
        );
    }

    const statusConfig = {
        good: {
            bg: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
            dot: 'bg-green-500',
            text: 'text-green-700 dark:text-green-300',
            label: 'Connected'
        },
        slow: {
            bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
            dot: 'bg-yellow-500',
            text: 'text-yellow-700 dark:text-yellow-300',
            label: 'Slow Connection'
        },
        error: {
            bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
            dot: 'bg-red-500',
            text: 'text-red-700 dark:text-red-300',
            label: 'Connection Issues'
        }
    };

    const config = statusConfig[pingStatus];

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg}`}>
            <div className={`w-2 h-2 rounded-full ${config.dot}`}/>
            <span className={`text-sm font-medium ${config.text}`}>
                {config.label}
            </span>
        </div>
    );
};

// Real-time toggle component
const RealtimeToggle: React.FC = () => {
    const {
        isAdminRealtime,
        enableRealtimeAdmin,
        disableRealtimeAdmin,
        showToast,
        auth
    } = useAppStore();

    const handleToggle = useCallback(() => {
        if (isAdminRealtime) {
            disableRealtimeAdmin();
            showToast({
                type: 'info',
                message: 'Switched to local-only analytics mode'
            });
        } else {
            enableRealtimeAdmin();
            showToast({
                type: 'success',
                message: auth.isAuthenticated
                    ? 'Multi-user analytics enabled'
                    : 'Real-time mode enabled'
            });
        }
    }, [isAdminRealtime, auth.isAuthenticated, enableRealtimeAdmin, disableRealtimeAdmin, showToast]);

    const buttonConfig = isAdminRealtime
        ? {
            className: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
            icon: Activity,
            label: auth.isAuthenticated ? 'SaaS Mode ON' : 'Real-time ON'
        }
        : {
            className: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
            icon: RefreshCw,
            label: 'Enable SaaS Mode'
        };

    const IconComponent = buttonConfig.icon;

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${buttonConfig.className}`}
        >
            <IconComponent className="h-4 w-4"/>
            <span className="text-sm font-medium">{buttonConfig.label}</span>
        </button>
    );
};

// Auto-refresh control component
const AutoRefreshControl: React.FC = () => {
    const {
        getGlobalRefreshStatus,
        enableAutoRefresh,
        disableAutoRefresh,
        showToast
    } = useAppStore();

    const [refreshStatus, setRefreshStatus] = useState(getGlobalRefreshStatus());
    const [intervalInput, setIntervalInput] = useState('30');

    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshStatus(getGlobalRefreshStatus());
        }, 1000);

        return () => clearInterval(interval);
    }, [getGlobalRefreshStatus]);

    const handleToggleAutoRefresh = useCallback(() => {
        if (refreshStatus.autoRefreshEnabled) {
            disableAutoRefresh();
        } else {
            const intervalSeconds = parseInt(intervalInput) || AUTO_REFRESH_INTERVAL;
            if (intervalSeconds < 5) {
                showToast({
                    type: 'warning',
                    message: 'Minimum auto-refresh interval is 5 seconds'
                });
                return;
            }
            enableAutoRefresh(intervalSeconds);
        }
    }, [refreshStatus.autoRefreshEnabled, intervalInput, enableAutoRefresh, disableAutoRefresh, showToast]);

    const buttonConfig = refreshStatus.autoRefreshEnabled
        ? {
            className: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
            icon: Pause,
            label: 'Stop Auto'
        }
        : {
            className: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
            icon: Play,
            label: 'Auto Refresh'
        };

    const IconComponent = buttonConfig.icon;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleToggleAutoRefresh}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${buttonConfig.className}`}
            >
                <IconComponent className="h-4 w-4"/>
                <span className="text-sm font-medium">{buttonConfig.label}</span>
            </button>

            {!refreshStatus.autoRefreshEnabled && (
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={intervalInput}
                        onChange={(e) => setIntervalInput(e.target.value)}
                        min="5"
                        max="300"
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-center"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">sec</span>
                </div>
            )}
        </div>
    );
};

// User metrics card component
const UserMetricsCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    trend?: { value: number; isPositive: boolean };
    icon: React.ElementType;
    color: string;
    bgColor: string;
}> = ({title, value, subtitle, trend, icon: Icon, color, bgColor}) => {
    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
            {/* Header with status and icon */}
            <div className="flex items-center justify-between mb-4">
                <div
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"/>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Connected</span>
                </div>
                <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`}/>
                </div>
            </div>

            {/* Title */}
            <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
            </div>

            {/* Value and trend */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                        trend.isPositive
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                        <TrendingUp className={`h-3 w-3 ${
                            trend.isPositive
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400 transform rotate-180'
                        }`}/>
                        <span className={`text-xs font-medium ${
                            trend.isPositive
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                        }`}>
                            {trend.isPositive ? '+' : ''}{Math.abs(trend.value).toFixed(0)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UserMetricsCard
                title={isRealtime && isAuthenticated ? "Platform Users" : "Total Users"}
                value={enhancedMetrics.totalUsers}
                subtitle={isRealtime && isAuthenticated ? "Registered accounts" : "Current session"}
                trend={{value: 12, isPositive: true}}
                icon={Users}
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-100 dark:bg-blue-900/20"
            />

            <UserMetricsCard
                title="Active Today"
                value={enhancedMetrics.activeDaily}
                subtitle={`${enhancedMetrics.activeWeekly} this week`}
                trend={{value: 8, isPositive: true}}
                icon={Activity}
                color="text-green-600 dark:text-green-400"
                bgColor="bg-green-100 dark:bg-green-900/20"
            />

            <UserMetricsCard
                title="Total Sessions"
                value={enhancedMetrics.totalSessions}
                subtitle={`${Math.round(enhancedMetrics.avgSessionDuration / (1000 * 60))}min avg`}
                trend={{value: 15, isPositive: true}}
                icon={Clock}
                color="text-purple-600 dark:text-purple-400"
                bgColor="bg-purple-100 dark:bg-purple-900/20"
            />

            <UserMetricsCard
                title="Applications"
                value={enhancedMetrics.totalAppsCreated}
                subtitle={isRealtime && isAuthenticated ? "Platform total" : "Current user"}
                trend={{value: 5, isPositive: true}}
                icon={FileText}
                color="text-orange-600 dark:text-orange-400"
                bgColor="bg-orange-100 dark:bg-orange-900/20"
            />
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
            return 'text-gray-600 dark:text-gray-400';
        }
        if (value.includes('Active') || value.includes('Authenticated') || value === 'Cloud + Local') {
            return 'text-green-600 dark:text-green-400';
        }
        if (value.includes('Guest') || value === 'Local Storage') {
            return 'text-yellow-600 dark:text-yellow-400';
        }
        return 'text-gray-600 dark:text-gray-400';
    }, []);

    const getDotColor = useCallback((key: string, value: string) => {
        const textColor = getStatusColor(key, value);
        if (textColor.includes('green')) return 'bg-green-500';
        if (textColor.includes('blue')) return 'bg-blue-500';
        if (textColor.includes('yellow')) return 'bg-yellow-500';
        return 'bg-gray-500';
    }, [getStatusColor]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Database className="h-5 w-5"/>
                System Health
                {isRealtime && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">LIVE</span>
                )}
            </h3>
            <div className="space-y-4">
                {Object.entries(healthMetrics).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-sm font-medium flex items-center gap-1 ${getStatusColor(key, value)}`}>
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
        enableRealtimeAdmin,
        disableRealtimeAdmin,
        isAdminRealtime,
        auth,
        loadRealtimeAdminAnalytics,
        loadRealtimeFeedbackSummary
    } = useAppStore();

    // Local state
    const [isExporting, setIsExporting] = useState(false);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [typeFilter, setTypeFilter] = useState<FeedbackFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
    const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
    const [feedbackPage, setFeedbackPage] = useState(1);

    // Derived state
    const adminState = ui?.admin;
    const isDashboardOpen = adminState?.dashboardOpen ?? false;
    const isAuthenticated = adminState?.authenticated ?? false;
    const currentSection = adminState?.currentSection ?? 'overview';
    const globalRefreshStatus = getGlobalRefreshStatus();

    // Job metrics calculation
    const jobMetrics = useMemo(() => {
        const totalApps = applications.length;
        const appliedCount = applications.filter(app => app.status === 'Applied').length;
        const interviewCount = applications.filter(app => app.status === 'Interview').length;
        const offerCount = applications.filter(app => app.status === 'Offer').length;
        const rejectedCount = applications.filter(app => app.status === 'Rejected').length;

        const successRate = totalApps > 0 ? ((interviewCount + offerCount) / totalApps * 100) : 0;
        const responseRate = totalApps > 0 ? ((totalApps - appliedCount) / totalApps * 100) : 0;

        const now = new Date();
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weeklyApps = applications.filter(app => new Date(app.dateApplied) >= thisWeek).length;
        const monthlyApps = applications.filter(app => new Date(app.dateApplied) >= thisMonth).length;

        const companyCount = new Set(applications.map(app => app.company)).size;
        const locationCount = new Set(applications.filter(app => app.location).map(app => app.location)).size;

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

    // Feedback pagination
    const paginatedFeedback = useMemo(() => {
        if (!adminFeedback?.recentFeedback) return {items: [], totalPages: 0, totalCount: 0};

        let filtered = adminFeedback.recentFeedback;

        // Apply filters
        if (typeFilter !== 'all') {
            filtered = filtered.filter(feedback => feedback.type === typeFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(feedback => {
                const isRead = feedback.metadata?.read ?? false;
                switch (statusFilter) {
                    case 'read':
                        return isRead;
                    case 'unread':
                        return !isRead;
                    case 'flagged':
                        return false;
                    default:
                        return true;
                }
            });
        }

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

        // Apply pagination
        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / FEEDBACK_PER_PAGE);
        const startIndex = (feedbackPage - 1) * FEEDBACK_PER_PAGE;
        const items = filtered.slice(startIndex, startIndex + FEEDBACK_PER_PAGE);

        return {items, totalPages, totalCount};
    }, [adminFeedback?.recentFeedback, typeFilter, statusFilter, searchQuery, sortBy, feedbackPage]);

    // Unified admin system initialization
    useEffect(() => {
        let autoRefreshInterval: NodeJS.Timeout | null = null;
        let realtimeCleanup: (() => void) | null = null;
        let retryTimeout: NodeJS.Timeout | null = null;
        let debounceTimeout: NodeJS.Timeout | null = null;
        let retryCount = 0;

        const startUnifiedAdminSystem = async () => {
            if (!isDashboardOpen || !isAuthenticated) return;

            console.log('🚀 Starting unified admin dashboard system...');

            try {
                // Load initial data
                console.log('📊 Loading initial admin data...');
                await Promise.all([
                    loadRealtimeAdminAnalytics(),
                    loadRealtimeFeedbackSummary(),
                    refreshAllAdminData()
                ]);
                console.log('✅ Initial admin data loaded successfully');

                // Enable auto-refresh if not enabled
                if (!globalRefreshStatus.autoRefreshEnabled) {
                    console.log('🔄 Enabling global auto-refresh system...');
                    enableAutoRefresh(AUTO_REFRESH_INTERVAL);
                }

                // Setup real-time with fallback
                await setupRealtimeWithFallback();
            } catch (error) {
                console.error('❌ Failed to initialize admin system:', error);
                showToast({
                    type: 'error',
                    message: 'Failed to load admin data. Check your connection.'
                });
            }
        };

        const setupRealtimeWithFallback = async () => {
            try {
                console.log(`🔌 Setting up real-time subscriptions (attempt ${retryCount + 1})...`);

                realtimeCleanup = realtimeAdminService.subscribeToRealtimeUpdates((data) => {
                    console.log('📡 Real-time update received:', data);

                    // Debounced refresh
                    if (debounceTimeout) clearTimeout(debounceTimeout);
                    debounceTimeout = setTimeout(() => {
                        loadRealtimeAdminAnalytics();
                        loadRealtimeFeedbackSummary();

                        showToast({
                            type: 'success',
                            message: 'Data updated in real-time',
                            duration: 2000
                        });
                    }, DEBOUNCE_DELAY);
                });

                console.log('✅ Real-time subscriptions active');
                retryCount = 0;
            } catch (error) {
                console.error(`❌ Real-time setup failed (attempt ${retryCount + 1}):`, error);

                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    const retryDelay = Math.pow(2, retryCount) * 1000;
                    console.log(`🔄 Retrying real-time setup in ${retryDelay}ms...`);

                    retryTimeout = setTimeout(() => {
                        setupRealtimeWithFallback();
                    }, retryDelay);
                } else {
                    console.log('❌ Max retries exceeded, using polling fallback');
                    startPollingFallback();
                }
            }
        };

        const startPollingFallback = () => {
            console.log('📋 Starting enhanced polling fallback...');

            autoRefreshInterval = setInterval(async () => {
                if (!document.hidden && navigator.onLine) {
                    console.log('⏰ Polling for admin data updates...');
                    try {
                        await Promise.all([
                            loadRealtimeAdminAnalytics(),
                            loadRealtimeFeedbackSummary()
                        ]);
                    } catch (pollError) {
                        console.error('❌ Polling failed:', pollError);
                    }
                }
            }, POLLING_INTERVAL);
        };

        startUnifiedAdminSystem();

        return () => {
            console.log('🧹 Cleaning up unified admin dashboard system...');

            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            if (retryTimeout) clearTimeout(retryTimeout);
            if (debounceTimeout) clearTimeout(debounceTimeout);
            if (realtimeCleanup) realtimeCleanup();

            if (globalRefreshStatus.autoRefreshEnabled && !isDashboardOpen) {
                console.log('⏹️ Disabling global auto-refresh - dashboard closing');
                disableAutoRefresh();
            }

            console.log('✅ Admin dashboard cleanup completed');
        };
    }, [isDashboardOpen, isAuthenticated, globalRefreshStatus.autoRefreshEnabled]);

    // Page visibility management
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!isDashboardOpen || !isAuthenticated) return;

            if (document.hidden && globalRefreshStatus.autoRefreshEnabled) {
                console.log('⏸️ Page hidden - pausing auto-refresh');
                disableAutoRefresh();
            } else if (!document.hidden && !globalRefreshStatus.autoRefreshEnabled) {
                console.log('▶️ Page visible - resuming auto-refresh');
                enableAutoRefresh(AUTO_REFRESH_INTERVAL);
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
                    case '1':
                        e.preventDefault();
                        setAdminSection('overview');
                        break;
                    case '2':
                        e.preventDefault();
                        setAdminSection('analytics');
                        break;
                    case '3':
                        e.preventDefault();
                        setAdminSection('feedback');
                        break;
                    case '4':
                        e.preventDefault();
                        setAdminSection('users');
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
                    lastRefreshTimestamp: globalRefreshStatus.lastRefreshTimestamp,
                    refreshStatus: globalRefreshStatus.refreshStatus,
                    autoRefreshEnabled: globalRefreshStatus.autoRefreshEnabled,
                    refreshErrors: globalRefreshStatus.refreshErrors
                },
                version: '2.0.0-Production'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applytrak-saas-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: isAdminRealtime ? 'SaaS analytics exported successfully!' : 'Admin data exported successfully!',
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
    }, [timeRange, isAdminRealtime, auth.isAuthenticated, applications.length, goals, goalProgress, analytics, adminAnalytics, globalRefreshStatus, showToast]);

    const handleLogout = useCallback(async () => {
        console.log('🔓 Admin logout initiated');

        try {
            // Reset admin state
            useAppStore.setState(state => ({
                ui: {
                    ...state.ui,
                    admin: {
                        authenticated: false,
                        dashboardOpen: false,
                        currentSection: 'overview'
                    }
                }
            }));

            // Clear admin session
            const {adminLogout} = await import('../../utils/adminAuth');
            await adminLogout();

            // Sign out from regular auth
            const {signOut} = useAppStore.getState();
            await signOut();

            showToast({
                type: 'success',
                message: 'Logged out successfully',
                duration: 3000
            });

            console.log('✅ Admin logout completed successfully');
        } catch (error) {
            console.error('❌ Error during admin logout:', error);

            // Force reset admin state
            useAppStore.setState(state => ({
                ui: {
                    ...state.ui,
                    admin: {
                        authenticated: false,
                        dashboardOpen: false,
                        currentSection: 'overview'
                    }
                }
            }));

            showToast({
                type: 'error',
                message: 'Logout completed with errors',
                duration: 3000
            });
        }
    }, [showToast]);

    // Helper functions
    const getFeedbackTypeIcon = useCallback((type: string) => {
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
    }, []);

    const getFeedbackTypeColor = useCallback((type: string) => {
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
    }, []);

    const handleExportFeedback = useCallback(() => {
        if (!adminFeedback?.recentFeedback) return;

        const exportData = {
            exportDate: new Date().toISOString(),
            mode: isAdminRealtime
                ? (auth.isAuthenticated ? 'Multi-User SaaS Cloud' : 'Real-time Local')
                : 'Single-User Local',
            totalFeedback: adminFeedback.totalFeedback,
            averageRating: adminFeedback.averageRating,
            feedbackData: paginatedFeedback.items.map(feedback => ({
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
    }, [adminFeedback, paginatedFeedback.items, isAdminRealtime, auth.isAuthenticated, showToast]);

    // Early returns for error states
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

    if (!isDashboardOpen || !isAuthenticated) {
        return null;
    }

    // Main admin dashboard content
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
                                    {isAdminRealtime && auth.isAuthenticated ? 'SaaS Analytics' : 'Job Application Analytics'}
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                                    currentSection === id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0"/>
                                <span className="font-medium">{label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Footer actions */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
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
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Title Section */}
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {currentSection === 'overview' && 'ApplyTrak Overview'}
                                    {currentSection === 'analytics' && 'Analytics'}
                                    {currentSection === 'feedback' && 'Feedback'}
                                    {currentSection === 'users' && 'Users'}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {currentSection === 'overview' && 'System overview and key job application metrics'}
                                    {currentSection === 'analytics' && 'Deep dive into job application patterns and trends'}
                                    {currentSection === 'feedback' && 'User feedback and system improvement suggestions'}
                                    {currentSection === 'users' && 'User behavior and engagement analytics'}
                                </p>
                            </div>

                            {/* Control Bar */}
                            <div className="flex items-center gap-3">
                                {/* Status Indicator */}
                                <div
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                    <div className={`w-2 h-2 rounded-full ${
                                        isAdminRealtime
                                            ? (auth.isAuthenticated ? 'bg-green-500 animate-pulse' : 'bg-blue-500 animate-pulse')
                                            : 'bg-gray-400'
                                    }`}/>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {isAdminRealtime
                                            ? (auth.isAuthenticated ? 'SaaS Mode' : 'Live Mode')
                                            : 'Local Mode'
                                        }
                                    </span>
                                    {globalRefreshStatus.autoRefreshEnabled && (
                                        <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">
                                            Auto: {globalRefreshStatus.autoRefreshInterval}s
                                        </span>
                                    )}
                                </div>

                                {/* Mode Toggle */}
                                <button
                                    onClick={() => {
                                        if (isAdminRealtime) {
                                            disableRealtimeAdmin();
                                        } else {
                                            enableRealtimeAdmin();
                                        }
                                    }}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                        isAdminRealtime
                                            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                            : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {isAdminRealtime ? 'Live ON' : 'Enable Live'}
                                </button>

                                {/* Auto-Refresh Toggle */}
                                <button
                                    onClick={() => {
                                        if (globalRefreshStatus.autoRefreshEnabled) {
                                            disableAutoRefresh();
                                        } else {
                                            enableAutoRefresh(AUTO_REFRESH_INTERVAL);
                                        }
                                    }}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                        globalRefreshStatus.autoRefreshEnabled
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                            : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {globalRefreshStatus.autoRefreshEnabled ? 'Auto ON' : 'Auto Refresh'}
                                </button>

                                {/* Time Range Selector */}
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="7d">Last 7 days</option>
                                    <option value="30d">Last 30 days</option>
                                    <option value="90d">Last 90 days</option>
                                    <option value="all">All time</option>
                                </select>

                                {/* Refresh Button */}
                                <button
                                    onClick={handleUnifiedRefresh}
                                    disabled={globalRefreshStatus.isRefreshing}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    title={globalRefreshStatus.refreshErrors.length > 0
                                        ? `Last refresh had ${globalRefreshStatus.refreshErrors.length} errors`
                                        : 'Refresh all admin data'}
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${globalRefreshStatus.isRefreshing ? 'animate-spin' : ''}`}/>
                                    <span>Refresh All</span>
                                    {globalRefreshStatus.refreshErrors.length > 0 && (
                                        <AlertCircle className="h-4 w-4 text-red-200"/>
                                    )}
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={closeAdminDashboard}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>

                        {/* Error Banner */}
                        {globalRefreshStatus.refreshErrors.length > 0 && (
                            <div
                                className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400"/>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                            {globalRefreshStatus.refreshErrors.length} refresh errors occurred
                                        </p>
                                    </div>
                                    <button
                                        onClick={resetRefreshErrors}
                                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 underline"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content sections */}
                    <div className="p-6">
                        {/* Overview Section */}
                        {currentSection === 'overview' && (
                            <div className="space-y-6">
                                {/* SaaS Mode Banner */}
                                {isAdminRealtime && (
                                    <div className={`rounded-lg p-4 border ${
                                        auth.isAuthenticated
                                            ? 'bg-gradient-to-r from-blue-50 to-purple-100 dark:from-blue-900/20 dark:to-purple-800/20 border-blue-200/50 dark:border-blue-700/50'
                                            : 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50 dark:border-green-700/50'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                                auth.isAuthenticated ? 'bg-blue-500' : 'bg-green-500'
                                            }`}/>
                                            <div>
                                                <p className={`font-medium ${
                                                    auth.isAuthenticated
                                                        ? 'text-blue-900 dark:text-blue-100'
                                                        : 'text-green-900 dark:text-green-100'
                                                }`}>
                                                    {auth.isAuthenticated ? 'Multi-User SaaS Mode Active' : 'Live Data Mode Active'}
                                                </p>
                                                <p className={`text-sm ${
                                                    auth.isAuthenticated
                                                        ? 'text-blue-700 dark:text-blue-300'
                                                        : 'text-green-700 dark:text-green-300'
                                                }`}>
                                                    {auth.isAuthenticated
                                                        ? 'Dashboard shows real-time analytics across all authenticated users'
                                                        : 'Dashboard automatically updates with real-time job application insights'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Metrics Overview */}
                                {isAdminRealtime ? (
                                    <EnhancedMetricsOverview
                                        isRealtime={isAdminRealtime}
                                        isAuthenticated={auth.isAuthenticated}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <UserMetricsCard
                                            title="Total Applications"
                                            value={jobMetrics.totalApps}
                                            subtitle={`+${jobMetrics.weeklyApps} this week`}
                                            icon={FileText}
                                            color="text-blue-600 dark:text-blue-400"
                                            bgColor="bg-blue-100 dark:bg-blue-900/20"
                                        />

                                        <UserMetricsCard
                                            title="Success Rate"
                                            value={`${jobMetrics.successRate.toFixed(1)}%`}
                                            subtitle={`${jobMetrics.interviewCount + jobMetrics.offerCount} positive responses`}
                                            icon={CheckCircle}
                                            color="text-green-600 dark:text-green-400"
                                            bgColor="bg-green-100 dark:bg-green-900/20"
                                        />

                                        <UserMetricsCard
                                            title="Companies"
                                            value={jobMetrics.companyCount}
                                            subtitle={`${jobMetrics.locationCount} unique locations`}
                                            icon={Building2}
                                            color="text-purple-600 dark:text-purple-400"
                                            bgColor="bg-purple-100 dark:bg-purple-900/20"
                                        />

                                        <UserMetricsCard
                                            title="Monthly Goal"
                                            value={`${Math.round(goalProgress.monthlyProgress || 0)}%`}
                                            subtitle={`${goalProgress.monthlyApplications || 0} / ${goals.monthlyGoal || 0} apps`}
                                            icon={Target}
                                            color="text-orange-600 dark:text-orange-400"
                                            bgColor="bg-orange-100 dark:bg-orange-900/20"
                                        />
                                    </div>
                                )}

                                {/* Application Status Breakdown & System Health */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Status Distribution */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                            {isAdminRealtime && auth.isAuthenticated ? 'Cross-User Application Status' : 'Application Status Distribution'}
                                        </h3>
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
                                                                <div className={`w-3 h-3 rounded-full ${color}`}/>
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
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* System Health Panel */}
                                    <SystemHealthPanel isRealtime={isAdminRealtime}
                                                       isAuthenticated={auth.isAuthenticated}/>
                                </div>

                                {/* Job Type Distribution & Feedback Overview */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Job Type Distribution */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                            {isAdminRealtime && auth.isAuthenticated ? 'Platform Job Type Trends' : 'Job Type Preferences'}
                                        </h3>
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
                                            ].map(({label, count, color, icon: IconComponent}) => {
                                                const percentage = jobMetrics.totalApps > 0 ? (count / jobMetrics.totalApps * 100) : 0;
                                                return (
                                                    <div key={label}
                                                         className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} bg-opacity-20`}>
                                                                <IconComponent
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

                                    {/* Quick Feedback Overview */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                            {isAdminRealtime && auth.isAuthenticated ? 'Platform Feedback Overview' : 'User Feedback Overview'}
                                        </h3>
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
                                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                                            {isAdminRealtime && auth.isAuthenticated ? 'Platform Total' : 'Total Feedback'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {adminFeedback.recentFeedback.slice(0, 2).map((feedback) => {
                                                    const IconComponent = getFeedbackTypeIcon(feedback.type);
                                                    return (
                                                        <div key={feedback.id}
                                                             className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                            <IconComponent
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
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {isAdminRealtime && auth.isAuthenticated ? 'No platform feedback yet' : 'No feedback received yet'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Analytics Section */}
                        {currentSection === 'analytics' && (
                            <div className="space-y-6">
                                {/* Analytics Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <UserMetricsCard
                                        title="Response Rate"
                                        value={`${jobMetrics.responseRate.toFixed(1)}%`}
                                        trend={{
                                            value: Math.round(jobMetrics.responseRate - 45),
                                            isPositive: jobMetrics.responseRate > 45
                                        }}
                                        icon={Activity}
                                        color="text-blue-600 dark:text-blue-400"
                                        bgColor="bg-blue-100 dark:bg-blue-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Monthly Applications"
                                        value={jobMetrics.monthlyApps}
                                        trend={{value: Math.max(0, jobMetrics.monthlyApps - 10), isPositive: true}}
                                        icon={Calendar}
                                        color="text-green-600 dark:text-green-400"
                                        bgColor="bg-green-100 dark:bg-green-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Average Weekly"
                                        value={Math.round(jobMetrics.totalApps / Math.max(1, Math.ceil(jobMetrics.totalApps / 7)))}
                                        trend={{value: 12, isPositive: true}}
                                        icon={BarChart3}
                                        color="text-purple-600 dark:text-purple-400"
                                        bgColor="bg-purple-100 dark:bg-purple-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Interview Rate"
                                        value={`${((jobMetrics.interviewCount / Math.max(1, jobMetrics.totalApps)) * 100).toFixed(1)}%`}
                                        trend={{
                                            value: Math.round((jobMetrics.interviewCount / Math.max(1, jobMetrics.totalApps)) * 100 - 15),
                                            isPositive: true
                                        }}
                                        icon={Users}
                                        color="text-orange-600 dark:text-orange-400"
                                        bgColor="bg-orange-100 dark:bg-orange-900/20"
                                    />
                                </div>

                                {/* Advanced Analytics Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Application Trends Chart */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5"/>
                                            {isAdminRealtime && auth.isAuthenticated ? 'Platform Application Trends' : 'Application Trends'}
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                                                <span
                                                    className="text-lg font-bold text-gray-900 dark:text-gray-100">{jobMetrics.weeklyApps}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                                                <span
                                                    className="text-lg font-bold text-gray-900 dark:text-gray-100">{jobMetrics.monthlyApps}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                                                <span
                                                    className="text-lg font-bold text-green-600 dark:text-green-400">{jobMetrics.successRate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Success Metrics */}
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                            <Target className="h-5 w-5"/>
                                            Success Metrics
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    label: 'Interviews',
                                                    count: jobMetrics.interviewCount,
                                                    color: 'text-yellow-600'
                                                },
                                                {
                                                    label: 'Offers',
                                                    count: jobMetrics.offerCount,
                                                    color: 'text-green-600'
                                                },
                                                {
                                                    label: 'Companies Applied',
                                                    count: jobMetrics.companyCount,
                                                    color: 'text-blue-600'
                                                }
                                            ].map(({label, count, color}) => (
                                                <div key={label} className="flex items-center justify-between">
                                                    <span
                                                        className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                                    <span className={`text-lg font-bold ${color}`}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Analytics Table */}
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {isAdminRealtime && auth.isAuthenticated ? 'Platform Performance Breakdown' : 'Performance Breakdown'}
                                        </h3>
                                        <button
                                            onClick={handleExportData}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <Download className="h-4 w-4"/>
                                            Export Analytics
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{jobMetrics.totalApps}</p>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">Total
                                                Applications</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{jobMetrics.responseRate.toFixed(1)}%</p>
                                            <p className="text-sm text-green-700 dark:text-green-300">Response Rate</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{jobMetrics.companyCount}</p>
                                            <p className="text-sm text-purple-700 dark:text-purple-300">Companies</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Feedback Section */}
                        {currentSection === 'feedback' && (
                            <div className="space-y-6">
                                {/* Feedback Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <UserMetricsCard
                                        title="Total Feedback"
                                        value={adminFeedback?.totalFeedback || 0}
                                        subtitle={isAdminRealtime && auth.isAuthenticated ? "Across all users" : "Current session"}
                                        icon={MessageSquare}
                                        color="text-blue-600 dark:text-blue-400"
                                        bgColor="bg-blue-100 dark:bg-blue-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Avg Rating"
                                        value={adminFeedback?.averageRating?.toFixed(1) || 'N/A'}
                                        icon={Star}
                                        color="text-yellow-600 dark:text-yellow-400"
                                        bgColor="bg-yellow-100 dark:bg-yellow-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Unread"
                                        value={adminFeedback?.unreadFeedback || 0}
                                        icon={Eye}
                                        color="text-green-600 dark:text-green-400"
                                        bgColor="bg-green-100 dark:bg-green-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Bug Reports"
                                        value={adminFeedback?.feedbackTrends?.bugs || 0}
                                        icon={Bug}
                                        color="text-red-600 dark:text-red-400"
                                        bgColor="bg-red-100 dark:bg-red-900/20"
                                    />
                                </div>

                                {/* Feedback Management */}
                                <div
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <div
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {isAdminRealtime && auth.isAuthenticated ? 'Platform Feedback Management' : 'Feedback Management'}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setShowFilters(!showFilters)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <Filter className="h-4 w-4"/>
                                                Filters
                                            </button>
                                            <button
                                                onClick={handleExportFeedback}
                                                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <Download className="h-4 w-4"/>
                                                Export
                                            </button>
                                        </div>
                                    </div>

                                    {/* Feedback Filters */}
                                    {showFilters && (
                                        <div
                                            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <label
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                                                <select
                                                    value={typeFilter}
                                                    onChange={(e) => setTypeFilter(e.target.value as FeedbackFilter)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                                >
                                                    <option value="all">All Types</option>
                                                    <option value="love">Love</option>
                                                    <option value="bug">Bug Reports</option>
                                                    <option value="feature">Feature Requests</option>
                                                    <option value="general">General</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                                >
                                                    <option value="all">All Status</option>
                                                    <option value="unread">Unread</option>
                                                    <option value="read">Read</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort
                                                    By</label>
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                                >
                                                    <option value="newest">Newest First</option>
                                                    <option value="oldest">Oldest First</option>
                                                    <option value="rating-high">Highest Rating</option>
                                                    <option value="rating-low">Lowest Rating</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                                                <div className="relative">
                                                    <Search
                                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search feedback..."
                                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Feedback List */}
                                    <div className="space-y-4">
                                        {paginatedFeedback.items && paginatedFeedback.items.length > 0 ? (
                                            paginatedFeedback.items.slice(0, 10).map((feedback) => {
                                                const IconComponent = getFeedbackTypeIcon(feedback.type);
                                                const isExpanded = expandedFeedback === feedback.id;

                                                return (
                                                    <div key={feedback.id}
                                                         className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <div className="flex items-start gap-4">
                                                            <div
                                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                                    feedback.type === 'love' ? 'bg-red-100 dark:bg-red-900/20' :
                                                                        feedback.type === 'bug' ? 'bg-red-100 dark:bg-red-900/20' :
                                                                            feedback.type === 'feature' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                                                                                'bg-blue-100 dark:bg-blue-900/20'
                                                                }`}>
                                                                <IconComponent
                                                                    className={`h-5 w-5 ${getFeedbackTypeColor(feedback.type)}`}/>
                                                            </div>

                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <span
                                                                        className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                                        {feedback.type}
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`h-4 w-4 ${
                                                                                    i < feedback.rating
                                                                                        ? 'text-yellow-400 fill-current'
                                                                                        : 'text-gray-300 dark:text-gray-600'
                                                                                }`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span
                                                                        className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {new Date(feedback.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                </div>

                                                                <p className={`text-gray-700 dark:text-gray-300 ${
                                                                    isExpanded ? '' : 'line-clamp-2'
                                                                }`}>
                                                                    {feedback.message}
                                                                </p>

                                                                {feedback.email && (
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                                        From: {feedback.email}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => setExpandedFeedback(isExpanded ? null : feedback.id!)}
                                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            >
                                                                <Eye className="h-4 w-4"/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-12">
                                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No
                                                    feedback found</h3>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                                                        ? 'Try adjusting your filters to see more feedback.'
                                                        : isAdminRealtime && auth.isAuthenticated
                                                            ? 'No feedback has been submitted to the platform yet.'
                                                            : 'No feedback has been submitted yet.'
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    {paginatedFeedback.totalPages > 1 && (
                                        <div
                                            className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Showing {((feedbackPage - 1) * FEEDBACK_PER_PAGE) + 1} to {Math.min(feedbackPage * FEEDBACK_PER_PAGE, paginatedFeedback.totalCount)} of {paginatedFeedback.totalCount} results
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setFeedbackPage(Math.max(1, feedbackPage - 1))}
                                                    disabled={feedbackPage === 1}
                                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50"
                                                >
                                                    Previous
                                                </button>
                                                <span
                                                    className="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                                    Page {feedbackPage} of {paginatedFeedback.totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setFeedbackPage(Math.min(paginatedFeedback.totalPages, feedbackPage + 1))}
                                                    disabled={feedbackPage === paginatedFeedback.totalPages}
                                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Feedback Trends */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Feedback
                                            Types</h3>
                                        <div className="space-y-3">
                                            {[
                                                {
                                                    type: 'love',
                                                    count: adminFeedback?.feedbackTrends?.love || 0,
                                                    color: 'bg-red-500'
                                                },
                                                {
                                                    type: 'feature',
                                                    count: adminFeedback?.feedbackTrends?.features || 0,
                                                    color: 'bg-yellow-500'
                                                },
                                                {
                                                    type: 'bug',
                                                    count: adminFeedback?.feedbackTrends?.bugs || 0,
                                                    color: 'bg-red-600'
                                                },
                                                {
                                                    type: 'general',
                                                    count: adminFeedback?.feedbackTrends?.general || 0,
                                                    color: 'bg-blue-500'
                                                }
                                            ].map(({type, count, color}) => {
                                                const total = (adminFeedback?.feedbackTrends?.love || 0) +
                                                    (adminFeedback?.feedbackTrends?.features || 0) +
                                                    (adminFeedback?.feedbackTrends?.bugs || 0) +
                                                    (adminFeedback?.feedbackTrends?.general || 0);
                                                const percentage = total > 0 ? (count / total * 100) : 0;

                                                return (
                                                    <div key={type} className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${color}`}/>
                                                        <span
                                                            className="text-sm text-gray-600 dark:text-gray-400 capitalize flex-1">{type}</span>
                                                        <span
                                                            className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                                                        <span
                                                            className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                                                            {percentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent
                                            Activity</h3>
                                        <div className="space-y-3">
                                            {paginatedFeedback.items.slice(0, 5).map((feedback) => (
                                                <div key={feedback.id} className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"/>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                                                        New {feedback.type} feedback received
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(feedback.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users Section */}
                        {currentSection === 'users' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <UserMetricsCard
                                        title={isAdminRealtime && auth.isAuthenticated ? "Platform Users" : "Total Users"}
                                        value={adminAnalytics?.userMetrics.totalUsers || 1}
                                        subtitle={isAdminRealtime && auth.isAuthenticated ? "Registered accounts" : "Current browser session"}
                                        icon={Users}
                                        color="text-blue-600 dark:text-blue-400"
                                        bgColor="bg-blue-100 dark:bg-blue-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Active Sessions"
                                        value={adminAnalytics?.usageMetrics.totalSessions || 0}
                                        subtitle={isAdminRealtime && auth.isAuthenticated ? "Cross-platform" : "Current session"}
                                        icon={Activity}
                                        color="text-green-600 dark:text-green-400"
                                        bgColor="bg-green-100 dark:bg-green-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Avg Session"
                                        value={`${Math.round((adminAnalytics?.usageMetrics.averageSessionDuration || 0) / (1000 * 60))}min`}
                                        icon={Clock}
                                        color="text-purple-600 dark:text-purple-400"
                                        bgColor="bg-purple-100 dark:bg-purple-900/20"
                                    />

                                    <UserMetricsCard
                                        title="Features Used"
                                        value={adminAnalytics?.usageMetrics.featuresUsage ? Object.keys(adminAnalytics.usageMetrics.featuresUsage).length : 0}
                                        subtitle={isAdminRealtime && auth.isAuthenticated ? "Platform-wide" : "This session"}
                                        icon={TrendingUp}
                                        color="text-orange-600 dark:text-orange-400"
                                        bgColor="bg-orange-100 dark:bg-orange-900/20"
                                    />
                                </div>

                                {/* Privacy Notice */}
                                <div
                                    className="rounded-lg p-6 border bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50">
                                    <div className="flex items-start gap-3">
                                        <Shield
                                            className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"/>
                                        <div>
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                                {isAdminRealtime && auth.isAuthenticated
                                                    ? 'Enterprise-Grade SaaS Privacy & Security'
                                                    : 'Privacy-First ApplyTrak Analytics'
                                                }
                                            </h4>
                                            <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
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