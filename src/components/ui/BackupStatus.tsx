import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AlertCircle, AlertTriangle, CheckCircle, Download, Info, Trash2, Upload} from 'lucide-react';
import {
    clearOldBackups,
    createManualBackup,
    emergencyRecover,
    getLocalBackups,
    getStorageUsage
} from '../../utils/backup';
import {Application} from '../../types';

// Constants for better maintainability
const STORAGE_THRESHOLDS = {
    WARNING: 75,
    CRITICAL: 90,
    MAX_PERCENTAGE: 100,
} as const;

const UPDATE_INTERVALS = {
    STORAGE_UPDATE: 30000, // 30 seconds
} as const;

const STORAGE_DEFAULTS = {
    ESTIMATED_LIMIT_KB: 5120, // 5MB default
    BYTES_PER_KB: 1024,
} as const;

const ANIMATION_DURATION = {
    STORAGE_BAR: 500,
    HOVER_SCALE: 200,
} as const;

// Type definitions for better type safety
interface StorageInfo {
    used: number;
    usedMB: number;
    estimated_limit: number;
    available: number;
    percentage: number;
    canBackup: boolean;
}

// Type guard to ensure StorageUsage matches StorageInfo
const normalizeStorageUsage = (usage: any): StorageInfo => {
    return {
        used: usage.used || 0,
        usedMB: usage.usedMB || 0,
        estimated_limit: usage.estimated_limit || STORAGE_DEFAULTS.ESTIMATED_LIMIT_KB,
        available: usage.available || STORAGE_DEFAULTS.ESTIMATED_LIMIT_KB,
        percentage: usage.percentage || 0,
        canBackup: usage.canBackup !== undefined ? usage.canBackup : true
    };
};

interface LocalBackup {
    apps?: Partial<Application>[];
    applications?: Application[];
    ts?: string;
    timestamp?: string;
    v?: string;
    version?: string;
    count?: number;
}

