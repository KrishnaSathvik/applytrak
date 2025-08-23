import React, {useCallback, useEffect, useState} from 'react';
import {AlertTriangle, Clock, Download, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {recoveryUtils} from '../../services/recoveryUtils';

const STORAGE_KEY = 'recoveryAlertDismissed';

const RecoveryAlert: React.FC = () => {
    const {applications, showToast} = useAppStore();
    const [showAlert, setShowAlert] = useState(false);
    const [recoveryOptions, setRecoveryOptions] = useState<number>(0);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check session storage on mount
    useEffect(() => {
        const dismissed = sessionStorage.getItem(STORAGE_KEY);
        if (dismissed === 'true') {
            setIsDismissed(true);
        }
    }, []);

    // Check for recovery needs when applications change
    useEffect(() => {
        checkForRecoveryNeeds();
    }, [applications, isDismissed]);

    const checkForRecoveryNeeds = useCallback(async () => {
        // Don't show if user has dismissed or if there are already applications
        if (isDismissed || applications.length > 0) {
            setShowAlert(false);
            return;
        }

        setIsLoading(true);

        try {
            // Check if recovery data is available
            const hasRecoveryData = await recoveryUtils.checkForRecoveryData();

            if (hasRecoveryData) {
                const options = await recoveryUtils.getRecoveryOptions();
                setRecoveryOptions(options.length);
                setShowAlert(options.length > 0);
            } else {
                setShowAlert(false);
            }
        } catch (error) {
            console.error('RecoveryAlert: Failed to check recovery options', error);
            setShowAlert(false);

            // Optional: Show error toast for debugging
            showToast?.({
                type: 'error',
                message: 'Failed to check for recovery data',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [isDismissed, applications.length, showToast]);

    const handleOpenRecoveryModal = useCallback(() => {
        try {
            const store = useAppStore.getState();
            store.modals.recovery.isOpen = true;
            setShowAlert(false);
        } catch (error) {
            console.error('RecoveryAlert: Failed to open recovery modal', error);
            showToast?.({
                type: 'error',
                message: 'Failed to open recovery modal',
                duration: 3000,
            });
        }
    }, [showToast]);

    const handleDismissAlert = useCallback(() => {
        setIsDismissed(true);
        setShowAlert(false);

        try {
            // Remember dismissal for this session
            sessionStorage.setItem(STORAGE_KEY, 'true');
        } catch (error) {
            console.warn('RecoveryAlert: Failed to save dismissal state', error);
        }
    }, []);

    // Don't render if loading or not showing
    if (isLoading || !showAlert) {
        return null;
    }

    const recoveryText = recoveryOptions === 1 ? 'backup' : 'backups';

    return (
        <div className="mb-6 animate-fade-in">
            <div className="glass rounded-lg border-l-4 border-yellow-500 p-4 bg-yellow-50/50 dark:bg-yellow-900/10">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <AlertTriangle
                            className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                            aria-hidden="true"
                        />

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 tracking-wide">
                                Data Recovery Available
                            </h3>

                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-1 leading-relaxed">
                                We found{' '}
                                <span className="font-bold">{recoveryOptions}</span>{' '}
                                {recoveryText} that can restore your previous applications.
                                Would you like to recover your data?
                            </p>

                            <div className="flex items-center gap-3 mt-3">
                                <button
                                    onClick={handleOpenRecoveryModal}
                                    className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white font-bold tracking-wide transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                    type="button"
                                >
                                    <Download className="h-3 w-3 mr-1" aria-hidden="true"/>
                                    Recover Data
                                </button>

                                <button
                                    onClick={handleDismissAlert}
                                    className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline tracking-wide transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded px-1"
                                    type="button"
                                >
                                    Dismiss
                                </button>
                            </div>

                            <div
                                className="flex items-center gap-1 mt-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true"/>
                                <span>This alert will disappear once you add applications or dismiss it</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleDismissAlert}
                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex-shrink-0"
                        aria-label="Dismiss recovery alert"
                        type="button"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecoveryAlert;