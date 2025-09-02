// src/components/modals/PrivacySettingsModal.tsx
import React, {useEffect, useState} from 'react';
import {AlertTriangle, BarChart3, Check, Cloud, Download, Mail, Shield, Trash2} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';
import {privacyService, PrivacySettings} from '../../services/privacyService';

const PrivacySettingsModal: React.FC = () => {
    const {
        modals,
        closePrivacySettings,
        auth,
        showToast,
        // Add these to your store - they'll be implemented in the store update
        setPrivacySettings
    } = useAppStore();

    const [settings, setSettings] = useState<PrivacySettings>({
        analytics: false,
        marketing_consent: false,
        cloud_sync_consent: true,
        functional_cookies: true,
        tracking_level: 'minimal',
        data_retention_period: 365
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDataDeletion, setShowDataDeletion] = useState(false);

    // Load current privacy settings on modal open
    useEffect(() => {
        const loadSettings = async () => {
            if (!auth.user?.id) return;

            try {
                setLoading(true);
                const currentSettings = await privacyService.getPrivacySettings(String(auth.user.id));

                if (currentSettings) {
                    setSettings({
                        analytics: currentSettings.analytics,
                        marketing_consent: currentSettings.marketing_consent,
                        cloud_sync_consent: currentSettings.cloud_sync_consent,
                        functional_cookies: currentSettings.functional_cookies,
                        tracking_level: currentSettings.tracking_level,
                        data_retention_period: currentSettings.data_retention_period
                    });
                }
            } catch (error) {
                console.error('Failed to load privacy settings:', error);
                showToast({
                    type: 'error',
                    message: 'Failed to load privacy settings',
                    duration: 5000
                });
            } finally {
                setLoading(false);
            }
        };

        if (modals.privacySettings?.isOpen) {
            loadSettings();
        }
    }, [modals.privacySettings?.isOpen, auth.user?.id, showToast]);

    // Update individual setting
    const updateSetting = async (key: keyof PrivacySettings, value: any) => {
        if (!auth.user?.id) return;

        const newSettings = {...settings, [key]: value};
        setSettings(newSettings);

        try {
            await privacyService.updateConsent(String(auth.user.id), key, value);

            showToast({
                type: 'success',
                message: getConsentUpdateMessage(key, value),
                duration: 4000
            });
        } catch (error) {
            console.error('Failed to update privacy setting:', error);
            // Revert the setting
            setSettings(settings);
            showToast({
                type: 'error',
                message: 'Failed to update privacy setting',
                duration: 5000
            });
        }
    };

    // Get user-friendly message for consent changes
    const getConsentUpdateMessage = (setting: string, enabled: boolean): string => {
        const messages = {
            analytics: {
                enabled: "Analytics enabled - Thank you for helping us improve ApplyTrak!",
                disabled: "Analytics disabled - We respect your privacy choice"
            },
            marketing_consent: {
                enabled: "You'll receive our monthly product updates",
                disabled: "Unsubscribed from product updates"
            }
        };

        const settingMessages = messages[setting as keyof typeof messages];
        return settingMessages ? settingMessages[enabled ? 'enabled' : 'disabled'] : 'Setting updated';
    };

    // Save all settings
    const handleSave = async () => {
        if (!auth.user?.id) return;

        try {
            setSaving(true);
            await privacyService.updatePrivacySettings(String(auth.user.id), settings);

            // Update global app state
            setPrivacySettings(settings);

            showToast({
                type: 'success',
                message: 'Privacy settings saved successfully',
                duration: 4000
            });

            closePrivacySettings();
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
            showToast({
                type: 'error',
                message: 'Failed to save privacy settings',
                duration: 5000
            });
        } finally {
            setSaving(false);
        }
    };

    // Request data export
    const requestDataExport = async () => {
        if (!auth.user?.id) return;

        try {
            const exportData = await privacyService.exportUserData(String(auth.user.id));

            // Create downloadable file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `applytrak-data-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: 'Your data has been exported and downloaded',
                duration: 5000
            });
        } catch (error) {
            console.error('Failed to export data:', error);
            showToast({
                type: 'error',
                message: 'Failed to export your data',
                duration: 5000
            });
        }
    };

    // Request data deletion
    const requestDataDeletion = async () => {
        if (!auth.user?.id) return;

        if (!window.confirm(
            'Are you sure you want to delete ALL your data? This action cannot be undone and will permanently remove your account, applications, and all associated data.'
        )) {
            return;
        }

        try {
            await privacyService.deleteAllUserData(String(auth.user.id));

            showToast({
                type: 'success',
                message: 'Your data has been deleted. You will be signed out.',
                duration: 5000
            });

            // Sign out user after data deletion
            setTimeout(() => {
                // Call your existing signOut method
                window.location.reload(); // Force reload to clear all data
                closePrivacySettings();
            }, 2000);
        } catch (error) {
            console.error('Failed to delete data:', error);
            showToast({
                type: 'error',
                message: 'Failed to delete your data',
                duration: 5000
            });
        }
    };

    // Get privacy level summary
    const getPrivacyLevel = (): { level: string; color: string; description: string } => {
        if (settings.analytics && settings.marketing_consent) {
            return {
                level: 'Full Sharing',
                color: 'text-blue-600 dark:text-blue-400',
                description: 'Helping us improve ApplyTrak for everyone'
            };
        } else if (settings.analytics || settings.marketing_consent) {
            return {
                level: 'Balanced',
                color: 'text-green-600 dark:text-green-400',
                description: 'Good balance of privacy and functionality'
            };
        } else {
            return {
                level: 'Privacy Focused',
                color: 'text-purple-600 dark:text-purple-400',
                description: 'Maximum privacy protection'
            };
        }
    };

    const privacyLevel = getPrivacyLevel();

    return (
        <Modal
            isOpen={modals.privacySettings.isOpen}
            onClose={closePrivacySettings}
            title="Privacy Settings"
            size="xl"
        >
            <div className="space-y-6">
                {/* Privacy Level Indicator */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Shield className={`h-5 w-5 ${privacyLevel.color}`}/>
                        <div>
                            <h3 className={`font-semibold ${privacyLevel.color}`}>
                                Current Level: {privacyLevel.level}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {privacyLevel.description}
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading privacy settings...</p>
                    </div>
                ) : (
                    <>
                        {/* Data Collection Controls */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                Data Collection Preferences
                            </h4>

                            {/* Analytics Toggle */}
                            <div
                                className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                      Usage Analytics
                    </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Help us improve features by sharing anonymous usage patterns
                                    </p>
                                    {settings.analytics && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            ✨ Thank you for helping make ApplyTrak better!
                                        </p>
                                    )}
                                </div>
                                <label className="flex items-center ml-4">
                                    <input
                                        type="checkbox"
                                        checked={settings.analytics}
                                        onChange={(e) => updateSetting('analytics', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </label>
                            </div>

                            {/* Marketing Toggle */}
                            <div
                                className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                      Product Updates
                    </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Receive monthly updates about new features and job search tips
                                    </p>
                                </div>
                                <label className="flex items-center ml-4">
                                    <input
                                        type="checkbox"
                                        checked={settings.marketing_consent}
                                        onChange={(e) => updateSetting('marketing_consent', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </label>
                            </div>

                            {/* Cloud Sync (Required) */}
                            <div
                                className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Cloud className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                      Cloud Sync
                    </span>
                                        <span
                                            className="text-xs text-gray-500 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Required
                    </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Required for saving applications and syncing across devices
                                    </p>
                                </div>
                                <div className="ml-4">
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400"/>
                                </div>
                            </div>
                        </div>

                        {/* Data Retention Settings */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                Data Retention
                            </h4>

                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Keep my data for:
                                </label>
                                <select
                                    value={settings.data_retention_period}
                                    onChange={(e) => updateSetting('data_retention_period', parseInt(e.target.value))}
                                    className="form-select w-full"
                                >
                                    <option value={90}>3 months</option>
                                    <option value={365}>1 year</option>
                                    <option value={730}>2 years</option>
                                    <option value={-1}>Until I delete my account</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Older data will be automatically deleted according to your preference
                                </p>
                            </div>
                        </div>

                        {/* Data Rights Actions */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                Your Data Rights
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                    onClick={requestDataExport}
                                    className="flex items-center gap-2 p-3 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <Download className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Export My Data</span>
                                </button>

                                <button
                                    onClick={() => setShowDataDeletion(!showDataDeletion)}
                                    className="flex items-center gap-2 p-3 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400"/>
                                    <span
                                        className="text-sm font-medium text-red-600 dark:text-red-400">Delete My Data</span>
                                </button>
                            </div>

                            {showDataDeletion && (
                                <div
                                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle
                                            className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"/>
                                        <div>
                                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                                Permanent Data Deletion
                                            </p>
                                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                                This will permanently delete your account, all job applications, goals,
                                                and analytics data.
                                                This action cannot be undone.
                                            </p>
                                            <button
                                                onClick={requestDataDeletion}
                                                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                I understand, delete everything
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Privacy Commitment */}
                        <div
                            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                            <div className="flex items-start gap-2">
                                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"/>
                                <div className="text-sm">
                                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                                        Our Privacy Promise
                                    </p>
                                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                                        We never sell your data or share it with third parties. All analytics are
                                        anonymized
                                        and used solely to improve ApplyTrak. You can change these settings anytime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex-1 btn btn-primary disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
                                Saving...
                            </>
                        ) : (
                            'Save Settings'
                        )}
                    </button>
                    <button
                        onClick={closePrivacySettings}
                        disabled={saving}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PrivacySettingsModal;