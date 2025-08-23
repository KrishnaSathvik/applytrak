import React, {forwardRef} from 'react';
import {cn} from '../../utils/helpers';

// Constants for better maintainability
const ANIMATION_DURATION = 200;
const LOADING_SPINNER_SIZE = 4;

// Type definitions for better type safety
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    children: React.ReactNode;
}

// Style configuration objects
const BASE_CLASSES = [
    'inline-flex items-center justify-center font-bold tracking-wide rounded-lg',
    'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95',
    'shadow-sm hover:shadow-md'
].join(' ');

const VARIANT_STYLES: Record<ButtonVariant, string> = {
    primary: [
        'bg-gradient-to-r from-primary-500 to-primary-600',
        'hover:from-primary-600 hover:to-primary-700',
        'text-white focus:ring-primary-500 shadow-primary-500/25',
        'disabled:hover:from-primary-500 disabled:hover:to-primary-600'
    ].join(' '),

    secondary: [
        'bg-gradient-to-r from-gray-500 to-gray-600',
        'hover:from-gray-600 hover:to-gray-700',
        'text-white focus:ring-gray-500 shadow-gray-500/25',
        'disabled:hover:from-gray-500 disabled:hover:to-gray-600'
    ].join(' '),

    outline: [
        'border-2 border-primary-300 dark:border-primary-600',
        'bg-white dark:bg-gray-800',
        'hover:bg-primary-50 dark:hover:bg-primary-900/20',
        'text-primary-700 dark:text-primary-300 focus:ring-primary-500',
        'hover:border-primary-400 dark:hover:border-primary-500',
        'disabled:hover:bg-white dark:disabled:hover:bg-gray-800',
        'disabled:hover:border-primary-300 dark:disabled:hover:border-primary-600'
    ].join(' '),

    ghost: [
        'text-gray-700 dark:text-gray-300',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:ring-primary-500 shadow-none hover:shadow-sm',
        'disabled:hover:bg-transparent'
    ].join(' '),

    danger: [
        'bg-gradient-to-r from-red-500 to-red-600',
        'hover:from-red-600 hover:to-red-700',
        'text-white focus:ring-red-500 shadow-red-500/25',
        'disabled:hover:from-red-500 disabled:hover:to-red-600'
    ].join(' '),

    success: [
        'bg-gradient-to-r from-green-500 to-green-600',
        'hover:from-green-600 hover:to-green-700',
        'text-white focus:ring-green-500 shadow-green-500/25',
        'disabled:hover:from-green-500 disabled:hover:to-green-600'
    ].join(' '),

    warning: [
        'bg-gradient-to-r from-yellow-500 to-yellow-600',
        'hover:from-yellow-600 hover:to-yellow-700',
        'text-white focus:ring-yellow-500 shadow-yellow-500/25',
        'disabled:hover:from-yellow-500 disabled:hover:to-yellow-600'
    ].join(' '),

    gradient: [
        'bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500',
        'hover:from-primary-600 hover:via-purple-600 hover:to-secondary-600',
        'text-white focus:ring-primary-500 shadow-primary-500/25',
        'text-shadow-sm',
        'disabled:hover:from-primary-500 disabled:hover:via-purple-500 disabled:hover:to-secondary-500'
    ].join(' ')
};

const SIZE_STYLES: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs font-semibold tracking-wider',
    md: 'px-4 py-2 text-sm font-bold tracking-wide',
    lg: 'px-6 py-3 text-base font-bold tracking-wide',
    xl: 'px-8 py-4 text-lg font-extrabold tracking-wider'
};

// Loading spinner component for reusability
const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({
                                                                             size = LOADING_SPINNER_SIZE,
                                                                             className = ''
                                                                         }) => (
    <svg
        className={cn('animate-spin', className)}
        width={size * 4}
        height={size * 4}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
                                                                      variant = 'primary',
                                                                      size = 'md',
                                                                      loading = false,
                                                                      loadingText = 'Loading...',
                                                                      icon,
                                                                      iconPosition = 'left',
                                                                      fullWidth = false,
                                                                      className,
                                                                      disabled,
                                                                      children,
                                                                      onClick,
                                                                      ...props
                                                                  }, ref) => {
    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Get loading text based on size
    const getLoadingText = () => {
        if (size === 'sm') return 'Loading...';
        if (size === 'xl') return loadingText;
        return loadingText;
    };

    // Handle click events with loading protection
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (loading) {
            event.preventDefault();
            return;
        }
        onClick?.(event);
    };

    // Render icon with proper spacing
    const renderIcon = () => {
        if (!icon || loading) return null;

        const iconClasses = cn(
            'flex-shrink-0',
            children && iconPosition === 'left' && 'mr-2',
            children && iconPosition === 'right' && 'ml-2'
        );

        return <span className={iconClasses}>{icon}</span>;
    };

    // Render loading state
    const renderLoadingState = () => (
        <div className="flex items-center justify-center">
            <LoadingSpinner
                size={size === 'sm' ? 3 : size === 'xl' ? 5 : LOADING_SPINNER_SIZE}
                className="mr-2"
            />
            <span className="font-medium">{getLoadingText()}</span>
        </div>
    );

    // Render button content
    const renderContent = () => {
        if (loading) {
            return renderLoadingState();
        }

        return (
            <>
                {iconPosition === 'left' && renderIcon()}
                {children}
                {iconPosition === 'right' && renderIcon()}
            </>
        );
    };

    return (
        <button
            ref={ref}
            className={cn(
                BASE_CLASSES,
                VARIANT_STYLES[variant],
                SIZE_STYLES[size],
                fullWidth && 'w-full',
                loading && 'cursor-wait',
                isDisabled && 'transform-none hover:scale-100 active:scale-100',
                className
            )}
            disabled={isDisabled}
            onClick={handleClick}
            aria-disabled={isDisabled}
            aria-busy={loading}
            aria-describedby={loading ? `${props.id || 'button'}-loading` : undefined}
            style={{
                transitionDuration: `${ANIMATION_DURATION}ms`,
            }}
            type="button"
            {...props}
        >
            {renderContent()}

            {/* Screen reader loading announcement */}
            {loading && (
                <span
                    id={`${props.id || 'button'}-loading`}
                    className="sr-only"
                    aria-live="polite"
                >
          {getLoadingText()}
        </span>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;