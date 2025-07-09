// src/App.tsx - ENHANCED WITH PREMIUM TYPOGRAPHY + FIXED BACKUP SYSTEM
import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import Layout from './components/layout/Layout';
import { initializeDatabase } from './services/databaseService';
import LoadingScreen from './components/ui/LoadingScreen';
import { setupAutoBackup } from './utils/backup';
import { Application } from './types';
import './styles/globals.css';

// Lazy load components for better performance
const ApplicationForm = React.lazy(() => import('./components/forms/ApplicationForm'));
const MobileResponsiveApplicationTable = React.lazy(() => import('./components/tables/MobileResponsiveApplicationTable'));
const GoalTracker = React.lazy(() => import('./components/ui/GoalTracker'));
const AnalyticsDashboard = React.lazy(() => import('./components/charts/AnalyticsDashboard'));
const EditApplicationModal = React.lazy(() => import('./components/modals/EditApplicationModal'));
const GoalModal = React.lazy(() => import('./components/modals/GoalModal'));
const MilestoneModal = React.lazy(() => import('./components/modals/MilestoneModal'));
const RecoveryModal = React.lazy(() => import('./components/modals/RecoveryModal'));
const ExportImportActions = React.lazy(() => import('./components/ui/ExportImportActions'));
const RecoveryAlert = React.lazy(() => import('./components/ui/RecoveryAlert'));
const ErrorBoundary = React.lazy(() => import('./components/ui/ErrorBoundary'));
const BackupStatus = React.lazy(() => import('./components/ui/BackupStatus'));

