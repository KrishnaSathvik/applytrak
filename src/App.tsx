// src/App.tsx - MOBILE RESPONSIVE FIXED
import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/ui/LoadingScreen';
import { setupAutoBackup } from './utils/backup';
import { useJobTrackerShortcuts } from './hooks/useKeyboardShortcuts';
import { Application } from './types';
import './styles/globals.css';

// Lazy load components for better performance
const ApplicationForm = React.lazy(() => import('./components/forms/ApplicationForm'));
const PaginatedApplicationTable = React.lazy(() => import('./components/tables/PaginatedApplicationTable'));
const GoalTracker = React.lazy(() => import('./components/ui/GoalTracker'));
const AnalyticsDashboard = React.lazy(() => import('./components/charts/AnalyticsDashboard'));
const EditApplicationModal = React.lazy(() => import('./components/modals/EditApplicationModal'));
const GoalModal = React.lazy(() => import('./components/modals/GoalModal'));
const MilestoneModal = React.lazy(() => import('./components/modals/MilestoneModal'));
const RecoveryModal = React.lazy(() => import('./components/modals/RecoveryModal'));
const ExportImportActions = React.lazy(() => import('./components/ui/ExportImportActions'));
const RecoveryAlert = React.lazy(() => import('./components/ui/RecoveryAlert'));
const ErrorBoundary = React.lazy(() => import('./components/ui/ErrorBoundary'));

