// src/components/ui/SearchHighlight.tsx - OPTIMIZED VERSION
import React, { memo, useMemo } from 'react';

interface SearchHighlightProps {
    text: string;
    searchQuery: string;
    className?: string;
}

const SearchHighlight: React.FC<SearchHighlightProps> = memo(({
                                                                  text,
                                                                  searchQuery,
                                                                  className = ''
                                                              }) => {
    // OPTIMIZATION 1: Memoize expensive regex operations
    const highlightedText = useMemo(() => {
        // Early return for empty search
        if (!searchQuery?.trim() || !text) {
            return <span className={className}>{text}</span>;
        }

        try {
            // OPTIMIZATION 2: Cache regex and escape special characters
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');

            // OPTIMIZATION 3: Split only once and process
            const parts = text.split(regex);

            // OPTIMIZATION 4: Use key-based rendering for better React performance
            return (
                <span className={className}>
                    {parts.map((part, index) => {
                        const isMatch = regex.test(part);

                        // Reset regex lastIndex to avoid issues with global flag
                        regex.lastIndex = 0;

                        return isMatch ? (
                            <mark
                                key={`${index}-${part}`}
                                className="bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 px-1 rounded"
                            >
                                {part}
                            </mark>
                        ) : (
                            <React.Fragment key={`${index}-${part}`}>
                                {part}
                            </React.Fragment>
                        );
                    })}
                </span>
            );
        } catch (error) {
            // Fallback for invalid regex
            console.warn('SearchHighlight regex error:', error);
            return <span className={className}>{text}</span>;
        }
    }, [text, searchQuery, className]);

    return highlightedText;
}, (prevProps, nextProps) => {
    // OPTIMIZATION 5: Custom comparison for better memoization
    return (
        prevProps.text === nextProps.text &&
        prevProps.searchQuery === nextProps.searchQuery &&
        prevProps.className === nextProps.className
    );
});

SearchHighlight.displayName = 'SearchHighlight';

export default SearchHighlight;