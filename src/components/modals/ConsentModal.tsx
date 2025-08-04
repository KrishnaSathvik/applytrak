import React, {useState} from 'react';
import {BarChart3, Check, Eye, Settings, Shield, X} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

const ConsentModal: React.FC = () => {
    const {
        modals,
        closeAnalyticsConsent,
        enableAnalytics,
        disableAnalytics,
        showToast
    } = useAppStore();

    const [customSettings, setCustomSettings] = useState({
        analytics: true,
        feedback: true,
        functionalCookies: true
    });
    const [showCustomOptions, setShowCustomOptions] = useState(false);

    const handleAcceptAll = async () => {
        try {
            await enableAnalytics({
                trackingLevel: 'standard',
                consentDate: new Date().toISOString()
            });

            closeAnalyticsConsent();

            showToast({
                type: 'success',
                message: '✅ Analytics enabled! Thank you for helping improve ApplyTrak.',
                duration: 5000
            });
        } catch (error) {
            console.error('Failed to enable analytics:', error);
            showToast({
                type: 'error',
                message: 'Failed to save preferences. Please try again.'
            });
        }
    };

    const handleDeclineAll = () => {
        disableAnalytics();
        closeAnalyticsConsent();

        showToast({
            type: 'info',
            message: '🔒 Analytics disabled. You can change this in settings anytime.',
            duration: 4000
        });
    };

    const handleCustomize = async () => {
        try {
            if (customSettings.analytics) {
                await enableAnalytics({
                    trackingLevel: 'minimal',
                    consentDate: new Date().toISOString()
                });
            } else {
                disableAnalytics();
            }

            closeAnalyticsConsent();

            showToast({
                type: 'success',
                message: '✅ Preferences saved successfully!',
                duration: 4000
            });
        } catch (error) {
            console.error('Failed to save custom settings:', error);
            showToast({
                type: 'error',
                message: 'Failed to save preferences. Please try again.'
            });
        }
    };

    const getModalTitle = () => {
        switch (modals.analyticsConsent.type) {
            case 'first-visit':
                return 'Welcome to ApplyTrak!';
            case 'settings-change':
                return 'Update Analytics Preferences';
            case 'update-required':
                return 'Privacy Policy Update';
            default:
                return 'Analytics & Privacy';
        }
    };

    const getModalDescription = () => {
        switch (modals.analyticsConsent.type) {
            case 'first-visit':
                return 'Help us improve ApplyTrak by sharing anonymous usage data';
            case 'settings-change':
                return 'Manage your analytics and privacy preferences';
            case 'update-required':
                return 'We\'ve updated our privacy practices';
            default:
                return 'Manage your data preferences';
        }
    };

    return (
        <Modal
            isOpen={modals.analyticsConsent.isOpen}
            onClose={closeAnalyticsConsent}
            title={getModalTitle()}
            size="lg"
            variant="primary"
        >
            <div className="space-y-6">
                {/* Header Description */}
                <div className="text-center">
                    <div
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-8 w-8 text-white"/>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {getModalDescription()}
                    </p>
                </div>

                {/* Privacy Explanation */}
                <div
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5"/>
                        How We Protect Your Privacy
                    </h4>
                    <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                        <div className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"/>
                            <span><strong>Anonymous only:</strong> No personal data is collected or stored</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"/>
                            <span><strong>Local storage:</strong> Data stays on your device</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"/>
                            <span><strong>Easy opt-out:</strong> Disable anytime in settings</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"/>
                            <span><strong>GDPR compliant:</strong> Your privacy rights are respected</span>
                        </div>
                    </div>
                </div>

                {/* What We Track */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Eye className="h-5 w-5"/>
                        What Anonymous Data We Track
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <p className="font-medium text-gray-700 dark:text-gray-300">Usage Analytics:</p>
                            <ul className="space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                                <li>• Feature usage patterns</li>
                                <li>• Session duration</li>
                                <li>• Page views</li>
                                <li>• Device type (mobile/desktop)</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium text-gray-700 dark:text-gray-300">Performance Data:</p>
                            <ul className="space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                                <li>• Error tracking</li>
                                <li>• Load times</li>
                                <li>• Browser compatibility</li>
                                <li>• User experience metrics</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Custom Settings */}
                {showCustomOptions && (
                    <div
                        className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200/50 dark:border-yellow-700/50">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5"/>
                            Customize Your Preferences
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Usage Analytics</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Help improve app features
                                        and performance</p>
                                </div>
                                <button
                                    onClick={() => setCustomSettings(prev => ({...prev, analytics: !prev.analytics}))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        customSettings.analytics ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          customSettings.analytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Feedback Collection</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Allow feedback submissions
                                        to improve the app</p>
                                </div>
                                <button
                                    onClick={() => setCustomSettings(prev => ({...prev, feedback: !prev.feedback}))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        customSettings.feedback ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          customSettings.feedback ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Functional Cookies</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Essential for app
                                        functionality (required)</p>
                                </div>
                                <div
                                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-400 cursor-not-allowed">
                                    <span
                                        className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div
                    className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    {!showCustomOptions ? (
                        <>
                            <button
                                onClick={handleDeclineAll}
                                className="btn btn-secondary flex-1 group"
                            >
                                <X className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200"/>
                                Decline All
                            </button>

                            <button
                                onClick={() => setShowCustomOptions(true)}
                                className="btn btn-secondary flex-1 group"
                            >
                                <Settings
                                    className="h-5 w-5 mr-2 group-hover:rotate-45 transition-transform duration-200"/>
                                Customize
                            </button>

                            <button
                                onClick={handleAcceptAll}
                                className="btn btn-primary flex-1 group"
                            >
                                <Check
                                    className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                Accept All
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowCustomOptions(false)}
                                className="btn btn-secondary flex-1"
                            >
                                Back
                            </button>

                            <button
                                onClick={handleCustomize}
                                className="btn btn-primary flex-1 group"
                            >
                                <Check
                                    className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                Save Preferences
                            </button>
                        </>
                    )}
                </div>

                {/* Legal Note */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        You can change these preferences anytime in the app settings.
                        By using ApplyTrak, you agree to our privacy practices.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ConsentModal;