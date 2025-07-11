// src/components/ui/Modal.tsx - FIXED VERSION WITH PROPER Z-INDEX
import React, {useEffect} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
import {cn} from '../../utils/helpers';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    footer?: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export const Modal: React.FC<ModalProps> = ({
                                                isOpen,
                                                onClose,
                                                title,
                                                children,
                                                size = 'md',
                                                className,
                                                footer,
                                                variant = 'default'
                                            }) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    const getVariantClasses = () => {
        switch (variant) {
            case 'primary':
                return 'border-t-4 border-t-blue-500 dark:border-t-blue-400';
            case 'success':
                return 'border-t-4 border-t-green-500 dark:border-t-green-400';
            case 'warning':
                return 'border-t-4 border-t-yellow-500 dark:border-t-yellow-400';
            case 'error':
                return 'border-t-4 border-t-red-500 dark:border-t-red-400';
            default:
                return '';
        }
    };

    const getHeaderBackground = () => {
        switch (variant) {
            case 'primary':
                return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
            case 'success':
                return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
            case 'warning':
                return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20';
            case 'error':
                return 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20';
            default:
                return 'bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20';
        }
    };

    // 🔧 FIXED: Render modal content
    const modalContent = (
        /* 🔧 FIXED: Increased z-index to be above header (z-header = 400) */
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* 🔧 FIXED: Enhanced Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
            />

            {/* 🔧 FIXED: Modal positioned above all content */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={cn(
                    'relative w-full glass-card shadow-2xl transform transition-all duration-300 scale-100',
                    'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
                    sizeClasses[size],
                    getVariantClasses(),
                    className
                )}>
                    {/* Enhanced Header */}
                    {title && (
                        <div className={cn(
                            'flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50',
                            getHeaderBackground()
                        )}>
                            <h3 className="text-xl font-bold text-gradient-static tracking-tight">
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
                                aria-label="Close modal"
                            >
                                <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200"/>
                            </button>
                        </div>
                    )}

                    {/* Enhanced Content */}
                    <div className="p-6 text-gray-900 dark:text-gray-100">
                        {children}
                    </div>

                    {/* Enhanced Footer */}
                    {footer && (
                        <div
                            className="flex items-center justify-end gap-3 p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-b-xl">
                            {footer}
                        </div>
                    )}

                    {/* No header close button for headerless modals */}
                    {!title && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 group z-10"
                            aria-label="Close modal"
                        >
                            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // 🔧 FIXED: Use portal to render modal at document root level
    // This ensures modal appears above header regardless of component tree position
    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null;
};