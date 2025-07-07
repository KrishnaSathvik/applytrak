// src/components/ui/Button.tsx - Enhanced Typography Version
import React from 'react';
import {cn} from '../../utils/helpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'gradient';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
                                                  variant = 'primary',
                                                  size = 'md',
                                                  loading = false,
                                                  className,
                                                  disabled,
                                                  children,
                                                  ...props
                                              }) => {
    const baseClasses = 'inline-flex items-center justify-center font-bold tracking-wide rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md';

    const variants = {
        primary: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white focus:ring-primary-500 shadow-primary-500/25',
        secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white focus:ring-gray-500 shadow-gray-500/25',
        outline: 'border-2 border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-700 dark:text-primary-300 focus:ring-primary-500 hover:border-primary-400 dark:hover:border-primary-500',
        ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-primary-500 shadow-none hover:shadow-sm',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500 shadow-red-500/25',
        success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white focus:ring-green-500 shadow-green-500/25',
        warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white focus:ring-yellow-500 shadow-yellow-500/25',
        gradient: 'bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 hover:from-primary-600 hover:via-purple-600 hover:to-secondary-600 text-white focus:ring-primary-500 shadow-primary-500/25 text-shadow-sm'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs font-semibold tracking-wider',
        md: 'px-4 py-2 text-sm font-bold tracking-wide',
        lg: 'px-6 py-3 text-base font-bold tracking-wide',
        xl: 'px-8 py-4 text-lg font-extrabold tracking-wider'
    };

    return (
        <button
            className={cn(
                baseClasses,
                variants[variant],
                sizes[size],
                loading && 'cursor-wait',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium">Loading...</span>
                </div>
            )}
            {!loading && children}
        </button>
    );
};

export default Button;