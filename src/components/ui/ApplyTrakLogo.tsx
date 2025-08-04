// src/components/ui/ApplyTrakLogo.tsx - SVG Logo Component
import React from 'react';
import logoSvg from '../../favicon.svg';

interface ApplyTrakLogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    className?: string;
    showText?: boolean;
    textClassName?: string;
    variant?: 'default' | 'white' | 'dark';
    priority?: boolean;
}

const ApplyTrakLogo: React.FC<ApplyTrakLogoProps> = ({
                                                         size = 'md',
                                                         className = '',
                                                         showText = false,
                                                         textClassName = '',
                                                         variant = 'default',
                                                         priority = false
                                                     }) => {
    const getSizeClasses = () => {
        if (typeof size === 'number') {
            return {width: size, height: size};
        }

        switch (size) {
            case 'xs':
                return 'w-4 h-4'; // 16px
            case 'sm':
                return 'w-6 h-6'; // 24px
            case 'md':
                return 'w-8 h-8'; // 32px
            case 'lg':
                return 'w-12 h-12'; // 48px
            case 'xl':
                return 'w-16 h-16'; // 64px
            default:
                return 'w-8 h-8';
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'white':
                return 'text-white';
            case 'dark':
                return 'text-gray-900 dark:text-gray-100';
            default:
                return 'text-gray-900 dark:text-gray-100';
        }
    };

    const sizeClasses = typeof size === 'number' ? '' : getSizeClasses();
    const inlineStyle = typeof size === 'number' ? {width: size, height: size} : {};

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* SVG Logo - Perfect Clarity */}
            <img
                src={logoSvg}
                alt="ApplyTrak Logo"
                className={`
                    flex-shrink-0 transition-all duration-300
                    ${sizeClasses}
                `}
                style={{
                    ...inlineStyle,
                    objectFit: 'contain',
                    objectPosition: 'center'
                }}
                loading={priority ? 'eager' : 'lazy'}
                decoding="sync"
                onError={(e) => {
                    console.warn('ApplyTrak SVG logo failed to load:', e);
                }}
                onLoad={() => {
                    console.log('ApplyTrak SVG logo loaded successfully');
                }}
            />

            {/* Optional Text */}
            {showText && (
                <span className={`font-bold tracking-tight ${getTextColor()} ${textClassName}`}>
                    ApplyTrak
                </span>
            )}
        </div>
    );
};

export default ApplyTrakLogo;