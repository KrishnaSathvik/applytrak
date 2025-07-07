// src/App.tsx - FIXED: Complete dark theme implementation
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

// Enhanced loading component for paginated table
const PaginatedTableLoadingFallback = () => (
    <div className="glass-card">
        <div className="space-y-4 animate-pulse">
            {/* Search and tabs skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
            </div>

            {/* Results summary skeleton */}
            <div className="flex justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>

            {/* Table skeleton */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
                    <div className="flex gap-4">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
                        ))}
                    </div>
                </div>

                {/* Table rows - Only 15 since it's paginated */}
                <div className="space-y-0">
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                            <div className="flex gap-4 items-center">
                                {[...Array(7)].map((_, j) => (
                                    <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                                ))}
                                <div className="flex gap-1">
                                    {[...Array(4)].map((_, k) => (
                                        <div key={k} className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination skeleton */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="flex gap-2">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Enhanced TrackerTab with pagination info
const TrackerTab: React.FC = () => {
    const { applications, bulkAddApplications } = useAppStore();

    // Enhanced import handler
    const handleImportApplications = async (importedApplications: Application[]) => {
        try {
            if (!Array.isArray(importedApplications) || importedApplications.length === 0) {
                throw new Error('No valid applications found in the import file');
            }

            // Map full applications to the format expected by bulkAddApplications
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
        <div className="space-y-8">
            {/* Hero Section with Enhanced Design */}
            <div className="glass-card bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-primary-600/10 border-2 border-primary-200/30 dark:border-primary-700/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold text-gradient">
                            🚀 Application Tracker
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Manage and track your job applications with pagination and style
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                📊 {applications.length} Applications
                            </span>
                            <span className="flex items-center gap-1">
                                📄 15 Per Page
                            </span>
                            <span className="flex items-center gap-1">
                                ⚡ Fast Navigation
                            </span>
                            <span className="flex items-center gap-1">
                                🎯 Goal Tracking
                            </span>
                        </div>
                    </div>

                    <React.Suspense
                        fallback={<div className="h-12 w-48 skeleton rounded-xl" />}
                    >
                        <ExportImportActions
                            applications={applications}
                            onImport={handleImportApplications}
                        />
                    </React.Suspense>
                </div>
            </div>

            {/* Recovery Alert */}
            <React.Suspense fallback={null}>
                <RecoveryAlert />
            </React.Suspense>

            {/* Goal Tracking */}
            <React.Suspense fallback={<div className="skeleton h-48 rounded-2xl" />}>
                <GoalTracker />
            </React.Suspense>

            {/* Application Form */}
            <React.Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
                <ApplicationForm />
            </React.Suspense>

            {/* Paginated Application Table */}
            <React.Suspense fallback={<PaginatedTableLoadingFallback />}>
                <PaginatedApplicationTable />
            </React.Suspense>
        </div>
    );
};

// Enhanced AnalyticsTab
const AnalyticsTab: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* Hero Section for Analytics */}
            <div className="glass-card bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-600/10 border-2 border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-center justify-between">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold text-gradient">
                            📊 Analytics Dashboard
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Insights and statistics about your job search journey
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                📈 Success Metrics
                            </span>
                            <span className="flex items-center gap-1">
                                🎯 Performance Insights
                            </span>
                            <span className="flex items-center gap-1">
                                📅 Timeline Analysis
                            </span>
                        </div>
                    </div>

                    <div className="glass rounded-full p-4">
                        <span className="text-4xl">📊</span>
                    </div>
                </div>
            </div>

            <React.Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
                <AnalyticsDashboard />
            </React.Suspense>
        </div>
    );
};

// Error Screen Component
const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
        <div className="text-center max-w-md glass-card">
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="btn btn-primary btn-lg"
            >
                Reload Application
            </button>
        </div>
    </div>
);

// Main App Component
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
        // Initialize app
        const initializeApp = async () => {
            try {
                // FIXED: Proper theme initialization
                const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const initialTheme = savedTheme || systemTheme;

                // Set theme in store
                setTheme(initialTheme);

                // FIXED: Immediately apply to DOM
                const isDark = initialTheme === 'dark';
                document.documentElement.classList.toggle('dark', isDark);
                document.body.classList.toggle('dark', isDark);
                document.documentElement.style.colorScheme = initialTheme;

                // Save to localStorage if not already saved
                if (!savedTheme) {
                    localStorage.setItem('theme', initialTheme);
                }

                // Load data
                await Promise.all([
                    loadApplications(),
                    loadGoals()
                ]);

                // Force initial calculations
                calculateProgress();
                calculateAnalytics();

                // FIXED: Listen for system theme changes
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const handleSystemThemeChange = (e: MediaQueryListEvent) => {
                    // Only auto-switch if user hasn't manually set a preference
                    if (!localStorage.getItem('theme')) {
                        const newTheme = e.matches ? 'dark' : 'light';
                        setTheme(newTheme);
                        document.documentElement.classList.toggle('dark', e.matches);
                        document.body.classList.toggle('dark', e.matches);
                        document.documentElement.style.colorScheme = newTheme;
                    }
                };

                mediaQuery.addEventListener('change', handleSystemThemeChange);

                // Setup auto-backup (with reduced frequency to avoid storage issues)
                const getApplicationsData = async (): Promise<Application[]> => {
                    return useAppStore.getState().applications;
                };

                const cleanup = setupAutoBackup(getApplicationsData);

                // Return cleanup function that includes theme listener cleanup
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
            // Cleanup if needed
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
                {/* Background with enhanced grid pattern */}
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