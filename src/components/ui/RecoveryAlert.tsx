import React, {useEffect, useState} from 'react';
import {AlertTriangle, Clock, Download, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {recoveryUtils} from '../../services/database';

const RecoveryAlert: React.FC = () => {
    const {applications, showToast} = useAppStore();
    const [showAlert, setShowAlert] = useState(false);
    const [recoveryOptions, setRecoveryOptions] = useState<number>(0);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        checkForRecoveryNeeds();
    }, [applications]);

    const checkForRecoveryNeeds = async () => {
        try {
            // Don't show if user has dismissed or if there are already applications
            if (isDismissed || applications.length > 0) {
                setShowAlert(false);
                return;
            }

            // Check if recovery is available
            const hasRecoveryData = await recoveryUtils.checkForRecoveryData();

            if (hasRecoveryData) {
                const options = await recoveryUtils.getRecoveryOptions();
                setRecoveryOptions(options.length);
                setShowAlert(true);
            }
        } catch (error) {
            console.error('Error checking recovery options:', error);
        }
    };

    const openRecoveryModal = () => {
        // Set recovery modal state to open
        const store = useAppStore.getState();
        store.modals.recovery.isOpen = true;
        setShowAlert(false);
    };

    const dismissAlert = () => {
        setIsDismissed(true);
        setShowAlert(false);
        // Remember dismissal for this session
        sessionStorage.setItem('recoveryAlertDismissed', 'true');
    };

    // Check session storage on mount
    useEffect(() => {
        const dismissed = sessionStorage.getItem('recoveryAlertDismissed');
        if (dismissed) {
            setIsDismissed(true);
        }
    }, []);

    if (!showAlert) return null;

    return (
        <div className="mb-6 animate-fade-in">
            <div className="glass rounded-lg border-l-4 border-yellow-500 p-4 bg-yellow-50/50 dark:bg-yellow-900/10">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5"/>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 tracking-wide">
                                Data Recovery Available
                            </h3>
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-1 leading-relaxed">
                                We found <span
                                className="font-bold">{recoveryOptions}</span> backup{recoveryOptions !== 1 ? 's' : ''} that
                                can restore
                                your previous applications.
                                Would you like to recover your data?
                            </p>

                            <div className="flex items-center space-x-3 mt-3">
                                <button
                                    onClick={openRecoveryModal}
                                    className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white font-bold tracking-wide"
                                >
                                    <Download className="h-3 w-3 mr-1"/>
                                    Recover Data
                                </button>

                                <button
                                    onClick={dismissAlert}
                                    className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline tracking-wide"
                                >
                                    Dismiss
                                </button>
                            </div>

                            <div
                                className="flex items-center space-x-1 mt-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                <Clock className="h-3 w-3"/>
                                <span>This alert will disappear once you add applications or dismiss it</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={dismissAlert}
                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                        aria-label="Dismiss recovery alert"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecoveryAlert;