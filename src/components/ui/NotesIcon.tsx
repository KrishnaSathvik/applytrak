import React from 'react';
import {FileText} from 'lucide-react';

interface NotesIconProps {
    hasNotes: boolean;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
} as const;

const ICON_SIZES = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
} as const;

export const NotesIcon: React.FC<NotesIconProps> = ({
                                                        hasNotes,
                                                        onClick,
                                                        className = '',
                                                        disabled = false,
                                                        size = 'md',
                                                    }) => {
    const sizeClasses = SIZE_CLASSES[size];
    const iconSize = ICON_SIZES[size];

    const getButtonClasses = () => {
        const baseClasses = `
      inline-flex items-center justify-center rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${sizeClasses}
    `.trim();

        if (disabled) {
            return `${baseClasses} opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500`;
        }

        if (hasNotes) {
            return `${baseClasses} 
        bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 
        hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:scale-110 
        focus:ring-blue-500
        active:scale-95
      `.trim();
        }

        return `${baseClasses} 
      bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 
      hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105
      focus:ring-gray-500
      active:scale-95
    `.trim();
    };

    const getTooltipText = () => {
        if (disabled) return 'Notes unavailable';
        return hasNotes ? 'View notes' : 'No notes available';
    };

    return (
        <button
            onClick={onClick}
            className={`${getButtonClasses()} ${className}`}
            title={getTooltipText()}
            aria-label={getTooltipText()}
            type="button"
            disabled={disabled}
        >
            <FileText
                className={iconSize}
                aria-hidden="true"
            />
        </button>
    );
};