// src/store/useAppStore.ts - PHASE 2: UNIFIED GLOBAL REFRESH SYSTEM
import {create} from 'zustand';
import {persist, subscribeWithSelector} from 'zustand/middleware';
import {startTransition} from 'react';
import {debounce} from 'lodash';
import {
    AdminAnalytics,
    AdminFeedbackSummary,
    AnalyticsData,
    AnalyticsSettings,
    Application,
    ApplicationStatus,
    FeedbackSubmission,
    GoalProgress,
    Goals,
    SourceSuccessRate,
    UserMetrics
} from '../types';
import {authService, databaseService} from '../services/databaseService'; // ✅ Added authService import
import {analyticsService} from '../services/analyticsService';
import realtimeAdminService from '../services/realtimeAdminService';
import {feedbackService} from '../services/feedbackService';

// ============================================================================
// TYPES - ENHANCED WITH AUTHENTICATION
// ============================================================================

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// ✅ NEW: Authentication state interface
export interface AuthState {
    user: any | null;  // Supabase User type
    session: any | null; // Supabase Session type
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// ✅ PHASE 2: Global refresh state interface
export interface GlobalRefreshState {
    isRefreshing: boolean;
    lastRefreshTimestamp: string | null;
    refreshStatus: 'idle' | 'refreshing' | 'success' | 'error';
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number; // in seconds
    refreshErrors: string[];
}

export interface UIState {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    currentPage: number;
    itemsPerPage: number;
    searchQuery: string;
    selectedApplicationIds: string[];
    isLoading: boolean;
    error: string | null;
    selectedTab: 'tracker' | 'analytics';
    analytics: {
        consentModalOpen: boolean;
        settingsOpen: boolean;
    };
    feedback: {
        buttonVisible: boolean;
        modalOpen: boolean;
        lastSubmissionDate?: string;
    };
    admin: {
        authenticated: boolean;
        dashboardOpen: boolean;
        currentSection: 'overview' | 'analytics' | 'feedback' | 'users' | 'settings' | 'support';
    };
}

export interface ModalState {
    editApplication: {
        isOpen: boolean;
        application?: Application;
    };
    goalSetting: {
        isOpen: boolean;
    };
    milestone: {
        isOpen: boolean;
        message?: string;
    };
    recovery: {
        isOpen: boolean;
    };
    analyticsConsent: {
        isOpen: boolean;
        type?: 'first-visit' | 'settings-change' | 'update-required';
    };
    feedback: {
        isOpen: boolean;
        initialType?: 'bug' | 'feature' | 'general' | 'love';
    };
    adminLogin: {
        isOpen: boolean;
        returnPath?: string;
    };
    // ✅ NEW: Authentication modals
    auth: {
        loginOpen: boolean;
        signupOpen: boolean;
        resetPasswordOpen: boolean;
        mode?: 'login' | 'signup' | 'reset';
    };
}

export interface AppState {
    // ✅ EXISTING STATE (unchanged)
    applications: Application[];
    filteredApplications: Application[];
    goals: Goals;
    toasts: Toast[];
    ui: UIState;
    modals: ModalState;
    goalProgress: GoalProgress;
    analytics: AnalyticsData;
    analyticsSettings: AnalyticsSettings;
    userMetrics: UserMetrics | null;
    feedbackList: FeedbackSubmission[];
    adminAnalytics: AdminAnalytics | null;
    adminFeedback: AdminFeedbackSummary | null;

    autoRefreshPreferences?: {
        enabled: boolean;
        interval: number;
    };

    // ✅ EXISTING REAL-TIME ADMIN STATE (unchanged)
    isAdminRealtime: boolean;
    adminSubscription: (() => void) | null;
    lastAdminUpdate: string | null;

    // ✅ NEW: Authentication state
    auth: AuthState;
    authSubscription: (() => void) | null;

    // ✅ PHASE 2: Global refresh state
    globalRefresh: GlobalRefreshState;
    autoRefreshTimer: NodeJS.Timeout | null;

    // ✅ EXISTING ACTIONS (unchanged - keeping all existing functionality)
    loadApplications: () => Promise<void>;
    addApplication: (application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
    deleteApplication: (id: string) => Promise<void>;
    deleteApplications: (ids: string[]) => Promise<void>;
    updateApplicationStatus: (ids: string[], status: ApplicationStatus) => Promise<void>;
    bulkDeleteApplications: (ids: string[]) => Promise<void>;
    bulkUpdateApplications: (ids: string[], updates: Partial<Application>) => Promise<void>;
    searchApplications: (query: string) => void;
    clearSearch: () => void;
    bulkAddApplications: (applications: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<{
        successCount: number;
        errorCount: number
    }>;
    handleImport: (importedApplications: Application[]) => Promise<{ successCount: number; errorCount: number }>;
    loadGoals: () => Promise<void>;
    updateGoals: (goals: Goals) => Promise<void>;
    calculateProgress: () => void;
    checkMilestones: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    toggleSidebar: () => void;
    setCurrentPage: (page: number) => void;
    setSearchQuery: (query: string) => void;
    setSelectedApplicationIds: (ids: string[]) => void;
    clearSelection: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSelectedTab: (tab: 'tracker' | 'analytics') => void;
    openEditModal: (application: Application) => void;
    closeEditModal: () => void;
    openGoalModal: () => void;
    closeGoalModal: () => void;
    openMilestone: (message: string) => void;
    closeMilestone: () => void;
    showToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    calculateAnalytics: () => void;
    initializeAnalytics: () => Promise<void>;
    enableAnalytics: (settings?: Partial<AnalyticsSettings>) => Promise<void>;
    disableAnalytics: () => void;
    trackEvent: (event: string, properties?: Record<string, any>) => Promise<void>;
    trackPageView: (page: string) => Promise<void>;
    trackFeatureUsage: (feature: string, context?: Record<string, any>) => Promise<void>;
    openAnalyticsConsent: (type?: 'first-visit' | 'settings-change') => void;
    closeAnalyticsConsent: () => void;
    openFeedbackModal: (initialType?: 'bug' | 'feature' | 'general' | 'love') => void;
    closeFeedbackModal: () => void;
    submitFeedback: (type: 'bug' | 'feature' | 'general' | 'love', rating: number, message: string, email?: string) => Promise<void>;
    loadFeedbackList: () => void;
    authenticateAdmin: (password: string) => boolean;
    logoutAdmin: () => void;
    loadAdminAnalytics: () => Promise<void>;
    loadAdminFeedback: () => Promise<void>;
    openAdminDashboard: () => void;
    closeAdminDashboard: () => void;
    setAdminSection: (section: 'overview' | 'analytics' | 'feedback' | 'users' | 'settings' | 'support') => void;

    // ✅ EXISTING REAL-TIME ADMIN ACTIONS (unchanged)
    enableRealtimeAdmin: () => void;
    disableRealtimeAdmin: () => void;
    loadRealtimeAdminAnalytics: () => Promise<void>;
    loadRealtimeFeedbackSummary: () => Promise<void>;
    refreshAdminData: () => Promise<void>;
    getAdminConnectionStatus: () => {
        isRealtime: boolean;
        isConnected: boolean;
        lastUpdate: string | null;
        mode: string;
    };

    // ✅ NEW: Authentication actions
    initializeAuth: () => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    openAuthModal: (mode: 'login' | 'signup' | 'reset') => void;
    closeAuthModal: () => void;
    getAuthStatus: () => {
        isAuthenticated: boolean;
        user: any | null;
        isLoading: boolean;
        error: string | null;
    };

    // ✅ PHASE 2: Global refresh actions
    refreshAllAdminData: () => Promise<void>;
    enableAutoRefresh: (intervalSeconds?: number) => void;
    disableAutoRefresh: () => void;
    getGlobalRefreshStatus: () => GlobalRefreshState;
    resetRefreshErrors: () => void;
}



// ============================================================================
// UTILITY FUNCTIONS (unchanged)
// ============================================================================

const createOptimizedCache = () => {
    let cache = new Map();
    return {
        get: (key: string) => cache.get(key),
        set: (key: string, value: any) => {
            if (cache.size > 10) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            cache.set(key, value);
        },
        clear: () => cache.clear(),
        invalidatePattern: (pattern: string) => {
            Array.from(cache.keys())
                .filter(key => key.includes(pattern))
                .forEach(key => cache.delete(key));
        }
    };
};

const safeParseInt = (value: any): number => {
    const parsed = parseInt(String(value || '0'));
    return isNaN(parsed) ? 0 : parsed;
};

const ensureNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    return safeParseInt(value);
};

const optimizedCache = createOptimizedCache();

// ✅ EXISTING UTILITY FUNCTIONS (unchanged)
const calculateGoalProgress = (applications: Application[], goals: Goals): GoalProgress => {
    const now = new Date();
    const totalApplications = applications.length;
    const totalProgress = Math.min((totalApplications / goals.totalGoal) * 100, 100);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyApplications = applications.filter(app => {
        const appDate = new Date(app.dateApplied);
        return appDate >= weekStart;
    }).length;
    const weeklyProgress = Math.min((weeklyApplications / goals.weeklyGoal) * 100, 100);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyApplications = applications.filter(app => {
        const appDate = new Date(app.dateApplied);
        return appDate >= monthStart;
    }).length;
    const monthlyProgress = Math.min((monthlyApplications / goals.monthlyGoal) * 100, 100);

    return {
        totalGoal: goals.totalGoal,
        weeklyGoal: goals.weeklyGoal,
        monthlyGoal: goals.monthlyGoal,
        totalProgress,
        weeklyProgress,
        monthlyProgress,
        weeklyStreak: 0,
        totalApplications,
        weeklyApplications,
        monthlyApplications
    };
};

const calculateAnalytics = (applications: Application[]): AnalyticsData => {
    const statusDistribution = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {} as { [key in ApplicationStatus]: number });

