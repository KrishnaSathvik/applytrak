// src/components/tables/SmartApplicationTable.tsx
// Production-ready smart table that automatically chooses optimal rendering strategy
import React, {memo, Suspense, useMemo} from 'react';
import {useAppStore} from '../../store/useAppStore';
import ErrorBoundary from '../ui/ErrorBoundary';

// Dynamic imports for code splitting and performance
const ApplicationTable = React.lazy(() => import('./ApplicationTable'));
const VirtualizedApplicationTable = React.lazy(() => import('./VirtualizedApplicationTable'));

// Configuration constants
const DEFAULT_VIRTUALIZATION_THRESHOLD = 50;
const LOADING_SKELETON_ROWS = 5;

interface SmartApplicationTableProps {
    forceVirtualization?: boolean;
    virtualizationThreshold?: number;
    className?: string;
    testId?: string;
}

interface TableDecision {
    shouldUseVirtualization: boolean;
    TableComponent: React.LazyExoticComponent<React.ComponentType<any>>;
    reason: string;
}

const SmartApplicationTable: React.FC<SmartApplicationTableProps> = memo(({
                                                                              forceVirtualization = false,
                                                                              virtualizationThreshold = DEFAULT_VIRTUALIZATION_THRESHOLD,
                                                                              className = '',
                                                                              testId = 'smart-application-table'
                                                                          }) => {
    const {filteredApplications} = useAppStore();

    // Determine optimal table component with reasoning
    const tableDecision = useMemo((): TableDecision => {
        const applicationCount = filteredApplications.length;
        const shouldVirtualize = forceVirtualization || applicationCount > virtualizationThreshold;

        return {
            shouldUseVirtualization: shouldVirtualize,
            TableComponent: shouldVirtualize ? VirtualizedApplicationTable : ApplicationTable,
            reason: shouldVirtualize
                ? forceVirtualization
                    ? 'Forced virtualization enabled'
                    : `Application count (${applicationCount}) exceeds threshold (${virtualizationThreshold})`
                : `Application count (${applicationCount}) below threshold (${virtualizationThreshold})`
        };
    }, [filteredApplications.length, forceVirtualization, virtualizationThreshold]);

    // Development logging with performance insights
    const logPerformanceInfo = useMemo(() => {
        if (process.env.NODE_ENV === 'development') {
            const performanceData = {
                applicationCount: filteredApplications.length,
                tableType: tableDecision.shouldUseVirtualization ? 'Virtualized' : 'Standard',
                threshold: virtualizationThreshold,
                forced: forceVirtualization,
                reason: tableDecision.reason,
                memoryEstimate: filteredApplications.length * 0.5 + 'KB' // Rough estimate
            };

            console.group('📊 Smart Table Performance Analysis');
            console.table(performanceData);
            console.groupEnd();
        }
    }, [
        filteredApplications.length,
        tableDecision.shouldUseVirtualization,
        tableDecision.reason,
        virtualizationThreshold,
        forceVirtualization
    ]);

    const {TableComponent, shouldUseVirtualization} = tableDecision;

    return (
        <div className={`smart-application-table ${className}`} data-testid={testId}>
            {/* Development Performance Indicator */}
            {process.env.NODE_ENV === 'development' && (
                <DevelopmentPerformanceIndicator
                    shouldUseVirtualization={shouldUseVirtualization}
                    applicationCount={filteredApplications.length}
                    reason={tableDecision.reason}
                />
            )}

            {/* Error Boundary for table components */}
            <ErrorBoundary
                fallback={<TableErrorFallback/>}
                onError={(error, errorInfo) => {
                    console.error('Smart Table Error:', error, errorInfo);
                    // You might want to send this to your error tracking service
                }}
            >
                <Suspense fallback={<TableLoadingSkeleton/>}>
                    <TableComponent/>
                </Suspense>
            </ErrorBoundary>
        </div>
    );
});

// Development performance indicator component
interface PerformanceIndicatorProps {
    shouldUseVirtualization: boolean;
    applicationCount: number;
    reason: string;
}

const DevelopmentPerformanceIndicator: React.FC<PerformanceIndicatorProps> = memo(({
                                                                                       shouldUseVirtualization,
                                                                                       applicationCount,
                                                                                       reason
                                                                                   }) => (
    <div
        className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-lg">
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
                <span className="text-xl" role="img" aria-label="Performance indicator">📊</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
            Performance Mode:
          </span>
                    <span className={`text-sm font-extrabold ${
                        shouldUseVirtualization
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-green-600 dark:text-green-400'
                    }`}>
            {shouldUseVirtualization ? 'Virtualized' : 'Standard'} Table
          </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
            Processing
          </span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            {applicationCount}
          </span>
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
            applications
          </span>
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {reason}
                </div>
            </div>
        </div>
    </div>
));

// Enhanced loading skeleton with better visual feedback
const TableLoadingSkeleton: React.FC = memo(() => (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Loading table">
        {/* Header skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg animate-pulse"/>
                <div className="space-y-2 flex-1">
                    <div
                        className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-md"/>
                    <div
                        className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md w-2/3"/>
                </div>
            </div>
        </div>

        {/* Rows skeleton */}
        <div className="space-y-3">
            {Array.from({length: LOADING_SKELETON_ROWS}, (_, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                    <div className="flex items-center space-x-4">
                        <div
                            className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl animate-pulse shadow-lg"/>
                        <div className="space-y-2 flex-1">
                            <div
                                className="h-4 bg-gradient-to-r from-gray-200 to-blue-200 dark:from-gray-600 dark:to-blue-700 rounded-md"/>
                            <div
                                className="h-3 bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-700 dark:to-blue-800 rounded-md w-3/4"/>
                        </div>
                        <div className="flex space-x-2">
                            <div
                                className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg animate-pulse"/>
                            <div
                                className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg animate-pulse"/>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Footer skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full animate-pulse"/>
                <div
                    className="h-3 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-700 dark:to-purple-700 rounded-md w-32"/>
            </div>
        </div>

        {/* Screen reader text */}
        <span className="sr-only">Loading application table...</span>
    </div>
));

// Error fallback component
const TableErrorFallback: React.FC = memo(() => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-8">
        <div className="text-center">
            <div
                className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl" role="img" aria-label="Error">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Unable to Load Table
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                There was an error loading the application table. Please try refreshing the page.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
                Refresh Page
            </button>
        </div>
    </div>
));

// Set display names for better debugging
SmartApplicationTable.displayName = 'SmartApplicationTable';
DevelopmentPerformanceIndicator.displayName = 'DevelopmentPerformanceIndicator';
TableLoadingSkeleton.displayName = 'TableLoadingSkeleton';
TableErrorFallback.displayName = 'TableErrorFallback';

export default SmartApplicationTable;