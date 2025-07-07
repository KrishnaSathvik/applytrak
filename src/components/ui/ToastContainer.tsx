import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { useAppStore, Toast } from '../../store/useAppStore';

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useAppStore();

    // Auto-remove toasts and limit to 3 visible toasts
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

    const getToastClasses = (type: Toast['type']) => {
        const baseClasses = 'toast';
        switch (type) {
            case 'success':
                return `${baseClasses} toast-success`;
            case 'error':
                return `${baseClasses} toast-error`;
            case 'warning':
                return `${baseClasses} toast-warning`;
            case 'info':
            default:
                return `${baseClasses} toast-info`;
        }
    };

    const getIconColor = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            case 'warning':
                return 'text-yellow-600 dark:text-yellow-400';
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
                return 'bg-yellow-500';
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
            {/* Add the CSS animation as a style element */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes shrink {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                    .toast-progress {
                        animation: shrink var(--duration) linear forwards;
                    }
                `
            }} />

            <div
                className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full"
                role="region"
                aria-label="Notifications"
            >
                {visibleToasts.map((toast, index) => {
                    const Icon = getToastIcon(toast.type);

                    return (
                        <div
                            key={toast.id}
                            className={`${getToastClasses(toast.type)} transform transition-all duration-500 ease-out`}
                            style={{
                                animationDelay: `${index * 100}ms`,
                                transform: `translateY(${index * 8}px) scale(${1 - index * 0.05})`,
                                opacity: 1 - index * 0.1,
                                zIndex: 50 - index
                            }}
                            role="alert"
                            aria-live="assertive"
                        >
                            <div className="flex items-start space-x-3">
                                {/* Icon */}
                                <div className={`flex-shrink-0 p-1 ${getIconColor(toast.type)}`}>
                                    <Icon className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide leading-relaxed">
                                        {toast.message}
                                    </p>

                                    {/* Action Button */}
                                    {toast.action && (
                                        <button
                                            onClick={toast.action.onClick}
                                            className="mt-2 inline-flex items-center text-xs font-bold text-gradient-blue hover:text-gradient-purple transition-colors tracking-wider"
                                        >
                                            {toast.action.label}
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </button>
                                    )}
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                                    aria-label="Dismiss notification"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Progress Bar for timed toasts */}
                            {toast.duration && (
                                <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                                    <div
                                        className={`h-full ${getProgressBarColor(toast.type)} toast-progress transition-all ease-linear`}
                                        style={{
                                            '--duration': `${toast.duration}ms`
                                        } as React.CSSProperties}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Toast Counter */}
                {toasts.length > 3 && (
                    <div className="glass-subtle rounded-lg p-3 text-center">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">
                            +{toasts.length - 3} more notifications
                        </span>
                    </div>
                )}
            </div>
        </>
    );
};

export default ToastContainer;