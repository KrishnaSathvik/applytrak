// src/components/auth/PrivacyConsentSection.tsx
import React from 'react';

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
        <div className="space-y-3">
            {/* Terms + Privacy - Compact */}
            <label className="flex items-start gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={value.required}
                    onChange={(e) => set('required')(e.target.checked)}
                    disabled={disabled}
                    className="h-2 w-2 text-blue-600 focus:ring-0 border-gray-300 rounded-sm mt-1 scale-50"
                    required
                />
                <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        I accept the{' '}
                        <button 
                            type="button" 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors" 
                            onClick={onViewTerms}
                        >
                            Terms of Service
                        </button>
                        {' '}and{' '}
                        <button 
                            type="button" 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors" 
                            onClick={onViewPrivacy}
                        >
                            Privacy Policy
                        </button>
                        <span className="text-red-500 ml-1">*</span>
                    </span>
                </div>
            </label>

            {/* Cloud sync - Compact */}
            <label className="flex items-start gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={value.cloudSync}
                    onChange={(e) => set('cloudSync')(e.target.checked)}
                    disabled={disabled}
                    className="h-2 w-2 text-blue-600 focus:ring-0 border-gray-300 rounded-sm mt-1 scale-50"
                    required
                />
                <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Enable cloud sync to save applications across devices
                        <span className="text-red-500 ml-1">*</span>
                    </span>
                </div>
            </label>



            {/* Validation hints - Compact */}
            {(!value.required || !value.cloudSync) && (
                <div className="text-xs text-red-600 dark:text-red-400 pl-5">
                    Please accept all required terms to continue.
                </div>
            )}
        </div>
    );
};

export default PrivacyConsentSection;
