import React, {memo, useMemo} from 'react';

interface SearchHighlightProps {
    text: string;
    searchQuery: string;
    className?: string;
    highlightClassName?: string;
    variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

const VARIANT_STYLES = {
    primary: 'bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 text-blue-900 dark:text-blue-100',
    secondary: 'bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 text-purple-900 dark:text-purple-100',
    accent: 'bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 text-green-900 dark:text-green-100',
    default: 'bg-gradient-to-r from-yellow-200 to-amber-200 dark:from-yellow-800 dark:to-amber-800 text-yellow-900 dark:text-yellow-100',
} as const;

const BASE_HIGHLIGHT_CLASSES = 'font-bold tracking-wide px-1.5 py-0.5 rounded-md shadow-sm';

const SearchHighlight: React.FC<SearchHighlightProps> = memo(
    ({text, searchQuery, className = '', highlightClassName, variant = 'default'}) => {
        const highlightedText = useMemo(() => {
            // Early return for empty search or text
            if (!searchQuery?.trim() || !text) {
                return (
                    <span className={`font-medium tracking-normal ${className}`}>
            {text}
          </span>
                );
            }

            try {
                // Escape special regex characters for safe pattern matching
                const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escapedQuery})`, 'gi');
                const parts = text.split(regex);

                // Get highlight classes based on variant or custom className
                const getHighlightClasses = (): string => {
                    if (highlightClassName) {
                        return highlightClassName;
                    }
                    return `${VARIANT_STYLES[variant]} ${BASE_HIGHLIGHT_CLASSES}`;
                };

                const highlightClasses = getHighlightClasses();

                return (
                    <span className={`font-medium tracking-normal leading-relaxed ${className}`}>
            {parts.map((part, index) => {
                const isMatch = regex.test(part);

                // Reset regex lastIndex to avoid global flag issues
                regex.lastIndex = 0;

                return isMatch ? (
                    <mark
                        key={`highlight-${index}-${part}`}
                        className={highlightClasses}
                        style={{backgroundColor: 'transparent'}}
                    >
                        {part}
                    </mark>
                ) : (
                    <React.Fragment key={`text-${index}-${part}`}>
                        {part}
                    </React.Fragment>
                );
            })}
          </span>
                );
            } catch (error) {
                // Graceful fallback for invalid regex patterns
                console.warn('SearchHighlight: Invalid regex pattern', {searchQuery, error});
                return (
                    <span className={`font-medium tracking-normal ${className}`}>
            {text}
          </span>
                );
            }
        }, [text, searchQuery, className, highlightClassName, variant]);

        return highlightedText;
    },
    // Custom equality check for optimal re-rendering
    (prevProps, nextProps) => {
        return (
            prevProps.text === nextProps.text &&
            prevProps.searchQuery === nextProps.searchQuery &&
            prevProps.className === nextProps.className &&
            prevProps.highlightClassName === nextProps.highlightClassName &&
            prevProps.variant === nextProps.variant
        );
    }
);

SearchHighlight.displayName = 'SearchHighlight';

export default SearchHighlight;