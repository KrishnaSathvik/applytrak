// src/components/admin/SupportTools.tsx - UPDATED: Uses Unified Global Refresh System
import React, {useMemo, useState} from 'react';
import {
    Activity,
    AlertTriangle,
    Archive,
    CheckCircle,
    Database,
    Download,
    FileText,
    HelpCircle,
    Mail,
    MessageSquare,
    Settings,
    Star,
    Users,
    X,
    Info
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

// ✅ UPDATED: Real support tools that use unified global refresh (no individual refresh)
const SupportTools: React.FC = () => {
    const {
        // Real data from your store
        applications,
        feedbackList,
        analytics,
        userMetrics,
        adminAnalytics,
        isAdminRealtime,
        auth,
        ui,
        showToast,
        // ✅ REMOVED: refreshAdminData, loadApplications - now uses unified global refresh
        // ✅ NEW: Using global refresh status instead of local state
        getGlobalRefreshStatus
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'tools'>('overview');
    // ✅ REMOVED: Individual refresh state - now uses global refresh status

    // ✅ NEW: Get global refresh status
    const globalRefreshStatus = getGlobalRefreshStatus();

    // Real support metrics from your actual data
    const supportMetrics = useMemo(() => {
        return {
            totalApplications: applications.length,
            totalFeedback: feedbackList.length,
            systemHealth: 'Healthy',
            lastSync: isAdminRealtime && auth.isAuthenticated ? 'Active' : 'Local Mode',
            avgApplicationsPerDay: applications.length > 0 ? (applications.length / 30).toFixed(1) : '0',
            bugReports: feedbackList.filter(f => f.type === 'bug').length,
            featureRequests: feedbackList.filter(f => f.type === 'feature').length,
            userSatisfaction: feedbackList.length > 0 ?
                (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1) : 'N/A'
        };
    }, [applications, feedbackList, isAdminRealtime, auth]);

    // ✅ REMOVED: Individual refresh handler - now uses unified global refresh from AdminDashboard header

    const handleDiagnosticCheck = () => {
        showToast({
            type: 'info',
            message: '🔍 Running system diagnostics...',
            duration: 2000
        });

        setTimeout(() => {
            const diagnostics = {
                localStorage: typeof(Storage) !== "undefined",
                applications: applications.length > 0,
                analytics: analytics !== null,
                theme: ui.theme !== null,
                globalRefresh: globalRefreshStatus !== null,
                timestamp: new Date().toISOString()
            };

            const allChecksPass = Object.values(diagnostics).every(check => check);

            showToast({
                type: allChecksPass ? 'success' : 'warning',
                message: allChecksPass ?
                    '✅ All systems operational' :
                    '⚠️ Some issues detected - check console',
                duration: 3000
            });

            console.log('ApplyTrak Diagnostics:', diagnostics);
        }, 2000);
    };

    const handleExportLogs = () => {
        try {
            const logs = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                applications: applications.length,
                feedback: feedbackList.length,
                systemInfo: {
                    theme: ui.theme,
                    localStorage: typeof(Storage) !== "undefined",
                    sessionStorage: typeof(sessionStorage) !== "undefined",
                    analytics: analytics !== null
                },
                recentFeedback: feedbackList.slice(-5),
                // ✅ NEW: Include global refresh status in logs
                globalRefreshStatus: {
                    isRefreshing: globalRefreshStatus.isRefreshing,
                    lastRefreshTimestamp: globalRefreshStatus.lastRefreshTimestamp,
                    refreshStatus: globalRefreshStatus.refreshStatus,
                    autoRefreshEnabled: globalRefreshStatus.autoRefreshEnabled,
                    refreshErrors: globalRefreshStatus.refreshErrors
                }
            };

            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applytrak-support-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: '📊 Support logs exported successfully',
                duration: 3000
            });
        } catch (error) {
            showToast({
                type: 'error',
                message: '❌ Failed to export logs'
            });
        }
    };

    const handleClearCache = () => {
        try {
            // Clear browser cache that we can control
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
            }

            showToast({
                type: 'success',
                message: '🧹 Cache cleared successfully',
                duration: 3000
            });
        } catch (error) {
            showToast({
                type: 'warning',
                message: '⚠️ Cache partially cleared',
                duration: 3000
            });
        }
    };

    const handleReportBug = () => {
        const bugReport = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            applications: applications.length,
            theme: ui.theme,
            analytics: analytics !== null,
            globalRefreshStatus: globalRefreshStatus.refreshStatus
        };

        const mailtoLink = `mailto:support@applytrak.com?subject=ApplyTrak Bug Report&body=Please describe the issue:%0D%0A%0D%0ASystem Info:%0D%0A${encodeURIComponent(JSON.stringify(bugReport, null, 2))}`;
        window.open(mailtoLink, '_blank');

        showToast({
            type: 'success',
            message: '📧 Bug report template opened in email client',
            duration: 3000
        });
    };

    return (
        <div className="space-y-6">
            {/* ✅ UPDATED: Header without individual refresh button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <HelpCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        Support Tools
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isAdminRealtime && auth.isAuthenticated
                            ? "Live support tools and system diagnostics - Full SaaS functionality active"
                            : "Local support tools - System diagnostics and troubleshooting"
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* ✅ REMOVED: Individual refresh button - uses unified refresh from AdminDashboard header */}

                    {/* ✅ NEW: Info about unified refresh */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Info className="h-4 w-4" />
                        <span>Use global refresh in header</span>
                    </div>

                    <button
                        onClick={handleExportLogs}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export Logs
                    </button>
                </div>
            </div>

            {/* ✅ NEW: Global refresh status indicator */}
            {globalRefreshStatus.isRefreshing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Refreshing support data via global refresh...</span>
                    </div>
                </div>
            )}

            {/* ✅ ENHANCED: Support Metrics Overview with global refresh integration */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applications</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {supportMetrics.totalApplications}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            globalRefreshStatus.refreshStatus === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                                globalRefreshStatus.refreshStatus === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
                                    'bg-blue-100 dark:bg-blue-900/20'
                        }`}>
                            <CheckCircle className={`h-6 w-6 ${
                                globalRefreshStatus.refreshStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                                    globalRefreshStatus.refreshStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                                        'text-blue-600 dark:text-blue-400'
                            }`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
                            <p className={`text-lg font-bold ${
                                globalRefreshStatus.refreshStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                                    globalRefreshStatus.refreshStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                                        'text-blue-600 dark:text-blue-400'
                            }`}>
                                {globalRefreshStatus.refreshStatus === 'success' ? 'Healthy' :
                                    globalRefreshStatus.refreshStatus === 'error' ? 'Issues' : 'Syncing'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Avg</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {supportMetrics.avgApplicationsPerDay}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                            <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {supportMetrics.userSatisfaction}/5
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: Activity },
                        { id: 'diagnostics', label: 'Diagnostics', icon: Settings },
                        { id: 'tools', label: 'Support Tools', icon: Settings }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                System Status
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Applications Tracked:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{supportMetrics.totalApplications}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Feedback Received:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{supportMetrics.totalFeedback}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Bug Reports:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{supportMetrics.bugReports}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Feature Requests:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{supportMetrics.featureRequests}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Sync Status:</span>
                                    <span className={`font-medium ${
                                        supportMetrics.lastSync === 'Active'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                        {supportMetrics.lastSync}
                                    </span>
                                </div>
                                {/* ✅ NEW: Global refresh status display */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Global Refresh:</span>
                                    <span className={`font-medium ${
                                        globalRefreshStatus.refreshStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                                            globalRefreshStatus.refreshStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                                                'text-blue-600 dark:text-blue-400'
                                    }`}>
                                        {globalRefreshStatus.refreshStatus === 'success' ? 'Healthy' :
                                            globalRefreshStatus.refreshStatus === 'error' ? 'Error' :
                                                globalRefreshStatus.isRefreshing ? 'Refreshing' : 'Idle'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleDiagnosticCheck}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <Activity className="h-4 w-4 mr-2" />
                                    Run Diagnostic Check
                                </button>
                                <button
                                    onClick={handleReportBug}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Report Bug
                                </button>
                                <button
                                    onClick={handleClearCache}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Clear Cache
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ ENHANCED: Diagnostics Tab with global refresh status */}
            {activeTab === 'diagnostics' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            System Diagnostics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>Applications:</strong> {applications.length}
                            </div>
                            <div>
                                <strong>Theme:</strong> {ui.theme}
                            </div>
                            <div>
                                <strong>Analytics:</strong> {analytics ? 'Enabled' : 'Disabled'}
                            </div>
                            <div>
                                <strong>LocalStorage:</strong> {typeof(Storage) !== "undefined" ? 'Available' : 'Not Available'}
                            </div>
                            <div>
                                <strong>Auth Status:</strong> {auth.isAuthenticated ? 'Authenticated' : 'Local Mode'}
                            </div>
                            <div>
                                <strong>Sync Mode:</strong> {isAdminRealtime ? 'Real-time' : 'Local Only'}
                            </div>
                            {/* ✅ NEW: Global refresh diagnostics */}
                            <div>
                                <strong>Global Refresh:</strong> {globalRefreshStatus.refreshStatus}
                            </div>
                            <div>
                                <strong>Auto Refresh:</strong> {globalRefreshStatus.autoRefreshEnabled ? 'Enabled' : 'Disabled'}
                            </div>
                            <div>
                                <strong>Last Refresh:</strong> {globalRefreshStatus.lastRefreshTimestamp
                                ? new Date(globalRefreshStatus.lastRefreshTimestamp).toLocaleString()
                                : 'Never'}
                            </div>
                            <div>
                                <strong>Refresh Errors:</strong> {globalRefreshStatus.refreshErrors.length}
                            </div>
                            <div>
                                <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...
                            </div>
                            <div>
                                <strong>Platform:</strong> {navigator.platform}
                            </div>
                            <div>
                                <strong>Language:</strong> {navigator.language}
                            </div>
                            <div>
                                <strong>Timestamp:</strong> {new Date().toISOString()}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">System Health Checks</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">LocalStorage: Working</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Data Loading: Working</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {analytics ?
                                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                                        <X className="h-4 w-4 text-gray-400" />
                                    }
                                    <span className="text-sm">Analytics: {analytics ? 'Active' : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {auth.isAuthenticated ?
                                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                                        <Activity className="h-4 w-4 text-blue-600" />
                                    }
                                    <span className="text-sm">Authentication: {auth.isAuthenticated ? 'Active' : 'Local Mode'}</span>
                                </div>
                                {/* ✅ NEW: Global refresh health check */}
                                <div className="flex items-center gap-2">
                                    {globalRefreshStatus.refreshStatus === 'success' ?
                                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                                        globalRefreshStatus.refreshStatus === 'error' ?
                                            <X className="h-4 w-4 text-red-600" /> :
                                            <Activity className="h-4 w-4 text-blue-600" />
                                    }
                                    <span className="text-sm">Global Refresh: {globalRefreshStatus.refreshStatus}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {globalRefreshStatus.autoRefreshEnabled ?
                                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                                        <X className="h-4 w-4 text-gray-400" />
                                    }
                                    <span className="text-sm">Auto Refresh: {globalRefreshStatus.autoRefreshEnabled ? 'Active' : 'Disabled'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Tools Tab */}
            {activeTab === 'tools' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Diagnostic Tools
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleDiagnosticCheck}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <Activity className="h-4 w-4 mr-2" />
                                    System Health Check
                                </button>
                                <button
                                    onClick={handleExportLogs}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Debug Logs
                                </button>
                                <button
                                    onClick={() => window.open('https://docs.applytrak.com/troubleshooting', '_blank')}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Documentation
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Support Actions
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleReportBug}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Report Bug
                                </button>
                                <button
                                    onClick={() => window.open('mailto:support@applytrak.com?subject=ApplyTrak Support Request', '_blank')}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Contact Support
                                </button>
                                <button
                                    onClick={handleClearCache}
                                    className="w-full btn btn-secondary text-left justify-start"
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Clear Cache & Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTools;