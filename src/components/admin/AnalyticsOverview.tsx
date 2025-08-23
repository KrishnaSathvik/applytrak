// src/components/admin/AnalyticsOverview.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Activity,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Calendar,
    ChevronDown,
    Clock,
    Download,
    Info,
    Minus,
    Monitor,
    Smartphone,
    Users
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

interface TimeRange {
    label: string;
    value: 'day' | 'week' | 'month' | 'all';
    days: number;
}

interface TrendData {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
}

interface DeviceUsageData {
    mobile: { count: number; percentage: number };
    desktop: { count: number; percentage: number };
}

interface FeatureUsageData {
    name: string;
    count: number;
    percentage: number;
}

interface UserMetrics {
    totalUsers: number;
    activeUsers: {
        daily: number;
        weekly: number;
        monthly: number;
    };
    newUsers: {
        thisMonth: number;
    };
}

interface UsageMetrics {
    totalSessions: number;
    averageSessionDuration: number;
    totalApplicationsCreated: number;
    featuresUsage: Record<string, number>;
}

interface DeviceMetrics {
    mobile: number;
    desktop: number;
}

interface AdminAnalyticsData {
    userMetrics: UserMetrics;
    usageMetrics: UsageMetrics;
    deviceMetrics: DeviceMetrics;
}

interface GlobalRefreshStatus {
    isRefreshing: boolean;
    lastRefreshTimestamp?: number;
    refreshStatus: 'idle' | 'success' | 'error';
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    refreshErrors: string[];
}

const TIME_RANGES: TimeRange[] = [
    {label: 'Today', value: 'day', days: 1},
    {label: 'This Week', value: 'week', days: 7},
    {label: 'This Month', value: 'month', days: 30},
    {label: 'All Time', value: 'all', days: 365}
];

const TREND_COLORS = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400'
} as const;

const METRIC_COLORS = {
    users: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    activity: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    sessions: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    duration: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
} as const;