interface BackupStatusProps {
    applications: Application[];
    onRestore?: (applications: Application[]) => void;
    onShowToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

type StorageHealthLevel = 'good' | 'warning' | 'critical';

// Utility functions for storage status
const getStorageHealthLevel = (percentage: number): StorageHealthLevel => {
    if (percentage >= STORAGE_THRESHOLDS.CRITICAL) return 'critical';
    if (percentage >= STORAGE_THRESHOLDS.WARNING) return 'warning';
    return 'good';
};

const getStorageStatusStyles = (healthLevel: StorageHealthLevel) => {
    const styles = {
        good: {
            text: 'text-green-600 dark:text-green-400',
            icon: CheckCircle,
            progressBar: 'bg-gradient-to-r from-green-500 to-emerald-500',
            alertBg: 'bg-green-50 dark:bg-green-900/20',
            alertBorder: 'border-green-200 dark:border-green-800'
        },
        warning: {
            text: 'text-yellow-600 dark:text-yellow-400',
            icon: AlertTriangle,
            progressBar: 'bg-gradient-to-r from-yellow-500 to-orange-500',
            alertBg: 'bg-yellow-50 dark:bg-yellow-900/20',
            alertBorder: 'border-yellow-200 dark:border-yellow-800'
        },
        critical: {
            text: 'text-red-600 dark:text-red-400',
            icon: AlertCircle,
            progressBar: 'bg-gradient-to-r from-red-500 to-red-600',
            alertBg: 'bg-red-50 dark:bg-red-900/20',
            alertBorder: 'border-red-200 dark:border-red-800'
        }
    };
    return styles[healthLevel];
};

const formatFileSize = (kb: number): string => {
    if (kb < STORAGE_DEFAULTS.BYTES_PER_KB) {
        return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / STORAGE_DEFAULTS.BYTES_PER_KB).toFixed(1)} MB`;
};

const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'Unknown time';

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Invalid date';

        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Unknown time';
    }
};

const BackupStatus: React.FC<BackupStatusProps> = ({
                                                       applications,
                                                       onRestore,
                                                       onShowToast,
                                                       autoRefresh = true,
                                                       refreshInterval = UPDATE_INTERVALS.STORAGE_UPDATE
                                                   }) => {
    // State management
    const [storageInfo, setStorageInfo] = useState<StorageInfo>({
        used: 0,
        usedMB: 0,
        estimated_limit: STORAGE_DEFAULTS.ESTIMATED_LIMIT_KB,
        available: STORAGE_DEFAULTS.ESTIMATED_LIMIT_KB,
        percentage: 0,
        canBackup: true
    });

    const [localBackups, setLocalBackups] = useState<LocalBackup[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Memoized calculations
    const storageHealthLevel = useMemo(() =>
            getStorageHealthLevel(storageInfo.percentage),
        [storageInfo.percentage]
    );

    const statusStyles = useMemo(() =>
            getStorageStatusStyles(storageHealthLevel),
        [storageHealthLevel]
    );

    const StatusIcon = statusStyles.icon;

    const latestBackupTime = useMemo(() => {
        if (!localBackups.length) return null;

        const latest = localBackups[0];
        const timestamp = latest?.ts || latest?.timestamp;
        return formatTimestamp(timestamp);
    }, [localBackups]);

    // Storage info update function with error handling
    const updateStorageInfo = useCallback(async () => {
        try {
            setIsLoading(true);

            const rawUsage = getStorageUsage();
            const normalizedUsage = normalizeStorageUsage(rawUsage);
            const backups = getLocalBackups();

            setStorageInfo(normalizedUsage);
            setLocalBackups(backups);
            setLastUpdated(new Date());

        } catch (error) {
            console.error('Failed to update storage info:', error);
            onShowToast?.('Failed to update storage information', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [onShowToast]);

    // Auto-refresh effect
    useEffect(() => {
        // Initial update
        updateStorageInfo();

        if (!autoRefresh) return;

        // Set up interval for updates
        const interval = setInterval(updateStorageInfo, refreshInterval);

        return () => clearInterval(interval);
    }, [updateStorageInfo, autoRefresh, refreshInterval]);

    // Event handlers with enhanced error handling
    const handleClearBackups = useCallback(async () => {
        const confirmed = window.confirm(
            'Clear all local backups? This will free up storage space but remove recovery options.'
        );

        if (!confirmed) return;

        try {
            setIsLoading(true);
            clearOldBackups();

            // Update storage info after clearing
            const rawUsage = getStorageUsage();
            const normalizedUsage = normalizeStorageUsage(rawUsage);
            const backups = getLocalBackups();

            setStorageInfo(normalizedUsage);
            setLocalBackups(backups);
            setLastUpdated(new Date());

            onShowToast?.('Local backups cleared successfully', 'success');
        } catch (error) {
            console.error('Failed to clear backups:', error);
            onShowToast?.('Failed to clear backups', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [onShowToast]);

    const handleCreateManualBackup = useCallback(async () => {
        if (applications.length === 0) {
            onShowToast?.('No applications to backup', 'warning');
            return;
        }

        try {
            setIsLoading(true);
            await createManualBackup(applications);
            onShowToast?.('Backup file downloaded successfully', 'success');
        } catch (error) {
            console.error('Backup failed:', error);
            onShowToast?.(`Backup failed: ${error}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [applications, onShowToast]);

    const handleEmergencyRecover = useCallback(async () => {
        const confirmed = window.confirm(
            'Restore from emergency backup? This will replace your current applications.'
        );

        if (!confirmed) return;

        try {
            setIsLoading(true);
            const recovered = emergencyRecover();

            if (recovered && recovered.length > 0) {
                onRestore?.(recovered);
                onShowToast?.(`Recovered ${recovered.length} applications from local backup`, 'success');
            } else {
                onShowToast?.('No recoverable data found in local storage', 'warning');
            }
        } catch (error) {
            console.error('Recovery failed:', error);
            onShowToast?.('Recovery failed', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [onRestore, onShowToast]);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    // Warning message content
    const getWarningMessage = () => {
        if (storageHealthLevel === 'critical') {
            return {
                title: 'Storage Almost Full!',
                message: 'Auto-backup may fail. Consider clearing old backups or downloading manual backup.'
            };
        }
        if (storageHealthLevel === 'warning') {
            return {
                title: 'Storage Getting Full',
                message: 'Auto-backup working but consider clearing old data soon.'
            };
        }
        return null;
    };

    const warningMessage = getWarningMessage();

    return (
        <div
            className="glass-card bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30">
            {/* Header */}
            <header
                className="flex items-center justify-between cursor-pointer group"
                onClick={toggleExpanded}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpanded();
                    }
                }}
                aria-expanded={isExpanded}
                aria-label="Toggle backup status details"
            >
                <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 ${statusStyles.text}`}>
                        <StatusIcon className="w-4 h-4" aria-hidden="true"/>
                        <h2 className="font-display font-bold text-lg tracking-wide text-gradient-static">
                            Storage Status
                        </h2>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
            {storageInfo.percentage.toFixed(1)}% used
          </span>
                    {isLoading && (
                        <div
                            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                    )}
                </div>

                <button
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 group-hover:scale-110 transition-all duration-200"
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    tabIndex={-1} // Since parent handles keyboard events
                >
                    <Info
                        className={`w-5 h-5 transform transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                    />
                </button>
            </header>

            {/* Storage Progress Bar */}
            <div className="mt-4" role="group" aria-labelledby="storage-progress-label">
                <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner"
                    role="progressbar"
                    aria-valuenow={storageInfo.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Storage usage: ${storageInfo.percentage.toFixed(1)}%`}
                >
                    <div
                        className={`h-3 rounded-full transition-all duration-${ANIMATION_DURATION.STORAGE_BAR} shadow-sm ${statusStyles.progressBar}`}
                        style={{width: `${Math.min(storageInfo.percentage, STORAGE_THRESHOLDS.MAX_PERCENTAGE)}%`}}
                    />
                </div>

                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    <span>{formatFileSize(storageInfo.used)} used</span>
                    <span>{formatFileSize(storageInfo.estimated_limit)} limit</span>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>

            {/* Warning for high usage */}
            {warningMessage && storageHealthLevel !== 'good' && (
                <div
                    className={`mt-4 p-4 rounded-xl border-2 ${statusStyles.alertBg} ${statusStyles.alertBorder}`}
                    role="alert"
                    aria-live="polite"
                >
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${statusStyles.text}`} aria-hidden="true"/>
                        <div className="text-sm">
                            <h3 className={`font-bold tracking-wide ${statusStyles.text}`}>
                                {warningMessage.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium leading-relaxed">
                                {warningMessage.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-6 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    {/* Backup Information */}
                    <section>
                        <h3 className="font-display font-bold text-lg text-gradient-blue tracking-wide mb-3">
                            Local Backup Status
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Available backups:
                  </span>
                                    <span className="font-bold text-gradient-static">
                    {localBackups.length}
                  </span>
                                </div>
                                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Backup capability:
                  </span>
                                    <span
                                        className={`font-bold ${
                                            storageInfo.canBackup
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}
                                    >
                    {storageInfo.canBackup ? 'Good' : 'Limited'}
                  </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Applications:
                  </span>
                                    <span className="font-bold text-gradient-purple">
                    {applications.length}
                  </span>
                                </div>
                                {latestBackupTime && (
                                    <div className="flex justify-between">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      Latest backup:
                    </span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                      {latestBackupTime}
                    </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Action Buttons */}
                    <section>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 tracking-wide mb-3">
                            Backup Actions
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleCreateManualBackup}
                                disabled={isLoading || applications.length === 0}
                                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                aria-label="Download backup file"
                            >
                                <Download className="w-4 h-4" aria-hidden="true"/>
                                <span>Download Backup</span>
                            </button>

                            {localBackups.length > 0 && (
                                <button
                                    onClick={handleEmergencyRecover}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    aria-label="Restore from emergency backup"
                                >
                                    <Upload className="w-4 h-4" aria-hidden="true"/>
                                    <span>Emergency Restore</span>
                                </button>
                            )}

                            {localBackups.length > 0 && (
                                <button
                                    onClick={handleClearBackups}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    aria-label="Clear all local backups"
                                >
                                    <Trash2 className="w-4 h-4" aria-hidden="true"/>
                                    <span>Clear Backups</span>
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Technical Details */}
                    <details className="text-xs text-gray-500 dark:text-gray-400">
                        <summary
                            className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1">
                            Technical Details
                        </summary>
                        <div className="mt-3 space-y-1 font-mono bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border">
                            <div className="grid grid-cols-2 gap-2">
                                <span>Used:</span>
                                <span>{storageInfo.used} KB ({storageInfo.usedMB.toFixed(2)} MB)</span>

                                <span>Available:</span>
                                <span>{storageInfo.available} KB</span>

                                <span>Estimated Limit:</span>
                                <span>{storageInfo.estimated_limit} KB</span>

                                <span>Applications Count:</span>
                                <span>{applications.length}</span>

                                <span>Backup Status:</span>
                                <span className={storageInfo.canBackup ? 'text-green-600' : 'text-red-600'}>
                  {storageInfo.canBackup ? 'OK' : 'At Risk'}
                </span>

                                <span>Storage Health:</span>
                                <span className={`capitalize ${statusStyles.text}`}>
                  {storageHealthLevel}
                </span>
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default BackupStatus;