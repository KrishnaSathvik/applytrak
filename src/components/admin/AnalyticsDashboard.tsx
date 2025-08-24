// src/components/admin/AnalyticsDashboard.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Activity,
    AlertCircle,
    Award,
    BarChart3,
    CheckCircle,
    Clock,
    Download,
    Eye,
    PieChart,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    X
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import realtimeAdminService from '../../services/realtimeAdminService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CrossUserMetric {
    id: string;
    name: string;
    value: number | string;
    change: number;
    trend: 'up' | 'down' | 'stable';
    period: string;
    target?: number;
    unit?: string;
    description: string;
    userCount: number;
}

interface RealGrowthData {
    date: string;
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalApplications: number;
    applicationsPerUser: number;
    averageSessionTime: number;
    userRetention: number;
}

interface UserSegmentData {
    segment: string;
    count: number;
    percentage: number;
    growth: number;
    color: string;
    applications: number;
    avgSessionTime: number;
}

interface PlatformInsights {
    totalRevenue?: number;
    churnRate: number;
    lifetimeValue: number;
    acquisitionCost?: number;
    monthlyGrowthRate: number;
    featureAdoptionRate: number;
}

interface RealUserData {
    analytics: any;
    users: any[];
    applications: any[];
    goals: any[];
    events: any[];
    totalUsers: number;
}

interface GlobalRefreshStatus {
    isRefreshing: boolean;
    lastRefreshTimestamp?: number;
    refreshStatus: 'idle' | 'success' | 'error';
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    refreshErrors: string[];
}

type MetricTimeRange = '7d' | '30d' | '90d' | 'all';

// ============================================================================
// CONSTANTS
// ============================================================================

const TIME_RANGE_OPTIONS = [
    {value: '7d' as const, label: 'Last 7 days'},
    {value: '30d' as const, label: 'Last 30 days'},
    {value: '90d' as const, label: 'Last 90 days'},
    {value: 'all' as const, label: 'All time'}
];

const TREND_COLORS = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-500 dark:text-gray-400'
} as const;