export const AnalyticsOverview: React.FC = () => {
    const {
        adminAnalytics,
        showToast,
        getGlobalRefreshStatus
    } = useAppStore();

    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(TIME_RANGES[2]); // Default to month
    const [showFilters, setShowFilters] = useState(false);

    const globalRefreshStatus = getGlobalRefreshStatus();

    // Close filters when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowFilters(false);
        if (showFilters) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showFilters]);

    const handleExportAnalytics = useCallback((): void => {
        if (!adminAnalytics) {
            showToast({
                type: 'error',
                message: 'No analytics data available to export',
                duration: 3000
            });
            return;
        }

        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                timeRange: selectedTimeRange.label,
                analytics: adminAnalytics,
                summary: {
                    totalUsers: adminAnalytics.userMetrics.totalUsers,
                    totalSessions: adminAnalytics.usageMetrics.totalSessions,
                    averageSessionDuration: adminAnalytics.usageMetrics.averageSessionDuration,
                    mostUsedFeatures: Object.entries(adminAnalytics.usageMetrics.featuresUsage || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([name, count]) => ({name, count}))
                },
                refreshMetadata: {
                    lastRefreshTimestamp: globalRefreshStatus.lastRefreshTimestamp,
                    refreshStatus: globalRefreshStatus.refreshStatus,
                    autoRefreshEnabled: globalRefreshStatus.autoRefreshEnabled,
                    refreshErrors: globalRefreshStatus.refreshErrors
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `applytrak-analytics-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: 'Analytics exported successfully!',
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
    }, [adminAnalytics, selectedTimeRange.label, globalRefreshStatus, showToast]);

    // Calculate trends with fallback data
    const calculateTrend = useCallback((current: number, previous?: number): TrendData => {
        const fallbackPrevious = previous ?? current * 0.8;
        if (fallbackPrevious === 0) return {direction: 'neutral', percentage: 0};

        const change = ((current - fallbackPrevious) / fallbackPrevious) * 100;
        return {
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
            percentage: Math.abs(change)
        };
    }, []);

    const userTrend = useMemo(() =>
            calculateTrend(Number(adminAnalytics?.userMetrics.activeUsers.daily) || 0),
        [adminAnalytics?.userMetrics.activeUsers.daily, calculateTrend]
    );

    const sessionTrend = useMemo(() =>
            calculateTrend(Number(adminAnalytics?.usageMetrics.totalSessions) || 0),
        [adminAnalytics?.usageMetrics.totalSessions, calculateTrend]
    );

    const deviceUsage = useMemo((): DeviceUsageData => {
        const mobile = Number(adminAnalytics?.deviceMetrics.mobile) || 0;
        const desktop = Number(adminAnalytics?.deviceMetrics.desktop) || 0;
        const total = mobile + desktop;

        return {
            mobile: {
                count: mobile,
                percentage: total > 0 ? Math.round((mobile / total) * 100 * 10) / 10 : 0
            },
            desktop: {
                count: desktop,
                percentage: total > 0 ? Math.round((desktop / total) * 100 * 10) / 10 : 0
            }
        };
    }, [adminAnalytics?.deviceMetrics]);

    const topFeatures = useMemo((): FeatureUsageData[] => {
        if (!adminAnalytics?.usageMetrics.featuresUsage) return [];

        const features = Object.entries(adminAnalytics.usageMetrics.featuresUsage);
        if (features.length === 0) return [];

        const maxCount = Math.max(...Object.values(adminAnalytics.usageMetrics.featuresUsage));

        return features
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([feature, count]) => ({
                name: feature
                    .replace(/[_-]/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase()),
                count,
                percentage: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
            }));
    }, [adminAnalytics?.usageMetrics.featuresUsage]);

    const formatDuration = useCallback((milliseconds: number): string => {
        const minutes = Math.round(milliseconds / 1000 / 60);
        return `${minutes}m`;
    }, []);

    const formatNumber = useCallback((num: number): string => {
        return num.toLocaleString();
    }, []);

    const formatTimestamp = useCallback((timestamp?: number | string): string => {
        if (!timestamp) return 'Never';
        try {
            return new Date(timestamp).toLocaleTimeString();
        } catch (error) {
            return 'Invalid';
        }
    }, []);

    const handleTimeRangeChange = useCallback((range: TimeRange): void => {
        setSelectedTimeRange(range);
        setShowFilters(false);
    }, []);

    const TrendIndicator: React.FC<{ trend: TrendData }> = ({trend}) => (
        <div className="flex items-center gap-1">
            {trend.direction === 'up' && <ArrowUp className="h-4 w-4 text-green-500"/>}
            {trend.direction === 'down' && <ArrowDown className="h-4 w-4 text-red-500"/>}
            {trend.direction === 'neutral' && <Minus className="h-4 w-4 text-gray-400"/>}
            <span className={`text-sm font-medium ${TREND_COLORS[trend.direction]}`}>
        {trend.percentage.toFixed(1)}%
      </span>
        </div>
    );

    const RefreshIndicator: React.FC<{ variant?: 'dot' | 'text' }> = ({variant = 'dot'}) => {
        if (globalRefreshStatus.refreshStatus !== 'success') return null;

        return variant === 'dot' ? (
            <div className="w-2 h-2 bg-green-500 rounded-full"/>
        ) : (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"/>
                <span>Live</span>
            </div>
        );
    };

    // Loading state
    if (!adminAnalytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"/>
                    <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
                    {globalRefreshStatus.isRefreshing && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            Global refresh in progress...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Analytics Overview
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Detailed insights into user behavior and app usage
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Time Range Selector */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFilters(!showFilters);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <Calendar className="h-4 w-4"/>
                            <span className="text-sm font-medium">{selectedTimeRange.label}</span>
                            <ChevronDown className="h-4 w-4"/>
                        </button>

                        {showFilters && (
                            <div
                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                {TIME_RANGES.map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => handleTimeRangeChange(range)}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                            selectedTimeRange.value === range.value
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Global Refresh Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Info className="h-4 w-4" />
                        <span className="hidden sm:inline">Use global refresh in header</span>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportAnalytics}
                        disabled={!adminAnalytics}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        <Download className="h-4 w-4"/>
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* Global Refresh Status */}
            {globalRefreshStatus.isRefreshing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <div
                            className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
                        <span className="text-sm font-medium">
              Refreshing analytics overview via global refresh...
            </span>
                    </div>
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${METRIC_COLORS.users}`}>
                            <Users className="h-6 w-6"/>
                        </div>
                        <TrendIndicator trend={userTrend}/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatNumber(adminAnalytics.userMetrics.totalUsers)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Updated: {formatTimestamp(globalRefreshStatus.lastRefreshTimestamp)}
                        </p>
                    </div>
                </div>

                {/* Active Users */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${METRIC_COLORS.activity}`}>
                            <Activity className="h-6 w-6"/>
                        </div>
                        <RefreshIndicator/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatNumber(adminAnalytics.userMetrics.activeUsers.daily)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Daily Active Users</p>
                    </div>
                </div>

                {/* Total Sessions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${METRIC_COLORS.sessions}`}>
                            <BarChart3 className="h-6 w-6"/>
                        </div>
                        <TrendIndicator trend={sessionTrend}/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatNumber(adminAnalytics.usageMetrics.totalSessions)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                    </div>
                </div>

                {/* Average Session Duration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${METRIC_COLORS.duration}`}>
                            <Clock className="h-6 w-6"/>
                        </div>
                        <RefreshIndicator/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatDuration(adminAnalytics.usageMetrics.averageSessionDuration)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Session Duration</p>
                    </div>
                </div>
            </div>

            {/* Device Usage & User Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Usage */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Device Usage
                            </h3>
                            <RefreshIndicator variant="text"/>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {/* Mobile */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                        <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">Mobile</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatNumber(deviceUsage.mobile.count)} users
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {deviceUsage.mobile.percentage}%
                                    </p>
                                </div>
                            </div>

                            {/* Desktop */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                        <Monitor className="h-5 w-5 text-green-600 dark:text-green-400"/>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">Desktop</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatNumber(deviceUsage.desktop.count)} users
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {deviceUsage.desktop.percentage}%
                                    </p>
                                </div>
                            </div>

                            {/* Visual Bar */}
                            <div className="mt-6">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div className="flex h-full">
                                        <div
                                            className="bg-blue-500 transition-all duration-500 ease-out"
                                            style={{width: `${deviceUsage.mobile.percentage}%`}}
                                        />
                                        <div
                                            className="bg-green-500 transition-all duration-500 ease-out"
                                            style={{width: `${deviceUsage.desktop.percentage}%`}}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span>Mobile {deviceUsage.mobile.percentage}%</span>
                                    <span>Desktop {deviceUsage.desktop.percentage}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Activity Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                User Activity
                            </h3>
                            {globalRefreshStatus.autoRefreshEnabled && (
                                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
                                    <span>Auto-refresh: {globalRefreshStatus.autoRefreshInterval}s</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Daily Active Users</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(adminAnalytics.userMetrics.activeUsers.daily)}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Active Users</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(adminAnalytics.userMetrics.activeUsers.weekly)}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Active Users</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(adminAnalytics.userMetrics.activeUsers.monthly)}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">New Users (This Month)</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(adminAnalytics.userMetrics.newUsers.thisMonth)}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Applications Created</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(adminAnalytics.usageMetrics.totalApplicationsCreated)}
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Usage */}
            {topFeatures.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Features</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Most used features by your users</p>
                            </div>
                            {globalRefreshStatus.refreshStatus === 'success' && (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"/>
                                    <span>Current</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {topFeatures.map((feature, index) => (
                                <div key={feature.name} className="flex items-center gap-4">
                                    <div
                                        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {feature.name}
                      </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {formatNumber(feature.count)} uses
                      </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                                                style={{width: `${feature.percentage}%`}}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Data Quality Info */}
            <div
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-start gap-3">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"/>
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Analytics Data Quality
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-3">
                            All analytics data is collected anonymously and stored locally in the user's browser.
                            No personal information is tracked or transmitted to external servers.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-blue-600 dark:text-blue-400">
                            <span>• Data retention: 30 days</span>
                            <span>• Privacy compliant</span>
                            <span>• User consent required</span>
                            <span>• Auto-refresh: {globalRefreshStatus.autoRefreshEnabled ? 'Enabled' : 'Manual'}</span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Last updated: {globalRefreshStatus.lastRefreshTimestamp
                            ? new Date(globalRefreshStatus.lastRefreshTimestamp).toLocaleString()
                            : 'Never refreshed'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};