// src/components/tables/SmartApplicationTable.tsx
// This component automatically chooses the best table based on data size
import React, { memo, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

// Dynamic imports for better performance
const ApplicationTable = React.lazy(() => import('./ApplicationTable'));
const VirtualizedApplicationTable = React.lazy(() => import('./VirtualizedApplicationTable'));

// Threshold for switching to virtual scrolling
const VIRTUALIZATION_THRESHOLD = 50;

interface SmartApplicationTableProps {
    forceVirtualization?: boolean;
    virtualizationThreshold?: number;
}

const SmartApplicationTable: React.FC<SmartApplicationTableProps> = memo(({
                                                                              forceVirtualization = false,
                                                                              virtualizationThreshold = VIRTUALIZATION_THRESHOLD
                                                                          }) => {
    const { filteredApplications } = useAppStore();

    // Determine which table component to use
    const { shouldUseVirtualization, TableComponent } = useMemo(() => {
        const shouldVirtualize = forceVirtualization || filteredApplications.length > virtualizationThreshold;

        return {
            shouldUseVirtualization: shouldVirtualize,
            TableComponent: shouldVirtualize ? VirtualizedApplicationTable : ApplicationTable
        };
    }, [filteredApplications.length, forceVirtualization, virtualizationThreshold]);

    // Show performance info in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Table Performance Info:
      Applications: ${filteredApplications.length}
      Using: ${shouldUseVirtualization ? 'VirtualizedTable' : 'StandardTable'}
      Threshold: ${virtualizationThreshold}
      Force Virtualization: ${forceVirtualization}
    `);
    }

    return (
        <div className="space-y-4">
            {/* Performance indicator in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    📊 Using {shouldUseVirtualization ? 'Virtualized' : 'Standard'} table
                    ({filteredApplications.length} applications)
                </div>
            )}

            <React.Suspense
                fallback={
                    <div className="space-y-4 animate-pulse">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
                            ))}
                        </div>
                    </div>
                }
            >
                <TableComponent />
            </React.Suspense>
        </div>
    );
});

SmartApplicationTable.displayName = 'SmartApplicationTable';

export default SmartApplicationTable;