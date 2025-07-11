import React, {useEffect, useState} from 'react';
import {AlertTriangle, CheckCircle, ExternalLink, Info, X, XCircle} from 'lucide-react';
import {Toast, useAppStore} from '../../store/useAppStore';

const ToastContainer: React.FC = () => {
    const {toasts, removeToast} = useAppStore();
    const [isVisible, setIsVisible] = useState(false);

    // Auto-remove toasts with cleanup
    useEffect(() => {
        const timers: { [key: string]: NodeJS.Timeout } = {};

        toasts.forEach((toast) => {
            if (toast.duration && !timers[toast.id]) {
                timers[toast.id] = setTimeout(() => {
                    removeToast(toast.id);
                }, toast.duration);
            }
        });

        // Show/hide animation
        setIsVisible(toasts.length > 0);

        return () => {
            Object.values(timers).forEach(timer => clearTimeout(timer));
        };
    }, [toasts, removeToast]);

    // Limit to 3 visible toasts for performance
    const visibleToasts = toasts.slice(0, 3);

    const getToastIcon = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return CheckCircle;
            case 'error':
                return XCircle;
            case 'warning':
                return AlertTriangle;
            case 'info':
            default:
                return Info;
        }
    };

    const getToastStyles = (type: Toast['type']) => {
        const baseStyles = `
            relative w-full max-w-sm p-4 mb-3 rounded-xl shadow-lg border
            backdrop-blur-md transform transition-all duration-300 ease-out
            font-family-primary
        `;

        switch (type) {
            case 'success':
                return `${baseStyles} 
                    bg-gradient-to-r from-green-50/95 to-emerald-50/95 
                    dark:from-green-900/20 dark:to-emerald-900/20
                    border-green-200/50 dark:border-green-700/50
                    text-green-800 dark:text-green-200`;
            case 'error':
                return `${baseStyles} 
                    bg-gradient-to-r from-red-50/95 to-pink-50/95 
                    dark:from-red-900/20 dark:to-pink-900/20
                    border-red-200/50 dark:border-red-700/50
                    text-red-800 dark:text-red-200`;
            case 'warning':
                return `${baseStyles} 
                    bg-gradient-to-r from-amber-50/95 to-yellow-50/95 
                    dark:from-amber-900/20 dark:to-yellow-900/20
                    border-amber-200/50 dark:border-amber-700/50
                    text-amber-800 dark:text-amber-200`;
            case 'info':
            default:
                return `${baseStyles} 
                    bg-gradient-to-r from-blue-50/95 to-indigo-50/95 
                    dark:from-blue-900/20 dark:to-indigo-900/20
                    border-blue-200/50 dark:border-blue-700/50
                    text-blue-800 dark:text-blue-200`;
        }
    };

    const getIconColor = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            case 'warning':
                return 'text-amber-600 dark:text-amber-400';
            case 'info':
            default:
                return 'text-blue-600 dark:text-blue-400';
        }
    };

    const getProgressBarColor = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            case 'warning':
                return 'bg-amber-500';
            case 'info':
            default:
                return 'bg-blue-500';
        }
    };

    if (visibleToasts.length === 0) {
        return null;
    }

    return (
        <>
            {/* Toast Container */}
            <div
                className={`
                    fixed top-4 right-4 z-toast space-y-3 max-w-sm w-full
                    transition-all duration-300 ease-out pointer-events-none
                    ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
                `}
                role="region"
                aria-label="Notifications"
                aria-live="polite"
            >
                {visibleToasts.map((toast, index) => {
                    const Icon = getToastIcon(toast.type);

                    return (
                        <div
                            key={toast.id}
                            className={`
                                ${getToastStyles(toast.type)}
                                animate-slide-in-right
                                hover:scale-105 hover:shadow-xl
                                pointer-events-auto
                                gpu-accelerated
                            `}
                            style={{
                                animationDelay: `${index * 100}ms`,
                                zIndex: 50 - index
                            }}
                            role="alert"
                            aria-live="assertive"
                        >
                            <div className="flex items-start space-x-3">
                                {/* Icon */}
                                <div className={`
                                    flex-shrink-0 p-2 rounded-lg
                                    ${getIconColor(toast.type)}
                                    bg-white/50 dark:bg-gray-800/50
                                `}>
                                    <Icon className="h-5 w-5"/>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="
                                        text-sm font-semibold tracking-normal leading-relaxed
                                        text-gray-900 dark:text-gray-100
                                    ">
                                        {toast.message}
                                    </p>

                                    {/* Action Button */}
                                    {toast.action && (
                                        <button
                                            onClick={toast.action.onClick}
                                            className="
                                                mt-2 inline-flex items-center text-xs font-medium
                                                text-blue-600 dark:text-blue-400
                                                hover:text-blue-800 dark:hover:text-blue-300
                                                transition-colors duration-200
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                                rounded-md px-2 py-1
                                            "
                                        >
                                            {toast.action.label}
                                            <ExternalLink className="h-3 w-3 ml-1"/>
                                        </button>
                                    )}
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="
                                        flex-shrink-0 p-1 rounded-md
                                        text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                                        hover:bg-white/50 dark:hover:bg-gray-700/50
                                        transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                                    "
                                    aria-label="Dismiss notification"
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            </div>

                            {/* Progress Bar for timed toasts */}
                            {toast.duration && (
                                <div
                                    className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                                    <div
                                        className={`
                                            h-full ${getProgressBarColor(toast.type)} 
                                            transition-all ease-linear animate-shrink
                                        `}
                                        style={{
                                            animationDuration: `${toast.duration}ms`
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Toast Counter */}
                {toasts.length > 3 && (
                    <div className="
                        glass-effect rounded-lg p-3 text-center
                        bg-white/80 dark:bg-gray-800/80
                        border border-gray-200/50 dark:border-gray-700/50
                        pointer-events-auto
                    ">
                        <span className="
                            text-xs font-medium text-gray-600 dark:text-gray-400
                            tracking-wide uppercase
                        ">
                            +{toasts.length - 3} more notifications
                        </span>
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes shrink {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                    
                    @keyframes slide-in-right {
                        from {
                            opacity: 0;
                            transform: translateX(100%) translateZ(0);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0) translateZ(0);
                        }
                    }
                    
                    .animate-shrink {
                        animation: shrink var(--duration, 5000ms) linear forwards;
                    }
                    
                    .animate-slide-in-right {
                        animation: slide-in-right 0.3s ease-out forwards;
                    }
                    
                    .z-toast {
                        z-index: 1300;
                    }
                    
                    .font-family-primary {
                        font-family: var(--font-family-primary, 'Geist', sans-serif);
                    }
                    
                    .gpu-accelerated {
                        transform: translateZ(0);
                        backface-visibility: hidden;
                    }
                `
            }}/>
        </>
    );
};

export default ToastContainer;