// Enhanced loading component for table - MOBILE OPTIMIZED WITH PREMIUM TYPOGRAPHY
const TableLoadingFallback = () => (
    <div className="glass-card">
        <div className="space-y-4 animate-pulse">
            {/* Search and tabs skeleton - MOBILE STACK */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-full sm:w-64 animate-shimmer"></div>
                <div className="flex gap-2">
                    <div className="h-12 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600 rounded-xl flex-1 sm:w-32 animate-shimmer"></div>
                    <div className="h-12 bg-gradient-to-r from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-600 rounded-xl flex-1 sm:w-32 animate-shimmer"></div>
                </div>
            </div>

            {/* Results summary skeleton - ENHANCED */}
            <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div className="h-5 bg-gradient-to-r from-indigo-200 to-indigo-300 dark:from-indigo-700 dark:to-indigo-600 rounded-lg w-full sm:w-48 animate-shimmer"></div>
                <div className="h-5 bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 rounded-lg w-24 sm:w-32 animate-shimmer"></div>
            </div>

            {/* Mobile vs Desktop Table skeleton - ENHANCED GRADIENTS */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
                {/* Desktop table view */}
                <div className="hidden sm:block">
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-4 shadow-inner">
                        <div className="flex gap-4">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="h-4 bg-white/40 rounded flex-1 animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-0">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex gap-4 items-center">
                                    {[...Array(7)].map((_, j) => (
                                        <div key={j} className={`h-4 rounded flex-1 animate-pulse ${
                                            j === 0 ? 'bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600' :
                                                j === 2 ? 'bg-gradient-to-r from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-600' :
                                                    'bg-gray-200 dark:bg-gray-700'
                                        }`}></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile card view - ENHANCED */}
                <div className="sm:hidden space-y-4 p-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="h-6 bg-gradient-to-r from-blue-300 to-purple-300 dark:from-blue-600 dark:to-purple-600 rounded-lg w-2/3 animate-pulse"></div>
                                <div className="h-7 bg-gradient-to-r from-green-300 to-emerald-300 dark:from-green-600 dark:to-emerald-600 rounded-full w-20 animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination skeleton - MOBILE RESPONSIVE WITH GRADIENTS */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
                <div className="h-5 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-700 dark:to-purple-700 rounded-lg w-full sm:w-48 animate-pulse"></div>
                <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-10 w-10 rounded-lg animate-pulse ${
                            i === 2 ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}></div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Enhanced TrackerTab - MOBILE OPTIMIZED WITH PREMIUM TYPOGRAPHY + BACKUP STATUS
const TrackerTab: React.FC = () => {
    // 🔧 FIXED: Remove showToast from destructuring if it doesn't exist in your store
    const { applications, bulkAddApplications } = useAppStore();

    // 🔧 CREATE: Local showToast function
    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        console.log(`Toast [${type.toUpperCase()}]: ${message}`);

        // 🔧 Optional: Add browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`ApplyTrak - ${type.charAt(0).toUpperCase() + type.slice(1)}`, {
                body: message,
                icon: '/favicon.ico'
            });
        }
    };

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
            showToast(`Successfully imported ${applicationsToAdd.length} applications`, 'success');
        } catch (error) {
            console.error('Import failed:', error);
            showToast('Import failed: ' + (error as Error).message, 'error');
        }
    };

    const handleRestoreFromBackup = (restoredApplications: Application[]) => {
        try {
            if (!Array.isArray(restoredApplications) || restoredApplications.length === 0) {
                throw new Error('No valid applications found in backup');
            }

            const applicationsToAdd = restoredApplications.map(app => {
                const { id, createdAt, updatedAt, ...appData } = app;
                return appData;
            });

            bulkAddApplications(applicationsToAdd);
            showToast(`Successfully restored ${applicationsToAdd.length} applications from backup`, 'success');
        } catch (error) {
            console.error('Restore failed:', error);
            showToast('Restore failed: ' + (error as Error).message, 'error');
        }
    };

    return (
        <div className="space-y-8 sm:space-y-10">
            {/* Hero Section - ENHANCED TYPOGRAPHY */}
            <div className="glass-card bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-primary-600/10 border-2 border-primary-200/30 dark:border-primary-700/30 shadow-xl">
                <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4 sm:space-y-6">
                        {/* Hero title - ENHANCED WITH PREMIUM TYPOGRAPHY */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gradient-static tracking-tight leading-none text-shadow-lg animate-text-shimmer">
                            🚀 Application Tracker
                        </h1>

                        {/* Subtitle - ENHANCED WITH RICH TYPOGRAPHY */}
                        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-2xl">
                            Keep your job search on track with <span className="font-display font-bold text-gradient-blue tracking-wide">ApplyTrak</span>
                        </p>

                        {/* Stats - ENHANCED MOBILE GRID WITH PREMIUM TYPOGRAPHY */}
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 pt-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-2xl animate-bounce-gentle">📊</span>
                                <div className="text-left">
                                    <div className="text-lg font-extrabold text-gradient-static">
                                        {applications.length}
                                    </div>
                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                        Apps
                                    </div>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-2xl">📄</span>
                                <div className="text-left">
                                    <div className="text-lg font-extrabold text-gradient-blue">
                                        15
                                    </div>
                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                        Per Page
                                    </div>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-2xl animate-ping-light">⚡</span>
                                <div className="text-left">
                                    <div className="text-lg font-extrabold text-gradient-purple">
                                        Fast
                                    </div>
                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                        Navigation
                                    </div>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-2xl animate-spin-slow">🎯</span>
                                <div className="text-left">
                                    <div className="text-lg font-extrabold text-gradient-static">
                                        Smart
                                    </div>
                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                        Goals
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export/Import Actions - ENHANCED */}
                    <div className="flex-shrink-0">
                        <React.Suspense
                            fallback={<div className="h-12 sm:h-14 w-full sm:w-52 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse" />}
                        >
                            <ExportImportActions
                                applications={applications}
                                onImport={handleImportApplications}
                            />
                        </React.Suspense>
                    </div>
                </div>
            </div>

            {/* Backup Status Component - NEW SECTION */}
            <React.Suspense fallback={
                <div className="bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20 h-32 rounded-2xl animate-pulse shadow-lg" />
            }>
                <BackupStatus
                    applications={applications}
                    onRestore={handleRestoreFromBackup}
                    onShowToast={showToast}
                />
            </React.Suspense>

            {/* Recovery Alert */}
            <React.Suspense fallback={null}>
                <RecoveryAlert />
            </React.Suspense>

            {/* Goal Tracking - ENHANCED */}
            <React.Suspense fallback={
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 h-48 sm:h-56 rounded-2xl animate-pulse shadow-lg" />
            }>
                <GoalTracker />
            </React.Suspense>

            {/* Application Form - ENHANCED */}
            <React.Suspense fallback={
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 h-96 sm:h-[28rem] rounded-2xl animate-pulse shadow-lg" />
            }>
                <ApplicationForm />
            </React.Suspense>

            {/* Mobile Responsive Application Table - ENHANCED */}
            <React.Suspense fallback={<TableLoadingFallback />}>
                <div className="responsive-table">
                    <MobileResponsiveApplicationTable />
                </div>
            </React.Suspense>
        </div>
    );
};

