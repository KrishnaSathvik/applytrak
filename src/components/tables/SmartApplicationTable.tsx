// src/components/tables/SmartApplicationTable.tsx - ENHANCED TYPOGRAPHY VERSION
// This component automatically chooses the best table based on data size
import React, {memo, useMemo} from 'react';
import {useAppStore} from '../../store/useAppStore';

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
    const {filteredApplications} = useAppStore();

    // Determine which table component to use
    const {shouldUseVirtualization, TableComponent} = useMemo(() => {
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
                <div
                    className="glass-subtle rounded-lg p-3 border border-yellow-200/50 dark:border-yellow-700/50 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">📊</span>
                        <div>
                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 tracking-wide">
                                Performance Mode: <span
                                className="font-extrabold text-gradient-blue">{shouldUseVirtualization ? 'Virtualized' : 'Standard'}</span> Table
                            </p>
                            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 tracking-wider">
                                Processing <span
                                className="font-bold text-gradient-purple">{filteredApplications.length}</span> applications
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <React.Suspense
                fallback={
                    <div className="space-y-4 animate-pulse">
                        {/* Enhanced loading header */}
                        <div
                            className="glass-subtle rounded-lg p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 to-blue-900/20">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg animate-pulse"></div>
                                <div className="space-y-2 flex-1">
                                    <div
                                        className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-md animate-pulse"></div>
                                    <div
                                        className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced loading rows */}
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i}
                                     className="glass-subtle rounded-xl p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl animate-pulse shadow-lg"></div>
                                        <div className="space-y-2 flex-1">
                                            <div
                                                className="h-4 bg-gradient-to-r from-gray-200 to-blue-200 dark:from-gray-600 dark:to-blue-700 rounded-md animate-pulse"></div>
                                            <div
                                                className="h-3 bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-700 dark:to-blue-800 rounded-md w-3/4 animate-pulse"></div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <div
                                                className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg animate-pulse"></div>
                                            <div
                                                className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Enhanced loading footer */}
                        <div
                            className="glass-subtle rounded-lg p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                            <div className="flex items-center justify-center space-x-2">
                                <div
                                    className="w-4 h-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full animate-pulse"></div>
                                <div
                                    className="h-3 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-700 dark:to-purple-700 rounded-md w-32 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                }
            >
                <TableComponent/>
            </React.Suspense>
        </div>
    );
});

SmartApplicationTable.displayName = 'SmartApplicationTable';

export default SmartApplicationTable;