// Enhanced loading component for paginated table - MOBILE OPTIMIZED
const PaginatedTableLoadingFallback = () => (
    <div className="glass-card">
        <div className="space-y-4 animate-pulse">
            {/* Search and tabs skeleton - MOBILE STACK */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-64"></div>
                <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 sm:w-32"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 sm:w-32"></div>
                </div>
            </div>

            {/* Results summary skeleton */}
            <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-48"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32"></div>
            </div>

            {/* Mobile vs Desktop Table skeleton */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Desktop table view */}
                <div className="hidden sm:block">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
                        <div className="flex gap-4">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-0">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                                <div className="flex gap-4 items-center">
                                    {[...Array(7)].map((_, j) => (
                                        <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile card view */}
                <div className="sm:hidden space-y-3 p-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination skeleton - MOBILE RESPONSIVE */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-48"></div>
                <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Enhanced TrackerTab - MOBILE OPTIMIZED
const TrackerTab: React.FC = () => {
    const { applications, bulkAddApplications } = useAppStore();

    const handleImportApplications = async (importedApplications: Application[]) => {
        try {
            if (!Array.isArray(importedApplications) || importedApplications.length === 0) {
                throw new Error('No valid applications found in the import file');
            }

            const applicationsToAdd = importedApplications.map(app => {
                const { id, createdAt, updatedAt, ...appData } = app;
                return appData;
            });

            await bulkAddApplications(applicationsToAdd);
        } catch (error) {
            console.error('Import failed:', error);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Hero Section - MOBILE RESPONSIVE */}
            <div className="glass-card bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-primary-600/10 border-2 border-primary-200/30 dark:border-primary-700/30">
                <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">
                            🚀 Application Tracker
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                            Keep your job search on track with ApplyTrak
                        </p>

                        {/* Stats - MOBILE GRID */}
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 pt-2">
                            <span className="flex items-center gap-1">
                                📊 {applications.length} Apps
                            </span>
                            <span className="flex items-center gap-1">
                                📄 15/Page
                            </span>
                            <span className="flex items-center gap-1">
                                ⚡ Fast Nav
                            </span>
                            <span className="flex items-center gap-1">
                                🎯 Goals
                            </span>
                        </div>
                    </div>

                    {/* Export/Import Actions - MOBILE RESPONSIVE */}
                    <div className="flex-shrink-0">
                        <React.Suspense
                            fallback={<div className="h-10 sm:h-12 w-full sm:w-48 skeleton rounded-xl" />}
                        >
                            <ExportImportActions
                                applications={applications}
                                onImport={handleImportApplications}
                            />
                        </React.Suspense>
                    </div>
                </div>
            </div>

            {/* Recovery Alert */}
            <React.Suspense fallback={null}>
                <RecoveryAlert />
            </React.Suspense>

            {/* Goal Tracking - MOBILE RESPONSIVE */}
            <React.Suspense fallback={<div className="skeleton h-40 sm:h-48 rounded-2xl" />}>
                <GoalTracker />
            </React.Suspense>

            {/* Application Form - MOBILE RESPONSIVE */}
            <React.Suspense fallback={<div className="skeleton h-80 sm:h-96 rounded-2xl" />}>
                <ApplicationForm />
            </React.Suspense>

            {/* Paginated Application Table - MOBILE RESPONSIVE */}
            <React.Suspense fallback={<PaginatedTableLoadingFallback />}>
                <PaginatedApplicationTable />
            </React.Suspense>
        </div>
    );
};

// Enhanced AnalyticsTab - MOBILE OPTIMIZED
const AnalyticsTab: React.FC = () => {
    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Hero Section for Analytics - MOBILE RESPONSIVE */}
            <div className="glass-card bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-600/10 border-2 border-blue-200/30 dark:border-blue-700/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">
                            📊 Analytics
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                            Insights about your job search journey
                        </p>

                        {/* Analytics Features - MOBILE GRID */}
                        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 pt-2">
                            <span className="flex items-center gap-1">
                                📈 Success Metrics
                            </span>
                            <span className="flex items-center gap-1">
                                🎯 Performance
                            </span>
                            <span className="flex items-center gap-1">
                                📅 Timeline
                            </span>
                        </div>
                    </div>

                    <div className="glass rounded-full p-3 sm:p-4 self-center sm:self-auto">
                        <span className="text-2xl sm:text-4xl">📊</span>
                    </div>
                </div>
            </div>

            <React.Suspense fallback={<div className="skeleton h-80 sm:h-96 rounded-2xl" />}>
                <AnalyticsDashboard />
            </React.Suspense>
        </div>
    );
};

// Error Screen Component - MOBILE RESPONSIVE
const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4">
        <div className="text-center max-w-sm sm:max-w-md glass-card w-full">
            <div className="text-red-500 text-4xl sm:text-6xl mb-4 sm:mb-6">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                Something went wrong
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="btn btn-primary w-full sm:w-auto"
            >
                Reload Application
            </button>
        </div>
    </div>
);

// Main App Component - MOBILE RESPONSIVE
const App: React.FC = () => {
    const {
        ui,
        applications,
        loadApplications,
        loadGoals,
        setTheme,
        calculateProgress,
        calculateAnalytics
    } = useAppStore();

    // Use keyboard shortcuts
    useJobTrackerShortcuts();

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Theme initialization
                const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const initialTheme = savedTheme || systemTheme;

                setTheme(initialTheme);

                // Apply to DOM immediately
                const isDark = initialTheme === 'dark';
                document.documentElement.classList.toggle('dark', isDark);
                document.body.classList.toggle('dark', isDark);
                document.documentElement.style.colorScheme = initialTheme;

                if (!savedTheme) {
                    localStorage.setItem('theme', initialTheme);
                }

                // Load data
                await Promise.all([
                    loadApplications(),
                    loadGoals()
                ]);

                calculateProgress();
                calculateAnalytics();

                // System theme change listener
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const handleSystemThemeChange = (e: MediaQueryListEvent) => {
                    if (!localStorage.getItem('theme')) {
                        const newTheme = e.matches ? 'dark' : 'light';
                        setTheme(newTheme);
                        document.documentElement.classList.toggle('dark', e.matches);
                        document.body.classList.toggle('dark', e.matches);
                        document.documentElement.style.colorScheme = newTheme;
                    }
                };

                mediaQuery.addEventListener('change', handleSystemThemeChange);

                // Auto-backup setup
                const getApplicationsData = async (): Promise<Application[]> => {
                    return useAppStore.getState().applications;
                };

                const cleanup = setupAutoBackup(getApplicationsData);

                return () => {
                    if (typeof cleanup === 'function') {
                        cleanup();
                    }
                    mediaQuery.removeEventListener('change', handleSystemThemeChange);
                };
            } catch (error) {
                console.error('App initialization failed:', error);
                return undefined;
            }
        };

        const cleanupPromise = initializeApp();

        return () => {
            if (cleanupPromise instanceof Promise) {
                cleanupPromise.then(cleanup => {
                    if (typeof cleanup === 'function') {
                        cleanup();
                    }
                });
            }
        };
    }, [loadApplications, loadGoals, setTheme, calculateProgress, calculateAnalytics]);

    // Loading state
    if (ui.isLoading && applications.length === 0) {
        return <LoadingScreen />;
    }

    // Error state
    if (ui.error) {
        return <ErrorScreen error={ui.error} />;
    }

    return (
        <React.Suspense fallback={<LoadingScreen />}>
            <ErrorBoundary>
                <div className="min-h-screen bg-grid dark:bg-grid-dark">
                    <Layout>
                        {/* Main Content Based on Selected Tab */}
                        {ui.selectedTab === 'tracker' && <TrackerTab />}
                        {ui.selectedTab === 'analytics' && <AnalyticsTab />}

                        {/* Global Modals */}
                        <React.Suspense fallback={null}>
                            <EditApplicationModal />
                            <GoalModal />
                            <MilestoneModal />
                            <RecoveryModal />
                        </React.Suspense>
                    </Layout>
                </div>
            </ErrorBoundary>
        </React.Suspense>
    );
};

export default App;