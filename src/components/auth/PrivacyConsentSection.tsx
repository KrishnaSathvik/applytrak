// src/components/auth/PrivacyConsentSection.tsx
import React, {useState} from 'react';
import {BarChart3, Info, Mail, Shield} from 'lucide-react';

// Types matching your privacy requirements
interface PrivacyConsents {
    required: boolean;           // Terms & Privacy Policy (required)
    cloudSync: boolean;          // Cloud storage (required for core functionality)
    analytics: boolean;          // Usage analytics (optional)
    marketing: boolean;          // Product updates (optional)
}

interface PrivacyConsentSectionProps {
    onConsentChange: (consents: PrivacyConsents) => void;
    disabled?: boolean;
    showOptInBenefits?: boolean;
}

// Strategic consent framing for higher opt-in rates
const ConsentLabels = {
    analytics: {
        title: "Help us improve job search features",
        description: "Share anonymous usage patterns to help us build better tools for job seekers",
        benefits: ["Priority feature development", "Bug fixes based on real usage", "Improved user experience"],
        socialProof: "Join 1,200+ users helping make job searching easier"
    },
    marketing: {
        title: "Get product updates",
        description: "Receive monthly updates about new features and job search tips",
        frequency: "Maximum 1 email per month, unsubscribe anytime"
    }
};

const PrivacyConsentSection: React.FC<PrivacyConsentSectionProps> = ({
                                                                         onConsentChange,
                                                                         disabled = false,
                                                                         showOptInBenefits = true
                                                                     }) => {
    const [consents, setConsents] = useState<PrivacyConsents>({
        required: false,
        cloudSync: false,
        analytics: false,
        marketing: false
    });

    const [showDetails, setShowDetails] = useState<string | null>(null);

    const updateConsent = (type: keyof PrivacyConsents, value: boolean) => {
        const newConsents = {...consents, [type]: value};
        setConsents(newConsents);
        onConsentChange(newConsents);
    };

    const toggleDetails = (type: string) => {
        setShowDetails(showDetails === type ? null : type);
    };

    return (
        <div className="space-y-4 border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Privacy & Data Settings
                </h3>
            </div>

            {/* Required Consents */}
            <div className="space-y-3">
                {/* Terms & Privacy Policy - Required */}
                <label
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <input
                        type="checkbox"
                        checked={consents.required}
                        onChange={(e) => updateConsent('required', e.target.checked)}
                        disabled={disabled}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        required
                    />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            Accept Terms of Service and Privacy Policy
                            <span className="text-red-500 ml-1">*</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Required to create your account and use ApplyTrak's core features
                        </p>
                    </div>
                </label>

                {/* Cloud Sync - Required for functionality */}
                <label
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <input
                        type="checkbox"
                        checked={consents.cloudSync}
                        onChange={(e) => updateConsent('cloudSync', e.target.checked)}
                        disabled={disabled}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        required
                    />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            Enable cloud sync for your job applications
                            <span className="text-red-500 ml-1">*</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Required to save your applications, sync across devices, and use ApplyTrak's core features
                        </p>
                    </div>
                </label>
            </div>

            {/* Optional Consents */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3">
                    Optional (help us improve ApplyTrak):
                </h4>

                {/* Analytics Consent - Strategic framing */}
                <label
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <input
                        type="checkbox"
                        checked={consents.analytics}
                        onChange={(e) => updateConsent('analytics', e.target.checked)}
                        disabled={disabled}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                {ConsentLabels.analytics.title}
              </span>
                            <button
                                type="button"
                                onClick={() => toggleDetails('analytics')}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <Info className="h-4 w-4"/>
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {ConsentLabels.analytics.description}
                        </p>

                        {showOptInBenefits && consents.analytics && (
                            <div
                                className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                    ✨ Thank you for helping improve ApplyTrak! Your insights drive our development
                                    priorities.
                                </p>
                            </div>
                        )}

                        {showDetails === 'analytics' && (
                            <div
                                className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm space-y-2">
                                <div>
                                    <strong className="text-gray-900 dark:text-gray-100">What we track:</strong>
                                    <ul className="text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                                        <li>• Features you use most (helps prioritize development)</li>
                                        <li>• Page views and navigation patterns</li>
                                        <li>• Performance metrics and error reports</li>
                                        <li>• General device info (mobile vs desktop)</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong className="text-gray-900 dark:text-gray-100">What we DON'T track:</strong>
                                    <ul className="text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                                        <li>• Your job application content</li>
                                        <li>• Company names or personal notes</li>
                                        <li>• Identifying information</li>
                                        <li>• Third-party sharing (never)</li>
                                    </ul>
                                </div>
                                {showOptInBenefits && (
                                    <div className="text-blue-600 dark:text-blue-400">
                                        <strong>{ConsentLabels.analytics.socialProof}</strong>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </label>

                {/* Marketing Consent */}
                <label
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <input
                        type="checkbox"
                        checked={consents.marketing}
                        onChange={(e) => updateConsent('marketing', e.target.checked)}
                        disabled={disabled}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                {ConsentLabels.marketing.title}
              </span>
                            <button
                                type="button"
                                onClick={() => toggleDetails('marketing')}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <Info className="h-4 w-4"/>
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {ConsentLabels.marketing.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {ConsentLabels.marketing.frequency}
                        </p>

                        {showDetails === 'marketing' && (
                            <div
                                className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm">
                                <strong className="text-gray-900 dark:text-gray-100">What you'll receive:</strong>
                                <ul className="text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                                    <li>• New feature announcements</li>
                                    <li>• Job search tips and best practices</li>
                                    <li>• Product updates and improvements</li>
                                    <li>• Occasional surveys (optional participation)</li>
                                </ul>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    You can change these preferences anytime in your account settings.
                                </p>
                            </div>
                        )}
                    </div>
                </label>
            </div>

            {/* Privacy commitment */}
            <div
                className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"/>
                    <div className="text-sm">
                        <p className="text-blue-900 dark:text-blue-100 font-medium">
                            Your privacy, your choice
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                            You can change these settings anytime. We'll never sell your data or share it with third
                            parties.
                            All analytics data is anonymized and helps us build better job search tools for everyone.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form validation feedback */}
            {!consents.required && (
                <div className="text-sm text-red-600 dark:text-red-400">
                    Please accept the Terms of Service and Privacy Policy to continue.
                </div>
            )}

            {!consents.cloudSync && (
                <div className="text-sm text-red-600 dark:text-red-400">
                    Cloud sync is required for ApplyTrak's core functionality.
                </div>
            )}
        </div>
    );
};

export default PrivacyConsentSection;