// Enhanced AnalyticsTab - PREMIUM TYPOGRAPHY
const AnalyticsTab: React.FC = () => {
    return (
        <div className="space-y-8 sm:space-y-10">
            {/* Hero Section for Analytics - ENHANCED WITH PREMIUM TYPOGRAPHY */}
            <div className="glass-card bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-600/10 border-2 border-blue-200/30 dark:border-blue-700/30 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-4 sm:space-y-6">
                        {/* Analytics Title - ENHANCED WITH PREMIUM TYPOGRAPHY */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gradient-blue tracking-tight leading-none text-shadow-lg animate-text-shimmer">
                            📊 Analytics
                        </h1>

                        {/* Analytics Subtitle - ENHANCED WITH RICH TYPOGRAPHY */}
                        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-2xl">
                            Insights about your <span className="font-display font-bold text-gradient-purple tracking-wide">job search journey</span>
                        </p>

                        {/* Analytics Features - ENHANCED GRID WITH PREMIUM TYPOGRAPHY */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                            <div className="inline-flex items-center gap-3 px-4 py-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                                <span className="text-2xl animate-bounce-gentle">📈</span>
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 text-gradient-static tracking-wide">
                                        Success Metrics
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wider">
                                        Track your progress
                                    </div>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-3 px-4 py-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                                <span className="text-2xl animate-pulse">🎯</span>
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 text-gradient-purple tracking-wide">
                                        Performance
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wider">
                                        Analyze trends
                                    </div>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-3 px-4 py-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                                <span className="text-2xl animate-spin-slow">📅</span>
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 text-gradient-blue tracking-wide">
                                        Timeline
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wider">
                                        View history
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Icon - ENHANCED */}
                    <div className="glass rounded-2xl p-6 sm:p-8 self-center sm:self-auto shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/30 dark:border-blue-700/30">
                        <span className="text-4xl sm:text-6xl animate-float filter drop-shadow-lg">📊</span>
                    </div>
                </div>
            </div>

            {/* Analytics Dashboard - ENHANCED */}
            <React.Suspense fallback={
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 h-96 sm:h-[32rem] rounded-2xl animate-pulse shadow-lg" />
            }>
                <AnalyticsDashboard />
            </React.Suspense>
        </div>
    );
};

// Error Screen Component - ENHANCED WITH PREMIUM TYPOGRAPHY
const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4">
        <div className="text-center max-w-sm sm:max-w-md glass-card w-full shadow-2xl bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20">
            <div className="text-red-500 text-6xl sm:text-8xl mb-6 sm:mb-8 animate-bounce-gentle filter drop-shadow-lg">⚠️</div>

            {/* Error Title - ENHANCED WITH PREMIUM TYPOGRAPHY */}
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 text-shadow tracking-tight text-gradient-static">
                Something went wrong
            </h2>

            {/* Error Message - ENHANCED WITH RICH TYPOGRAPHY */}
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed font-medium tracking-normal">
                {error}
            </p>

            {/* Error Button - ENHANCED WITH PREMIUM STYLING */}
            <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold tracking-wide px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 w-full sm:w-auto border-2 border-red-400/20"
            >
                <span className="font-bold tracking-wide">Reload Application</span>
            </button>
        </div>
    </div>
);

