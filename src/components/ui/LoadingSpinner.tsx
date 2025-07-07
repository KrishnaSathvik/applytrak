import React from 'react';
import {Briefcase, Loader2, Target, TrendingUp} from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'brand';
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
                                                           size = 'md',
                                                           variant = 'default',
                                                           message,
                                                           fullScreen = false,
                                                           className = ''
                                                       }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    };

    const renderSpinner = () => {
        const baseClass = `${sizeClasses[size]} ${className}`;

        switch (variant) {
            case 'dots':
                return (
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`${sizeClasses[size]} bg-gradient-to-r from-primary-500 to-blue-600 dark:from-primary-400 dark:to-blue-500 rounded-full animate-bounce shadow-lg`}
                                style={{animationDelay: `${i * 0.1}s`}}
                            />
                        ))}
                    </div>
                );

            case 'pulse':
                return (
                    <div className={`${baseClass} bg-gradient-to-r from-primary-500 to-purple-600 dark:from-primary-400 dark:to-purple-500 rounded-full animate-pulse shadow-lg`}/>
                );

            case 'bounce':
                return (
                    <div className="flex space-x-2">
                        <Briefcase className={`${baseClass} text-primary-600 dark:text-primary-400 animate-bounce drop-shadow-lg`}/>
                        <TrendingUp className={`${baseClass} text-green-600 dark:text-green-400 animate-bounce drop-shadow-lg`}
                                    style={{animationDelay: '0.1s'}}/>
                        <Target className={`${baseClass} text-blue-600 dark:text-blue-400 animate-bounce drop-shadow-lg`}
                                style={{animationDelay: '0.2s'}}/>
                    </div>
                );

            case 'brand':
                return (
                    <div className="relative">
                        <div
                            className={`${baseClass} border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin`}/>
                        <div
                            className={`absolute inset-0 ${baseClass} border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin shadow-lg`}/>
                        <Briefcase className="absolute inset-0 m-auto h-4 w-4 text-primary-600 dark:text-primary-400 drop-shadow-sm"/>
                    </div>
                );

            default:
                return (
                    <Loader2 className={`${baseClass} text-primary-600 dark:text-primary-400 animate-spin drop-shadow-lg`}/>
                );
        }
    };

    const content = (
        <div className="flex flex-col items-center justify-center space-y-3">
            {renderSpinner()}
            {message && (
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400 animate-pulse tracking-wide leading-relaxed text-center">
                    {message}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div
                className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="glass-card p-8">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

// Skeleton Loading Components - Enhanced Typography
export const ApplicationSkeleton: React.FC = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse shadow-sm"/>
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-blue-200 dark:from-gray-700 dark:to-blue-800 rounded animate-pulse"/>
                            <div className="h-3 w-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse"/>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <div className="h-8 w-16 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 rounded animate-pulse"/>
                        <div className="h-8 w-8 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded animate-pulse"/>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const ChartSkeleton: React.FC = () => (
    <div className="glass-card p-6">
        <div className="space-y-4">
            <div className="h-6 w-32 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 rounded animate-pulse"/>
            <div className="h-64 bg-gradient-to-br from-gray-200 via-blue-100 to-purple-100 dark:from-gray-700 dark:via-blue-900 dark:to-purple-900 rounded animate-pulse shadow-inner"/>
            <div className="flex justify-center space-x-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full animate-pulse shadow-sm ${
                            i === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                                i === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                                    i === 2 ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                                        'bg-gradient-to-br from-yellow-400 to-orange-500'
                        }`}/>
                        <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"/>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const GoalSkeleton: React.FC = () => (
    <div className="glass-card p-6">
        <div className="space-y-4">
            <div className="h-6 w-40 bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-800 dark:to-blue-800 rounded animate-pulse"/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <div className={`h-4 w-24 rounded animate-pulse ${
                            i === 0 ? 'bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800' :
                                i === 1 ? 'bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800' :
                                    'bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800'
                        }`}/>
                        <div className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"/>
                        <div className="h-3 w-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse"/>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default LoadingSpinner;