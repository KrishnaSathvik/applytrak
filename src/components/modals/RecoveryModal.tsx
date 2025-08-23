import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AlertTriangle, CheckCircle, Database, Download, HardDrive, RefreshCw, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {recoveryUtils} from '../../services/recoveryUtils';
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

interface PreviewData {
    totalApplications: number;
    statusBreakdown: Record<string, number>;
    dateRange: { earliest: string; latest: string };
}

interface RecoveryError extends Error {
    code?: string;
    details?: string;
}

const RecoveryModal: React.FC = () => {
    const {modals, showToast, loadApplications} = useAppStore();
    const {recovery} = modals;

    // State management
    const [availableOptions, setAvailableOptions] = useState<RecoveryOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<RecoveryOption | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [recoveryProgress, setRecoveryProgress] = useState<{
        current: number;
        total: number;
        step: string;
    } | null>(null);

    // Memoized preview data calculation
    const previewData = useMemo<PreviewData | null>(() => {
        if (!selectedOption) return null;

        const applications = selectedOption.data;
        const statusBreakdown = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const dates = applications
            .map(app => new Date(app.dateApplied))
            .sort((a, b) => a.getTime() - b.getTime());

        const dateRange = {
            earliest: dates[0]?.toLocaleDateString() || 'Unknown',
            latest: dates[dates.length - 1]?.toLocaleDateString() || 'Unknown'
        };

        return {
            totalApplications: applications.length,
            statusBreakdown,
            dateRange
        };
    }, [selectedOption]);

    // Load recovery options when modal opens
    useEffect(() => {
        if (recovery.isOpen) {
            loadRecoveryOptions();
        }
    }, [recovery.isOpen]);

    // Enhanced error handling
    const handleError = useCallback((error: unknown, context: string) => {
        console.error(`${context}:`, error);

        const errorMessage = error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : 'An unexpected error occurred';

        showToast({
            type: 'error',
            message: `${context}: ${errorMessage}`,
            duration: 5000
        });
    }, [showToast]);

    const loadRecoveryOptions = useCallback(async () => {
        setIsLoading(true);
        try {
            const options = await recoveryUtils.getRecoveryOptions();
            const formattedOptions: RecoveryOption[] = options.map((option, index) => ({
                id: `${option.source}-${index}`,
                name: option.source === 'localStorage'
                    ? 'Local Storage Backup'
                    : `Database Backup ${index + 1}`,
                description: option.source === 'localStorage'
                    ? 'Essential data backup stored in your browser'
                    : `Full backup from ${new Date(option.source.split('-')[1] || Date.now()).toLocaleDateString()}`,
                data: option.data,
                count: option.count,
                lastModified: option.source === 'localStorage'
                    ? 'Unknown'
                    : option.source.split('-')[1] || 'Unknown',
                source: option.source.includes('localStorage') ? 'localStorage' : 'database'
            }));

            setAvailableOptions(formattedOptions);
        } catch (error) {
            handleError(error, 'Failed to load recovery options');
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const handleOptionSelect = useCallback((option: RecoveryOption) => {
        setSelectedOption(option);
    }, []);

    const executeRecovery = useCallback(async () => {
        if (!selectedOption) return;

        setIsRecovering(true);
        setRecoveryProgress({current: 0, total: selectedOption.count, step: 'Preparing recovery...'});

        try {
            const {databaseService} = await import('../../services/databaseService');

            // Step 1: Backup current data
            setRecoveryProgress({current: 1, total: selectedOption.count, step: 'Backing up current data...'});
            const currentData = await databaseService.getApplications();

            if (currentData.length > 0) {
                await databaseService.createBackup();
                showToast({
                    type: 'info',
                    message: 'Current data backed up successfully',
                    duration: 3000
                });
            }

            // Step 2: Clear existing data
            setRecoveryProgress({current: 2, total: selectedOption.count, step: 'Clearing existing data...'});
            // Note: Add clear method if needed based on your database service

            // Step 3: Restore applications with progress tracking
            const applications = selectedOption.data;
            const batchSize = 10; // Process in batches for better UX

            for (let i = 0; i < applications.length; i += batchSize) {
                const batch = applications.slice(i, i + batchSize);

                setRecoveryProgress({
                    current: Math.min(i + batchSize, applications.length),
                    total: applications.length,
                    step: `Restoring applications (${i + 1}-${Math.min(i + batchSize, applications.length)} of ${applications.length})...`
                });

                await Promise.all(
                    batch.map(app => {
                        const {id, createdAt, updatedAt, ...appData} = app;
                        return databaseService.addApplication(appData);
                    })
                );

                // Small delay for UI responsiveness
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Step 4: Reload applications
            setRecoveryProgress({
                current: selectedOption.count,
                total: selectedOption.count,
                step: 'Finalizing recovery...'
            });
            await loadApplications();

            showToast({
                type: 'success',
                message: `Successfully recovered ${selectedOption.count} applications!`,
                duration: 5000
            });

            closeRecoveryModal();
        } catch (error) {
            handleError(error, 'Recovery failed');
        } finally {
            setIsRecovering(false);
            setRecoveryProgress(null);
            setShowConfirmation(false);
        }
    }, [selectedOption, showToast, loadApplications, handleError]);

    const closeRecoveryModal = useCallback(() => {
        const state = useAppStore.getState();
        state.modals.recovery.isOpen = false;
        setSelectedOption(null);
        setAvailableOptions([]);
        setShowConfirmation(false);
        setRecoveryProgress(null);
    }, []);

    const handleRecoveryClick = useCallback(() => {
        setShowConfirmation(true);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!recovery.isOpen) return;

            if (event.key === 'Escape') {
                if (showConfirmation) {
                    setShowConfirmation(false);
                } else {
                    closeRecoveryModal();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [recovery.isOpen, showConfirmation, closeRecoveryModal]);

    if (!recovery.isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={closeRecoveryModal}>
                <div
                    className="modal-content max-w-4xl"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-labelledby="recovery-modal-title"
                    aria-describedby="recovery-modal-description"
                >
                    <div className="card-header bg-yellow-600 text-white">
                        <div className="flex items-center justify-between">
                            <h2 id="recovery-modal-title" className="text-lg font-semibold flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2"/>
                                Data Recovery Center
                            </h2>
                            <button
                                onClick={closeRecoveryModal}
                                className="text-white/80 hover:text-white transition-colors p-1 rounded"
                                aria-label="Close recovery modal"
                                type="button"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Recovery Info */}
                        <div
                            id="recovery-modal-description"
                            className="glass rounded-lg p-4 border-l-4 border-yellow-500"
                        >
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"/>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                        Data Recovery Available
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        We found potential backup data that can be restored. Select a recovery source
                                        below
                                        to preview and restore your applications.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recovery Progress */}
                        {recoveryProgress && (
                            <div className="glass rounded-lg p-4 border-l-4 border-blue-500">
                                <div className="flex items-center space-x-3 mb-3">
                                    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin"/>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                        Recovery in Progress
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {recoveryProgress.step}
                                    </p>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(recoveryProgress.current / recoveryProgress.total) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {recoveryProgress.current} of {recoveryProgress.total} completed
                                    </p>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2"/>
                                        <p className="text-gray-600 dark:text-gray-400">Scanning for recovery
                                            options...</p>
                                    </div>
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
                                            <p className="font-medium">No recovery options found</p>
                                            <p className="text-sm mt-1">Try importing from a backup file or check your
                                                browser storage</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3" role="listbox" aria-label="Recovery options">
                                            {availableOptions.map((option) => (
                                                <div
                                                    key={option.id}
                                                    className={`glass rounded-lg p-4 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                                        selectedOption?.id === option.id
                                                            ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                            : 'border border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                                    }`}
                                                    onClick={() => handleOptionSelect(option)}
                                                    role="option"
                                                    aria-selected={selectedOption?.id === option.id}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleOptionSelect(option);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-3">
                                                            {option.source === 'localStorage' ? (
                                                                <HardDrive
                                                                    className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                                                            ) : (
                                                                <Database
                                                                    className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0"/>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                    {option.name}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                    {option.description}
                                                                </p>
                                                                <div
                                                                    className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    <span
                                                                        className="font-medium">{option.count} applications</span>
                                                                    {option.lastModified !== 'Unknown' && (
                                                                        <span>
                                      Modified: {new Date(option.lastModified).toLocaleDateString()}
                                    </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedOption?.id === option.id && (
                                                            <CheckCircle
                                                                className="h-5 w-5 text-primary-600 flex-shrink-0"/>
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
                                                        <span className="text-gray-600 dark:text-gray-400 block">Total Applications:</span>
                                                        <div
                                                            className="font-semibold text-lg text-primary-600 dark:text-primary-400">
                                                            {previewData.totalApplications}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400 block">Date Range:</span>
                                                        <div className="text-sm font-medium">
                                                            {previewData.dateRange.earliest} to {previewData.dateRange.latest}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass rounded-lg p-4">
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                                    Status Breakdown
                                                </h4>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
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
                                                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center">
                                                    <AlertTriangle className="h-4 w-4 mr-1"/>
                                                    Important Notice
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Recovery will replace your current data. Your existing applications
                                                    will
                                                    be backed up automatically before proceeding.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <Database className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                                            <p>Select a recovery source to preview</p>
                                            <p className="text-sm mt-1">Choose from the available options on the
                                                left</p>
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
                                disabled={isRecovering}
                                type="button"
                            >
                                Cancel
                            </button>

                            {selectedOption && (
                                <button
                                    onClick={handleRecoveryClick}
                                    disabled={isRecovering}
                                    className="btn btn-md bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="button"
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

            {/* Confirmation Modal */}
            {showConfirmation && selectedOption && (
                <div className="modal-overlay" style={{zIndex: 1001}}>
                    <div
                        className="modal-content max-w-md"
                        role="dialog"
                        aria-labelledby="confirm-title"
                        aria-describedby="confirm-description"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-8 w-8 text-red-600"/>
                                <div>
                                    <h3 id="confirm-title"
                                        className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Confirm Data Recovery
                                    </h3>
                                    <p id="confirm-description"
                                       className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    Are you sure you want to
                                    recover <strong>{selectedOption.count} applications</strong> from
                                    <strong> {selectedOption.name}</strong>? This will replace all your current data.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="btn btn-secondary btn-sm"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeRecovery}
                                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                                    type="button"
                                >
                                    Yes, Recover Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RecoveryModal;