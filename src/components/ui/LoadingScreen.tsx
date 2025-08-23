import React, {useMemo} from 'react';
import {Briefcase, Loader2} from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    showLogo?: boolean;
}

const LOADING_DOTS = [
    {delay: '0ms'},
    {delay: '150ms'},
    {delay: '300ms'},
] as const;

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
                                                                message = 'Loading your job applications...',
                                                                showLogo = true,
                                                            }) => {
    // Memoize the dots to prevent unnecessary re-renders
    const loadingDots = useMemo(
        () =>
            LOADING_DOTS.map((dot, index) => (
                <div
                    key={index}
                    className="w-2 h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-bounce"
                    style={{animationDelay: dot.delay}}
                    aria-hidden="true"
                />
            )),
        []
    );

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
            role="status"
            aria-live="polite"
            aria-label="Application loading"
        >
            <div className="text-center space-y-8">
                {/* Logo Section */}
                {showLogo && (
                    <div className="flex justify-center">
                        <div className="relative">
                            <Briefcase
                                className="h-16 w-16 text-primary-600 animate-pulse"
                                aria-hidden="true"
                            />
                            <div
                                className="absolute inset-0 bg-primary-600 opacity-20 rounded-lg blur-xl animate-pulse"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Loader2
                            className="h-8 w-8 animate-spin text-primary-600"
                            aria-hidden="true"
                        />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold text-gradient-static tracking-tight">
                            ApplyTrak
                        </h1>
                        <p
                            className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed"
                            aria-live="polite"
                        >
                            {message}
                        </p>
                    </div>
                </div>

                {/* Loading Dots Animation */}
                <div className="flex justify-center gap-2" aria-hidden="true">
                    {loadingDots}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;