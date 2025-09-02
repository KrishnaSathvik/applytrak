// src/components/auth/PrivacyConsentSection.tsx
import React from 'react';
import {Shield, CheckCircle, Cloud, Lock} from 'lucide-react';
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    Privacy &amp; Data Settings
                </h3>
            </div>

            {/* Terms + Privacy - Enhanced */}
            <div className="glass-card border-2 border-blue-200/30 dark:border-blue-700/30">
                <label className="flex items-start gap-4 p-4 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 mt-1">
                        <input
                            type="checkbox"
                            checked={value.required}
                            onChange={(e) => set('required')(e.target.checked)}
                            disabled={disabled}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            required
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-base">
                            Accept{' '}
                            <button 
                                type="button" 
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline transition-colors" 
                                onClick={onViewTerms}
                            >
                                Terms of Service
                            </button>
                            {' '}and{' '}
                            <button 
                                type="button" 
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline transition-colors" 
                                onClick={onViewPrivacy}
                            >
                                Privacy Policy
                            </button>
                            <span className="text-red-500 ml-1 font-bold">*</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                            Required to create your account and use ApplyTrak&apos;s core features
                        </p>
                    </div>
                    {value.required && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    )}
                </label>
            </div>

            {/* Cloud sync - Enhanced */}
            <div className="glass-card border-2 border-purple-200/30 dark:border-purple-700/30">
                <label className="flex items-start gap-4 p-4 cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 mt-1">
                        <input
                            type="checkbox"
                            checked={value.cloudSync}
                            onChange={(e) => set('cloudSync')(e.target.checked)}
                            disabled={disabled}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            required
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                            <Cloud className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Enable cloud sync for your job applications
                            <span className="text-red-500 ml-1 font-bold">*</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                            Required to save your applications and sync across devices
                        </p>
                    </div>
                    {value.cloudSync && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    )}
                </label>
            </div>

            {/* Privacy commitment - Enhanced */}
            <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-start gap-3 p-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                        <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                    </div>
                    <div className="text-sm">
                        <p className="text-blue-900 dark:text-blue-100 font-semibold text-base">Your privacy, your choice</p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                            We never sell your data. These settings can be changed anytime in your account preferences.
                        </p>
                    </div>
                </div>
            </div>

            {/* Validation hints - Enhanced */}
            {!value.required && (
                <div className="glass-card bg-red-50 dark:bg-red-900/20 border-2 border-red-200/30 dark:border-red-700/30">
                    <div className="flex items-center gap-2 p-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                            Please accept the Terms of Service and Privacy Policy to continue.
                        </p>
                    </div>
                </div>
            )}
            {!value.cloudSync && (
                <div className="glass-card bg-red-50 dark:bg-red-900/20 border-2 border-red-200/30 dark:border-red-700/30">
                    <div className="flex items-center gap-2 p-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                            Cloud sync is required for ApplyTrak&apos;s core functionality.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivacyConsentSection;
