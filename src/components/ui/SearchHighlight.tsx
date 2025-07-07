// src/components/ui/SearchHighlight.tsx - ENHANCED TYPOGRAPHY VERSION
import React, { memo, useMemo } from 'react';

interface SearchHighlightProps {
    text: string;
    searchQuery: string;
    className?: string;
    highlightClassName?: string;
    variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

const SearchHighlight: React.FC<SearchHighlightProps> = memo(({
                                                                  text,
                                                                  searchQuery,
                                                                  className = '',
                                                                  highlightClassName,
                                                                  variant = 'default'
                                                              }) => {
    // OPTIMIZATION 1: Memoize expensive regex operations
    const highlightedText = useMemo(() => {
        // Early return for empty search
        if (!searchQuery?.trim() || !text) {
            return <span className={`font-medium tracking-normal ${className}`}>{text}</span>;
        }

        try {
            // OPTIMIZATION 2: Cache regex and escape special characters
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');

            // OPTIMIZATION 3: Split only once and process
            const parts = text.split(regex);

            // Enhanced highlight styling based on variant
            const getHighlightClasses = () => {
                if (highlightClassName) return highlightClassName;

                switch (variant) {
                    case 'primary':
                        return 'bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 text-blue-900 dark:text-blue-100 font-bold tracking-wide px-1.5 py-0.5 rounded-md shadow-sm';
                    case 'secondary':
                        return 'bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 text-purple-900 dark:text-purple-100 font-bold tracking-wide px-1.5 py-0.5 rounded-md shadow-sm';
                    case 'accent':
                        return 'bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 text-green-900 dark:text-green-100 font-bold tracking-wide px-1.5 py-0.5 rounded-md shadow-sm';
                    default:
                        return 'bg-gradient-to-r from-yellow-200 to-amber-200 dark:from-yellow-800 dark:to-amber-800 text-yellow-900 dark:text-yellow-100 font-bold tracking-wide px-1.5 py-0.5 rounded-md shadow-sm';
                }
            };

            const highlightClasses = getHighlightClasses();

            // OPTIMIZATION 4: Use key-based rendering for better React performance
            return (
                <span className={`font-medium tracking-normal leading-relaxed ${className}`}>
                    {parts.map((part, index) => {
                        const isMatch = regex.test(part);

                        // Reset regex lastIndex to avoid issues with global flag
                        regex.lastIndex = 0;

                        return isMatch ? (
                            <mark
                                key={`highlight-${index}-${part}`}
                                className={highlightClasses}
                                style={{ backgroundColor: 'transparent' }} // Override default mark styles
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
            // Fallback for invalid regex with enhanced typography
            console.warn('SearchHighlight regex error:', error);
            return <span className={`font-medium tracking-normal ${className}`}>{text}</span>;
        }
    }, [text, searchQuery, className, highlightClassName, variant]);

    return highlightedText;
}, (prevProps, nextProps) => {
    // OPTIMIZATION 5: Custom comparison for better memoization
    return (
        prevProps.text === nextProps.text &&
        prevProps.searchQuery === nextProps.searchQuery &&
        prevProps.className === nextProps.className &&
        prevProps.highlightClassName === nextProps.highlightClassName &&
        prevProps.variant === nextProps.variant
    );
});

SearchHighlight.displayName = 'SearchHighlight';

export default SearchHighlight;