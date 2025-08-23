// src/components/ui/PrivacyStatusIndicator.tsx
import React from 'react';
import {BarChart3, Eye, EyeOff, Shield} from 'lucide-react';

interface PrivacySettings {
    analytics?: boolean;
    marketing_consent?: boolean;
    cloud_sync_consent?: boolean;
    tracking_level?: 'minimal' | 'standard' | 'enhanced';
}

interface PrivacyStatusIndicatorProps {
    settings: PrivacySettings | null;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

/**
 * Privacy Status Indicator - Shows user's current privacy level
 * Integrates with your existing UI patterns and dark mode
 */
const PrivacyStatusIndicator: React.FC<PrivacyStatusIndicatorProps> = ({
                                                                           settings,
                                                                           size = 'sm',
                                                                           showLabel = false,
                                                                           className = ''
                                                                       }) => {
    // Determine privacy level based on settings
    const getPrivacyLevel = () => {
        if (!settings) {
            return {
                level: 'unknown',
                color: 'text-gray-500 dark:text-gray-400',
                bgColor: 'bg-gray-100 dark:bg-gray-800',
                icon: Shield,
                label: 'Not configured',
                description: 'Privacy settings not configured'
            };
        }

        if (settings.analytics && settings.marketing_consent) {
            return {
                level: 'full-sharing',
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                icon: BarChart3,
                label: 'Full Sharing',
                description: 'Helping improve ApplyTrak for everyone'
            };
        } else if (settings.analytics || settings.marketing_consent) {
            return {
                level: 'balanced',
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-100 dark:bg-green-900/30',
                icon: Eye,
                label: 'Balanced',
                description: 'Good balance of privacy and functionality'
            };
        } else {
            return {
                level: 'privacy-focused',
                color: 'text-purple-600 dark:text-purple-400',
                bgColor: 'bg-purple-100 dark:bg-purple-900/30',
                icon: EyeOff,
                label: 'Privacy Focused',
                description: 'Maximum privacy protection'
            };
        }
    };

    const privacyInfo = getPrivacyLevel();
    const IconComponent = privacyInfo.icon;

    // Size variants
    const sizeClasses = {
        sm: {
            container: 'h-6 px-2',
            icon: 'h-3 w-3',
            text: 'text-xs'
        },
        md: {
            container: 'h-8 px-3',
            icon: 'h-4 w-4',
            text: 'text-sm'
        },
        lg: {
            container: 'h-10 px-4',
            icon: 'h-5 w-5',
            text: 'text-sm'
        }
    };

    const sizes = sizeClasses[size];

    if (showLabel) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div
                    className={`
            inline-flex items-center gap-1.5 rounded-full transition-colors
            ${sizes.container} ${privacyInfo.bgColor}
          `}
                    title={privacyInfo.description}
                >
                    <IconComponent className={`${sizes.icon} ${privacyInfo.color}`}/>
                    <span className={`font-medium ${privacyInfo.color} ${sizes.text}`}>
            {privacyInfo.label}
          </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
        inline-flex items-center justify-center rounded-full transition-colors cursor-help
        ${sizes.container} ${privacyInfo.bgColor} ${className}
      `}
            title={`Privacy Level: ${privacyInfo.label} - ${privacyInfo.description}`}
        >
            <IconComponent className={`${sizes.icon} ${privacyInfo.color}`}/>
        </div>
    );
};

export default PrivacyStatusIndicator;