// Main App Component - ENHANCED WITH PREMIUM FEATURES + IMPROVED BACKUP SYSTEM
const App: React.FC = () => {
    const {
        ui,
        applications,
        loadApplications,
        loadGoals,
        setTheme,
        calculateProgress,
        calculateAnalytics,
        showToast
    } = useAppStore();

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // 🔧 CRITICAL FIX: Initialize database FIRST
                console.log('🚀 Initializing database...');
                await initializeDatabase();
                console.log('✅ Database initialized successfully');

                // Theme initialization with enhanced system detection
                const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const initialTheme = savedTheme || systemTheme;

                setTheme(initialTheme);

                // Apply to DOM immediately with enhanced styling
                const isDark = initialTheme === 'dark';
                document.documentElement.classList.toggle('dark', isDark);
                document.body.classList.toggle('dark', isDark);
                document.documentElement.style.colorScheme = initialTheme;

                // Add enhanced meta theme color
                const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                if (metaThemeColor) {
                    metaThemeColor.setAttribute('content', isDark ? '#1f2937' : '#ffffff');
                }

                if (!savedTheme) {
                    localStorage.setItem('theme', initialTheme);
                }

                // 🔧 CRITICAL FIX: Load data AFTER database is initialized
                console.log('📊 Loading application data...');
                await Promise.all([
                    loadApplications(),
                    loadGoals()
                ]);
                console.log('✅ Data loaded successfully');

                calculateProgress();
                calculateAnalytics();

                // 🔧 SHOW SUCCESS TOAST
                showToast({
                    type: 'success',
                    message: 'Application loaded successfully!',
                    duration: 3000
                });

                // System theme change listener with enhanced handling
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const handleSystemThemeChange = (e: MediaQueryListEvent) => {
                    if (!localStorage.getItem('theme')) {
                        const newTheme = e.matches ? 'dark' : 'light';
                        setTheme(newTheme);
                        document.documentElement.classList.toggle('dark', e.matches);
                        document.body.classList.toggle('dark', e.matches);
                        document.documentElement.style.colorScheme = newTheme;

                        // Update meta theme color
                        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                        if (metaThemeColor) {
                            metaThemeColor.setAttribute('content', e.matches ? '#1f2937' : '#ffffff');
                        }
                    }
                };

                mediaQuery.addEventListener('change', handleSystemThemeChange);

                // Auto-backup setup with FIXED quota-safe system
                const getApplicationsData = async (): Promise<Application[]> => {
                    const currentState = useAppStore.getState();
                    return currentState.applications || [];
                };

                // Setup the NEW quota-safe backup system
                const cleanup = setupAutoBackup(getApplicationsData);

                console.log('✅ Quota-safe backup system initialized successfully');

                return () => {
                    if (typeof cleanup === 'function') {
                        cleanup();
                        console.log('🔄 Backup system cleanup completed');
                    }
                    mediaQuery.removeEventListener('change', handleSystemThemeChange);
                };
            } catch (error) {
                console.error('❌ App initialization failed:', error);

                // 🔧 SHOW ERROR TOAST
                showToast({
                    type: 'error',
                    message: 'Failed to initialize application: ' + (error as Error).message,
                    duration: 8000
                });

                if (error instanceof Error && error.message.includes('quota')) {
                    console.warn('⚠️ Storage quota issue detected - backup system will use minimal mode');
                }
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
                }).catch(error => {
                    console.warn('Cleanup error (non-critical):', error);
                });
            }
        };
    }, [loadApplications, loadGoals, setTheme, calculateProgress, calculateAnalytics, showToast]); // 🔧 ADD showToast TO DEPENDENCIES

    // Loading state with enhanced loading screen
    if (ui.isLoading && applications.length === 0) {
        return <LoadingScreen />;
    }

    // Error state with premium error screen
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