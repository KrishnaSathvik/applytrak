import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import LoadingScreen from './LoadingScreen';

const LoadingScreenDemo: React.FC = () => {
    const [currentVariant, setCurrentVariant] = useState<'default' | 'minimal' | 'animated' | 'progress'>('default');
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const variants = [
        { key: 'default', label: 'Default', description: 'Classic loading screen with logo and dots' },
        { key: 'minimal', label: 'Minimal', description: 'Clean, simple loading screen' },
        { key: 'animated', label: 'Animated', description: 'Dynamic loading with rotating messages' },
        { key: 'progress', label: 'Progress', description: 'Loading screen with progress bar' },
    ] as const;

    const handleVariantChange = (variant: typeof currentVariant) => {
        setCurrentVariant(variant);
        setIsLoading(true);
        setProgress(0);
    };

    const handleProgressComplete = () => {
        setIsLoading(false);
        setProgress(0);
    };

    // Simulate progress for progress variant
    useEffect(() => {
        if (currentVariant === 'progress' && isLoading) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 200);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [currentVariant, isLoading]);

    if (isLoading) {
        return (
            <LoadingScreen
                variant={currentVariant}
                progress={progress}
                onComplete={handleProgressComplete}
                message={currentVariant === 'animated' ? '' : `Loading ${currentVariant} variant...`}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gradient-static tracking-tight mb-4">
                        LoadingScreen Variants
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Explore different loading screen variants with enhanced animations, 
                        progress tracking, and visual effects.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {variants.map((variant) => (
                        <div
                            key={variant.key}
                            className="glass-card p-6 text-center hover:scale-105 transition-all duration-300 cursor-pointer"
                            onClick={() => handleVariantChange(variant.key as typeof currentVariant)}
                        >
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl flex items-center justify-center">
                                {variant.key === 'default' && (
                                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse flex items-center justify-center">
                                        <div className="w-4 h-4 bg-white rounded-full animate-spin border-2 border-transparent border-t-primary-600" />
                                    </div>
                                )}
                                {variant.key === 'minimal' && (
                                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse flex items-center justify-center">
                                        <div className="w-4 h-4 bg-white rounded-full animate-spin border-2 border-transparent border-t-primary-600" />
                                    </div>
                                )}
                                {variant.key === 'animated' && (
                                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full animate-spin flex items-center justify-center">
                                        <div className="w-4 h-4 bg-white rounded-full border-2 border-transparent border-t-primary-600 border-r-secondary-600" />
                                    </div>
                                )}
                                {variant.key === 'progress' && (
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse flex items-center justify-center">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {variant.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {variant.description}
                            </p>
                            <button className="mt-4 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200">
                                Try {variant.label}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 glass-card p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Features & Capabilities
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-primary-600 mb-3">Enhanced Animations</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• Smooth transitions and hover effects</li>
                                <li>• GPU-accelerated animations</li>
                                <li>• Dynamic message rotation</li>
                                <li>• Progress bar with completion callback</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary-600 mb-3">Accessibility</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• ARIA live regions for screen readers</li>
                                <li>• Proper role and label attributes</li>
                                <li>• Keyboard navigation support</li>
                                <li>• High contrast color schemes</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary-600 mb-3">Performance</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• Memoized components and callbacks</li>
                                <li>• Efficient re-rendering</li>
                                <li>• Optimized CSS animations</li>
                                <li>• Minimal DOM updates</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary-600 mb-3">Customization</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• Multiple visual variants</li>
                                <li>• Customizable messages and progress</li>
                                <li>• Flexible logo display options</li>
                                <li>• Theme-aware styling</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreenDemo;
