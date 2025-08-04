// src/components/admin/AnalyticsOverview.tsx - Detailed Analytics Component
import React, {useMemo, useState} from 'react';
import {
    Activity,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Calendar,
    ChevronDown,
    Clock,
    Download,
    Minus,
    Monitor,
    RefreshCw,
    Smartphone,
    Users
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

interface TimeRange {
    label: string;
    value: 'day' | 'week' | 'month' | 'all';
    days: number;
}

const timeRanges: TimeRange[] = [
    {label: 'Today', value: 'day', days: 1},
    {label: 'This Week', value: 'week', days: 7},
    {label: 'This Month', value: 'month', days: 30},
    {label: 'All Time', value: 'all', days: 365}
];

export const AnalyticsOverview: React.FC = () => {
    const {adminAnalytics, loadAdminAnalytics, showToast} = useAppStore();
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[2]); // Default to month
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadAdminAnalytics();
            showToast({
                type: 'success',
                message: 'Analytics data refreshed successfully',
                duration: 2000
            });
        } catch (error) {
            showToast({
                type: 'error',
                message: 'Failed to refresh analytics data'
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleExportAnalytics = () => {
        if (!adminAnalytics) return;

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
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applytrak-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast({
            type: 'success',
            message: 'Analytics exported successfully!',
            duration: 3000
        });
    };

    // Calculate trends (mock data for now - in real implementation, you'd compare with previous periods)
    const calculateTrend = (current: number, previous: number = current * 0.8) => {
        if (previous === 0) return {direction: 'up' as const, percentage: 0};
        const change = ((current - previous) / previous) * 100;
        return {
            direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
            percentage: Math.abs(change)
        };
    };

    const userTrend = useMemo(() =>
            calculateTrend(adminAnalytics?.userMetrics.activeUsers.daily || 0),
        [adminAnalytics]
    );

    const sessionTrend = useMemo(() =>
            calculateTrend(adminAnalytics?.usageMetrics.totalSessions || 0),
        [adminAnalytics]
    );

    const deviceUsage = useMemo(() => {
        const mobile = adminAnalytics?.deviceMetrics.mobile || 0;
        const desktop = adminAnalytics?.deviceMetrics.desktop || 0;
        const total = mobile + desktop;

        return {
            mobile: {count: mobile, percentage: total > 0 ? (mobile / total) * 100 : 0},
            desktop: {count: desktop, percentage: total > 0 ? (desktop / total) * 100 : 0}
        };
    }, [adminAnalytics]);

    const topFeatures = useMemo(() => {
        if (!adminAnalytics?.usageMetrics.featuresUsage) return [];

        return Object.entries(adminAnalytics.usageMetrics.featuresUsage)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([feature, count]) => ({
                name: feature.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                count,
                percentage: (count / Math.max(...Object.values(adminAnalytics.usageMetrics.featuresUsage))) * 100
            }));
    }, [adminAnalytics]);

    if (!adminAnalytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Overview</h2>
                    <p className="text-gray-600 dark:text-gray-400">Detailed insights into user behavior and app
                        usage</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Time Range Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Calendar className="h-4 w-4"/>
                            <span className="text-sm font-medium">{selectedTimeRange.label}</span>
                            <ChevronDown className="h-4 w-4"/>
                        </button>

                        {showFilters && (
                            <div
                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                {timeRanges.map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => {
                                            setSelectedTimeRange(range);
                                            setShowFilters(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                            selectedTimeRange.value === range.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                                        }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>

                    <button
                        onClick={handleExportAnalytics}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="h-4 w-4"/>
                        Export
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <div className="flex items-center gap-1">
                            {userTrend.direction === 'up' && <ArrowUp className="h-4 w-4 text-green-500"/>}
                            {userTrend.direction === 'down' && <ArrowDown className="h-4 w-4 text-red-500"/>}
                            {userTrend.direction === 'neutral' && <Minus className="h-4 w-4 text-gray-400"/>}
                            <span className={`text-sm font-medium ${
                                userTrend.direction === 'up' ? 'text-green-500' :
                                    userTrend.direction === 'down' ? 'text-red-500' : 'text-gray-400'
                            }`}>
                {userTrend.percentage.toFixed(1)}%
              </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {adminAnalytics.userMetrics.totalUsers.toLocaleString()}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    </div>
                </div>

                {/* Active Users */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                            <Activity className="h-6 w-6 text-green-600 dark:text-green-400"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {adminAnalytics.userMetrics.activeUsers.daily.toLocaleString()}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Daily Active Users</p>
                    </div>
                </div>

                {/* Total Sessions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                        </div>
                        <div className="flex items-center gap-1">
                            {sessionTrend.direction === 'up' && <ArrowUp className="h-4 w-4 text-green-500"/>}
                            {sessionTrend.direction === 'down' && <ArrowDown className="h-4 w-4 text-red-500"/>}
                            {sessionTrend.direction === 'neutral' && <Minus className="h-4 w-4 text-gray-400"/>}
                            <span className={`text-sm font-medium ${
                                sessionTrend.direction === 'up' ? 'text-green-500' :
                                    sessionTrend.direction === 'down' ? 'text-red-500' : 'text-gray-400'
                            }`}>
                {sessionTrend.percentage.toFixed(1)}%
              </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {adminAnalytics.usageMetrics.totalSessions.toLocaleString()}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                    </div>
                </div>

                {/* Average Session Duration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {Math.round(adminAnalytics.usageMetrics.averageSessionDuration / 1000 / 60)}m
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Device Usage</h3>
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
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{deviceUsage.mobile.count} users</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {deviceUsage.mobile.percentage.toFixed(1)}%
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
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{deviceUsage.desktop.count} users</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {deviceUsage.desktop.percentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {/* Visual Bar */}
                            <div className="mt-6">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div className="flex h-full">
                                        <div
                                            className="bg-blue-500 transition-all duration-500"
                                            style={{width: `${deviceUsage.mobile.percentage}%`}}
                                        />
                                        <div
                                            className="bg-green-500 transition-all duration-500"
                                            style={{width: `${deviceUsage.desktop.percentage}%`}}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span>Mobile {deviceUsage.mobile.percentage.toFixed(1)}%</span>
                                    <span>Desktop {deviceUsage.desktop.percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Activity Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Activity</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Daily Active Users</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {adminAnalytics.userMetrics.activeUsers.daily}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Active Users</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {adminAnalytics.userMetrics.activeUsers.weekly}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Active Users</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {adminAnalytics.userMetrics.activeUsers.monthly}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">New Users (This Month)</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {adminAnalytics.userMetrics.newUsers.thisMonth}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Applications Created</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {adminAnalytics.usageMetrics.totalApplicationsCreated}
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Features</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Most used features by your users</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {topFeatures.map((feature, index) => (
                                <div key={feature.name} className="flex items-center gap-4">
                                    <div
                                        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span
                                                className="font-medium text-gray-900 dark:text-gray-100">{feature.name}</span>
                                            <span
                                                className="text-sm text-gray-600 dark:text-gray-400">{feature.count} uses</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
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
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Analytics Data Quality
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-3">
                            All analytics data is collected anonymously and stored locally in the user's browser.
                            No personal information is tracked or transmitted to external servers.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-blue-600 dark:text-blue-400">
                            <span>• Data retention: 30 days</span>
                            <span>• Privacy compliant</span>
                            <span>• User consent required</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};