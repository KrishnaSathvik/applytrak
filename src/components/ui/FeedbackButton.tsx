// src/components/ui/FeedbackButton.tsx - Simple Floating Feedback Button
import React from 'react';
import {MessageCircle, MessageSquare} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

interface FeedbackButtonProps {
    position?: 'bottom-right' | 'bottom-left' | 'header';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'floating' | 'header' | 'minimal';
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
                                                           position = 'bottom-right',
                                                           size = 'md',
                                                           variant = 'floating'
                                                       }) => {
    const {openFeedbackModal, ui} = useAppStore();

    // Don't show if feedback button is disabled or admin dashboard is open
    if (!ui.feedback?.buttonVisible || ui.admin?.dashboardOpen) {
        return null;
    }

    const handleClick = () => {
        // Suggest feedback type based on user behavior
        const suggestedType = getSuggestedFeedbackType();
        openFeedbackModal(suggestedType);
    };

    const getSuggestedFeedbackType = (): 'bug' | 'feature' | 'general' | 'love' => {
        // Simple logic - you can enhance this based on user analytics
        const hour = new Date().getHours();

        // Different suggestions based on time of day (just for fun!)
        if (hour >= 9 && hour <= 17) {
            return 'feature'; // Work hours - likely thinking about improvements
        } else if (hour >= 18 && hour <= 22) {
            return 'general'; // Evening - general feedback
        } else {
            return 'love'; // Late night/early morning users are dedicated!
        }
    };

    // Header variant (for integration in header)
    if (variant === 'header') {
        return (
            <button
                onClick={handleClick}
                className="
          p-2.5 sm:p-3 rounded-xl sm:rounded-2xl
          bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30
          hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40
          border border-blue-200/50 dark:border-blue-700/50
          transition-all duration-300 group shadow-sm hover:shadow-md
        "
                title="Share Feedback"
                aria-label="Share feedback about ApplyTrak"
            >
                <MessageSquare className="
          h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400
          group-hover:scale-110 transition-transform duration-300
        "/>
            </button>
        );
    }

    // Minimal variant
    if (variant === 'minimal') {
        return (
            <button
                onClick={handleClick}
                className="
          inline-flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium text-blue-600 dark:text-blue-400
          hover:bg-blue-50 dark:hover:bg-blue-900/20
          transition-all duration-200
        "
                title="Share Feedback"
            >
                <MessageCircle className="h-4 w-4"/>
                <span className="hidden sm:inline">Feedback</span>
            </button>
        );
    }

    // Floating variant (default)
    const positionClasses = {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'header': 'relative'
    };

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-14 h-14',
        lg: 'w-16 h-16'
    };

    const iconSizes = {
        sm: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-7 w-7'
    };

    return (
        <button
            onClick={handleClick}
            className={`
        fixed ${positionClasses[position]} ${sizeClasses[size]}
        bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
        dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800
        text-white rounded-full shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out z-40 group
        hover:scale-110 active:scale-95
        glass-effect border border-blue-400/30
      `}
            title="Share your feedback about ApplyTrak"
            aria-label="Open feedback modal"
        >
            {/* Main Icon */}
            <div className="flex items-center justify-center w-full h-full">
                <MessageSquare className={`
          ${iconSizes[size]} group-hover:scale-110 transition-transform duration-300
        `}/>
            </div>

            {/* Pulse indicator for new users */}
            <div className="
        absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full
        animate-ping opacity-75
      "/>

            {/* Hover tooltip */}
            <div className="
        absolute bottom-full right-0 mb-2 px-3 py-2
        bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        whitespace-nowrap pointer-events-none
        transform translate-y-1 group-hover:translate-y-0
      ">
                💬 Share your thoughts!
                <div
                    className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"/>
            </div>

            {/* Decorative elements */}
            <div className="absolute inset-0 rounded-full">
                {/* Subtle gradient overlay */}
                <div
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                {/* Glow effect */}
                <div
                    className="absolute inset-0 rounded-full bg-blue-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-150"/>
            </div>
        </button>
    );
};

export default FeedbackButton;