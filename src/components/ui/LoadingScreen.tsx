import React, {useMemo, useState, useEffect} from 'react';
import {Sparkles, Target, TrendingUp} from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    showLogo?: boolean;
    variant?: 'default' | 'minimal' | 'animated' | 'progress';
    progress?: number; // 0-100 for progress variant
    onComplete?: () => void; // Callback when progress reaches 100%
}

const LOADING_DOTS = [
    {delay: '0ms', scale: 1},
    {delay: '200ms', scale: 1.2},
    {delay: '400ms', scale: 1},
] as const;

const LOADING_MESSAGES = [
    'Loading your job applications...',
    'Preparing your dashboard...',
    'Setting up your workspace...',
    'Almost ready...',
    'Finalizing setup...',
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading your job applications...',
    showLogo = true,
    variant = 'default',
    progress = 0,
    onComplete,
}) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    // Rotate through loading messages for animated variant
    useEffect(() => {
        if (variant === 'animated') {
            const interval = setInterval(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 2000);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [variant]);

    // Handle progress completion
    useEffect(() => {
        if (progress >= 100 && onComplete) {
            const timer = setTimeout(onComplete, 500);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [progress, onComplete]);

    // Memoized loading dots with improved animation
    const loadingDots = useMemo(
        () =>
            LOADING_DOTS.map((dot, index) => (
                <div
                    key={index}
                    className="w-3 h-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-pulse"
                    style={{
                        animationDelay: dot.delay,
                        transform: `scale(${dot.scale})`,
                    }}
                    aria-hidden="true"
                />
            )),
        []
    );

    // Memoized animated logo
    const animatedLogo = useMemo(() => {
        if (!showLogo) return null;

        const logoVariants = {
            default: (
                <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full animate-spin border-4 border-transparent border-t-primary-600 border-r-secondary-600" />
                </div>
            ),
            animated: (
                <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full animate-spin flex items-center justify-center">
                        <div className="w-12 h-12 bg-white rounded-full border-4 border-transparent border-t-primary-600 border-r-secondary-600 border-b-accent-600" />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-ping" />
                    <Target className="absolute -bottom-2 -left-2 h-6 w-6 text-green-500 animate-pulse" />
                </div>
            ),
            minimal: (
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full animate-spin border-2 border-transparent border-t-primary-600" />
                </div>
            ),
            progress: (
                <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full animate-pulse flex items-center justify-center">
                    <TrendingUp className="h-12 w-12 text-white animate-pulse" />
                </div>
            ),
        };

        return logoVariants[variant] || logoVariants.default;
    }, [showLogo, variant]);

    // Progress bar for progress variant
    const progressBar = variant === 'progress' && (
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Loading...</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out rounded-full"
                    style={{width: `${progress}%`}}
                />
            </div>
        </div>
    );



    // Current message based on variant
    const currentMessage = variant === 'animated' ? LOADING_MESSAGES[currentMessageIndex] : message;

    // Container classes based on variant
    const containerClasses = {
        default: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        minimal: "min-h-screen bg-white dark:bg-gray-900",
        animated: "min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900",
        progress: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
    };

    return (
        <div
            className={`${containerClasses[variant]} flex items-center justify-center transition-all duration-500`}
            role="status"
            aria-live="polite"
            aria-label="Application loading"
        >
            <div className="text-center space-y-8 px-4">
                {/* Logo Section */}
                {animatedLogo}

                {/* Main Content */}
                <div className="space-y-6">

                    <div className="space-y-3">
                        <h1 className="text-4xl font-extrabold text-gradient-static tracking-tight">
                            ApplyTrak
                        </h1>
                        <p
                            className="text-gray-600 dark:text-gray-400 max-w-md mx-auto font-medium leading-relaxed transition-all duration-500"
                            aria-live="polite"
                        >
                            {currentMessage}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                {progressBar}

                {/* Loading Dots Animation - only for default and animated variants */}
                {(variant === 'default' || variant === 'animated') && (
                    <div className="flex justify-center gap-3" aria-hidden="true">
                        {loadingDots}
                    </div>
                )}

                {/* Additional decorative elements for animated variant */}
                {variant === 'animated' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-400 rounded-full animate-ping" style={{animationDelay: '0ms'}} />
                        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-secondary-400 rounded-full animate-ping" style={{animationDelay: '500ms'}} />
                        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent-400 rounded-full animate-ping" style={{animationDelay: '1000ms'}} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadingScreen;