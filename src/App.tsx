// src/App.tsx - Production Ready Application Entry Point with Privacy Integration
import React, {useEffect} from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { HelmetProvider } from 'react-helmet-async';
import {useAppStore} from './store/useAppStore';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import {initializeDatabase} from './services/databaseService';

import {setupAutoBackup} from './utils/backup';
import {Application} from './types';
import {initializeAdminRoutes} from './utils/adminRoute';
// verifyDatabaseAdmin import removed - no longer needed after removing auto-redirect
import PrivacySettingsModal from './components/modals/PrivacySettingsModal';

// Analytics and SEO imports
import { initializeGA, trackPageView, trackUserInteraction } from './services/googleAnalyticsService';
import PageSEO from './components/seo/PageSEO';
import { OrganizationStructuredData, SoftwareApplicationStructuredData } from './components/seo/StructuredData';

import './styles/globals.css';


// ============================================================================
// LAZY LOADED COMPONENTS - Performance Optimization
// ============================================================================

// New Tab Components
const ApplicationsTab = React.lazy(() => import('./components/tabs/ApplicationsTab'));
const GoalsTab = React.lazy(() => import('./components/tabs/GoalsTab'));
const ProfileTab = React.lazy(() => import('./components/tabs/ProfileTab'));
const FeaturesPricingTab = React.lazy(() => import('./components/tabs/FeaturesPricingTab'));

// Modal Components
const GoalModal = React.lazy(() => import('./components/modals/GoalModal'));
const MilestoneModal = React.lazy(() => import('./components/modals/MilestoneModal'));
const RecoveryModal = React.lazy(() => import('./components/modals/RecoveryModal'));
const FeedbackModal = React.lazy(() => import('./components/modals/FeedbackModal'));

// Utility Components
const ErrorBoundary = React.lazy(() => import('./components/ui/ErrorBoundary'));
const AnalyticsDashboard = React.lazy(() => import('./components/charts/AnalyticsDashboard'));

// Admin Components
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const AuthModal = React.lazy(() => import('./components/auth/AuthModal'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

// Utility Pages
const DiagnosticsPage = React.lazy(() => import('./pages/DiagnosticsPage'));

// Marketing Page
const MarketingPage = React.lazy(() => import('./components/marketing/MarketingPage'));

// Home Tab
const HomeTab = React.lazy(() => import('./components/tabs/HomeTab'));



const UpgradeModal = React.lazy(() => import('./components/modals/UpgradeModal'));




// ============================================================================
// ERROR SCREEN COMPONENT
// ============================================================================

const ErrorScreen: React.FC<{ error: string }> = ({error}) => (
    <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4">
        <div
            className="text-center max-w-sm sm:max-w-md glass-card w-full shadow-2xl bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20">
            <div className="text-red-500 text-6xl sm:text-8xl mb-6 sm:mb-8 animate-bounce-gentle filter drop-shadow-lg">
                ⚠️
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 text-shadow tracking-tight text-gradient-static">
                Something went wrong
            </h2>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed font-medium tracking-normal">
                {error}
            </p>

            <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold tracking-wide px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 w-full sm:w-auto border-2 border-red-400/20"
            >
                <span className="font-bold tracking-wide">Reload Application</span>
            </button>
        </div>
    </div>
);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App: React.FC = () => {
    const {
        ui,
        applications,
        auth,
        modals,
        loadApplications,
        loadGoals,
        setTheme,
        calculateProgress,
        calculateAnalytics,
        showToast,
        initializeAuth,
        setSelectedTab,
        // NEW: Privacy-related state
        privacySettings,
        loadUserPrivacySettings,
        closeUpgradeModal
    } = useAppStore();



    const location = useLocation();
    const currentRoute = location.pathname;

    const isAdminDashboardOpen = ui?.admin?.dashboardOpen && ui?.admin?.authenticated;
    const isOnAdminRoute = currentRoute === '/admin';

    // ============================================================================
    // ROUTE CHANGE DETECTION - Now handled by React Router
    // ============================================================================
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Route changed to:', currentRoute);
        }
        
        // Track page views for Google Analytics
        trackPageView(currentRoute, document.title);
        
        // Track tab switches for analytics
        if (currentRoute === '/' || currentRoute === '') {
            const currentTab = ui?.selectedTab || 'home';
            trackUserInteraction.tabSwitched(currentTab);
        }
    }, [currentRoute, ui?.selectedTab]);

    // ============================================================================
    // PRIVACY SETTINGS & ANALYTICS INITIALIZATION - NEW
    // ============================================================================
    useEffect(() => {
        const initializePrivacySettings = async () => {
            if (!auth.isAuthenticated || !auth.user || privacySettings) return;

            try {
                await loadUserPrivacySettings();
                if (process.env.NODE_ENV === 'development') {
                    console.log('Privacy settings loaded for authenticated user');
                }
            } catch (error) {
                // Don't log as error - this is expected for new users
                if (process.env.NODE_ENV === 'development') {
                    console.log('Privacy settings not found for user (this is normal for new users)');
                }
            }
        };

        const initializeAnalytics = async () => {
            if (!auth.isAuthenticated || !auth.user || !privacySettings) return;

            try {
                // Check if user has analytics consent
                if (privacySettings.analytics) {
                    const { analyticsService } = await import('./services/analyticsService');
                    await analyticsService.enableAnalytics({ trackingLevel: 'standard' });
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Analytics enabled for authenticated user');
                    }
                }
            } catch (error) {
                console.error('Failed to initialize analytics:', error);
            }
        };

        if (auth.isAuthenticated && auth.user && !privacySettings) {
            initializePrivacySettings();
        } else if (auth.isAuthenticated && auth.user && privacySettings) {
            initializeAnalytics();
        }
    }, [auth.isAuthenticated, auth.user, privacySettings, loadUserPrivacySettings]);

    // ============================================================================
    // MARKETING PAGE INITIALIZATION - Show marketing page only on first visit for ALL users
    // ============================================================================
    useEffect(() => {
        // Check if user has visited before
        const hasVisitedBefore = localStorage.getItem('applytrak_has_visited');
        
        // For ALL users (authenticated and unauthenticated), show marketing page only on first visit
        if (!hasVisitedBefore) {
            useAppStore.getState().setShowMarketingPage(true);
            // Don't mark as visited here - let the marketing page handle it when user clicks "Get Started"
        } else {
            // User has visited before, show applications page
            useAppStore.getState().setShowMarketingPage(false);
        }
    }, [auth.isAuthenticated]);

    // ============================================================================
    // ADMIN LOGOUT HANDLER - REMOVED FOR SECURITY
    // ============================================================================
    // Admin logout handler removed - logout is now handled directly in components

    // ============================================================================
    // ADMIN STATE RESET ON LOGOUT
    // ============================================================================
    useEffect(() => {
        if (!auth.isAuthenticated) {
            if (ui.admin.dashboardOpen || ui.admin.authenticated) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('User logged out - resetting admin state');
                }
                useAppStore.setState(state => ({
                    ui: {
                        ...state.ui,
                        admin: {
                            authenticated: false,
                            dashboardOpen: false,
                            currentSection: 'overview'
                        }
                    }
                }));
            }
        }
    }, [auth.isAuthenticated, ui.admin.dashboardOpen, ui.admin.authenticated]);

    // ============================================================================
    // APP INITIALIZATION
    // ============================================================================
    useEffect(() => {
        const initializeApp = async () => {
            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Starting ApplyTrak initialization...');
                }

                // Initialize Google Analytics
                initializeGA();
                if (process.env.NODE_ENV === 'development') {
                    console.log('Google Analytics initialized');
                }

                // Initialize Database System
                await initializeDatabase();
                if (process.env.NODE_ENV === 'development') {
                    console.log('Database initialized successfully');
                }

                // Theme System Setup
                // Theme System Setup (light by default)
                const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
                const initialTheme = savedTheme;

                setTheme(initialTheme);

                if (process.env.NODE_ENV === 'development') {
                    console.log(`Theme system initialized: ${initialTheme} mode`);
                }

                // Initialize Authentication System
                await initializeAuth();
                if (process.env.NODE_ENV === 'development') {
                    console.log('Authentication system initialized');
                }

                // Load Application Data (Skip if admin route or admin dashboard)
                // Always load local data from IndexedDB to ensure data persistence
                if (!isOnAdminRoute && !isAdminDashboardOpen) {
                    if (auth.isAuthenticated) {
                        // Authenticated user: Load data and sync with cloud
                        await Promise.all([
                            loadApplications(),
                            loadGoals()
                        ]);

                        calculateProgress();
                        calculateAnalytics();

                        if (process.env.NODE_ENV === 'development') {
                            console.log('Application data loaded and metrics calculated');
                        }
                    } else {
                        // Unauthenticated user: Still load local data from IndexedDB
                        // This ensures imported data persists even without cloud sync
                        try {
                            const { databaseService } = await import('./services/databaseService');
                            const localApplications = await databaseService.getApplications();
                            
                            if (localApplications.length > 0) {
                                // Update store with local data using the proper method
                                // loadApplications() will fetch from IndexedDB and update the store correctly
                                useAppStore.getState().loadApplications();
                                
                                if (process.env.NODE_ENV === 'development') {
                                    console.log(`📱 Loaded ${localApplications.length} local applications (unauthenticated)`);
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to load local applications:', error);
                        }
                    }
                } else if (!isOnAdminRoute && !isAdminDashboardOpen && !auth.isAuthenticated) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('User not authenticated - skipping data loading to avoid RLS issues');
                    }
                }

                // Initialize Admin Routes
                const adminCleanup = initializeAdminRoutes();
                if (process.env.NODE_ENV === 'development') {
                    console.log('Admin routes initialized');
                }

                // Setup Auto-Backup System (Skip if admin route or admin dashboard)
                let backupCleanup: (() => void) | undefined;
                if (!isOnAdminRoute && !isAdminDashboardOpen) {
                    const getApplicationsData = async (): Promise<Application[]> => {
                        const currentState = useAppStore.getState();
                        return currentState.applications || [];
                    };

                    backupCleanup = setupAutoBackup(getApplicationsData);
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Auto-backup system initialized');
                    }
                }

                // Setup System Theme Change Listener
                // Only respond to system theme changes if user has explicitly set a theme preference
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const handleSystemThemeChange = (e: MediaQueryListEvent) => {
                    // For shared/public access, don't auto-switch themes based on system preference
                    // Only allow system theme changes if user has explicitly set a theme
                    const savedTheme = localStorage.getItem('theme');
                    if (savedTheme && savedTheme === 'system') {
                        const newTheme = e.matches ? 'dark' : 'light';
                        setTheme(newTheme);
                    }
                };

                mediaQuery.addEventListener('change', handleSystemThemeChange);
                if (process.env.NODE_ENV === 'development') {
                    console.log('System theme change listener active');
                }

                // Success message removed - not needed on every app load

                if (process.env.NODE_ENV === 'development') {
                    console.log('ApplyTrak initialization completed successfully!');
                }

                // Cleanup Function
                return () => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Starting ApplyTrak cleanup...');
                    }

                    if (typeof backupCleanup === 'function') {
                        backupCleanup();
                    }

                    if (typeof adminCleanup === 'function') {
                        adminCleanup();
                    }

                    mediaQuery.removeEventListener('change', handleSystemThemeChange);

                    if (process.env.NODE_ENV === 'development') {
                        console.log('ApplyTrak cleanup completed');
                    }
                };

            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('ApplyTrak initialization failed:', error);
                }

                showToast({
                    type: 'error',
                    message: 'Failed to initialize ApplyTrak: ' + (error as Error).message,
                    duration: 8000
                });

                if (error instanceof Error && error.message.includes('quota')) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('Storage quota issue detected - backup system will use minimal mode');
                    }
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
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('Cleanup error (non-critical):', error);
                    }
                });
            }
        };
    }, [
        isOnAdminRoute,
        isAdminDashboardOpen,
        loadApplications,
        loadGoals,
        setTheme,
        calculateProgress,
        calculateAnalytics,
        showToast,
        initializeAuth
    ]);

    // ============================================================================
    // AUTHENTICATION-BASED DATA LOADING
    // ============================================================================
    useEffect(() => {
        // Load data when user becomes authenticated
        if (auth.isAuthenticated && !isOnAdminRoute && !isAdminDashboardOpen) {
            const loadDataAfterAuth = async () => {
                try {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('🔄 Loading data after authentication...');
                    }
                    
                    await Promise.all([
                        loadApplications(),
                        loadGoals()
                    ]);

                    calculateProgress();
                    calculateAnalytics();

                    if (process.env.NODE_ENV === 'development') {
                        console.log('✅ Data loaded successfully after authentication');
                    }
                } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('❌ Failed to load data after authentication:', error);
                    }
                }
            };

            // Add a small delay to ensure authentication is fully established
            setTimeout(loadDataAfterAuth, 1000);
        }
    }, [auth.isAuthenticated, isOnAdminRoute, isAdminDashboardOpen, loadApplications, loadGoals, calculateProgress, calculateAnalytics, auth.user]);

    // ============================================================================
    // REDIRECT UNAUTHENTICATED USERS FROM PROFILE TAB
    // ============================================================================
    React.useEffect(() => {
        if (!auth.isAuthenticated && ui?.selectedTab === 'profile') {
            setSelectedTab('applications');
        }
    }, [auth.isAuthenticated, ui?.selectedTab, setSelectedTab]);

    // ============================================================================
    // LOADING STATE HANDLING
    // ============================================================================
    if (ui?.isLoading && applications.length === 0 && !isOnAdminRoute && !isAdminDashboardOpen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // ============================================================================
    // ERROR STATE HANDLING
    // ============================================================================
    if (ui?.error) {
        return <ErrorScreen error={ui.error}/>;
    }

    // ============================================================================
    // MAIN APPLICATION RENDER
    // ============================================================================
    return (
        <HelmetProvider>
            <React.Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
            }>
                <ErrorBoundary>
                    {/* Global SEO and Structured Data */}
                    <OrganizationStructuredData />
                    <SoftwareApplicationStructuredData />
                    
                    <Routes>
                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        }>
                            <PageSEO page="admin" />
                            <AdminPage/>
                        </React.Suspense>
                    } />
                    
                    {/* Special Pages */}
                    <Route path="/diagnostics" element={
                        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        }>
                            <PageSEO page="home" additionalProps={{ title: "Diagnostics - ApplyTrak", description: "System diagnostics and troubleshooting for ApplyTrak" }} />
                            <DiagnosticsPage/>
                        </React.Suspense>
                    } />

                    
                    {/* Marketing Page */}
                    <Route path="/marketing" element={
                        ui?.showMarketingPage ? (
                            <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        }>
                                <PageSEO page="marketing" />
                                <MarketingPage/>
                            </React.Suspense>
                        ) : (
                            <ResponsiveLayout>
                                    <PageSEO page={ui?.selectedTab as any || 'home'} />
                                    {ui?.selectedTab === 'home' && <HomeTab/>}
                                    {ui?.selectedTab === 'applications' && <ApplicationsTab/>}
                                    {ui?.selectedTab === 'goals' && <GoalsTab/>}
                                    {ui?.selectedTab === 'analytics' && <AnalyticsDashboard/>}
                                    {ui?.selectedTab === 'profile' && auth.isAuthenticated && <ProfileTab/>}
                                    {ui?.selectedTab === 'features' && <FeaturesPricingTab/>}

                                    <React.Suspense fallback={null}>
                                        <GoalModal/>
                                        <MilestoneModal/>
                                        <RecoveryModal/>
                                        <FeedbackModal/>
                                        <AuthModal/>


                                        <UpgradeModal 
                                            isOpen={modals.upgrade?.isOpen || false}
                                            onClose={closeUpgradeModal}
                                            trigger={modals.upgrade?.trigger || 'general'}
                                        />

                                        {modals.privacySettings?.isOpen && (
                                            <PrivacySettingsModal/>
                                        )}
                                    </React.Suspense>
                            </ResponsiveLayout>
                        )
                    } />
                    
                    {/* Default Route - Main Application */}
                    <Route path="*" element={
                        isAdminDashboardOpen ? (
                            <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        }>
                                <PageSEO page="admin" />
                                <AdminDashboard/>
                            </React.Suspense>
                        ) : ui?.showMarketingPage ? (
                            <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        }>
                                <PageSEO page="marketing" />
                                <MarketingPage/>
                            </React.Suspense>
                        ) : (
                            <ResponsiveLayout>
                                    <PageSEO page={ui?.selectedTab as any || 'home'} />
                                    {ui?.selectedTab === 'home' && <HomeTab/>}
                                    {ui?.selectedTab === 'applications' && <ApplicationsTab/>}
                                    {ui?.selectedTab === 'goals' && <GoalsTab/>}
                                    {ui?.selectedTab === 'analytics' && <AnalyticsDashboard/>}
                                    {ui?.selectedTab === 'profile' && auth.isAuthenticated && <ProfileTab/>}
                                    {ui?.selectedTab === 'features' && <FeaturesPricingTab/>}

                                    <React.Suspense fallback={null}>
                                        <GoalModal/>
                                        <MilestoneModal/>
                                        <RecoveryModal/>
                                        <FeedbackModal/>
                                        <AuthModal/>


                                        <UpgradeModal 
                                            isOpen={modals.upgrade?.isOpen || false}
                                            onClose={closeUpgradeModal}
                                            trigger={modals.upgrade?.trigger || 'general'}
                                        />

                                        {modals.privacySettings?.isOpen && (
                                            <PrivacySettingsModal/>
                                        )}
                                    </React.Suspense>
                            </ResponsiveLayout>
                        )
                    } />
                </Routes>
            </ErrorBoundary>
            <Analytics />
        </React.Suspense>
        </HelmetProvider>
    );
};

export default App;