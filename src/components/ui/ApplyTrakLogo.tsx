import React, {memo, useCallback, useMemo, useState} from 'react';
import logoSvg from '../../favicon.svg';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LogoVariant = 'default' | 'white' | 'dark';

export interface ApplyTrakLogoProps {
    /** Size of the logo - predefined sizes or custom number in pixels */
    size?: LogoSize | number;
    /** Additional CSS classes for the container */
    className?: string;
    /** Whether to show the "ApplyTrak" text next to the logo */
    showText?: boolean;
    /** Additional CSS classes for the text */
    textClassName?: string;
    /** Color variant for the text */
    variant?: LogoVariant;
    /** Whether to prioritize loading (eager vs lazy) */
    priority?: boolean;
    /** Click handler for the logo */
    onClick?: () => void;
    /** Whether the logo should be clickable/interactive */
    interactive?: boolean;
    /** Custom alt text for the logo */
    alt?: string;
    /** Whether to disable console logging */
    quiet?: boolean;
    /** Custom ARIA label for interactive logos */
    ariaLabel?: string;
    /** Whether to show loading state */
    showLoadingState?: boolean;
    /** Fallback image URL if SVG fails to load */
    fallbackSrc?: string;
    /** Whether to disable dragging */
    draggable?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_MAP: Record<LogoSize, { class: string; pixels: number }> = {
    xs: {class: 'w-4 h-4', pixels: 16},
    sm: {class: 'w-6 h-6', pixels: 24},
    md: {class: 'w-8 h-8', pixels: 32},
    lg: {class: 'w-12 h-12', pixels: 48},
    xl: {class: 'w-16 h-16', pixels: 64}
} as const;

const VARIANT_CLASSES: Record<LogoVariant, string> = {
    default: 'text-gray-900 dark:text-gray-100',
    white: 'text-white',
    dark: 'text-gray-900'
} as const;

const DEFAULT_ALT_TEXT = 'ApplyTrak Logo';
const BRAND_NAME = 'ApplyTrak';

// Animation and transition classes
const ANIMATION_CLASSES = {
    container: 'transition-all duration-200 ease-out',
    interactive: 'cursor-pointer hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm',
    logo: 'transition-all duration-300 ease-out',
    text: 'transition-colors duration-200'
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const buildClassName = (...classes: (string | boolean | undefined)[]): string => {
    return classes.filter(Boolean).join(' ');
};

const getTextSize = (logoSize: LogoSize | number): string => {
    if (typeof logoSize === 'number') {
        if (logoSize <= 16) return 'text-xs';
        if (logoSize <= 24) return 'text-sm';
        if (logoSize <= 32) return 'text-base';
        if (logoSize <= 48) return 'text-lg';
        return 'text-xl';
    }

    const textSizes: Record<LogoSize, string> = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    return textSizes[logoSize] || 'text-base';
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ApplyTrak Logo component with customizable size, variant, and text display
 * Supports both predefined sizes and custom pixel values
 * Includes accessibility features and interactive capabilities
 */
const ApplyTrakLogo: React.FC<ApplyTrakLogoProps> = memo(({
                                                              size = 'md',
                                                              className = '',
                                                              showText = false,
                                                              textClassName = '',
                                                              variant = 'default',
                                                              priority = false,
                                                              onClick,
                                                              interactive = false,
                                                              alt = DEFAULT_ALT_TEXT,
                                                              quiet = false,
                                                              ariaLabel,
                                                              showLoadingState = false,
                                                              fallbackSrc,
                                                              draggable = false
                                                          }) => {
    // ============================================================================
    // STATE
    // ============================================================================

    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================

    const isCustomSize = typeof size === 'number';
    const sizeConfig = isCustomSize ? null : SIZE_MAP[size] || SIZE_MAP.md;
    const sizeClasses = sizeConfig?.class || '';
    const pixelSize = isCustomSize ? size as number : sizeConfig?.pixels || 32;

    const inlineStyle = useMemo(() => ({
        ...(isCustomSize && {width: pixelSize, height: pixelSize}),
        objectFit: 'contain' as const,
        objectPosition: 'center' as const
    }), [isCustomSize, pixelSize]);

    const textColorClass = VARIANT_CLASSES[variant];
    const textSizeClass = getTextSize(size);

    // Determine the image source with fallback logic
    const imageSrc = useMemo(() => {
        if (hasError && fallbackSrc) {
            return fallbackSrc;
        }
        return logoSvg;
    }, [hasError, fallbackSrc]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        if (!quiet) {
            console.warn('ApplyTrak logo failed to load:', e);
        }

        setHasError(true);
        setIsLoading(false);

        // Retry logic for transient failures
        if (retryCount < 2 && !fallbackSrc) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setHasError(false);
                const img = e.target as HTMLImageElement;
                img.src = `${logoSvg}?retry=${retryCount + 1}`;
            }, 1000 * (retryCount + 1));
        }
    }, [quiet, retryCount, fallbackSrc]);

