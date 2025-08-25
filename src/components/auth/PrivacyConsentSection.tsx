// src/components/auth/PrivacyConsentSection.tsx
import React from 'react';
import {Shield} from 'lucide-react';
import type {PrivacyConsents} from '../../store/useAppStore';

interface PrivacyConsentSectionProps {
    value: PrivacyConsents;
    onChange: (consents: PrivacyConsents) => void;
    disabled?: boolean;
    onViewTerms?: () => void;
    onViewPrivacy?: () => void;
}

const PrivacyConsentSection: React.FC<PrivacyConsentSectionProps> = ({
                                                                         value,
                                                                         onChange,
                                                                         disabled = false,
                                                                         onViewTerms,
                                                                         onViewPrivacy,
                                                                     }) => {
    const set = (k: keyof PrivacyConsents) => (checked: boolean) =>
        onChange({...value, [k]: checked});

    return (
        <div className="space-y-4 border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
            <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Privacy &amp; Data Settings
                </h3>
            </div>

            {/* Terms + Privacy */}
            <label
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <input
                    type="checkbox"
                    checked={value.required}
                    onChange={(e) => set('required')(e.target.checked)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                />
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        Accept{' '}
                        <button type="button" className="underline" onClick={onViewTerms}>
                            Terms of Service
                        </button>
                        {' '}
                        and{' '}
                        <button type="button" className="underline" onClick={onViewPrivacy}>
                            Privacy Policy
                        </button>
                        <span className="text-red-500 ml-1">*</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Required to create your account and use ApplyTrak&apos;s core features
                    </p>
                </div>
            </label>

            {/* Cloud sync */}
            <label
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <input
                    type="checkbox"
                    checked={value.cloudSync}
                    onChange={(e) => set('cloudSync')(e.target.checked)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                />
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        Enable cloud sync for your job applications
                        <span className="text-red-500 ml-1">*</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Required to save your applications and sync across devices
                    </p>
                </div>
            </label>

            {/* Privacy commitment */}
            <div
                className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"/>
                    <div className="text-sm">
                        <p className="text-blue-900 dark:text-blue-100 font-medium">Your privacy, your choice</p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                            We never sell your data. These settings can be changed anytime.
                        </p>
                    </div>
                </div>
            </div>

            {/* validation hints */}
            {!value.required && (
                <div className="text-sm text-red-600 dark:text-red-400">
                    Please accept the Terms of Service and Privacy Policy to continue.
                </div>
            )}
            {!value.cloudSync && (
                <div className="text-sm text-red-600 dark:text-red-400">
                    Cloud sync is required for ApplyTrak&apos;s core functionality.
                </div>
            )}
        </div>
    );
};

export default PrivacyConsentSection;
