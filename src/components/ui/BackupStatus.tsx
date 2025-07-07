// src/components/ui/BackupStatus.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Upload, Trash2, Info, CheckCircle, AlertCircle } from 'lucide-react';
import {
    getStorageUsage,
    clearOldBackups,
    createManualBackup,
    getLocalBackups,
    emergencyRecover
} from '../../utils/backup';
import { Application } from '../../types';

interface BackupStatusProps {
    applications: Application[];
    onRestore?: (applications: Application[]) => void;
    onShowToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface StorageInfo {
    used: number;
    usedMB: number;
    estimated_limit: number;
    available: number;
    percentage: number;
    canBackup: boolean;
}

interface LocalBackup {
    apps?: Partial<Application>[];
    applications?: Application[];
    ts?: string;
    timestamp?: string;
    v?: string;
    version?: string;
    count?: number;
}

const BackupStatus: React.FC<BackupStatusProps> = ({
                                                       applications,
                                                       onRestore,
                                                       onShowToast
                                                   }) => {
    const [storageInfo, setStorageInfo] = useState<StorageInfo>({
        used: 0,
        usedMB: 0,
        estimated_limit: 5120, // 5MB default
        available: 5120,
        percentage: 0,
        canBackup: true
    });
    const [localBackups, setLocalBackups] = useState<LocalBackup[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const updateInfo = () => {
            try {
                const usage = getStorageUsage();
                setStorageInfo(usage);

                const backups = getLocalBackups();
                setLocalBackups(backups);
            } catch (error) {
                console.warn('Failed to update storage info:', error);
            }
        };

        // Initial update
        updateInfo();

        // Update every 30 seconds
        const interval = setInterval(updateInfo, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleClearBackups = () => {
        // ESLint fix: Use window.confirm instead of global confirm
        if (window.confirm('Clear all local backups? This will free up storage space but remove recovery options.')) {
            try {
                clearOldBackups();
                setStorageInfo(getStorageUsage());
                setLocalBackups([]);
                onShowToast?.('Local backups cleared', 'success');
            } catch (error) {
                onShowToast?.('Failed to clear backups', 'error');
            }
        }
    };

    const handleCreateManualBackup = async () => {
        try {
            await createManualBackup(applications);
            onShowToast?.('Backup file downloaded successfully', 'success');
        } catch (error) {
            onShowToast?.(`Backup failed: ${error}`, 'error');
        }
    };

    const handleEmergencyRecover = () => {
        try {
            const recovered = emergencyRecover();
            if (recovered && recovered.length > 0) {
                onRestore?.(recovered);
                onShowToast?.(`Recovered ${recovered.length} applications from local backup`, 'success');
            } else {
                onShowToast?.('No recoverable data found in local storage', 'warning');
            }
        } catch (error) {
            onShowToast?.('Recovery failed', 'error');
        }
    };

    const getStorageStatusColor = () => {
        if (storageInfo.percentage >= 90) return 'text-red-600 dark:text-red-400';
        if (storageInfo.percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getStorageStatusIcon = () => {
        if (storageInfo.percentage >= 90) return <AlertCircle className="w-4 h-4" />;
        if (storageInfo.percentage >= 75) return <AlertTriangle className="w-4 h-4" />;
        return <CheckCircle className="w-4 h-4" />;
    };

    const getLatestBackupTime = () => {
        if (!localBackups.length) return null;

        const latest = localBackups[0];
        const timestamp = latest?.ts || latest?.timestamp;

        if (!timestamp) return null;

        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return 'Unknown time';
        }
    };

    return (
        <div className="glass-card bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30">
            {/* Header */}
            <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 ${getStorageStatusColor()}`}>
                        {getStorageStatusIcon()}
                        <span className="font-display font-bold text-lg tracking-wide text-gradient-static">
                            Storage Status
                        </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                        {storageInfo.percentage}% used
                    </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 group-hover:scale-110 transition-all duration-200">
                    <Info className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Storage Progress Bar */}
            <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 shadow-sm ${
                            storageInfo.percentage >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                storageInfo.percentage >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                    'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    <span>{storageInfo.usedMB.toFixed(1)} MB used</span>
                    <span>{(storageInfo.estimated_limit / 1024).toFixed(0)} MB limit</span>
                </div>
            </div>

            {/* Warning for high usage */}
            {storageInfo.percentage >= 75 && (
                <div className={`mt-4 p-4 rounded-xl border-2 ${
                    storageInfo.percentage >= 90
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}>
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                            storageInfo.percentage >= 90 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`} />
                        <div className="text-sm">
                            <p className={`font-bold tracking-wide ${
                                storageInfo.percentage >= 90 ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                            }`}>
                                {storageInfo.percentage >= 90 ? 'Storage Almost Full!' : 'Storage Getting Full'}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium leading-relaxed">
                                {storageInfo.percentage >= 90
                                    ? 'Auto-backup may fail. Consider clearing old backups or downloading manual backup.'
                                    : 'Auto-backup working but consider clearing old data soon.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-6 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    {/* Backup Info */}
                    <div>
                        <h4 className="font-display font-bold text-lg text-gradient-blue tracking-wide mb-3">
                            Local Backup Status
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">Available backups:</span>
                                    <span className="font-bold text-gradient-static">{localBackups.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">Backup capability:</span>
                                    <span className={`font-bold ${storageInfo.canBackup ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {storageInfo.canBackup ? '✅ Good' : '❌ Limited'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">Applications:</span>
                                    <span className="font-bold text-gradient-purple">{applications.length}</span>
                                </div>
                                {localBackups.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-600 dark:text-gray-400">Latest backup:</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                                            {getLatestBackupTime() || 'Unknown'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleCreateManualBackup}
                            className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Backup</span>
                        </button>

                        {localBackups.length > 0 && (
                            <button
                                onClick={handleEmergencyRecover}
                                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Emergency Restore</span>
                            </button>
                        )}

                        {localBackups.length > 0 && (
                            <button
                                onClick={handleClearBackups}
                                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Clear Backups</span>
                            </button>
                        )}
                    </div>

                    {/* Technical Details */}
                    <details className="text-xs text-gray-500 dark:text-gray-400">
                        <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 font-semibold tracking-wide">
                            Technical Details
                        </summary>
                        <div className="mt-3 space-y-1 font-mono bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border">
                            <p>Used: {storageInfo.used} KB ({storageInfo.usedMB.toFixed(2)} MB)</p>
                            <p>Available: {storageInfo.available} KB</p>
                            <p>Estimated Limit: {storageInfo.estimated_limit} KB</p>
                            <p>Applications Count: {applications.length}</p>
                            <p>Backup Status: {storageInfo.canBackup ? 'OK' : 'At Risk'}</p>
                            <p>Storage Health: {
                                storageInfo.percentage >= 90 ? 'Critical' :
                                    storageInfo.percentage >= 75 ? 'Warning' : 'Good'
                            }</p>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default BackupStatus;