    const handleLoad = useCallback(() => {
        if (!quiet) {
            console.log('ApplyTrak logo loaded successfully');
        }
        setIsLoading(false);
        setHasError(false);
        setRetryCount(0);
    }, [quiet]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!interactive || !onClick) return;

        e.preventDefault();
        onClick();
    }, [interactive, onClick]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!interactive || !onClick) return;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    }, [interactive, onClick]);

    // ============================================================================
    // CLASS BUILDERS
    // ============================================================================

    const containerClasses = useMemo(() => buildClassName(
        'flex items-center gap-2',
        ANIMATION_CLASSES.container,
        interactive && ANIMATION_CLASSES.interactive,
        interactive && 'select-none',
        className
    ), [interactive, className]);

    const logoClasses = useMemo(() => buildClassName(
        'flex-shrink-0',
        ANIMATION_CLASSES.logo,
        sizeClasses,
        isLoading && showLoadingState && 'animate-pulse',
        hasError && 'opacity-50'
    ), [sizeClasses, isLoading, showLoadingState, hasError]);

    const textClasses = useMemo(() => buildClassName(
        'font-bold tracking-tight select-none',
        ANIMATION_CLASSES.text,
        textColorClass,
        textSizeClass,
        textClassName
    ), [textColorClass, textSizeClass, textClassName]);

    // ============================================================================
    // ACCESSIBILITY PROPS
    // ============================================================================

    const accessibilityProps = useMemo(() => {
        const props: Record<string, any> = {};

        if (interactive) {
            props.onClick = handleClick;
            props.onKeyDown = handleKeyDown;
            props.tabIndex = 0;
            props.role = 'button';
            props['aria-label'] = ariaLabel || (showText ? `${BRAND_NAME} logo` : alt);
        }

        return props;
    }, [interactive, handleClick, handleKeyDown, ariaLabel, showText, alt]);

    // ============================================================================
    // RENDER HELPERS
    // ============================================================================

    const renderLoadingState = () => {
        if (!isLoading || !showLoadingState) return null;

        return (
            <div
                className={logoClasses}
                style={inlineStyle}
                aria-label="Loading logo"
            >
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/>
            </div>
        );
    };

    const renderErrorState = () => {
        if (!hasError || fallbackSrc) return null;

        return (
            <div
                className={buildClassName(logoClasses, 'bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center')}
                style={inlineStyle}
                aria-label="Logo unavailable"
            >
        <span className="text-gray-400 dark:text-gray-600 text-xs font-bold">
          {pixelSize > 24 ? 'LOGO' : '?'}
        </span>
            </div>
        );
    };

    const renderLogo = () => {
        if (isLoading && showLoadingState) {
            return renderLoadingState();
        }

        if (hasError && !fallbackSrc) {
            return renderErrorState();
        }

        return (
            <img
                src={imageSrc}
                alt={interactive ? '' : alt} // Empty alt for interactive elements to avoid redundant screen reader announcements
                className={logoClasses}
                style={inlineStyle}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onError={handleError}
                onLoad={handleLoad}
                draggable={draggable}
                role={interactive ? 'presentation' : undefined}
            />
        );
    };

    const renderText = () => {
        if (!showText) return null;

        return (
            <span
                className={textClasses}
                aria-hidden={interactive ? 'true' : undefined}
            >
        {BRAND_NAME}
      </span>
        );
    };

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <div
            className={containerClasses}
            {...accessibilityProps}
        >
            {renderLogo()}
            {renderText()}
        </div>
    );
});

// Set display name for debugging
ApplyTrakLogo.displayName = 'ApplyTrakLogo';

export default ApplyTrakLogo;