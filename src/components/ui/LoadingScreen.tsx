// src/components/ui/LoadingScreen.tsx - Enhanced Typography Version
import React from 'react';
import {Briefcase, Loader2} from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    showLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
                                                                message = 'Loading your job applications...',
                                                                showLogo = true
                                                            }) => {
    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="text-center space-y-8">
                {showLogo && (
                    <div className="flex justify-center">
                        <div className="relative">
                            <Briefcase className="h-16 w-16 text-primary-600 animate-pulse"/>
                            <div
                                className="absolute inset-0 bg-primary-600 opacity-20 rounded-lg blur-xl animate-pulse"></div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600"/>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-extrabold text-gradient-static tracking-tight">
                            ApplyTrak
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Enhanced Loading dots animation */}
                <div className="flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-bounce"
                         style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-bounce"
                         style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-bounce"
                         style={{animationDelay: '300ms'}}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;