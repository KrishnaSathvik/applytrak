import React, {useEffect, useState} from 'react';
import {AlertTriangle, CheckCircle, Database, Download, HardDrive, RefreshCw, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {recoveryUtils} from '../../services/database';
import {Application} from '../../types';

interface RecoveryOption {
    id: string;
    name: string;
    description: string;
    data: Application[];
    count: number;
    lastModified: string;
    source: 'localStorage' | 'database' | 'file';
}

const RecoveryModal: React.FC = () => {
    const {modals, showToast, loadApplications} = useAppStore();
    const {recovery} = modals;

    const [availableOptions, setAvailableOptions] = useState<RecoveryOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<RecoveryOption | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [previewData, setPreviewData] = useState<{
        totalApplications: number;
        statusBreakdown: Record<string, number>;
        dateRange: { earliest: string; latest: string };
    } | null>(null);

    // Load recovery options when modal opens
    useEffect(() => {
        if (recovery.isOpen) {
            loadRecoveryOptions();
        }
    }, [recovery.isOpen]);

    const loadRecoveryOptions = async () => {
        setIsLoading(true);
        try {
            const options = await recoveryUtils.getRecoveryOptions();
            const formattedOptions: RecoveryOption[] = options.map((option, index) => ({
                id: `${option.source}-${index}`,
                name: option.source === 'localStorage' ? 'Local Storage Backup' : `Database Backup ${index + 1}`,
                description: option.source === 'localStorage'
                    ? 'Essential data backup stored in your browser'
                    : `Full backup from ${new Date(option.source.split('-')[1] || Date.now()).toLocaleDateString()}`,
                data: option.data,
                count: option.count,
                lastModified: option.source === 'localStorage' ? 'Unknown' : option.source.split('-')[1] || 'Unknown',
                source: option.source.includes('localStorage') ? 'localStorage' : 'database'
            }));

            setAvailableOptions(formattedOptions);
        } catch (error) {
            console.error('Failed to load recovery options:', error);
            showToast({
                type: 'error',
                message: 'Failed to load recovery options'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const previewRecoveryOption = (option: RecoveryOption) => {
        setSelectedOption(option);

        // Calculate preview statistics
        const applications = option.data;
        const statusBreakdown = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const dates = applications.map(app => new Date(app.dateApplied)).sort((a, b) => a.getTime() - b.getTime());
        const dateRange = {
            earliest: dates[0]?.toLocaleDateString() || 'Unknown',
            latest: dates[dates.length - 1]?.toLocaleDateString() || 'Unknown'
        };

        setPreviewData({
            totalApplications: applications.length,
            statusBreakdown,
            dateRange
        });
    };

    const executeRecovery = async () => {
        if (!selectedOption) return;

        setIsRecovering(true);
        try {
            const {databaseService} = await import('../../services/database');

            const currentData = await databaseService.getApplications();
            if (currentData.length > 0) {
                await databaseService.createBackup(); // FIXED: Remove parameter
                showToast({
                    type: 'info',
                    message: 'Current data backed up before recovery'
                });
            }
            await Promise.all(
                selectedOption.data.map(app => {
                    // FIXED: Remove id property and use proper destructuring
                    const {id, createdAt, updatedAt, ...appData} = app;
                    return databaseService.addApplication(appData);
                })
            );

            // Reload applications
            await loadApplications();

            showToast({
                type: 'success',
                message: `Successfully recovered ${selectedOption.count} applications!`,
                duration: 5000
            });

            closeRecoveryModal();
        } catch (error) {
            console.error('Recovery failed:', error);
            showToast({
                type: 'error',
                message: `Recovery failed: ${error}`
            });
        } finally {
            setIsRecovering(false);
        }
    };

    const closeRecoveryModal = () => {
        useAppStore.getState().modals.recovery.isOpen = false;
        setSelectedOption(null);
        setPreviewData(null);
        setAvailableOptions([]);
    };

    if (!recovery.isOpen) return null;

    return (
        <div className="modal-overlay" onClick={closeRecoveryModal}>
            <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
                <div className="card-header bg-yellow-600 text-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2"/>
                            Data Recovery Center
                        </h2>
                        <button
                            onClick={closeRecoveryModal}
                            className="text-white/80 hover:text-white transition-colors"
                            aria-label="Close recovery modal"
                        >
                            <X className="h-5 w-5"/>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Recovery Info */}
                    <div className="glass rounded-lg p-4 border-l-4 border-yellow-500">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5"/>
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                    Data Recovery Available
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    We found potential backup data that can be restored. Select a recovery source below
                                    to preview and restore your applications.
                                </p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2"/>
                                <p className="text-gray-600 dark:text-gray-400">Scanning for recovery options...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recovery Options */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                    <Database className="h-4 w-4 mr-2"/>
                                    Available Recovery Sources
                                </h3>

                                {availableOptions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <Database className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                                        <p>No recovery options found</p>
                                        <p className="text-sm mt-1">Try importing from a backup file</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {availableOptions.map((option) => (
                                            <div
                                                key={option.id}
                                                className={`glass rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                                    selectedOption?.id === option.id
                                                        ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                        : 'border border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                                }`}
                                                onClick={() => previewRecoveryOption(option)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-3">
                                                        {option.source === 'localStorage' ? (
                                                            <HardDrive className="h-5 w-5 text-blue-600 mt-0.5"/>
                                                        ) : (
                                                            <Database className="h-5 w-5 text-green-600 mt-0.5"/>
                                                        )}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                                {option.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {option.description}
                                                            </p>
                                                            <div
                                                                className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                <span>{option.count} applications</span>
                                                                {option.lastModified !== 'Unknown' && (
                                                                    <span>Modified: {new Date(option.lastModified).toLocaleDateString()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedOption?.id === option.id && (
                                                        <CheckCircle className="h-5 w-5 text-primary-600"/>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Preview Panel */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                    <Download className="h-4 w-4 mr-2"/>
                                    Recovery Preview
                                </h3>

                                {selectedOption && previewData ? (
                                    <div className="space-y-4">
                                        <div className="glass rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                                Data Summary
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Total Applications:</span>
                                                    <div
                                                        className="font-semibold text-lg text-primary-600 dark:text-primary-400">
                                                        {previewData.totalApplications}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span
                                                        className="text-gray-600 dark:text-gray-400">Date Range:</span>
                                                    <div className="text-sm">
                                                        {previewData.dateRange.earliest} to {previewData.dateRange.latest}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                                Status Breakdown
                                            </h4>
                                            <div className="space-y-2">
                                                {Object.entries(previewData.statusBreakdown).map(([status, count]) => (
                                                    <div key={status} className="flex justify-between items-center">
                            <span className={`status-badge status-${status.toLowerCase()}`}>
                              {status}
                            </span>
                                                        <span className="font-medium">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="glass rounded-lg p-4 border-l-4 border-red-500">
                                            <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                                                ⚠️ Important Notice
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Recovery will replace your current data. Your existing applications will
                                                be backed up automatically before proceeding.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <Database className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                                        <p>Select a recovery source to preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={closeRecoveryModal}
                            className="btn btn-secondary btn-md"
                        >
                            Cancel
                        </button>

                        {selectedOption && (
                            <button
                                onClick={executeRecovery}
                                disabled={isRecovering}
                                className="btn btn-md bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRecovering ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                                        Recovering...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2"/>
                                        Recover {selectedOption.count} Applications
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecoveryModal;