import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {AlertTriangle, CheckCircle, ExternalLink, Info, X, XCircle} from 'lucide-react';
import {Toast, useAppStore} from '../../store/useAppStore';

const TOAST_CONSTANTS = {
    MAX_VISIBLE_TOASTS: 3,
    ANIMATION_DELAY_STEP: 150,
    BASE_Z_INDEX: 50,
    STACK_OFFSET: 8, // Offset for stacked toasts
    IMPORTANT_TYPES: ['error', 'warning'] as const, // Always show these types
    MUTED_TYPES: ['info'] as const, // Can be muted
} as const;

const ToastContainer: React.FC = () => {
    const {toasts, removeToast} = useAppStore();
    const [isVisible, setIsVisible] = useState(false);
    const [hoveredToast, setHoveredToast] = useState<string | null>(null);
    const [mutedTypes] = useState<Set<string>>(new Set(['info']));
    const containerRef = useRef<HTMLDivElement>(null);

    // Check if a toast type is muted
    const isToastMuted = useCallback((type: Toast['type']) => {
        return mutedTypes.has(type);
    }, [mutedTypes]);

    // Filter toasts based on preferences
    const filteredToasts = useMemo(() => {
        return toasts.filter(toast => {
            // Always show important types
            if (toast.type === 'error' || toast.type === 'warning') return true;
            // Filter out muted types
            if (isToastMuted(toast.type)) return false;
            return true;
        });
    }, [toasts, isToastMuted]);

    // Memoized toast icon mapping with enhanced icons
    const getToastIcon = useCallback((type: Toast['type']) => {
        const iconMap = {
            success: CheckCircle,
            error: XCircle,
            warning: AlertTriangle,
            info: Info,
        } as const;
        return iconMap[type] || Info;
    }, []);

    // Enhanced toast styles with better gradients and effects
    const getToastStyles = useCallback((type: Toast['type']) => {
        const baseStyles = `
            relative w-full max-w-sm p-4 mb-3 rounded-2xl shadow-xl border
            backdrop-blur-md transform transition-all duration-300 ease-out
            font-family-primary overflow-hidden
        `.trim();

        const typeStyles = {
            success: `
                bg-gradient-to-br from-green-50/95 via-emerald-50/95 to-green-50/95
                dark:from-green-900/30 dark:via-emerald-900/30 dark:to-green-900/30
                border-green-200/60 dark:border-green-700/60
                text-green-800 dark:text-green-200
                shadow-green-500/20
            `.trim(),
            error: `
                bg-gradient-to-br from-red-50/95 via-pink-50/95 to-red-50/95
                dark:from-red-900/30 dark:via-pink-900/30 dark:to-red-900/30
                border-red-200/60 dark:border-red-700/60
                text-red-800 dark:text-red-200
                shadow-red-500/20
            `.trim(),
            warning: `
                bg-gradient-to-br from-amber-50/95 via-yellow-50/95 to-amber-50/95
                dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-amber-900/30
                border-amber-200/60 dark:border-amber-700/60
                text-amber-800 dark:text-amber-200
                shadow-amber-500/20
            `.trim(),
            info: `
                bg-gradient-to-br from-blue-50/95 via-indigo-50/95 to-blue-50/95
                dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-blue-900/30
                border-blue-200/60 dark:border-blue-700/60
                text-blue-800 dark:text-blue-200
                shadow-blue-500/20
            `.trim(),
        };

        return `${baseStyles} ${typeStyles[type] || typeStyles.info}`;
    }, []);

    // Enhanced icon colors with better contrast
    const getIconColor = useCallback((type: Toast['type']) => {
        const colorMap = {
            success: 'text-green-600 dark:text-green-400',
            error: 'text-red-600 dark:text-red-400',
            warning: 'text-amber-600 dark:text-amber-400',
            info: 'text-blue-600 dark:text-blue-400',
        } as const;
        return colorMap[type] || colorMap.info;
    }, []);

    // Enhanced progress bar colors
    const getProgressBarColor = useCallback((type: Toast['type']) => {
        const colorMap = {
            success: 'bg-gradient-to-r from-green-500 to-emerald-500',
            error: 'bg-gradient-to-r from-red-500 to-pink-500',
            warning: 'bg-gradient-to-r from-amber-500 to-yellow-500',
            info: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        } as const;
        return colorMap[type] || colorMap.info;
    }, []);

    // Enhanced background colors for icon containers
    const getIconBackground = useCallback((type: Toast['type']) => {
        const bgMap = {
            success: 'bg-green-100/80 dark:bg-green-800/40',
            error: 'bg-red-100/80 dark:bg-red-800/40',
            warning: 'bg-amber-100/80 dark:bg-amber-800/40',
            info: 'bg-blue-100/80 dark:bg-blue-800/40',
        } as const;
        return bgMap[type] || bgMap.info;
    }, []);

    // Auto-remove toasts with cleanup and pause on hover
    useEffect(() => {
        const timers: Record<string, NodeJS.Timeout> = {};

        filteredToasts.forEach((toast) => {
            if (toast.duration && !timers[toast.id]) {
                timers[toast.id] = setTimeout(() => {
                    removeToast(toast.id);
                }, toast.duration);
            }
        });

        // Show/hide animation
        setIsVisible(filteredToasts.length > 0);

        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, [filteredToasts, removeToast]);

    // Pause timers when hovering over toasts
    const handleToastHover = useCallback((toastId: string, isHovering: boolean) => {
        setHoveredToast(isHovering ? toastId : null);
    }, []);





    // Memoized visible toasts for performance with stacking effect
    const visibleToasts = useMemo(
        () => filteredToasts.slice(0, TOAST_CONSTANTS.MAX_VISIBLE_TOASTS),
        [filteredToasts]
    );

    const remainingCount = filteredToasts.length - TOAST_CONSTANTS.MAX_VISIBLE_TOASTS;

    // Early return if no toasts
    if (visibleToasts.length === 0) {
        return null;
    }

    return (
        <>
            {/* Toast Container */}
            <div
                ref={containerRef}
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
                    const isHovered = hoveredToast === toast.id;
                    const stackOffset = index * TOAST_CONSTANTS.STACK_OFFSET;
                    const isImportant = toast.type === 'error' || toast.type === 'warning';

                    return (
                        <div
                            key={toast.id}
                            className={`
                                ${getToastStyles(toast.type)}
                                animate-slide-in-right
                                hover:scale-105 hover:shadow-2xl hover:-translate-y-1
                                pointer-events-auto
                                gpu-accelerated
                                transform-gpu
                                ${isHovered ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}
                                ${isImportant ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-red-500' : ''}
                            `}
                            style={{
                                animationDelay: `${index * TOAST_CONSTANTS.ANIMATION_DELAY_STEP}ms`,
                                zIndex: TOAST_CONSTANTS.BASE_Z_INDEX - index,
                                transform: `translateY(${stackOffset}px)`,
                            }}
                            role="alert"
                            aria-live="assertive"
                            onMouseEnter={() => handleToastHover(toast.id, true)}
                            onMouseLeave={() => handleToastHover(toast.id, false)}
                        >
                            {/* Decorative background pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-current rounded-full -translate-y-10 translate-x-10" />
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-current rounded-full translate-y-8 -translate-x-8" />
                            </div>

                            <div className="relative flex items-start gap-3">
                                {/* Enhanced Icon Container */}
                                <div
                                    className={`
                                        flex-shrink-0 p-2.5 rounded-xl
                                        ${getIconColor(toast.type)}
                                        ${getIconBackground(toast.type)}
                                        backdrop-blur-sm
                                        transition-all duration-200
                                        ${isHovered ? 'scale-110' : ''}
                                    `}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold tracking-normal leading-relaxed text-gray-900 dark:text-gray-100">
                                        {toast.message}
                                    </p>

                                    {/* Enhanced Action Button */}
                                    {toast.action && (
                                        <button
                                            onClick={toast.action.onClick}
                                            className="
                                                mt-3 inline-flex items-center gap-2 text-xs font-medium
                                                text-blue-600 dark:text-blue-400
                                                hover:text-blue-800 dark:hover:text-blue-300
                                                transition-colors duration-200
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                                rounded-lg px-3 py-1.5
                                                hover:bg-blue-50 dark:hover:bg-blue-900/20
                                                active:scale-95
                                            "
                                            type="button"
                                        >
                                            {toast.action.label}
                                            <ExternalLink className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Enhanced Close Button */}
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="
                                        flex-shrink-0 p-1.5 rounded-lg
                                        text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                                        hover:bg-white/60 dark:hover:bg-gray-700/60
                                        transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                                        active:scale-95
                                    "
                                    aria-label="Dismiss notification"
                                    type="button"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Enhanced Progress Bar for timed toasts */}
                            {toast.duration && (
                                <div className="mt-4 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`
                                            h-full ${getProgressBarColor(toast.type)} 
                                            transition-all ease-linear animate-shrink
                                            rounded-full
                                        `}
                                        style={{
                                            animationDuration: `${toast.duration}ms`,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Enhanced Toast Counter */}
                {remainingCount > 0 && (
                    <div
                        className="
                            glass-effect rounded-xl p-4 text-center 
                            bg-white/90 dark:bg-gray-800/90 
                            border border-gray-200/60 dark:border-gray-700/60 
                            pointer-events-auto
                            hover:scale-105 hover:shadow-lg
                            transition-all duration-200
                        "
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide">
                                +{remainingCount} more notifications
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced CSS Animations */}
            <style
                dangerouslySetInnerHTML={{
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
                        
                        @keyframes slide-in-top {
                            from {
                                opacity: 0;
                                transform: translateY(-100%) translateZ(0);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0) translateZ(0);
                            }
                        }
                        
                        .animate-shrink {
                            animation: shrink var(--duration, 5000ms) linear forwards;
                        }
                        
                        .animate-slide-in-right {
                            animation: slide-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        }
                        
                        .animate-slide-in-top {
                            animation: slide-in-top 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
                            will-change: transform;
                        }
                        
                        .transform-gpu {
                            transform: translateZ(0);
                        }
                    `,
                }}
            />
        </>
    );
};

export default ToastContainer;