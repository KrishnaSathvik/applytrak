import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
import {cn} from '../../utils/helpers';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
    className?: string;
    footer?: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    fullscreenOnMobile?: boolean;
}

const SIZE_CLASSES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    fullscreen: 'w-full h-full max-w-none max-h-none',
} as const;

const VARIANT_CLASSES = {
    primary: 'border-t-4 border-t-blue-500 dark:border-t-blue-400',
    success: 'border-t-4 border-t-green-500 dark:border-t-green-400',
    warning: 'border-t-4 border-t-yellow-500 dark:border-t-yellow-400',
    error: 'border-t-4 border-t-red-500 dark:border-t-red-400',
    default: '',
} as const;

const HEADER_BACKGROUNDS = {
    primary: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    warning: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
    error: 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
    default: 'bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20',
} as const;

export const Modal: React.FC<ModalProps> = ({
                                                isOpen,
                                                onClose,
                                                title,
                                                children,
                                                size = 'md',
                                                className,
                                                footer,
                                                variant = 'default',
                                                closeOnBackdropClick = true,
                                                closeOnEscape = true,
                                                fullscreenOnMobile = false,
                                            }) => {

    // Use ref to track if this is the initial open
    const initialOpenRef = useRef(false);

    // Handle keyboard events
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && closeOnEscape && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';

            // FIXED: Only focus modal on initial open, not on re-renders
            if (!initialOpenRef.current) {
                initialOpenRef.current = true;

                // Small delay to ensure modal is fully rendered
                setTimeout(() => {
                    const modalElement = document.querySelector('[role="dialog"]') as HTMLElement;
                    if (modalElement) {
                        modalElement.focus();
                    }
                }, 50);
            }
        } else {
            // Reset when modal closes
            initialOpenRef.current = false;
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            if (!isOpen) {
                document.body.style.overflow = 'unset';
            }
        };
    }, [isOpen, onClose, closeOnEscape]);

    // Memoized style calculations
    const variantClasses = useMemo(() => VARIANT_CLASSES[variant], [variant]);
    const headerBackground = useMemo(() => HEADER_BACKGROUNDS[variant], [variant]);
    const sizeClass = useMemo(() => SIZE_CLASSES[size], [size]);

    // Event handlers
    const handleBackdropClick = useCallback((event: React.MouseEvent) => {
        if (event.target === event.currentTarget && closeOnBackdropClick) {
            onClose();
        }
    }, [onClose, closeOnBackdropClick]);

    const handleModalClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
    }, []);

    const handleCloseClick = useCallback(() => {
        onClose();
    }, [onClose]);

    // Early return if not open
    if (!isOpen) {
        return null;
    }

    // Render modal content
    const modalContent = (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Modal container */}
            <div
                className={cn(
                    "flex min-h-full items-center justify-center",
                    fullscreenOnMobile ? "md:p-4" : "p-4"
                )}
                onClick={handleBackdropClick}
            >
                <div
                    className={cn(
                        'relative w-full glass-card shadow-2xl transform transition-all duration-300 scale-100',
                        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
                        fullscreenOnMobile ? 'md:rounded-xl' : 'rounded-xl',
                        fullscreenOnMobile && 'w-full h-full md:w-auto md:h-auto',
                        sizeClass,
                        variantClasses,
                        className
                    )}
                    onClick={handleModalClick}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                    tabIndex={-1}
                >
                    {/* Header */}
                    {title && (
                        <div
                            className={cn(
                                'flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50',
                                fullscreenOnMobile ? 'p-4 md:p-6 md:rounded-t-xl' : 'p-6 rounded-t-xl',
                                headerBackground
                            )}
                        >
                            <h3
                                id="modal-title"
                                className="text-xl font-bold text-gradient-static tracking-tight text-gray-900 dark:text-gray-100"
                            >
                                {title}
                            </h3>
                            <button
                                onClick={handleCloseClick}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label="Close modal"
                                type="button"
                            >
                                <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200"/>
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className={cn(
                        "text-gray-900 dark:text-gray-100",
                        fullscreenOnMobile ? "p-4 md:p-6 flex-1 overflow-y-auto" : "p-6"
                    )}>
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div
                            className={cn(
                                "flex items-center justify-end gap-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/20",
                                fullscreenOnMobile ? "p-4 md:p-6 md:rounded-b-xl" : "p-6 rounded-b-xl"
                            )}>
                            {footer}
                        </div>
                    )}

                    {/* Close button for headerless modals */}
                    {!title && (
                        <button
                            onClick={handleCloseClick}
                            className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 group z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Close modal"
                            type="button"
                        >
                            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // Use portal to render modal at document root level
    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null;
};