    const completeStatusDistribution = {
        Applied: statusDistribution.Applied || 0,
        Interview: statusDistribution.Interview || 0,
        Offer: statusDistribution.Offer || 0,
        Rejected: statusDistribution.Rejected || 0
    };

    const typeDistribution = applications.reduce((acc, app) => {
        acc[app.type] = (acc[app.type] || 0) + 1;
        return acc;
    }, {} as any);

    const completeTypeDistribution = {
        Onsite: typeDistribution.Onsite || 0,
        Remote: typeDistribution.Remote || 0,
        Hybrid: typeDistribution.Hybrid || 0
    };

    const sourceDistribution = applications.reduce((acc, app) => {
        const source = app.jobSource || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const sourceSuccessRates: SourceSuccessRate[] = Object.keys(sourceDistribution).map(source => {
        const sourceApps = applications.filter(app => (app.jobSource || 'Unknown') === source);
        const total = sourceApps.length;
        const offers = sourceApps.filter(app => app.status === 'Offer').length;
        const interviews = sourceApps.filter(app => app.status === 'Interview' || app.status === 'Offer').length;

        return {
            source,
            total,
            offers,
            interviews,
            successRate: total > 0 ? (offers / total) * 100 : 0,
            interviewRate: total > 0 ? (interviews / total) * 100 : 0
        };
    });

    const offers = completeStatusDistribution.Offer;
    const successRate = applications.length > 0 ? (offers / applications.length) * 100 : 0;

    const interviewApps = applications.filter(app => app.status === 'Interview');
    const responseTimes = interviewApps.map(app => {
        const appliedDate = new Date(app.dateApplied);
        const now = new Date();
        return (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);
    });
    const averageResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    const monthlyTrend = applications.reduce((acc, app) => {
        const date = new Date(app.dateApplied);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = acc.find(item => item.month === monthKey);

        if (existing) {
            existing.count++;
        } else {
            acc.push({month: monthKey, count: 1});
        }

        return acc;
    }, [] as Array<{ month: string; count: number }>);

    return {
        statusDistribution: completeStatusDistribution,
        typeDistribution: completeTypeDistribution,
        sourceDistribution,
        sourceSuccessRates,
        successRate,
        averageResponseTime,
        totalApplications: applications.length,
        monthlyTrend: monthlyTrend.sort((a, b) => a.month.localeCompare(b.month))
    };
};

const checkMilestones = (applicationCount: number, showToast: (toast: Omit<Toast, 'id'>) => void) => {
    const milestones = [10, 25, 50, 100, 150, 200, 250, 500];
    const celebratedMilestones = JSON.parse(localStorage.getItem('celebratedMilestones') || '[]');

    const reachedMilestone = milestones.find(milestone =>
        applicationCount >= milestone && !celebratedMilestones.includes(milestone)
    );

    if (reachedMilestone) {
        showToast({
            type: 'success',
            message: `🎉 Milestone reached! You've submitted ${reachedMilestone} applications!`,
            duration: 8000
        });

        celebratedMilestones.push(reachedMilestone);
        localStorage.setItem('celebratedMilestones', JSON.stringify(celebratedMilestones));
    }
};

const createDebouncedSearch = (setState: (fn: (state: AppState) => Partial<AppState>) => void) => {
    return debounce((query: string, applications: Application[]) => {
        let filtered = applications;

        if (query.trim()) {
            const searchTerm = query.toLowerCase();
            filtered = applications.filter(app => {
                const searchFields = [
                    app.company,
                    app.position,
                    app.location,
                    app.jobSource,
                    app.notes
                ].filter(Boolean).join(' ').toLowerCase();

                return searchFields.includes(searchTerm);
            });
        }

        setState((state: AppState) => ({
            filteredApplications: filtered,
            ui: {...state.ui, currentPage: 1}
        }));
    }, 300);
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const ADMIN_PASSWORD = 'applytrak-admin-2024';

// ============================================================================
// MAIN STORE - ENHANCED WITH PHASE 2: UNIFIED GLOBAL REFRESH SYSTEM
// ============================================================================

export const useAppStore = create<AppState>()(
    subscribeWithSelector(
        persist(
            (set, get): AppState => {
                const debouncedSearch = createDebouncedSearch(set);

                return {
                    // ✅ EXISTING INITIAL STATE (unchanged)
                    applications: [],
                    filteredApplications: [],
                    goals: {totalGoal: 100, weeklyGoal: 5, monthlyGoal: 20},
                    toasts: [],
                    ui: {
                        theme: 'light',
                        sidebarOpen: false,
                        currentPage: 1,
                        itemsPerPage: 10,
                        searchQuery: '',
                        selectedApplicationIds: [],
                        isLoading: false,
                        error: null,
                        selectedTab: 'tracker',
                        analytics: {
                            consentModalOpen: false,
                            settingsOpen: false,
                        },
                        feedback: {
                            buttonVisible: true,
                            modalOpen: false,
                            lastSubmissionDate: undefined,
                        },
                        admin: {
                            authenticated: false,
                            dashboardOpen: false,
                            currentSection: 'overview'
                        },
                    },
                    modals: {
                        editApplication: {isOpen: false, application: undefined},
                        goalSetting: {isOpen: false},
                        milestone: {isOpen: false, message: undefined},
                        recovery: {isOpen: false},
                        analyticsConsent: {isOpen: false, type: undefined},
                        feedback: {isOpen: false, initialType: undefined},
                        adminLogin: {isOpen: false, returnPath: undefined},
                        // ✅ NEW: Authentication modals
                        auth: {
                            loginOpen: false,
                            signupOpen: false,
                            resetPasswordOpen: false,
                            mode: undefined
                        }
                    },
                    goalProgress: {
                        totalGoal: 100,
                        weeklyGoal: 5,
                        monthlyGoal: 20,
                        totalProgress: 0,
                        weeklyProgress: 0,
                        monthlyProgress: 0,
                        weeklyStreak: 0,
                        totalApplications: 0,
                        weeklyApplications: 0,
                        monthlyApplications: 0
                    },
                    analytics: {
                        statusDistribution: {Applied: 0, Interview: 0, Offer: 0, Rejected: 0},
                        typeDistribution: {Onsite: 0, Remote: 0, Hybrid: 0},
                        sourceDistribution: {},
                        sourceSuccessRates: [],
                        successRate: 0,
                        averageResponseTime: 0,
                        totalApplications: 0,
                        monthlyTrend: []
                    },
                    analyticsSettings: {
                        enabled: false,
                        consentGiven: false,
                        trackingLevel: 'minimal'
                    },
                    userMetrics: null,
                    feedbackList: [],
                    adminAnalytics: null,
                    adminFeedback: null,

                    // ✅ EXISTING REAL-TIME ADMIN STATE (unchanged)
                    isAdminRealtime: false,
                    adminSubscription: null,
                    lastAdminUpdate: null,

                    // ✅ NEW: Authentication state
                    auth: {
                        user: null,
                        session: null,
                        isAuthenticated: false,
                        isLoading: true,
                        error: null
                    },
                    authSubscription: null,

                    // ✅ PHASE 2: Global refresh state
                    globalRefresh: {
                        isRefreshing: false,
                        lastRefreshTimestamp: null,
                        refreshStatus: 'idle',
                        autoRefreshEnabled: false,
                        autoRefreshInterval: 30, // 30 seconds default
                        refreshErrors: []
                    },
                    autoRefreshTimer: null,

                    // ✅ PHASE 2: Enhanced global refresh action - MAIN IMPLEMENTATION
                    refreshAllAdminData: async () => {
                        console.log('🔄 Starting unified global admin refresh...');

                        // Set refreshing state
                        set(state => ({
                            ...state,
                            globalRefresh: {
                                ...state.globalRefresh,
                                isRefreshing: true,
                                refreshStatus: 'refreshing',
                                refreshErrors: []
                            }
                        }));

                        const errors: string[] = [];
                        const startTime = Date.now();

                        try {
                            const {isAdminRealtime, auth} = get();

                            // Define all refresh operations
                            const refreshOperations = [
                                {
                                    name: 'Applications Data',
                                    operation: () => get().loadApplications()
                                },
                                {
                                    name: 'Goals Data',
                                    operation: () => get().loadGoals()
                                },
                                {
                                    name: 'Analytics Calculation',
                                    operation: () => Promise.resolve(get().calculateAnalytics())
                                },
                                {
                                    name: 'Progress Calculation',
                                    operation: () => Promise.resolve(get().calculateProgress())
                                },
                                {
                                    name: 'Feedback List',
                                    operation: () => Promise.resolve(get().loadFeedbackList())
                                }
                            ];

                            // Add admin-specific refresh operations
                            if (isAdminRealtime) {
                                refreshOperations.push(
                                    {
                                        name: 'Real-time Admin Analytics',
                                        operation: () => get().loadRealtimeAdminAnalytics()
                                    },
                                    {
                                        name: 'Real-time Feedback Summary',
                                        operation: () => get().loadRealtimeFeedbackSummary()
                                    }
                                );
                            } else {
                                refreshOperations.push(
                                    {
                                        name: 'Admin Analytics',
                                        operation: () => get().loadAdminAnalytics()
                                    },
                                    {
                                        name: 'Admin Feedback',
                                        operation: () => get().loadAdminFeedback()
                                    }
                                );
                            }

                            // Execute all refresh operations in parallel
                            console.log(`🔄 Executing ${refreshOperations.length} refresh operations...`);

                            const results = await Promise.allSettled(
                                refreshOperations.map(async ({name, operation}) => {
                                    try {
                                        await operation();
                                        console.log(`✅ ${name} - Success`);
                                        return {name, success: true};
                                    } catch (error) {
                                        console.error(`❌ ${name} - Error:`, error);
                                        errors.push(`${name}: ${(error as Error).message}`);
                                        return {name, success: false, error};
                                    }
                                })
                            );

                            // Count successful operations
                            const successCount = results.filter(result =>
                                result.status === 'fulfilled' && result.value.success
                            ).length;

                            const refreshDuration = Date.now() - startTime;
                            console.log(`🔄 Global refresh completed: ${successCount}/${refreshOperations.length} operations successful in ${refreshDuration}ms`);

                            // Update refresh state
                            const refreshStatus = errors.length === 0 ? 'success' : 'error';

                            set(state => ({
                                ...state,
                                globalRefresh: {
                                    ...state.globalRefresh,
                                    isRefreshing: false,
                                    refreshStatus,
                                    refreshErrors: errors,
                                    lastRefreshTimestamp: new Date().toISOString()
                                },
                                lastAdminUpdate: new Date().toISOString()
                            }));

                            // Show appropriate toast message
                            const toastMessage = errors.length === 0
                                ? `✅ All admin data refreshed successfully (${refreshDuration}ms)`
                                : `⚠️ Refresh completed with ${errors.length} errors`;

                            get().showToast({
                                type: errors.length === 0 ? 'success' : 'warning',
                                message: toastMessage,
                                duration: errors.length === 0 ? 3000 : 5000
                            });

                            // Track refresh event
                            get().trackEvent('admin_global_refresh', {
                                success: errors.length === 0,
                                operationsCount: refreshOperations.length,
                                successCount,
                                errorCount: errors.length,
                                duration: refreshDuration,
                                mode: isAdminRealtime ?
                                    (auth.isAuthenticated ? 'saas_realtime' : 'local_realtime') :
                                    'local_only'
                            });

                        } catch (error) {
                            console.error('❌ Global refresh failed:', error);

                            set(state => ({
                                ...state,
                                globalRefresh: {
                                    ...state.globalRefresh,
                                    isRefreshing: false,
                                    refreshStatus: 'error',
                                    refreshErrors: [...errors, (error as Error).message]
                                }
                            }));

                            get().showToast({
                                type: 'error',
                                message: '❌ Global refresh failed',
                                duration: 5000
                            });
                        }
                    },

                    enableAutoRefresh: (intervalSeconds = 30) => {
                        console.log(`🔄 Enabling auto-refresh every ${intervalSeconds} seconds`);

                        // Clear existing timer
                        const {autoRefreshTimer} = get();
                        if (autoRefreshTimer) {
                            clearInterval(autoRefreshTimer);
                        }

                        // Set up new timer with enhanced state checking
                        const timer = setInterval(() => {
                            const {ui, globalRefresh} = get();

                            // ✅ ENHANCED: Only auto-refresh if all conditions are met
                            const shouldRefresh =
                                ui.admin.dashboardOpen &&           // Dashboard is open
                                !globalRefresh.isRefreshing &&      // Not currently refreshing
                                !document.hidden &&                 // Page is visible
                                navigator.onLine;                    // Device is online

                            if (shouldRefresh) {
                                console.log('🔄 Auto-refresh triggered - all conditions met');
                                get().refreshAllAdminData();
                            } else {
                                console.log('⏸️ Auto-refresh skipped - conditions not met:', {
                                    dashboardOpen: ui.admin.dashboardOpen,
                                    isRefreshing: globalRefresh.isRefreshing,
                                    pageHidden: document.hidden,
                                    offline: !navigator.onLine
                                });
                            }
                        }, intervalSeconds * 1000);

                        set(state => ({
                            ...state,
                            globalRefresh: {
                                ...state.globalRefresh,
                                autoRefreshEnabled: true,
                                autoRefreshInterval: intervalSeconds
                            },
                            autoRefreshTimer: timer
                        }));

                        get().showToast({
                            type: 'info',
                            message: `🔄 Auto-refresh enabled (${intervalSeconds}s intervals)`,
                            duration: 3000
                        });
                    },

                    disableAutoRefresh: () => {
                        console.log('⏹️ Disabling auto-refresh');

                        const {autoRefreshTimer} = get();
                        if (autoRefreshTimer) {
                            clearInterval(autoRefreshTimer);
                        }

                        set(state => ({
                            ...state,
                            globalRefresh: {
                                ...state.globalRefresh,
                                autoRefreshEnabled: false
                            },
                            autoRefreshTimer: null
                        }));

                        get().showToast({
                            type: 'info',
                            message: '⏹️ Auto-refresh disabled',
                            duration: 2000
                        });
                    },

                    getGlobalRefreshStatus: () => {
                        const { globalRefresh } = get();
                        return {
                            ...globalRefresh,
                            // Add computed properties for easier use in components
                            hasErrors: globalRefresh.refreshErrors.length > 0,
                            isHealthy: globalRefresh.refreshStatus === 'success' && globalRefresh.refreshErrors.length === 0,
                            lastRefreshAgo: globalRefresh.lastRefreshTimestamp
                                ? Date.now() - new Date(globalRefresh.lastRefreshTimestamp).getTime()
                                : null
                        };
                    },

                    resetRefreshErrors: () => {
                        console.log('🔄 Clearing refresh errors');
                        set(state => ({
                            ...state,
                            globalRefresh: {
                                ...state.globalRefresh,
                                refreshErrors: []
                            }
                        }));
                    },

                    // ✅ ALL EXISTING ACTIONS PRESERVED (keeping all existing methods exactly the same)
                    // ... (rest of the existing actions remain unchanged)

                    // ✅ NEW: Authentication actions
                    initializeAuth: async () => {
                        console.log('🔐 Initializing authentication...');

                        try {
                            // Subscribe to auth state changes
                            const unsubscribe = authService.subscribeToAuthChanges((authState) => {
                                console.log('🔐 Auth state changed:', authState.isAuthenticated);

                                set(state => ({
                                    ...state,
                                    auth: {
                                        user: authState.user,
                                        session: authState.session,
                                        isAuthenticated: authState.isAuthenticated,
                                        isLoading: authState.isLoading,
                                        error: null
                                    }
                                }));

                                // Reload data when authentication status changes
                                if (authState.isAuthenticated && !authState.isLoading) {
                                    console.log('✅ User authenticated, reloading data...');
                                    get().loadApplications();
                                    get().loadGoals();
                                }
                            });

                            // Store the subscription cleanup function
                            set(state => ({
                                ...state,
                                authSubscription: unsubscribe
                            }));

                            // Get current auth state
                            const currentAuth = authService.getAuthState();
                            set(state => ({
                                ...state,
                                auth: {
                                    user: currentAuth.user,
                                    session: currentAuth.session,
                                    isAuthenticated: currentAuth.isAuthenticated,
                                    isLoading: currentAuth.isLoading,
                                    error: null
                                }
                            }));

                            console.log('✅ Authentication initialized successfully');
                        } catch (error) {
                            console.error('❌ Authentication initialization failed:', error);
                            set(state => ({
                                ...state,
                                auth: {
                                    ...state.auth,
                                    isLoading: false,
                                    error: (error as Error).message
                                }
                            }));
                        }
                    },

                    signUp: async (email: string, password: string, displayName?: string) => {
                        console.log('📝 Signing up user:', email);

                        set(state => ({
                            ...state,
                            auth: {...state.auth, isLoading: true, error: null}
                        }));

                        try {
                            const result = await authService.signUp(email, password, displayName);

                            get().showToast({
                                type: 'success',
                                message: '🎉 Account created successfully! Please check your email to verify your account.',
                                duration: 6000
                            });

                            // Close auth modal
                            get().closeAuthModal();

                            console.log('✅ User signed up successfully');
                        } catch (error) {
                            console.error('❌ Sign up failed:', error);
                            const errorMessage = (error as any)?.message || 'Failed to create account';

                            set(state => ({
                                ...state,
                                auth: {...state.auth, isLoading: false, error: errorMessage}
                            }));

                            get().showToast({
                                type: 'error',
                                message: `❌ ${errorMessage}`,
                                duration: 5000
                            });
                        }
                    },

                    signIn: async (email: string, password: string) => {
                        console.log('🔑 Signing in user:', email);

                        set(state => ({
                            ...state,
                            auth: {...state.auth, isLoading: true, error: null}
                        }));

                        try {
                            const result = await authService.signIn(email, password);

                            get().showToast({
                                type: 'success',
                                message: '🎉 Welcome back! Your data is now synced across devices.',
                                duration: 5000
                            });

                            // Close auth modal
                            get().closeAuthModal();

                            console.log('✅ User signed in successfully');

                            // Track login event
                            get().trackEvent('user_signed_in', {
                                method: 'email',
                                timestamp: new Date().toISOString()
                            });
                        } catch (error) {
                            console.error('❌ Sign in failed:', error);
                            const errorMessage = (error as any)?.message || 'Failed to sign in';

                            set(state => ({
                                ...state,
                                auth: {...state.auth, isLoading: false, error: errorMessage}
                            }));

                            get().showToast({
                                type: 'error',
                                message: `❌ ${errorMessage}`,
                                duration: 5000
                            });
                        }
                    },

                    signOut: async () => {
                        console.log('🚪 Signing out user...');

                        set(state => ({
                            ...state,
                            auth: {...state.auth, isLoading: true, error: null}
                        }));

                        try {
                            await authService.signOut();

                            get().showToast({
                                type: 'info',
                                message: '👋 Signed out successfully. Your data is still saved locally.',
                                duration: 4000
                            });

                            console.log('✅ User signed out successfully');

                            // Track logout event
                            get().trackEvent('user_signed_out', {
                                timestamp: new Date().toISOString()
                            });
                        } catch (error) {
                            console.error('❌ Sign out failed:', error);
                            const errorMessage = (error as any)?.message || 'Failed to sign out';

                            set(state => ({
                                ...state,
                                auth: {...state.auth, isLoading: false, error: errorMessage}
                            }));

                            get().showToast({
                                type: 'error',
                                message: `❌ ${errorMessage}`,
                                duration: 5000
                            });
                        }
                    },

                    resetPassword: async (email: string) => {
                        console.log('🔑 Resetting password for:', email);

                        set(state => ({
                            ...state,
                            auth: {...state.auth, isLoading: true, error: null}
                        }));

                        try {
                            await authService.resetPassword(email);

                            get().showToast({
                                type: 'success',
                                message: '📧 Password reset email sent! Check your inbox.',
                                duration: 6000
                            });

                            // Close auth modal
                            get().closeAuthModal();

                            console.log('✅ Password reset email sent');
                        } catch (error) {
                            console.error('❌ Password reset failed:', error);
                            const errorMessage = (error as any)?.message || 'Failed to send reset email';

                            set(state => ({
                                ...state,
                                auth: {...state.auth, isLoading: false, error: errorMessage}
                            }));

                            get().showToast({
                                type: 'error',
                                message: `❌ ${errorMessage}`,
                                duration: 5000
                            });
                        }
                    },

                    openAuthModal: (mode: 'login' | 'signup' | 'reset') => {
                        console.log('🔐 Opening auth modal:', mode);

                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                auth: {
                                    loginOpen: mode === 'login',
                                    signupOpen: mode === 'signup',
                                    resetPasswordOpen: mode === 'reset',
                                    mode
                                }
                            },
                            auth: {...state.auth, error: null} // Clear any previous errors
                        }));

                        // Track modal open event
                        get().trackEvent('auth_modal_opened', {mode});
                    },

                    closeAuthModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                auth: {
                                    loginOpen: false,
                                    signupOpen: false,
                                    resetPasswordOpen: false,
                                    mode: undefined
                                }
                            },
                            auth: {...state.auth, error: null} // Clear any errors
                        }));
                    },

                    getAuthStatus: () => {
                        const {auth} = get();
                        return {
                            isAuthenticated: auth.isAuthenticated,
                            user: auth.user,
                            isLoading: auth.isLoading,
                            error: auth.error
                        };
                    },

                    // ✅ ALL EXISTING ACTIONS PRESERVED (unchanged implementation)
                    // Real-time admin actions
                    enableRealtimeAdmin: () => {
                        const cleanup = realtimeAdminService.subscribeToRealtimeUpdates((data) => {
                            if (data.userMetrics) {
                                set(state => ({
                                    ...state,
                                    adminAnalytics: data,
                                    lastAdminUpdate: new Date().toISOString()
                                }));

                                get().showToast({
                                    type: 'info',
                                    message: '📊 Admin data updated in real-time',
                                    duration: 2000
                                });
                            }
                        });

                        set(state => ({
                            ...state,
                            isAdminRealtime: true,
                            adminSubscription: cleanup
                        }));

                        console.log('🔄 Real-time admin mode enabled');
                    },

                    disableRealtimeAdmin: () => {
                        const {adminSubscription} = get();
                        if (adminSubscription) {
                            adminSubscription();
                        }

                        set(state => ({
                            ...state,
                            isAdminRealtime: false,
                            adminSubscription: null
                        }));

                        console.log('⏹️ Real-time admin mode disabled');
                    },

                    loadRealtimeAdminAnalytics: async () => {
                        try {
                            set(state => ({
                                ...state,
                                ui: {...state.ui, isLoading: true}
                            }));

                            const analytics = await realtimeAdminService.getRealtimeAdminAnalytics();

                            set(state => ({
                                ...state,
                                adminAnalytics: analytics,
                                lastAdminUpdate: new Date().toISOString(),
                                ui: {...state.ui, isLoading: false}
                            }));

                            console.log('📊 Real-time admin analytics loaded');
                        } catch (error) {
                            console.error('Failed to load real-time admin analytics:', error);
                            get().loadAdminAnalytics();
                            get().showToast({
                                type: 'warning',
                                message: 'Using local data - cloud unavailable'
                            });
                        }
                    },

                    loadRealtimeFeedbackSummary: async () => {
                        try {
                            const feedback = await realtimeAdminService.getRealtimeFeedbackSummary();

                            set(state => ({
                                ...state,
                                adminFeedback: feedback,
                                lastAdminUpdate: new Date().toISOString()
                            }));

                            console.log('💬 Real-time feedback summary loaded');
                        } catch (error) {
                            console.error('Failed to load real-time feedback:', error);
                            get().loadAdminFeedback();
                        }
                    },

                    // ✅ PHASE 2: Enhanced refreshAdminData (now calls unified refresh)
                    refreshAdminData: async () => {
                        console.log('🔄 Legacy refreshAdminData called - redirecting to unified refresh...');
                        await get().refreshAllAdminData();
                    },

                    getAdminConnectionStatus: () => {
                        const {isAdminRealtime, lastAdminUpdate, globalRefresh} = get();

                        return {
                            isRealtime: isAdminRealtime,
                            isConnected: !!process.env.REACT_APP_SUPABASE_URL,
                            lastUpdate: globalRefresh.lastRefreshTimestamp || lastAdminUpdate,
                            mode: isAdminRealtime ? 'Real-time Cloud' : 'Local Only'
                        };
                    },

                    // ✅ ALL OTHER EXISTING ACTIONS REMAIN EXACTLY THE SAME
                    // (All existing methods preserved with exact same implementation)
                    loadApplications: async () => {
                        set(state => ({...state, ui: {...state.ui, isLoading: true, error: null}}));
                        try {
                            const applications = await databaseService.getApplications();
                            set({
                                applications,
                                filteredApplications: applications,
                                ui: {...get().ui, isLoading: false}
                            });
                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            set(state => ({
                                ...state,
                                ui: {
                                    ...state.ui,
                                    isLoading: false,
                                    error: (error as Error).message
                                }
                            }));
                        }
                    },

                    addApplication: async (applicationData) => {
                        try {
                            const newApplication = await databaseService.addApplication(applicationData);
                            set(state => {
                                const updatedApplications = [newApplication, ...state.applications];
                                const filteredApplications = state.ui.searchQuery
                                    ? updatedApplications.filter(app => {
                                        const searchFields = [
                                            app.company,
                                            app.position,
                                            app.location,
                                            app.jobSource
                                        ].filter(Boolean).join(' ').toLowerCase();
                                        return searchFields.includes(state.ui.searchQuery.toLowerCase());
                                    })
                                    : updatedApplications;

                                return {
                                    ...state,
                                    applications: updatedApplications,
                                    filteredApplications
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: 'Application added successfully!',
                                duration: 3000
                            });

                            get().trackEvent('application_created', {
                                company: applicationData.company,
                                type: applicationData.type
                            });

                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                                get().checkMilestones();

                                const {ui} = get();
                                if (ui.admin?.dashboardOpen && ui.admin?.authenticated) {
                                    console.log('🔄 Auto-refreshing admin dashboard...');
                                    get().loadAdminAnalytics();
                                }
                            });
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to add application: ' + (error as Error).message
                            });
                        }
                    },

                    // ✅ CONTINUING WITH ALL OTHER EXISTING METHODS...
                    // (All remaining methods stay exactly the same - showing just a few for brevity)

                    updateApplication: async (id, updates) => {
                        try {
                            await databaseService.updateApplication(id, updates);
                            set(state => {
                                const applications = state.applications.map(app =>
                                    app.id === id ? {...app, ...updates, updatedAt: new Date().toISOString()} : app
                                );
                                const filteredApplications = state.ui.searchQuery
                                    ? applications.filter(app => {
                                        const searchFields = [
                                            app.company,
                                            app.position,
                                            app.location,
                                            app.jobSource
                                        ].filter(Boolean).join(' ').toLowerCase();
                                        return searchFields.includes(state.ui.searchQuery.toLowerCase());
                                    })
                                    : applications;

                                return {
                                    ...state,
                                    applications,
                                    filteredApplications
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: 'Application updated successfully!'
                            });

                            get().trackEvent('application_updated', {
                                applicationId: id,
                                updatedFields: Object.keys(updates)
                            });

                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to update application: ' + (error as Error).message
                            });
                        }
                    },

                    deleteApplication: async (id) => {
                        const state = get();

                        if (state.ui.isLoading) {
                            console.log('🚫 Delete prevented - operation in progress');
                            return;
                        }

                        try {
                            set(state => ({
                                ...state,
                                ui: {...state.ui, isLoading: true}
                            }));

                            await databaseService.deleteApplication(id);

                            set(state => {
                                const applications = (state.applications || []).filter(app => app && app.id !== id);
                                const filteredApplications = (state.filteredApplications || []).filter(app => app && app.id !== id);

                                return {
                                    ...state,
                                    applications,
                                    filteredApplications,
                                    ui: {
                                        ...state.ui,
                                        isLoading: false,
                                        selectedApplicationIds: (state.ui?.selectedApplicationIds || []).filter(selectedId => selectedId !== id)
                                    }
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: 'Application deleted successfully!'
                            });

                            await get().trackEvent('application_deleted', {applicationId: id});

                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            console.error('Delete application error:', error);

                            set(state => ({
                                ...state,
                                ui: {...state.ui, isLoading: false}
                            }));

                            get().showToast({
                                type: 'error',
                                message: 'Failed to delete application: ' + (error as Error).message
                            });
                        }
                    },

                    // ✅ Implementing all remaining existing methods with exact same logic...
                    // (Continuing with all other existing methods - truncated for space)

                    deleteApplications: async (ids) => {
                        try {
                            await databaseService.deleteApplications(ids);
                            set(state => {
                                const applications = state.applications.filter(app => !ids.includes(app.id));
                                const filteredApplications = state.filteredApplications.filter(app => !ids.includes(app.id));
                                return {
                                    ...state,
                                    applications,
                                    filteredApplications,
                                    ui: {...state.ui, selectedApplicationIds: []}
                                };
                            });
                            get().showToast({
                                type: 'success',
                                message: `${ids.length} applications deleted successfully!`
                            });
                            get().trackEvent('applications_bulk_deleted', {count: ids.length});
                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to delete applications: ' + (error as Error).message
                            });
                        }
                    },

                    updateApplicationStatus: async (ids, status) => {
                        try {
                            const updates = {status};
                            await databaseService.bulkUpdateApplications(ids, updates);
                            set(state => {
                                const applications = state.applications.map(app =>
                                    ids.includes(app.id) ? {...app, status, updatedAt: new Date().toISOString()} : app
                                );
                                const filteredApplications = state.ui.searchQuery
                                    ? applications.filter(app => {
                                        const searchFields = [
                                            app.company,
                                            app.position,
                                            app.location,
                                            app.jobSource
                                        ].filter(Boolean).join(' ').toLowerCase();
                                        return searchFields.includes(state.ui.searchQuery.toLowerCase());
                                    })
                                    : applications;
                                return {
                                    ...state,
                                    applications,
                                    filteredApplications,
                                    ui: {...state.ui, selectedApplicationIds: []}
                                };
                            });
                            get().showToast({
                                type: 'success',
                                message: `${ids.length} applications updated to ${status}!`
                            });
                            get().trackEvent('applications_status_updated', {count: ids.length, status});
                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to update application status: ' + (error as Error).message
                            });
                        }
                    },

                    bulkDeleteApplications: async (ids) => {
                        return get().deleteApplications(ids);
                    },

                    bulkUpdateApplications: async (ids, updates) => {
                        try {
                            await databaseService.bulkUpdateApplications(ids, updates);
                            set(state => {
                                const applications = state.applications.map(app =>
                                    ids.includes(app.id) ? {
                                        ...app, ...updates,
                                        updatedAt: new Date().toISOString()
                                    } : app
                                );
                                const filteredApplications = state.ui.searchQuery
                                    ? applications.filter(app => {
                                        const searchFields = [
                                            app.company,
                                            app.position,
                                            app.location,
                                            app.jobSource
                                        ].filter(Boolean).join(' ').toLowerCase();
                                        return searchFields.includes(state.ui.searchQuery.toLowerCase());
                                    })
                                    : applications;
                                return {
                                    ...state,
                                    applications,
                                    filteredApplications,
                                    ui: {...state.ui, selectedApplicationIds: []}
                                };
                            });
                            get().showToast({
                                type: 'success',
                                message: `${ids.length} applications updated successfully!`
                            });
                            get().trackEvent('applications_bulk_updated', {count: ids.length});
                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to update applications: ' + (error as Error).message
                            });
                        }
                    },

                    bulkAddApplications: async (applications) => {
                        try {
                            let successCount = 0;
                            let errorCount = 0;
                            const addedApplications: Application[] = [];

                            for (const appData of applications) {
                                try {
                                    const newApplication = await databaseService.addApplication(appData);
                                    addedApplications.push(newApplication);
                                    successCount++;
                                } catch (error) {
                                    errorCount++;
                                    console.error('Failed to add application:', error);
                                }
                            }

                            if (addedApplications.length > 0) {
                                set(state => ({
                                    ...state,
                                    applications: [...addedApplications, ...state.applications],
                                    filteredApplications: [...addedApplications, ...state.filteredApplications]
                                }));
                            }

                            if (successCount > 0) {
                                get().showToast({
                                    type: 'success',
                                    message: `Successfully imported ${successCount} applications!${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
                                    duration: 5000
                                });
                                get().trackEvent('applications_bulk_imported', {successCount, errorCount});
                            } else {
                                get().showToast({
                                    type: 'error',
                                    message: 'Failed to import applications. Please check the file format.'
                                });
                            }

                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                                get().checkMilestones();
                            });

                            return {successCount, errorCount};
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Import failed: ' + (error as Error).message
                            });
                            return {successCount: 0, errorCount: applications.length};
                        }
                    },

                    searchApplications: (query) => {
                        set(state => ({
                            ...state,
                            ui: {...state.ui, searchQuery: query}
                        }));

                        if (!query || query.trim() === '') {
                            set(state => ({
                                ...state,
                                filteredApplications: state.applications,
                                ui: {...state.ui, currentPage: 1}
                            }));
                            return;
                        }

                        const {applications} = get();
                        debouncedSearch(query, applications);
                        get().trackEvent('search_performed', {query: query.substring(0, 20)});
                    },

                    clearSearch: () => {
                        set(state => ({
                            ...state,
                            ui: {...state.ui, searchQuery: ''},
                            filteredApplications: state.applications
                        }));
                    },

                    handleImport: async (importedApplications) => {
                        const applicationsToAdd = importedApplications.map(app => {
                            const {id, createdAt, updatedAt, ...appData} = app;
                            return appData;
                        });
                        return await get().bulkAddApplications(applicationsToAdd);
                    },

                    loadGoals: async () => {
                        try {
                            const goals = await databaseService.getGoals();
                            set(state => ({...state, goals}));
                            get().calculateProgress();
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to load goals: ' + (error as Error).message
                            });
                        }
                    },

                    updateGoals: async (newGoals) => {
                        try {
                            await databaseService.updateGoals(newGoals);
                            set(state => ({...state, goals: newGoals}));
                            optimizedCache.invalidatePattern('goal-');
                            get().calculateProgress();
                            get().showToast({
                                type: 'success',
                                message: 'Goals updated successfully!'
                            });
                            get().trackEvent('goals_updated', {
                                totalGoal: newGoals.totalGoal,
                                weeklyGoal: newGoals.weeklyGoal,
                                monthlyGoal: newGoals.monthlyGoal
                            });
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to update goals: ' + (error as Error).message
                            });
                        }
                    },

                    calculateProgress: () => {
                        const {applications, goals} = get();
                        const goalProgress = calculateGoalProgress(applications, goals);
                        set(state => ({...state, goalProgress}));
                    },

                    checkMilestones: () => {
                        const {applications, showToast} = get();
                        checkMilestones(applications.length, showToast);
                    },

                    setTheme: (theme) => {
                        set(state => ({...state, ui: {...state.ui, theme}}));
                        document.documentElement.classList.toggle('dark', theme === 'dark');
                        get().trackEvent('theme_changed', {theme});
                    },

                    toggleSidebar: () => {
                        set(state => ({...state, ui: {...state.ui, sidebarOpen: !state.ui.sidebarOpen}}));
                        get().trackFeatureUsage('sidebar_toggle');
                    },

                    setCurrentPage: (page) => {
                        set(state => ({...state, ui: {...state.ui, currentPage: page}}));
                    },

                    setSearchQuery: (query) => {
                        get().searchApplications(query);
                    },

                    setSelectedApplicationIds: (ids) => {
                        set(state => ({...state, ui: {...state.ui, selectedApplicationIds: ids}}));
                    },

                    clearSelection: () => {
                        set(state => ({...state, ui: {...state.ui, selectedApplicationIds: []}}));
                    },

                    setLoading: (loading) => {
                        set(state => ({...state, ui: {...state.ui, isLoading: loading}}));
                    },

                    setError: (error) => {
                        set(state => ({...state, ui: {...state.ui, error}}));
                    },

                    setSelectedTab: (tab) => {
                        set(state => ({...state, ui: {...state.ui, selectedTab: tab}}));
                        get().trackPageView(tab);
                    },

                    openEditModal: (application) => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                editApplication: {isOpen: true, application}
                            }
                        }));
                        get().trackFeatureUsage('edit_modal_opened');
                    },

                    closeEditModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                editApplication: {isOpen: false}
                            }
                        }));
                    },

                    openGoalModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                goalSetting: {isOpen: true}
                            }
                        }));
                        get().trackFeatureUsage('goal_modal_opened');
                    },

                    closeGoalModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                goalSetting: {isOpen: false}
                            }
                        }));
                    },

                    openMilestone: (message) => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                milestone: {isOpen: true, message}
                            }
                        }));
                    },

                    closeMilestone: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                milestone: {isOpen: false}
                            }
                        }));
                    },

                    showToast: (toast) => {
                        const now = Date.now();
                        const DUPLICATE_THRESHOLD = 2000;
                        const currentToasts = get().toasts;

                        const isDuplicate = currentToasts.some(t => {
                            const toastTimestamp = parseInt(t.id.substring(0, 8), 36) * 1000;
                            const timeDiff = now - toastTimestamp;

                            return t.message === toast.message &&
                                t.type === toast.type &&
                                timeDiff < DUPLICATE_THRESHOLD;
                        });

                        if (isDuplicate) {
                            console.log('🚫 Duplicate toast prevented:', toast.message);
                            return;
                        }

                        const timestamp = Math.floor(now / 1000).toString(36);
                        const random = Math.random().toString(36).substr(2, 5);
                        const id = `${timestamp}-${random}`;

                        const newToast = {...toast, id};

                        set(state => {
                            const filteredToasts = state.toasts.filter(t => {
                                const toastTimestamp = parseInt(t.id.substring(0, 8), 36) * 1000;
                                return (now - toastTimestamp) < 30000;
                            });

                            return {
                                ...state,
                                toasts: [newToast, ...filteredToasts.slice(0, 2)]
                            };
                        });

                        const duration = toast.duration || 5000;
                        setTimeout(() => {
                            get().removeToast(id);
                        }, duration);
                    },

                    removeToast: (id) => {
                        set(state => ({...state, toasts: state.toasts.filter(toast => toast.id !== id)}));
                    },

                    calculateAnalytics: () => {
                        const {applications} = get();

                        const statusDistribution = applications.reduce((acc: Record<string, number>, app) => {
                            acc[app.status] = (acc[app.status] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>);

                        const completeStatusDistribution = {
                            Applied: statusDistribution['Applied'] || 0,
                            Interview: statusDistribution['Interview'] || 0,
                            Offer: statusDistribution['Offer'] || 0,
                            Rejected: statusDistribution['Rejected'] || 0
                        };

                        const typeDistribution = applications.reduce((acc: Record<string, number>, app) => {
                            acc[app.type] = (acc[app.type] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>);

                        const completeTypeDistribution = {
                            Onsite: typeDistribution['Onsite'] || 0,
                            Remote: typeDistribution['Remote'] || 0,
                            Hybrid: typeDistribution['Hybrid'] || 0
                        };

                        const sourceDistribution = applications.reduce((acc: Record<string, number>, app) => {
                            const source = app.jobSource || 'Unknown';
                            acc[source] = (acc[source] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>);

                        const sourceSuccessRates: SourceSuccessRate[] = Object.keys(sourceDistribution).map(source => {
                            const sourceApps = applications.filter(app => (app.jobSource || 'Unknown') === source);
                            const total = sourceApps.length;
                            const offers = sourceApps.filter(app => app.status === 'Offer').length;
                            const interviews = sourceApps.filter(app => app.status === 'Interview' || app.status === 'Offer').length;

                            return {
                                source,
                                total,
                                offers,
                                interviews,
                                successRate: total > 0 ? (offers / total) * 100 : 0,
                                interviewRate: total > 0 ? (interviews / total) * 100 : 0
                            };
                        });

                        const offers = completeStatusDistribution.Offer;
                        const successRate = applications.length > 0 ? (offers / applications.length) * 100 : 0;

                        const interviewApps = applications.filter(app => app.status === 'Interview');
                        const responseTimes = interviewApps.map(app => {
                            const appliedDate = new Date(app.dateApplied);
                            const now = new Date();
                            return (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);
                        });
                        const averageResponseTime = responseTimes.length > 0
                            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
                            : 0;

                        const monthlyTrend = applications.reduce((acc: Array<{
                            month: string;
                            count: number
                        }>, app) => {
                            const date = new Date(app.dateApplied);
                            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                            const existing = acc.find(item => item.month === monthKey);

                            if (existing) {
                                existing.count++;
                            } else {
                                acc.push({month: monthKey, count: 1});
                            }

                            return acc;
                        }, [] as Array<{ month: string; count: number }>);

                        const analytics = {
                            statusDistribution: completeStatusDistribution,
                            typeDistribution: completeTypeDistribution,
                            sourceDistribution,
                            sourceSuccessRates,
                            successRate,
                            averageResponseTime,
                            totalApplications: applications.length,
                            monthlyTrend: monthlyTrend.sort((a, b) => a.month.localeCompare(b.month))
                        };

                        set(state => ({...state, analytics}));
                    },

                    initializeAnalytics: async () => {
                        try {
                            const settings: AnalyticsSettings = analyticsService.isEnabled() ? {
                                enabled: true,
                                consentGiven: true,
                                trackingLevel: 'standard'
                            } : {
                                enabled: false,
                                consentGiven: false,
                                trackingLevel: 'minimal'
                            };

                            set(state => ({...state, analyticsSettings: settings}));

                            if (settings.consentGiven) {
                                await analyticsService.initialize();
                                const userMetrics = await analyticsService.getUserMetrics();
                                set(state => ({...state, userMetrics}));
                            } else {
                                get().openAnalyticsConsent('first-visit');
                            }
                        } catch (error) {
                            console.warn('Analytics initialization failed:', error);
                        }
                    },

                    enableAnalytics: async (settings: Partial<AnalyticsSettings> = {}) => {
                        try {
                            await analyticsService.enableAnalytics(settings);
                            const analyticsSettings: AnalyticsSettings = {
                                enabled: true,
                                consentGiven: true,
                                consentDate: new Date().toISOString(),
                                trackingLevel: settings.trackingLevel || 'standard'
                            };

                            set(state => ({...state, analyticsSettings}));

                            const userMetrics = await analyticsService.getUserMetrics();
                            set(state => ({...state, userMetrics}));

                            get().showToast({
                                type: 'success',
                                message: 'Analytics enabled! Thank you for helping improve ApplyTrak.',
                                duration: 5000
                            });

                            analyticsService.trackEvent('analytics_enabled', {
                                trackingLevel: settings.trackingLevel || 'standard'
                            });
                        } catch (error) {
                            console.error('Failed to enable analytics:', error);
                            get().showToast({
                                type: 'error',
                                message: 'Failed to enable analytics.'
                            });
                        }
                    },

                    disableAnalytics: () => {
                        analyticsService.disableAnalytics();
                        set(state => ({
                            ...state,
                            analyticsSettings: {
                                enabled: false,
                                consentGiven: false,
                                trackingLevel: 'minimal'
                            },
                            userMetrics: null
                        }));

                        get().showToast({
                            type: 'info',
                            message: 'Analytics disabled and data cleared.',
                            duration: 3000
                        });
                    },

                    trackEvent: async (event: string, properties?: Record<string, any>) => {
                        if (analyticsService.isEnabled()) {
                            await analyticsService.trackEvent(event as any, properties);
                        }
                    },

                    trackPageView: async (page: string) => {
                        if (analyticsService.isEnabled()) {
                            await analyticsService.trackPageView(page);
                        }
                    },

                    trackFeatureUsage: async (feature: string, context?: Record<string, any>) => {
                        if (analyticsService.isEnabled()) {
                            await analyticsService.trackFeatureUsage(feature, context);
                        }
                    },

                    openAnalyticsConsent: (type = 'settings-change') => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                analyticsConsent: {isOpen: true, type}
                            }
                        }));
                    },

                    closeAnalyticsConsent: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                analyticsConsent: {isOpen: false}
                            }
                        }));
                    },

                    // Feedback Actions
                    openFeedbackModal: (initialType) => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                feedback: {isOpen: true, initialType}
                            }
                        }));
                        get().trackEvent('feedback_modal_opened', {initialType});
                    },

                    closeFeedbackModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                feedback: {isOpen: false}
                            }
                        }));
                    },

                    submitFeedback: async (type, rating, message, email) => {
                        try {
                            const feedback = await feedbackService.submitFeedback(type, rating, message, email);

                            set(state => ({
                                ...state,
                                feedbackList: [feedback, ...state.feedbackList]
                            }));

                            get().showToast({
                                type: 'success',
                                message: '🎉 Thank you for your feedback! This helps make ApplyTrak better.',
                                duration: 5000
                            });

                            get().closeFeedbackModal();
                        } catch (error) {
                            console.error('Feedback submission failed:', error);
                            get().showToast({
                                type: 'error',
                                message: 'Failed to submit feedback. Please try again.'
                            });
                        }
                    },

                    loadFeedbackList: () => {
                        const feedbackList = feedbackService.getAllFeedback();
                        set(state => ({...state, feedbackList}));
                    },

                    // Admin Actions
                    authenticateAdmin: (password) => {
                        if (password === ADMIN_PASSWORD) {
                            set(state => ({
                                ...state,
                                ui: {
                                    ...state.ui,
                                    admin: {
                                        ...state.ui.admin,
                                        authenticated: true
                                    }
                                }
                            }));

                            get().showToast({
                                type: 'success',
                                message: 'Admin access granted.',
                                duration: 3000
                            });

                            return true;
                        } else {
                            get().showToast({
                                type: 'error',
                                message: 'Invalid admin password.'
                            });
                            return false;
                        }
                    },

                    logoutAdmin: () => {
                        // ✅ PHASE 2: Enhanced admin logout with auto-refresh cleanup
                        const {autoRefreshTimer} = get();
                        if (autoRefreshTimer) {
                            clearInterval(autoRefreshTimer);
                        }

                        set(state => ({
                            ...state,
                            ui: {
                                ...state.ui,
                                admin: {
                                    authenticated: false,
                                    dashboardOpen: false,
                                    currentSection: 'overview'
                                }
                            },
                            adminAnalytics: null,
                            adminFeedback: null,
                            // ✅ PHASE 2: Reset global refresh state on logout
                            globalRefresh: {
                                isRefreshing: false,
                                lastRefreshTimestamp: null,
                                refreshStatus: 'idle',
                                autoRefreshEnabled: false,
                                autoRefreshInterval: 30,
                                refreshErrors: []
                            },
                            autoRefreshTimer: null
                        }));

                        get().showToast({
                            type: 'info',
                            message: 'Admin logged out.',
                            duration: 2000
                        });
                    },

                    loadAdminAnalytics: async () => {
                        try {
                            // ✅ UPDATED: Now authentication-aware admin analytics
                            const {applications, userMetrics, auth} = get();
                            const sessions = analyticsService.getAllSessions();
                            const events = await analyticsService.getAllEvents();

                            // ✅ Enhanced with authentication context
                            const adminAnalytics: AdminAnalytics = {
                                userMetrics: {
                                    totalUsers: auth.isAuthenticated ? 1 : 0,
                                    activeUsers: {
                                        daily: auth.isAuthenticated ? 1 : 0,
                                        weekly: auth.isAuthenticated ? 1 : 0,
                                        monthly: auth.isAuthenticated ? 1 : 0
                                    },
                                    newUsers: {
                                        today: 0,
                                        thisWeek: 0,
                                        thisMonth: 0
                                    }
                                },
                                usageMetrics: {
                                    totalSessions: sessions.length,
                                    averageSessionDuration: sessions.length > 0
                                        ? sessions.reduce((sum, s) => sum + Number(s.duration || 0), 0) / sessions.length
                                        : 0,
                                    totalApplicationsCreated: applications.length,
                                    featuresUsage: events.reduce((acc: Record<string, number>, event) => {
                                        if (event.event === 'feature_used' && event.properties?.feature) {
                                            acc[event.properties.feature] = (acc[event.properties.feature] || 0) + 1;
                                        }
                                        return acc;
                                    }, {} as Record<string, number>)
                                },
                                deviceMetrics: {
                                    mobile: userMetrics?.deviceType === 'mobile' ? 1 : 0,
                                    desktop: userMetrics?.deviceType === 'desktop' ? 1 : 0
                                },
                                engagementMetrics: {
                                    dailyActiveUsers: [],
                                    featureAdoption: [],
                                    userRetention: {
                                        day1: 0,
                                        day7: 0,
                                        day30: 0
                                    }
                                }
                            };

                            set(state => ({...state, adminAnalytics}));
                            console.log('✅ Admin analytics loaded with', applications.length, 'applications');
                        } catch (error) {
                            console.error('Failed to load admin analytics:', error);
                        }
                    },

                    loadAdminFeedback: async () => {
                        try {
                            const stats = feedbackService.getFeedbackStats();
                            const recentFeedback = feedbackService.getRecentFeedback(10);

                            const adminFeedback: AdminFeedbackSummary = {
                                totalFeedback: stats.totalSubmissions,
                                unreadFeedback: recentFeedback.filter((f: FeedbackSubmission) => !f.metadata?.read).length,
                                averageRating: stats.averageRating,
                                recentFeedback,
                                feedbackTrends: {
                                    bugs: stats.typeDistribution.bug,
                                    features: stats.typeDistribution.feature,
                                    general: stats.typeDistribution.general,
                                    love: stats.typeDistribution.love
                                },
                                topIssues: []
                            };

                            set(state => ({...state, adminFeedback}));
                        } catch (error) {
                            console.error('Failed to load admin feedback:', error);
                        }
                    },

                    // ✅ UPDATED: Enhanced openAdminDashboard with authentication awareness
                    openAdminDashboard: () => {
                        set(state => ({
                            ...state,
                            ui: {
                                ...state.ui,
                                admin: {
                                    ...state.ui.admin,
                                    dashboardOpen: true
                                }
                            }
                        }));

                        // Load real-time data if available, otherwise fallback to local
                        if (process.env.REACT_APP_SUPABASE_URL) {
                            get().loadRealtimeAdminAnalytics();
                            get().loadRealtimeFeedbackSummary();
                            get().enableRealtimeAdmin();
                        } else {
                            get().loadAdminAnalytics();
                            get().loadAdminFeedback();
                        }
                    },

                    // ✅ UPDATED: Enhanced closeAdminDashboard with cleanup
                    closeAdminDashboard: () => {
                        // ✅ PHASE 2: Cleanup auto-refresh timer
                        const {autoRefreshTimer} = get();
                        if (autoRefreshTimer) {
                            clearInterval(autoRefreshTimer);
                        }

                        // Cleanup real-time subscriptions
                        get().disableRealtimeAdmin();

                        set(state => ({
                            ...state,
                            ui: {
                                ...state.ui,
                                admin: {
                                    ...state.ui.admin,
                                    dashboardOpen: false
                                }
                            },
                            // ✅ PHASE 2: Reset auto-refresh state
                            globalRefresh: {
                                ...state.globalRefresh,
                                autoRefreshEnabled: false
                            },
                            autoRefreshTimer: null
                        }));
                    },

                    setAdminSection: (section) => {
                        set(state => ({
                            ...state,
                            ui: {
                                ...state.ui,
                                admin: {
                                    ...state.ui.admin,
                                    currentSection: section
                                }
                            }
                        }));
                    },
                };
            },
            {
                name: 'applytrak-store',
                partialize: (state: AppState) => ({
                    ui: {
                        theme: state.ui?.theme || 'light',
                        itemsPerPage: state.ui?.itemsPerPage || 10,
                        selectedTab: state.ui?.selectedTab || 'tracker',
                        feedback: {
                            buttonVisible: state.ui?.feedback?.buttonVisible ?? true
                        },
                        admin: {
                            authenticated: false, // ✅ Always reset admin auth on persist
                            dashboardOpen: false,
                            currentSection: state.ui?.admin?.currentSection || 'overview'
                        }
                    },
                    goals: state.goals,
                    analyticsSettings: state.analyticsSettings,
                    // ✅ NEW: Don't persist authentication state (security)
                    // auth: undefined - Let authentication re-initialize on app load
                    isAdminRealtime: false, // ✅ Reset real-time state on persist (security)
                    autoRefreshPreferences: {
                        enabled: state.globalRefresh.autoRefreshEnabled,
                        interval: state.globalRefresh.autoRefreshInterval
                    }
                }),
                onRehydrateStorage: () => (state: AppState | undefined) => {
                    if (state) {
                        // ✅ EXISTING: Ensure admin state exists after rehydration
                        if (!state.ui) {
                            state.ui = {} as UIState;
                        }
                        if (!state.ui.admin) {
                            state.ui.admin = {
                                authenticated: false,
                                dashboardOpen: false,
                                currentSection: 'overview'
                            };
                        }
                        if (!state.ui.analytics) {
                            state.ui.analytics = {
                                consentModalOpen: false,
                                settingsOpen: false,
                            };
                        }
                        if (!state.ui.feedback) {
                            state.ui.feedback = {
                                buttonVisible: true,
                                modalOpen: false,
                                lastSubmissionDate: undefined,
                            };
                        }

                        // ✅ NEW: Ensure auth modal state exists
                        if (!state.modals.auth) {
                            state.modals.auth = {
                                loginOpen: false,
                                signupOpen: false,
                                resetPasswordOpen: false,
                                mode: undefined
                            };
                        }

                        // ✅ NEW: Initialize authentication state (will be updated by initializeAuth)
                        state.auth = {
                            user: null,
                            session: null,
                            isAuthenticated: false,
                            isLoading: true,
                            error: null
                        };
                        state.authSubscription = null;

                        // ✅ EXISTING: Initialize real-time state
                        state.isAdminRealtime = false;
                        state.adminSubscription = null;
                        state.lastAdminUpdate = null;

                        // ✅ PHASE 2: Initialize global refresh state
                        state.globalRefresh = {
                            isRefreshing: false,
                            lastRefreshTimestamp: null,
                            refreshStatus: 'idle',
                            autoRefreshEnabled: false,
                            autoRefreshInterval: 30,
                            refreshErrors: []
                        };
                        state.autoRefreshTimer = null;

                        if (state.autoRefreshPreferences) {
                            state.globalRefresh = {
                                ...state.globalRefresh,
                                autoRefreshEnabled: false, // Always start disabled
                                autoRefreshInterval: state.autoRefreshPreferences.interval || 30
                            };
                        }

                        // ✅ EXISTING: Force admin to be logged out on page refresh for security
                        if (state.ui?.admin) {
                            state.ui.admin.authenticated = false;
                            state.ui.admin.dashboardOpen = false;
                        }

                        console.log('🔧 Store rehydrated with Phase 2: Unified Global Refresh System');
                    }
                }
            }
        )
    )
);