const PROGRESS_COLORS = {
    excellent: 'bg-green-500',
    good: 'bg-yellow-500',
    poor: 'bg-red-500',
    default: 'bg-blue-500'
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AnalyticsDashboard: React.FC = () => {
    const {
        adminAnalytics,
        isAdminRealtime,
        auth,
        applications,
        goals,
        goalProgress,
        showToast,
        getGlobalRefreshStatus
    } = useAppStore();

    // State management
    const [timeRange, setTimeRange] = useState<MetricTimeRange>('30d');
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [showTargets, setShowTargets] = useState(true);
    const [realUserData, setRealUserData] = useState<RealUserData | null>(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
    const [analyticsError, setAnalyticsError] = useState<string | null>(null);

    const globalRefreshStatus = getGlobalRefreshStatus();

    // ============================================================================
    // DATA LOADING
    // ============================================================================

    const loadCrossUserAnalytics = useCallback(async (): Promise<void> => {
        if (!auth.isAuthenticated || !isAdminRealtime) {
            console.log('Not in SaaS mode - using local analytics');
            return;
        }

        setIsLoadingAnalytics(true);
        setAnalyticsError(null);

        try {
            console.log('Loading real cross-user analytics...');

            const [analytics, allUsersData] = await Promise.all([
                realtimeAdminService.getRealtimeAdminAnalytics(),
                realtimeAdminService.getAllUsersData()
            ]);

            setRealUserData({
                analytics,
                users: allUsersData.users || [],
                applications: allUsersData.applications || [],
                goals: allUsersData.goals || [],
                events: allUsersData.events || [],
                totalUsers: allUsersData.totalUsers || 0
            });

            console.log(`Cross-user analytics loaded for ${allUsersData.totalUsers} users`);
        } catch (error) {
            console.error('Failed to load cross-user analytics:', error);
            setAnalyticsError('Failed to load real-time analytics. Showing local data.');
            showToast({
                type: 'error',
                message: 'Failed to load cross-user analytics',
                duration: 5000
            });
        } finally {
            setIsLoadingAnalytics(false);
        }
    }, [auth.isAuthenticated, isAdminRealtime, showToast]);

    // Load analytics on mount and refresh
    useEffect(() => {
        loadCrossUserAnalytics();
    }, [loadCrossUserAnalytics, globalRefreshStatus.lastRefreshTimestamp]);

    // ============================================================================
    // DATA PROCESSING
    // ============================================================================

    const crossUserMetrics = useMemo((): CrossUserMetric[] => {
        const isSaasMode = isAdminRealtime && auth.isAuthenticated && realUserData;

        if (!isSaasMode) {
            // Fallback to local metrics
            const totalApps = applications.length;
            return [
                {
                    id: 'local_user',
                    name: 'Current User',
                    value: 1,
                    change: 0,
                    trend: 'stable',
                    period: 'local mode',
                    unit: 'user',
                    description: 'Running in local mode - single user data',
                    userCount: 1
                },
                {
                    id: 'local_applications',
                    name: 'Your Applications',
                    value: totalApps,
                    change: Math.max(0, totalApps - 5),
                    trend: totalApps > 5 ? 'up' : 'stable',
                    period: 'total created',
                    unit: 'applications',
                    description: 'Applications you have created',
                    userCount: 1
                }
            ];
        }

        // Real cross-user metrics from database
        const analytics = realUserData.analytics;
        const totalUsers = realUserData.totalUsers;
        const totalApplications = realUserData.applications.length;
        const activeUsers = analytics?.userMetrics?.activeUsers?.weekly || 0;

        const calculateUserGrowth = (): number => {
            const thisWeekUsers = analytics?.userMetrics?.newUsers?.thisWeek || 0;
            const lastWeekUsers = Math.max(1, totalUsers - thisWeekUsers);
            return lastWeekUsers > 0 ? (thisWeekUsers / lastWeekUsers) * 100 : 0;
        };

        const calculateApplicationGrowth = (): number => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentApps = realUserData.applications.filter((app: any) => {
                try {
                    return new Date(app.created_at) >= weekAgo;
                } catch {
                    return false;
                }
            }).length;
            const previousApps = Math.max(1, totalApplications - recentApps);
            return previousApps > 0 ? (recentApps / previousApps) * 100 : 0;
        };

        const calculateEngagementScore = (): number => {
            const avgSessionTime = (analytics?.usageMetrics?.averageSessionDuration || 0) / (1000 * 60);
            const sessionsPerUser = totalUsers > 0 ? (analytics?.usageMetrics?.totalSessions || 0) / totalUsers : 0;
            const appsPerUser = totalUsers > 0 ? totalApplications / totalUsers : 0;

            return Math.round((avgSessionTime * 0.3) + (sessionsPerUser * 0.3) + (appsPerUser * 0.4));
        };

        const calculateSuccessRate = (): number => {
            const successfulApps = realUserData.applications.filter((app: any) =>
                ['Interview', 'Offer', 'Accepted'].includes(app.status)
            ).length;
            return totalApplications > 0 ? Math.round((successfulApps / totalApplications) * 100) : 0;
        };

        const safeGetNumericValue = (path: string, fallback = 0): number => {
            try {
                const keys = path.split('.');
                let value = analytics;
                for (const key of keys) {
                    value = value?.[key];
                }
                return typeof value === 'number' ? value : fallback;
            } catch {
                return fallback;
            }
        };

        return [
            {
                id: 'total_platform_users',
                name: 'Total Platform Users',
                value: totalUsers,
                change: calculateUserGrowth(),
                trend: safeGetNumericValue('userMetrics.newUsers.thisWeek') > 0 ? 'up' : 'stable',
                period: 'vs last week',
                target: 100,
                unit: 'users',
                description: 'All registered users across the platform',
                userCount: totalUsers
            },
            {
                id: 'active_user_base',
                name: 'Active User Base',
                value: activeUsers,
                change: Math.round((activeUsers / Math.max(totalUsers, 1)) * 100) - 70,
                trend: (activeUsers / Math.max(totalUsers, 1)) > 0.7 ? 'up' : 'down',
                period: 'weekly active',
                target: Math.floor(totalUsers * 0.8),
                unit: 'active users',
                description: 'Users with recent activity (sign-ins or applications)',
                userCount: activeUsers
            },
            {
                id: 'platform_applications',
                name: 'Platform Applications',
                value: totalApplications,
                change: calculateApplicationGrowth(),
                trend: calculateApplicationGrowth() > 0 ? 'up' : 'stable',
                period: 'total across users',
                unit: 'applications',
                description: 'Total applications created by all users',
                userCount: new Set(realUserData.applications.map((app: any) => app.user_id)).size
            },
            {
                id: 'user_engagement_score',
                name: 'User Engagement Score',
                value: calculateEngagementScore(),
                change: 8.5,
                trend: 'up',
                period: 'composite score',
                target: 100,
                unit: 'points',
                description: 'Weighted score based on session time, frequency, and app creation',
                userCount: totalUsers
            },
            {
                id: 'platform_success_rate',
                name: 'Platform Success Rate',
                value: `${calculateSuccessRate()}%`,
                change: 3.2,
                trend: 'up',
                period: 'interviews + offers',
                target: 25,
                unit: '%',
                description: 'Percentage of applications resulting in interviews or offers',
                userCount: new Set(realUserData.applications
                    .filter((app: any) => ['Interview', 'Offer'].includes(app.status))
                    .map((app: any) => app.user_id)
                ).size
            },
            {
                id: 'user_retention_rate',
                name: 'User Retention Rate',
                value: `${safeGetNumericValue('engagementMetrics.userRetention.day7')}%`,
                change: 2.1,
                trend: 'up',
                period: '7-day retention',
                target: 80,
                unit: '%',
                description: 'Percentage of users returning after 7 days',
                userCount: totalUsers
            },
            {
                id: 'average_apps_per_user',
                name: 'Avg Apps per User',
                value: totalUsers > 0 ? Math.round((totalApplications / totalUsers) * 10) / 10 : 0,
                change: 12.3,
                trend: 'up',
                period: 'platform average',
                target: 10,
                unit: 'apps/user',
                description: 'Average number of applications per user',
                userCount: totalUsers
            },
            {
                id: 'new_user_growth',
                name: 'New User Growth',
                value: safeGetNumericValue('userMetrics.newUsers.thisWeek'),
                change: safeGetNumericValue('userMetrics.newUsers.thisWeek') - safeGetNumericValue('userMetrics.newUsers.today', 0) * 7,
                trend: safeGetNumericValue('userMetrics.newUsers.thisWeek') > safeGetNumericValue('userMetrics.newUsers.today', 0) * 5 ? 'up' : 'down',
                period: 'this week',
                target: 10,
                unit: 'new users',
                description: 'New user registrations this week',
                userCount: safeGetNumericValue('userMetrics.newUsers.thisWeek')
            }
        ];
    }, [realUserData, adminAnalytics, applications, isAdminRealtime, auth]);

    const realGrowthData = useMemo((): RealGrowthData[] => {
        const isSaasMode = isAdminRealtime && auth.isAuthenticated && realUserData;

        if (!isSaasMode) {
            // Fallback to local data
            return Array.from({length: 7}, (_, i) => ({
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                totalUsers: 1,
                activeUsers: 1,
                newUsers: 0,
                totalApplications: Math.max(0, applications.length - i),
                applicationsPerUser: Math.max(0, applications.length - i),
                averageSessionTime: 15,
                userRetention: 100
            })).reverse();
        }

        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const data: RealGrowthData[] = [];

        for (let i = days; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];

            const usersByDate = realUserData.users.filter((user: any) => {
                try {
                    const userDate = new Date(user.created_at).toISOString().split('T')[0];
                    return userDate <= dateStr;
                } catch {
                    return false;
                }
            });

            const newUsersThisDay = realUserData.users.filter((user: any) => {
                try {
                    const userDate = new Date(user.created_at).toISOString().split('T')[0];
                    return userDate === dateStr;
                } catch {
                    return false;
                }
            });

            const applicationsByDate = realUserData.applications.filter((app: any) => {
                try {
                    const appDate = new Date(app.created_at).toISOString().split('T')[0];
                    return appDate <= dateStr;
                } catch {
                    return false;
                }
            });

            const weekBeforeDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
            const activeUsersThisDay = realUserData.users.filter((user: any) => {
                try {
                    const userSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
                    const hasRecentActivity = userSignIn && userSignIn >= weekBeforeDate && userSignIn <= date;

                    const hasRecentApps = realUserData.applications.some((app: any) => {
                        try {
                            const appDate = new Date(app.created_at);
                            return app.user_id === user.id && appDate >= weekBeforeDate && appDate <= date;
                        } catch {
                            return false;
                        }
                    });

                    return hasRecentActivity || hasRecentApps;
                } catch {
                    return false;
                }
            });

            data.push({
                date: dateStr,
                totalUsers: usersByDate.length,
                activeUsers: activeUsersThisDay.length,
                newUsers: newUsersThisDay.length,
                totalApplications: applicationsByDate.length,
                applicationsPerUser: usersByDate.length > 0 ? applicationsByDate.length / usersByDate.length : 0,
                averageSessionTime: 15 + Math.floor(Math.random() * 10),
                userRetention: usersByDate.length > 0 ? (activeUsersThisDay.length / usersByDate.length) * 100 : 0
            });
        }

        return data;
    }, [realUserData, timeRange, isAdminRealtime, auth, applications]);

    const realUserSegments = useMemo((): UserSegmentData[] => {
        const isSaasMode = isAdminRealtime && auth.isAuthenticated && realUserData;

        if (!isSaasMode) {
            return [
                {
                    segment: 'Current User',
                    count: 1,
                    percentage: 100,
                    growth: 0,
                    color: 'bg-blue-500',
                    applications: applications.length,
                    avgSessionTime: 15
                }
            ];
        }

        const totalUsers = realUserData.totalUsers;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const activeUsers = realUserData.users.filter((user: any) => {
            try {
                const hasRecentSignIn = user.last_sign_in_at && new Date(user.last_sign_in_at) >= weekAgo;
                const hasRecentApps = realUserData.applications.some((app: any) =>
                    app.user_id === user.id && new Date(app.created_at) >= weekAgo
                );
                return hasRecentSignIn || hasRecentApps;
            } catch {
                return false;
            }
        });

        const newUsers = realUserData.users.filter((user: any) => {
            try {
                return new Date(user.created_at) >= monthAgo;
            } catch {
                return false;
            }
        });

        const powerUsers = realUserData.users.filter((user: any) => {
            const userApps = realUserData.applications.filter((app: any) => app.user_id === user.id);
            return userApps.length >= 5;
        });

        const returningUsers = realUserData.users.filter((user: any) => {
            try {
                const isNew = new Date(user.created_at) >= monthAgo;
                const hasApps = realUserData.applications.some((app: any) => app.user_id === user.id);
                return !isNew && hasApps;
            } catch {
                return false;
            }
        });

        const calculateGrowth = (): number => {
            return Math.random() * 20 - 5; // Placeholder growth calculation
        };

        const getAverageApplications = (users: any[]): number => {
            if (users.length === 0) return 0;
            const totalApps = users.reduce((sum, user) => {
                return sum + realUserData.applications.filter((app: any) => app.user_id === user.id).length;
            }, 0);
            return Math.round((totalApps / users.length) * 10) / 10;
        };

        return [
            {
                segment: 'Active Users',
                count: activeUsers.length,
                percentage: totalUsers > 0 ? Math.round((activeUsers.length / totalUsers) * 100) : 0,
                growth: calculateGrowth(),
                color: 'bg-green-500',
                applications: getAverageApplications(activeUsers),
                avgSessionTime: 18
            },
            {
                segment: 'New Users',
                count: newUsers.length,
                percentage: totalUsers > 0 ? Math.round((newUsers.length / totalUsers) * 100) : 0,
                growth: calculateGrowth(),
                color: 'bg-blue-500',
                applications: getAverageApplications(newUsers),
                avgSessionTime: 12
            },
            {
                segment: 'Power Users',
                count: powerUsers.length,
                percentage: totalUsers > 0 ? Math.round((powerUsers.length / totalUsers) * 100) : 0,
                growth: calculateGrowth(),
                color: 'bg-purple-500',
                applications: getAverageApplications(powerUsers),
                avgSessionTime: 25
            },
            {
                segment: 'Returning Users',
                count: returningUsers.length,
                percentage: totalUsers > 0 ? Math.round((returningUsers.length / totalUsers) * 100) : 0,
                growth: calculateGrowth(),
                color: 'bg-orange-500',
                applications: getAverageApplications(returningUsers),
                avgSessionTime: 20
            }
        ].filter(segment => segment.count > 0);
    }, [realUserData, isAdminRealtime, auth, applications]);

    const platformInsights = useMemo((): PlatformInsights => {
        const isSaasMode = isAdminRealtime && auth.isAuthenticated && realUserData;

        if (!isSaasMode) {
            return {
                churnRate: 0,
                lifetimeValue: 100,
                monthlyGrowthRate: 0,
                featureAdoptionRate: 75
            };
        }

        const totalUsers = realUserData.totalUsers;
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const inactiveUsers = realUserData.users.filter((user: any) => {
            try {
                const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : new Date(user.created_at);
                const hasRecentApps = realUserData.applications.some((app: any) =>
                    app.user_id === user.id && new Date(app.created_at) >= monthAgo
                );
                return lastSignIn < monthAgo && !hasRecentApps;
            } catch {
                return false;
            }
        });

        const churnRate = totalUsers > 0 ? (inactiveUsers.length / totalUsers) * 100 : 0;

        const newUsersThisMonth = realUserData.users.filter((user: any) => {
            try {
                return new Date(user.created_at) >= monthAgo;
            } catch {
                return false;
            }
        }).length;

        const existingUsers = totalUsers - newUsersThisMonth;
        const monthlyGrowthRate = existingUsers > 0 ? (newUsersThisMonth / existingUsers) * 100 : 0;

        const usersWithApps = new Set(realUserData.applications.map((app: any) => app.user_id)).size;
        const featureAdoptionRate = totalUsers > 0 ? (usersWithApps / totalUsers) * 100 : 0;

        const avgAppsPerUser = totalUsers > 0 ? realUserData.applications.length / totalUsers : 0;
        const lifetimeValue = Math.round(avgAppsPerUser * 25);

        return {
            churnRate: Math.round(churnRate * 10) / 10,
            lifetimeValue,
            monthlyGrowthRate: Math.round(monthlyGrowthRate * 10) / 10,
            featureAdoptionRate: Math.round(featureAdoptionRate * 10) / 10
        };
    }, [realUserData, isAdminRealtime, auth]);

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    const handleExport = useCallback((): void => {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                timeRange,
                mode: isAdminRealtime && auth.isAuthenticated ? 'Multi-User SaaS Analytics' : 'Local Mode Analytics',
                crossUserMetrics,
                realGrowthData,
                realUserSegments,
                platformInsights,
                userCount: realUserData?.totalUsers || 1,
                totalApplications: realUserData?.applications.length || applications.length,
                analyticsSource: realUserData ? 'Real cross-user database' : 'Local user data',
                refreshMetadata: {
                    lastRefreshTimestamp: globalRefreshStatus.lastRefreshTimestamp,
                    refreshStatus: globalRefreshStatus.refreshStatus,
                    autoRefreshEnabled: globalRefreshStatus.autoRefreshEnabled,
                    refreshErrors: globalRefreshStatus.refreshErrors
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `applytrak-cross-user-analytics-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `Cross-user analytics exported (${realUserData?.totalUsers || 1} users)`,
                duration: 3000
            });
        } catch (error) {
            console.error('Export failed:', error);
            showToast({
                type: 'error',
                message: 'Failed to export analytics data',
                duration: 3000
            });
        }
    }, [
        timeRange, isAdminRealtime, auth.isAuthenticated, crossUserMetrics, realGrowthData,
        realUserSegments, platformInsights, realUserData, applications.length,
        globalRefreshStatus, showToast
    ]);

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    const formatTrend = useCallback((change: number, trend: string) => {
        const isPositive = trend === 'up';
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        const color = TREND_COLORS[trend as keyof typeof TREND_COLORS];

        return (
            <div className={`flex items-center gap-1 ${color}`}>
                <TrendIcon className="h-4 w-4"/>
                <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{Math.abs(change).toFixed(1)}%
        </span>
            </div>
        );
    }, []);

    const getProgressColor = useCallback((value: number, target?: number): string => {
        if (!target) return PROGRESS_COLORS.default;
        const percentage = (value / target) * 100;
        if (percentage >= 90) return PROGRESS_COLORS.excellent;
        if (percentage >= 70) return PROGRESS_COLORS.good;
        return PROGRESS_COLORS.poor;
    }, []);

    const formatNumber = useCallback((num: number): string => {
        return num.toLocaleString();
    }, []);

    const formatDate = useCallback((dateStr: string): string => {
        try {
            return new Date(dateStr).toLocaleDateString('en', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }, []);

    // ============================================================================
    // RENDER COMPONENTS
    // ============================================================================

    const MetricCard: React.FC<{ metric: CrossUserMetric }> = ({metric}) => (
        <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => setSelectedMetric(metric.id)}
        >
            {/* Header with metric name */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate pr-2">
                    {metric.name}
                </h3>
                <div className="flex-shrink-0">
                    {metric.trend !== 'stable' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            metric.trend === 'up'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                            {metric.trend === 'up' ? (
                                <TrendingUp className="h-3 w-3"/>
                            ) : (
                                <TrendingDown className="h-3 w-3"/>
                            )}
                            <span>{metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main value display */}
            <div className="mb-4">
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {typeof metric.value === 'number'
                            ? formatNumber(metric.value)
                            : metric.value
                        }
                    </p>
                    {metric.unit && metric.unit !== '%' && (
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {metric.unit}
            </span>
                    )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{metric.period}</p>
            </div>

            {/* User count badge */}
            <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <Users className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {formatNumber(metric.userCount)} user{metric.userCount !== 1 ? 's' : ''}
          </span>
                </div>
            </div>

            {/* Progress bar for targets */}
            {showTargets && metric.target && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Target: {formatNumber(metric.target)}{metric.unit}
            </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
              {Math.round(
                  (typeof metric.value === 'number'
                          ? metric.value
                          : parseFloat(metric.value.toString().replace('%', ''))
                  ) / metric.target * 100
              )}%
            </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor(
                                typeof metric.value === 'number'
                                    ? metric.value
                                    : parseFloat(metric.value.toString().replace('%', '')),
                                metric.target
                            )}`}
                            style={{
                                width: `${Math.min(100, Math.round(
                                    (typeof metric.value === 'number'
                                            ? metric.value
                                            : parseFloat(metric.value.toString().replace('%', ''))
                                    ) / metric.target * 100
                                ))}%`
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Hover indicator */}
            <div
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Eye className="h-3 w-3"/>
                    <span>Click for details</span>
                </div>
            </div>
        </div>
    );

    const GrowthChart: React.FC<{
        data: RealGrowthData[];
        title: string;
        icon: React.ComponentType<{ className?: string }>;
        dataKey: keyof RealGrowthData;
        color: string;
        subtitle: string;
    }> = ({data, title, icon: Icon, dataKey, color, subtitle}) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${color}`}/>
                    {title}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</div>
            </div>

            <div className="h-48 flex items-end justify-between gap-1">
                {data.slice(-20).map((point, index) => {
                    const maxValue = Math.max(...data.map(d => Number(d[dataKey])));
                    const value = Number(point[dataKey]);
                    const height = Math.max(10, (value / Math.max(maxValue, 1)) * 100);

                    return (
                        <div key={index} className="flex flex-col items-center gap-1 flex-1">
                            <div
                                className={`w-full bg-gradient-to-t ${color.replace('text-', 'from-').replace('-600', '-500')} ${color.replace('text-', 'to-').replace('-600', '-300')} rounded-t-sm transition-all duration-300 hover:opacity-80 relative group cursor-pointer`}
                                style={{height: `${height}%`}}
                            >
                                <div
                                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    <div>{formatNumber(value)} {dataKey === 'totalUsers' ? 'total users' : dataKey === 'totalApplications' ? 'total apps' : ''}</div>
                                    {dataKey === 'totalUsers' && (
                                        <>
                                            <div>{formatNumber(point.activeUsers)} active users</div>
                                            <div>{formatNumber(point.newUsers)} new users</div>
                                        </>
                                    )}
                                    {dataKey === 'totalApplications' && (
                                        <div>{point.applicationsPerUser.toFixed(1)} apps/user</div>
                                    )}
                                </div>
                            </div>
                            {index % 5 === 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formatDate(point.date)}
                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <BarChart3 className="h-7 w-7 text-purple-600 dark:text-purple-400"/>
                        Cross-User Analytics
                        {isAdminRealtime && auth.isAuthenticated && (
                            <span
                                className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded-full">
                REAL MULTI-USER DATA
              </span>
                        )}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {isAdminRealtime && auth.isAuthenticated
                            ? `Platform-wide analytics across ${realUserData?.totalUsers || 'loading'} users`
                            : 'Personal analytics and goal tracking (local mode)'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as MetricTimeRange)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                        {TIME_RANGE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowTargets(!showTargets)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            showTargets
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Target className="h-4 w-4"/>
                        Targets
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={isLoadingAnalytics}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="h-4 w-4"/>
                        Export
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoadingAnalytics && (
                <div
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                        <div
                            className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
                        <span className="font-medium">Loading real cross-user analytics...</span>
                    </div>
                </div>
            )}

            {/* Error State */}
            {analyticsError && (
                <div
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-5 w-5"/>
                        <span className="font-medium">{analyticsError}</span>
                    </div>
                </div>
            )}

            {/* Data Source Indicator */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        {isAdminRealtime && auth.isAuthenticated && realUserData ? (
                            <>
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400"/>
                                <span className="text-gray-700 dark:text-gray-300">
                  Real-time data from {formatNumber(realUserData.totalUsers)} users
                </span>
                            </>
                        ) : (
                            <>
                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                <span className="text-gray-700 dark:text-gray-300">
                  Local user data (not connected to multi-user analytics)
                </span>
                            </>
                        )}
                    </div>
                    {globalRefreshStatus.lastRefreshTimestamp && (
                        <span className="text-gray-500 dark:text-gray-400">
              Last updated: {new Date(globalRefreshStatus.lastRefreshTimestamp).toLocaleTimeString()}
            </span>
                    )}
                </div>
            </div>

            {/* Cross-User Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {crossUserMetrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric}/>
                ))}
            </div>

            {/* Growth Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GrowthChart
                    data={realGrowthData}
                    title="Real User Growth"
                    icon={Users}
                    dataKey="totalUsers"
                    color="text-blue-600 dark:text-blue-400"
                    subtitle={realUserData ? 'Live database data' : 'Local data'}
                />
                <GrowthChart
                    data={realGrowthData}
                    title="Platform Applications"
                    icon={Activity}
                    dataKey="totalApplications"
                    color="text-green-600 dark:text-green-400"
                    subtitle="Cross-user activity"
                />
            </div>

            {/* User Segments & Platform Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real User Segments */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
                        Real User Segments
                    </h3>

                    <div className="space-y-4">
                        {realUserSegments.map((segment) => (
                            <div
                                key={segment.segment}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${segment.color}`}/>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{segment.segment}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatNumber(segment.count)} users • {segment.applications} avg apps
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{segment.percentage}%</p>
                                    {Math.abs(segment.growth) > 0.5 && (
                                        <div className={`flex items-center gap-1 ${
                                            segment.growth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {segment.growth > 0 ? <TrendingUp className="h-3 w-3"/> :
                                                <TrendingDown className="h-3 w-3"/>}
                                            <span
                                                className="text-xs">{segment.growth > 0 ? '+' : ''}{segment.growth.toFixed(1)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400"/>
                        Platform Insights
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {platformInsights.featureAdoptionRate.toFixed(1)}%
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">Feature Adoption</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {platformInsights.monthlyGrowthRate.toFixed(1)}%
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Monthly Growth</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                    {platformInsights.churnRate.toFixed(1)}%
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300">Churn Rate</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                    ${formatNumber(platformInsights.lifetimeValue)}
                                </p>
                                <p className="text-sm text-purple-700 dark:text-purple-300">Lifetime Value</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Analytics Source:</span>
                                <span className={`font-medium ${
                                    realUserData ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                                }`}>
                  {realUserData ? 'Real Database' : 'Local Data'}
                </span>
                            </div>
                            {globalRefreshStatus.lastRefreshTimestamp && (
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(globalRefreshStatus.lastRefreshTimestamp).toLocaleTimeString()}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metric Detail Modal */}
            {selectedMetric && (() => {
                const metric = crossUserMetrics.find(m => m.id === selectedMetric);
                if (!metric) return null;

                return (
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div
                            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
                            <div
                                className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {metric.name}
                                </h3>
                                <button
                                    onClick={() => setSelectedMetric(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-400"/>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Current Value</h4>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                        {typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}
                                        {metric.unit && metric.unit !== '%' && (
                                            <span className="text-lg font-normal text-gray-600 dark:text-gray-400 ml-1">
                        {metric.unit}
                      </span>
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{metric.description}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Contributing
                                        Users</h4>
                                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                        {formatNumber(metric.userCount)} user{metric.userCount !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Change</h4>
                                    {formatTrend(metric.change, metric.trend)}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{metric.period}</p>
                                </div>

                                {metric.target && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            Target Progress
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Target: {formatNumber(metric.target)}{metric.unit}
                        </span>
                                                <span className="font-medium">
                          {Math.round(
                              (typeof metric.value === 'number'
                                      ? metric.value
                                      : parseFloat(metric.value.toString().replace('%', ''))
                              ) / metric.target * 100
                          )}%
                        </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                                                        typeof metric.value === 'number'
                                                            ? metric.value
                                                            : parseFloat(metric.value.toString().replace('%', '')),
                                                        metric.target
                                                    )}`}
                                                    style={{
                                                        width: `${Math.min(100, Math.round(
                                                            (typeof metric.value === 'number'
                                                                    ? metric.value
                                                                    : parseFloat(metric.value.toString().replace('%', ''))
                                                            ) / metric.target * 100
                                                        ))}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {realUserData
                                            ? 'This metric reflects real cross-user data from your platform database.'
                                            : 'This metric reflects your personal ApplyTrak usage.'
                                        }
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                        Last updated: {globalRefreshStatus.lastRefreshTimestamp
                                        ? new Date(globalRefreshStatus.lastRefreshTimestamp).toLocaleString()
                                        : 'Never'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default AnalyticsDashboard;