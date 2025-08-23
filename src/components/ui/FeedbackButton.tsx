import React, {useCallback, useMemo} from 'react';
import {MessageCircle, MessageSquare} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

// Constants for better maintainability
const FEEDBACK_TIMES = {
    WORK_START: 9,
    WORK_END: 17,
    EVENING_START: 18,
    EVENING_END: 22,
} as const;

const ANIMATION_DURATIONS = {
    FAST: 200,
    MEDIUM: 300,
    SLOW: 500,
} as const;

const Z_INDEX = {
    FEEDBACK_BUTTON: 40,
} as const;

// Type definitions for better type safety
type FeedbackPosition = 'bottom-right' | 'bottom-left' | 'header';
type FeedbackSize = 'sm' | 'md' | 'lg';
type FeedbackVariant = 'floating' | 'header' | 'minimal';
type FeedbackType = 'bug' | 'feature' | 'general' | 'love';

interface FeedbackButtonProps {
    position?: FeedbackPosition;
    size?: FeedbackSize;
    variant?: FeedbackVariant;
    className?: string;
    disabled?: boolean;
}

// Style configuration objects
const POSITION_STYLES: Record<FeedbackPosition, string> = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'header': 'relative',
};

const SIZE_STYLES: Record<FeedbackSize, string> = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
};

const ICON_SIZES: Record<FeedbackSize, string> = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
};

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
                                                           position = 'bottom-right',
                                                           size = 'md',
                                                           variant = 'floating',
                                                           className = '',
                                                           disabled = false,
                                                       }) => {
    const {openFeedbackModal, ui} = useAppStore();

    // Memoized visibility check
    const isVisible = useMemo(() => {
        return !disabled &&
            ui?.feedback?.buttonVisible !== false &&
            ui?.admin?.dashboardOpen !== true;
    }, [disabled, ui?.feedback?.buttonVisible, ui?.admin?.dashboardOpen]);

    // Memoized feedback type suggestion
    const suggestedFeedbackType = useMemo((): FeedbackType => {
        const hour = new Date().getHours();

        if (hour >= FEEDBACK_TIMES.WORK_START && hour <= FEEDBACK_TIMES.WORK_END) {
            return 'feature'; // Work hours - likely thinking about improvements
        }
        if (hour >= FEEDBACK_TIMES.EVENING_START && hour <= FEEDBACK_TIMES.EVENING_END) {
            return 'general'; // Evening - general feedback
        }
        return 'love'; // Late night/early morning users are dedicated!
    }, []);

    // Optimized click handler
    const handleClick = useCallback(() => {
        if (disabled) return;

        try {
            openFeedbackModal(suggestedFeedbackType);
        } catch (error) {
            console.error('Failed to open feedback modal:', error);
            // Fallback to basic modal opening
            openFeedbackModal('general');
        }
    }, [disabled, openFeedbackModal, suggestedFeedbackType]);

    // Keyboard handler for accessibility
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
        }
    }, [handleClick]);

    // Don't render if not visible
    if (!isVisible) {
        return null;
    }

    // Header variant
    if (variant === 'header') {
        return (
            <button
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
          p-2.5 sm:p-3 rounded-xl sm:rounded-2xl
          bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30
          hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40
          border border-blue-200/50 dark:border-blue-700/50
          transition-all duration-${ANIMATION_DURATIONS.MEDIUM} group shadow-sm hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
                title="Share Feedback"
                aria-label="Share feedback about ApplyTrak"
                type="button"
            >
                <MessageSquare
                    className={`
            h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400
            group-hover:scale-110 transition-transform duration-${ANIMATION_DURATIONS.MEDIUM}
          `}
                    aria-hidden="true"
                />
            </button>
        );
    }

    // Minimal variant
    if (variant === 'minimal') {
        return (
            <button
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium text-blue-600 dark:text-blue-400
          hover:bg-blue-50 dark:hover:bg-blue-900/20
          transition-all duration-${ANIMATION_DURATIONS.FAST}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
                title="Share Feedback"
                type="button"
            >
                <MessageCircle className="h-4 w-4" aria-hidden="true"/>
                <span className="hidden sm:inline">Feedback</span>
            </button>
        );
    }

    // Floating variant (default)
    return (
        <button
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`
        fixed ${POSITION_STYLES[position]} ${SIZE_STYLES[size]}
        bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
        dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800
        text-white rounded-full shadow-lg hover:shadow-xl
        transition-all duration-${ANIMATION_DURATIONS.MEDIUM} ease-out z-${Z_INDEX.FEEDBACK_BUTTON} group
        hover:scale-110 active:scale-95
        glass-effect border border-blue-400/30
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
            title="Share your feedback about ApplyTrak"
            aria-label="Open feedback modal"
            type="button"
        >
            {/* Main Icon Container */}
            <div className="flex items-center justify-center w-full h-full relative">
                <MessageSquare
                    className={`
            ${ICON_SIZES[size]} 
            group-hover:scale-110 transition-transform duration-${ANIMATION_DURATIONS.MEDIUM}
            group-disabled:group-hover:scale-100
          `}
                    aria-hidden="true"
                />
            </div>

            {/* Pulse Indicator for New Users */}
            <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"
                aria-hidden="true"
            />

            {/* Hover Tooltip */}
            <div
                className="
          absolute bottom-full right-0 mb-2 px-3 py-2
          bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-${ANIMATION_DURATIONS.FAST}
          whitespace-nowrap pointer-events-none
          transform translate-y-1 group-hover:translate-y-0
          group-disabled:opacity-0
        "
                role="tooltip"
                aria-hidden="true"
            >
                💬 Share your thoughts!
                <div
                    className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"/>
            </div>

            {/* Decorative Effects */}
            <div className="absolute inset-0 rounded-full" aria-hidden="true">
                {/* Subtle Gradient Overlay */}
                <div className={`
          absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-${ANIMATION_DURATIONS.MEDIUM}
          group-disabled:opacity-0
        `}/>

                {/* Glow Effect */}
                <div className={`
          absolute inset-0 rounded-full bg-blue-400/20 blur-lg 
          opacity-0 group-hover:opacity-100 transition-opacity duration-${ANIMATION_DURATIONS.MEDIUM} scale-150
          group-disabled:opacity-0
        `}/>
            </div>

            {/* Screen Reader Only Text */}
            <span className="sr-only">
        Open feedback modal to share your thoughts about ApplyTrak
      </span>
        </button>
    );
};

export default FeedbackButton;