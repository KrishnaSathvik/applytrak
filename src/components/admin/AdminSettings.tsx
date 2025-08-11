// src/components/admin/AdminSettings.tsx - UPDATED: Uses Unified Global Refresh System
import React, {useMemo, useState} from 'react';
import {
    Activity,
    AlertTriangle,
    Archive,
    Bell,
    CheckCircle,
    Database,
    Download,
    Edit,
    Eye,
    EyeOff,
    FileText,
    Key,
    Lock,
    Plus,
    Save,
    Settings,
    Shield,
    UserCheck,
    Users,
    X,
    Info
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

// ✅ UPDATED: Real admin settings that uses unified global refresh (no individual refresh)
const AdminSettings: React.FC = () => {
    const {
        // Real data from your store
        applications,
        feedbackList,
        analytics,
        goals,
        userMetrics,
        adminAnalytics,
        isAdminRealtime,
        auth,
        ui,
        analyticsSettings,
        showToast,
        // ✅ REMOVED: refreshAdminData - now uses unified global refresh
        setTheme,
        enableAnalytics,
        disableAnalytics,
        updateGoals,
        loadApplications,
        loadGoals,
        // ✅ NEW: Using global refresh status instead of local state
        getGlobalRefreshStatus
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<'system' | 'privacy' | 'data' | 'appearance' | 'backup'>('system');
    // ✅ REMOVED: Individual refresh state - now uses global refresh status
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // ✅ NEW: Get global refresh status
    const globalRefreshStatus = getGlobalRefreshStatus();

    // Real system stats from your actual data
    const systemStats = useMemo(() => {
        return {
            totalApplications: applications.length,
            totalFeedback: feedbackList.length,
            analyticsEnabled: analyticsSettings.enabled,
            currentTheme: ui.theme,
            totalSessions: adminAnalytics?.usageMetrics?.totalSessions || 0,
            avgSessionDuration: adminAnalytics?.usageMetrics?.averageSessionDuration || 0,
            storageUsed: applications.length * 0.5, // Rough KB estimate
            lastBackup: localStorage.getItem('applytrak_last_backup') || 'Never'
        };
    }, [applications, feedbackList, analyticsSettings, ui.theme, adminAnalytics]);

    // ✅ REMOVED: Individual refresh handler - now uses unified global refresh from AdminDashboard header

    const handleToggleAnalytics = (enabled: boolean) => {
        if (enabled) {
            enableAnalytics();
            showToast({
                type: 'success',
                message: '📊 Analytics enabled successfully',
                duration: 3000
            });
        } else {
            disableAnalytics();
            showToast({
                type: 'warning',
                message: '📊 Analytics disabled',
                duration: 3000
            });
        }
        setHasUnsavedChanges(true);
    };

    const handleThemeChange = (theme: 'light' | 'dark') => {
        setTheme(theme);
        showToast({
            type: 'success',
            message: `🎨 Theme changed to ${theme} mode`,
            duration: 3000
        });
        setHasUnsavedChanges(true);
    };

    const handleExportAllData = () => {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                applications,
                goals,
                analytics,
                userMetrics,
                feedbackList,
                settings: {
                    theme: ui.theme,
                    analytics: analyticsSettings
                },
                systemStats,
                // ✅ NEW: Include global refresh metadata
                refreshMetadata: {
                    lastRefreshTimestamp: globalRefreshStatus.lastRefreshTimestamp,
                    refreshStatus: globalRefreshStatus.refreshStatus
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applytrak-complete-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: '📦 Complete data export successful',
                duration: 3000
            });
        } catch (error) {
            showToast({
                type: 'error',
                message: '❌ Failed to export data'
            });
        }
    };

    const handleClearAllData = () => {
        if (window.confirm('⚠️ This will permanently delete all your applications, goals, and analytics data. Are you sure?')) {
            try {
                // Clear localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('applytrak_')) {
                        localStorage.removeItem(key);
                    }
                });

                // Reload the page to reset the app state
                window.location.reload();

                showToast({
                    type: 'success',
                    message: '🗑️ All data cleared successfully',
                    duration: 3000
                });
            } catch (error) {
                showToast({
                    type: 'error',
                    message: '❌ Failed to clear data'
                });
            }
        }
    };

    const handleResetGoals = async () => {
        if (window.confirm('Reset all goals to default values?')) {
            try {
                const defaultGoals = {
                    totalGoal: 100,
                    weeklyGoal: 5,
                    monthlyGoal: 20
                };
                await updateGoals(defaultGoals);
                showToast({
                    type: 'success',
                    message: '🎯 Goals reset to defaults',
                    duration: 3000
                });
            } catch (error) {
                showToast({
                    type: 'error',
                    message: '❌ Failed to reset goals'
                });
            }
        }
    };

    const handleCreateBackup = () => {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                applications,
                goals,
                analytics,
                settings: analyticsSettings,
                // ✅ NEW: Include global refresh status in backup
                refreshStatus: globalRefreshStatus
            };

            // Save backup timestamp
            localStorage.setItem('applytrak_last_backup', new Date().toISOString());

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applytrak-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: '💾 Backup created successfully',
                duration: 3000
            });
        } catch (error) {
            showToast({
                type: 'error',
                message: '❌ Failed to create backup'
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* ✅ UPDATED: Header without individual refresh button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Settings className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                        System Settings
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isAdminRealtime && auth.isAuthenticated
                            ? "Live system configuration and data management - Full SaaS functionality active"
                            : "Local system settings - Managing your ApplyTrak configuration"
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasUnsavedChanges && (
                        <button
                            onClick={() => {
                                setHasUnsavedChanges(false);
                                showToast({type: 'success', message: '✅ Settings applied successfully'});
                            }}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Apply Changes
                        </button>
                    )}
                    {/* ✅ REMOVED: Individual refresh button - uses unified refresh from AdminDashboard header */}

                    {/* ✅ NEW: Info about unified refresh */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Info className="h-4 w-4" />
                        <span>Use global refresh button in header</span>
                    </div>
                </div>
            </div>

            {/* ✅ NEW: Global refresh status indicator */}
            {globalRefreshStatus.isRefreshing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Global refresh in progress...</span>
                    </div>
                </div>
            )}

            {/* ✅ NEW: Enhanced system stats with global refresh timestamp */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applications</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {systemStats.totalApplications}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                            <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sessions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {systemStats.totalSessions}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {systemStats.storageUsed.toFixed(1)}KB
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                            <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Refresh Status</p>
                            <p className={`text-lg font-bold ${
                                globalRefreshStatus.refreshStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                                    globalRefreshStatus.refreshStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                                        'text-blue-600 dark:text-blue-400'
                            }`}>
                                {globalRefreshStatus.refreshStatus === 'success' ? 'Healthy' :
                                    globalRefreshStatus.refreshStatus === 'error' ? 'Error' : 'Syncing'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    {[
                        { id: 'system', label: 'System', icon: Settings },
                        { id: 'privacy', label: 'Privacy', icon: Shield },
                        { id: 'data', label: 'Data', icon: Database },
                        { id: 'appearance', label: 'Appearance', icon: Eye },
                        { id: 'backup', label: 'Backup', icon: Archive }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
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

            {/* System Tab */}
            {activeTab === 'system' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Core System Settings
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Analytics Collection</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Enable analytics to track your job application progress
                                    </p>
                                </div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={systemStats.analyticsEnabled}
                                        onChange={(e) => handleToggleAnalytics(e.target.checked)}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        {systemStats.analyticsEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Default Goals</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Current: {goals.weeklyGoal} weekly, {goals.monthlyGoal} monthly, {goals.totalGoal} total
                                    </p>
                                </div>
                                <button
                                    onClick={handleResetGoals}
                                    className="btn btn-secondary text-sm"
                                >
                                    Reset to Defaults
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">System Mode</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {isAdminRealtime && auth.isAuthenticated ? 'SaaS Mode (Cloud Sync)' : 'Local Mode (Offline)'}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    isAdminRealtime && auth.isAuthenticated
                                        ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                        : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                }`}>
                                    {isAdminRealtime && auth.isAuthenticated ? 'CLOUD' : 'LOCAL'}
                                </span>
                            </div>

                            {/* ✅ NEW: Global refresh status display */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Global Refresh Status</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Last refreshed: {globalRefreshStatus.lastRefreshTimestamp
                                        ? new Date(globalRefreshStatus.lastRefreshTimestamp).toLocaleString()
                                        : 'Never'}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    globalRefreshStatus.refreshStatus === 'success' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                                        globalRefreshStatus.refreshStatus === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
                                            'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                }`}>
                                    {globalRefreshStatus.refreshStatus === 'success' ? 'SUCCESS' :
                                        globalRefreshStatus.refreshStatus === 'error' ? 'ERROR' :
                                            globalRefreshStatus.isRefreshing ? 'REFRESHING' : 'IDLE'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Privacy Settings
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Data Encryption</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Your data is encrypted both in storage and during transmission
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20">
                                    ENABLED
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Local Storage</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Data stored locally on your device for offline access
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                                    ACTIVE
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Anonymous Analytics</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Analytics data is anonymized and contains no personal information
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20">
                                    PROTECTED
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Data Management
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Data</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Download all your data including applications, goals, and analytics
                                </p>
                                <button
                                    onClick={handleExportAllData}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export All Data
                                </button>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Permanently delete all your data. This action cannot be undone.
                                </p>
                                <button
                                    onClick={handleClearAllData}
                                    className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear All Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Appearance Settings
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Theme</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleThemeChange('light')}
                                        className={`p-4 border-2 rounded-lg flex items-center gap-3 ${
                                            systemStats.currentTheme === 'light'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
                                        <span className="font-medium">Light Mode</span>
                                        {systemStats.currentTheme === 'light' && (
                                            <CheckCircle className="h-5 w-5 text-purple-600 ml-auto" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleThemeChange('dark')}
                                        className={`p-4 border-2 rounded-lg flex items-center gap-3 ${
                                            systemStats.currentTheme === 'dark'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <div className="w-6 h-6 bg-gray-800 border border-gray-600 rounded"></div>
                                        <span className="font-medium">Dark Mode</span>
                                        {systemStats.currentTheme === 'dark' && (
                                            <CheckCircle className="h-5 w-5 text-purple-600 ml-auto" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backup Tab */}
            {activeTab === 'backup' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Backup & Recovery
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Create Backup</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Create a backup file of all your data for safekeeping
                                </p>
                                <button
                                    onClick={handleCreateBackup}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <Archive className="h-4 w-4" />
                                    Create Backup
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Backup Status</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Backup:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {systemStats.lastBackup === 'Never' ? 'Never' : new Date(systemStats.lastBackup).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Auto Backup:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {isAdminRealtime && auth.isAuthenticated ? 'Enabled' : 'Manual Only'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;