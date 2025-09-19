// src/store/useAppStore.ts - PRODUCTION READY WITH PRIVACY INTEGRATION
import {create} from 'zustand';
import {persist, subscribeWithSelector} from 'zustand/middleware';
import {startTransition} from 'react';
import {debounce} from 'lodash';
import {
    AdminAnalytics,
    AdminFeedbackSummary,
    AnalyticsData,
    Application,
    ApplicationStatus,
    AppUser,
    FeedbackSubmission,
    GoalProgress,
    Goals,
    SourceSuccessRate,
    UserMetrics,
    mapSupabaseUserToAppUser,
    mapSupabaseSession
} from '../types';
import {authService, databaseService, supabase, initializeSupabase} from '../services/databaseService';
import {analyticsService} from '../services/analyticsService';
import realtimeAdminService from '../services/realtimeAdminService';
import {feedbackService} from '../services/feedbackService';
import {verifyDatabaseAdmin} from "../utils/adminAuth";



// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PrivacyConsents {
    required: boolean;
    cloudSync: boolean;
    analytics: boolean;
    marketing: boolean;
}

interface PrivacySettings {
    analytics: boolean;
    marketing_consent: boolean;
    cloud_sync_consent: boolean;
    functional_cookies: boolean;
    tracking_level: 'minimal' | 'standard' | 'enhanced';
    data_retention_period: number;
    feedback?: boolean;
    data_sharing_consent?: boolean;
    updated_at?: string;
}

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

export interface AuthState {
    user: AppUser | null;
    session: any | null; // Keep as any for Supabase compatibility
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface GlobalRefreshState {
    isRefreshing: boolean;
    lastRefreshTimestamp: string | null;
    refreshStatus: 'idle' | 'refreshing' | 'success' | 'error';
    autoRefreshEnabled: boolean;
    autoRefreshInterval: number;
    autoRefreshIntervalSeconds: number;
    refreshErrors: string[];
}

export interface UIState {
    theme: 'light' | 'dark';
    searchQuery: string;
    isLoading: boolean;
    error: string | null;
    selectedTab: 'home' | 'applications' | 'goals' | 'analytics' | 'achievements' | 'profile' | 'features';
    showMarketingPage: boolean;
    analytics: {
        consentModalOpen: boolean;
        settingsOpen: false;
    };
    feedback: {
        buttonVisible: boolean;
        modalOpen: boolean;
        lastSubmissionDate?: string;
    };
    admin: {
        authenticated: boolean;
        dashboardOpen: boolean;
        currentSection: 'overview' | 'analytics' | 'feedback' | 'users';
    };
}

export interface ModalState {
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
    feedback: {
        isOpen: boolean;
        initialType?: 'bug' | 'feature' | 'general' | 'love';
    };
    adminLogin: {
        isOpen: boolean;
        returnPath?: string;
    };
    auth: {
        loginOpen: boolean;
        signupOpen: boolean;
        resetPasswordOpen: boolean;
        mode?: 'login' | 'signup' | 'reset';
    };
    privacySettings: {
        isOpen: boolean;
    };
    editApplication: {
        isOpen: boolean;
        application?: Application | null;
    };
    welcomeTour: {
        isOpen: boolean;
    };
    upgrade: {
        isOpen: boolean;
        trigger?: 'limit_reached' | 'analytics' | 'general';
    };
}

export interface AppState {
    // Core Data
    applications: Application[];
    filteredApplications: Application[];
    goals: Goals;
    goalProgress: GoalProgress;
    analytics: AnalyticsData;

    userMetrics: UserMetrics | null;

    // Privacy State
    privacySettings: PrivacySettings | null;
    privacyConsents: PrivacyConsents | null;

    // UI State
    toasts: Toast[];
    ui: UIState;
    modals: ModalState;

    // Admin & Analytics
    feedbackList: FeedbackSubmission[];
    adminAnalytics: AdminAnalytics | null;
    adminFeedback: AdminFeedbackSummary | null;

    // System State
    auth: AuthState;
    authSubscription: (() => void) | null;
    isAdminRealtime: boolean;
    adminSubscription: (() => void) | null;
    lastAdminUpdate: string | null;
    globalRefresh: GlobalRefreshState;
    autoRefreshTimer: NodeJS.Timeout | null;
    autoRefreshPreferences?: {
        enabled: boolean;
        interval: number;
    };

    // Application Actions
    loadApplications: () => Promise<void>;
    addApplication: (application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
    deleteApplication: (id: string) => Promise<void>;
    deleteApplications: (ids: string[]) => Promise<void>;
    removeDuplicateApplications: () => Promise<void>;
    updateApplicationStatus: (ids: string[], status: ApplicationStatus) => Promise<void>;
    bulkDeleteApplications: (ids: string[]) => Promise<void>;
    bulkUpdateApplications: (ids: string[], updates: Partial<Application>) => Promise<void>;
    bulkAddApplications: (applications: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>[], options?: { silent?: boolean }) => Promise<{
        successCount: number;
        errorCount: number;
    }>;
    handleImport: (importedApplications: Application[]) => Promise<{ successCount: number; errorCount: number }>;

    // Search Actions
    searchApplications: (query: string) => void;

    // Goals Actions
    loadGoals: () => Promise<void>;
    updateGoals: (goals: Goals) => Promise<void>;
    calculateProgress: () => void;
    checkMilestones: () => void;

    // UI Actions
    setTheme: (theme: 'light' | 'dark') => void;
    setSearchQuery: (query: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSelectedTab: (tab: 'home' | 'applications' | 'goals' | 'analytics' | 'profile' | 'features') => void;
    setShowMarketingPage: (show: boolean) => void;
    resetMarketingPage: () => void;

    // Modal Actions
    openGoalModal: () => void;
    closeGoalModal: () => void;
    openMilestone: (message: string) => void;
    closeMilestone: () => void;
    openRecoveryModal: () => void;
    closeRecoveryModal: () => void;
    openAdminLoginModal: (returnPath?: string) => void;
    closeAdminLoginModal: () => void;

    // Toast Actions
    showToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    getToastCategory: (message: string) => string | null;
    getCategoryCooldown: (category: string) => number;
    clearToastTracking: () => void;

    // Analytics Actions
    calculateAnalytics: () => void;
    trackEvent: (event: string, properties?: Record<string, any>) => Promise<void>;
    trackFeatureUsage: (feature: string, context?: Record<string, any>) => Promise<void>;

    // Privacy Actions
    setPrivacySettings: (settings: PrivacySettings | null) => void;
    openPrivacySettings: () => void;
    closePrivacySettings: () => void;
    loadUserPrivacySettings: () => Promise<void>;

    // Feedback Actions
    openFeedbackModal: (initialType?: 'bug' | 'feature' | 'general' | 'love') => void;
    closeFeedbackModal: () => void;
    submitFeedback: (type: 'bug' | 'feature' | 'general' | 'love', rating: number, message: string, email?: string) => Promise<void>;
    loadFeedbackList: () => void;

    // Admin Actions
    authenticateAdmin: (password: string) => Promise<boolean>;
    logoutAdmin: () => void;
    loadAdminAnalytics: () => Promise<void>;
    loadAdminFeedback: () => Promise<void>;
    openAdminDashboard: () => void;
    closeAdminDashboard: () => void;
    setAdminSection: (section: 'overview' | 'analytics' | 'feedback' | 'users') => void;

    // Realtime Admin Actions
    enableRealtimeAdmin: () => void;
    disableRealtimeAdmin: () => void;
    loadRealtimeAdminAnalytics: () => Promise<void>;
    loadRealtimeFeedbackSummary: () => Promise<void>;
    getAdminConnectionStatus: () => {
        isRealtime: boolean;
        isConnected: boolean;
        lastUpdate: string | null;
        mode: string;
    };

    // Auth Actions
    initializeAuth: () => Promise<void>;
    signUp: (
        email: string,
        password: string,
        displayName?: string,
        privacyConsents?: PrivacyConsents
    ) => Promise<{ user: AppUser | null; error?: string }>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    openAuthModal: (mode: 'login' | 'signup' | 'reset') => void;
    closeAuthModal: () => void;
    openApplicationLimitModal: () => void;
    openWelcomeTourModal: () => void;
    closeWelcomeTourModal: () => void;
    openUpgradeModal: (trigger?: 'limit_reached' | 'analytics' | 'general') => void;
    closeUpgradeModal: () => void;
    openEditModal: (application: Application) => void;
    closeEditModal: () => void;

    syncLocalApplicationsToCloud: () => Promise<void>;


    // Global Refresh Actions
    refreshAllAdminData: () => Promise<void>;
    enableAutoRefresh: (intervalSeconds?: number) => void;
    disableAutoRefresh: () => void;
    getGlobalRefreshStatus: () => GlobalRefreshState;
    resetRefreshErrors: () => void;

    // System Actions
    cleanup: () => void;
    getConnectionStatus: () => {
        isOnline: boolean;
        supabaseConfigured: boolean;
        isAuthenticated: boolean;
        isRealtimeEnabled: boolean;
        lastRefresh: string | null;
        connectionType: 'cloud' | 'local';
        syncStatus: 'synced' | 'local-only';
        adminMode: 'saas_realtime' | 'local_realtime' | 'local_only';
    };
}

// ============================================================================
// UTILITY FUNCTIONS
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

// Removed unused safeParseInt function

const optimizedCache = createOptimizedCache();

const calculateGoalProgress = async (applications: Application[], goals: Goals, userId?: string): Promise<GoalProgress> => {
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

    // Get daily streak from user_metrics table instead of calculating from applications
    let dailyStreak = 0;
    if (userId) {
        try {
            const client = initializeSupabase();
            if (client) {
                const { data: userMetrics } = await client
                    .from('user_metrics')
                    .select('daily_streak')
                    .eq('userid', userId)
                    .single();
                
                dailyStreak = userMetrics?.daily_streak || 0;
            }
        } catch (error) {
            console.warn('Failed to fetch streak from user_metrics, falling back to calculation:', error);
            // Fallback to calculation if database read fails
            dailyStreak = calculateDailyStreak(applications);
        }
    } else {
        // Fallback to calculation if no userId
        dailyStreak = calculateDailyStreak(applications);
    }

    return {
        totalGoal: goals.totalGoal,
        weeklyGoal: goals.weeklyGoal,
        monthlyGoal: goals.monthlyGoal,
        totalProgress,
        weeklyProgress,
        monthlyProgress,
        dailyStreak,
        totalApplications,
        weeklyApplications,
        monthlyApplications
    };
};

// Calculate consecutive days with at least one application
const calculateDailyStreak = (applications: Application[]): number => {
    if (applications.length === 0) return 0;

    // Get unique dates when applications were submitted
    // Parse dateApplied as local date to avoid timezone issues
    const applicationDates = new Set(
        applications.map(app => {
            // Parse the date string as local date (YYYY-MM-DD format)
            const [year, month, day] = app.dateApplied.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return date.toDateString();
        })
    );

    // Convert to sorted array of dates
    const sortedDates = Array.from(applicationDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

    if (sortedDates.length === 0) return 0;

    // Calculate streak starting from today/yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = 0;
    let currentDate = new Date(today);

    // Check if we have applications today or yesterday to start the streak
    const hasToday = sortedDates.some(date => 
        date.getTime() === today.getTime()
    );
    const hasYesterday = sortedDates.some(date => 
        date.getTime() === yesterday.getTime()
    );

    if (!hasToday && !hasYesterday) {
        // No recent applications, streak is 0
        return 0;
    }

    // Start counting from the most recent day with applications
    if (hasToday) {
        currentDate = new Date(today);
    } else if (hasYesterday) {
        currentDate = new Date(yesterday);
    }

    // Count consecutive days backwards
    for (let i = 0; i < sortedDates.length; i++) {
        const appDate = new Date(sortedDates[i]);
        appDate.setHours(0, 0, 0, 0);

        if (appDate.getTime() === currentDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (appDate.getTime() < currentDate.getTime()) {
            // Gap found, streak ends
            break;
        }
    }

    return streak;
};

// Removed unused calculateAnalytics function

const checkMilestones = (applicationCount: number, showToast: (toast: Omit<Toast, 'id'>) => void) => {
    const milestones = [10, 25, 50, 100, 150, 200, 250, 500];
    const celebratedMilestones = JSON.parse(localStorage.getItem('celebratedMilestones') || '[]');

    const reachedMilestone = milestones.find(milestone =>
        applicationCount >= milestone && !celebratedMilestones.includes(milestone)
    );

    if (reachedMilestone) {
        showToast({
            type: 'success',
            message: `Milestone reached! You've submitted ${reachedMilestone} applications!`,
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
            
            // Performance optimization: use more efficient search for large datasets
            if (applications.length > 100) {
                // For large datasets, use Set for O(1) lookups
                const searchSet = new Set(searchTerm.split(' ').filter(Boolean));
                filtered = applications.filter(app => {
                    const searchFields = [
                        app.company,
                        app.position,
                        app.location,
                        app.jobSource,
                        app.notes
                    ].filter(Boolean);
                    
                    // Check if any search term matches any field
                    return searchFields.some(field => {
                        if (!field) return false;
                        const fieldLower = field.toLowerCase();
                        return searchSet.has(fieldLower) || fieldLower.includes(searchTerm);
                    });
                });
            } else {
                // For smaller datasets, use the original approach
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
        }

        setState((state: AppState) => ({
            filteredApplications: filtered,
            ui: {...state.ui, currentPage: 1}
        }));
    }, 300);
};

// Removed unused generateId function

// Configuration
//const ADMIN_PASSWORD = 'applytrak-admin-2024';//
const DUPLICATE_TOAST_THRESHOLD = 2000;
const AUTO_REFRESH_DEFAULT_INTERVAL = 30;
const MAX_TOAST_COUNT = 3;
const TOAST_CLEANUP_THRESHOLD = 30000;

// ============================================================================
// MAIN STORE IMPLEMENTATION
// ============================================================================

export const useAppStore = create<AppState>()(
    subscribeWithSelector(
        persist(
            (set, get): AppState => {
                const debouncedSearch = createDebouncedSearch(set);

                return {
                    // ============================================================================
                    // INITIAL STATE
                    // ============================================================================

                    applications: [],
                    filteredApplications: [],
                    goals: {totalGoal: 50, weeklyGoal: 5, monthlyGoal: 20},
                    toasts: [],
                    ui: {
                        theme: 'light',
            
                        searchQuery: '',
                        isLoading: false,
                        error: null,
                        selectedTab: (() => {
                            // Check if user has visited before
                            const hasVisitedBefore = localStorage.getItem('applytrak_has_visited');
                            if (!hasVisitedBefore) {
                                // First time visitor - show home tab
                                localStorage.setItem('applytrak_has_visited', 'true');
                                return 'home';
                            } else {
                                // Returning user - show applications tab
                                return 'applications';
                            }
                        })(),
                        showMarketingPage: true,
                        analytics: {
                            consentModalOpen: false,
                            settingsOpen: false,
                        },
                        feedback: {
                            buttonVisible: true,
                            modalOpen: false,
                        },
                        admin: {
                            authenticated: false,
                            dashboardOpen: false,
                            currentSection: 'overview'
                        },
                    },
                    modals: {
                        goalSetting: {isOpen: false},
                        milestone: {isOpen: false},
                        recovery: {isOpen: false},
                        feedback: {isOpen: false},
                        adminLogin: {isOpen: false},
                        auth: {
                            loginOpen: false,
                            signupOpen: false,
                            resetPasswordOpen: false
                        },
                        privacySettings: {isOpen: false},
                        editApplication: {isOpen: false, application: null},
                        welcomeTour: {isOpen: false},
                        upgrade: {isOpen: false},

                    },
                    goalProgress: {
                        totalGoal: 50,
                        weeklyGoal: 5,
                        monthlyGoal: 20,
                        totalProgress: 0,
                        weeklyProgress: 0,
                        monthlyProgress: 0,
                        dailyStreak: 0,
                        totalApplications: 0,
                        weeklyApplications: 0,
                        monthlyApplications: 0
                    },
                    analytics: {
                        statusDistribution: {Applied: 0, Interview: 0, Offer: 0, Rejected: 0},
                        typeDistribution: {Remote: 0, Onsite: 0, Hybrid: 0},
                        employmentTypeDistribution: {'Full-time': 0, Contract: 0, 'Part-time': 0, Internship: 0, '-': 0},
                        sourceDistribution: {},
                        sourceSuccessRates: [],
                        successRate: 0,
                        averageResponseTime: 0,
                        totalApplications: 0,
                        monthlyTrend: []
                    },

                    userMetrics: null,
                    feedbackList: [],
                    adminAnalytics: null,
                    adminFeedback: null,

                    // Privacy State
                    privacySettings: null,
                    privacyConsents: null,

                    // System State
                    isAdminRealtime: false,
                    adminSubscription: null,
                    lastAdminUpdate: null,
                    auth: {
                        user: null,
                        session: null,
                        isAuthenticated: false,
                        isLoading: true,
                        error: null
                    },
                    authSubscription: null,
                    globalRefresh: {
                        isRefreshing: false,
                        lastRefreshTimestamp: null,
                        refreshStatus: 'idle',
                        autoRefreshEnabled: false,
                        autoRefreshInterval: AUTO_REFRESH_DEFAULT_INTERVAL,
                        autoRefreshIntervalSeconds: AUTO_REFRESH_DEFAULT_INTERVAL,
                        refreshErrors: []
                    },
                    autoRefreshTimer: null,

                    // ============================================================================
                    // GLOBAL REFRESH SYSTEM
                    // ============================================================================

                    refreshAllAdminData: async () => {
                        console.log('Starting unified global admin refresh...');

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

                            console.log(`Executing ${refreshOperations.length} refresh operations...`);

                            const results = await Promise.allSettled(
                                refreshOperations.map(async ({name, operation}) => {
                                    try {
                                        await operation();
                                        console.log(`✅ ${name} - Success`);
                                        return {name, success: true};
                                    } catch (error) {
                                        console.error(`❌ ${name} - Error:`, error);
                                        const errorMessage = (error as Error).message;
                                        const errorType = errorMessage.includes('timeout') ? 'timeout' :
                                            errorMessage.includes('network') ? 'network' :
                                                errorMessage.includes('authentication') ? 'auth' :
                                                    errorMessage.includes('permission') ? 'permission' : 'unknown';

                                        errors.push(`${name}: ${errorMessage} (${errorType})`);
                                        return {name, success: false, error, errorType};
                                    }
                                })
                            );

                            const successCount = results.filter(result =>
                                result.status === 'fulfilled' && result.value.success
                            ).length;

                            const refreshDuration = Date.now() - startTime;
                            console.log(`Global refresh completed: ${successCount}/${refreshOperations.length} operations successful in ${refreshDuration}ms`);

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

                            const toastMessage = errors.length === 0
                                ? `All admin data refreshed successfully (${refreshDuration}ms)`
                                : `Refresh completed with ${errors.length} errors`;

                            get().showToast({
                                type: errors.length === 0 ? 'success' : 'warning',
                                message: toastMessage,
                                duration: errors.length === 0 ? 3000 : 5000
                            });

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
                            console.error('Global refresh failed:', error);

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
                                message: 'Global refresh failed',
                                duration: 5000
                            });
                        }
                    },

                    enableAutoRefresh: (intervalSeconds = AUTO_REFRESH_DEFAULT_INTERVAL) => {
                        console.log(`Enabling auto-refresh every ${intervalSeconds} seconds`);

                        const {autoRefreshTimer} = get();
                        if (autoRefreshTimer) {
                            clearInterval(autoRefreshTimer);
                        }

                        const timer = setInterval(() => {
                            const {ui, globalRefresh} = get();

                            const shouldRefresh =
                                ui.admin.dashboardOpen &&
                                !globalRefresh.isRefreshing &&
                                !document.hidden &&
                                navigator.onLine;

                            if (shouldRefresh) {
                                console.log('Auto-refresh triggered - all conditions met');
                                get().refreshAllAdminData();
                            } else {
                                console.log('Auto-refresh skipped - conditions not met:', {
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
                                autoRefreshInterval: intervalSeconds,
                                autoRefreshIntervalSeconds: intervalSeconds
                            },
                            autoRefreshTimer: timer
                        }));

                        get().showToast({
                            type: 'info',
                            message: `Auto-refresh enabled (${intervalSeconds}s intervals)`,
                            duration: 3000
                        });
                    },

                    disableAutoRefresh: () => {
                        console.log('Disabling auto-refresh');

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
                            message: 'Auto-refresh disabled',
                            duration: 2000
                        });
                    },

                    getGlobalRefreshStatus: () => {
                        const {globalRefresh} = get();
                        return {
                            isRefreshing: globalRefresh.isRefreshing,
                            lastRefreshTimestamp: globalRefresh.lastRefreshTimestamp,
                            refreshStatus: globalRefresh.refreshStatus,
                            autoRefreshEnabled: globalRefresh.autoRefreshEnabled,
                            autoRefreshInterval: globalRefresh.autoRefreshInterval,
                            autoRefreshIntervalSeconds: globalRefresh.autoRefreshIntervalSeconds,
                            refreshErrors: globalRefresh.refreshErrors
                        };
                    },

                    resetRefreshErrors: () => {
                        console.log('Clearing refresh errors');
                        set(state => ({
                            ...state,
                            globalRefresh: {
                                ...state.globalRefresh,
                                refreshErrors: []
                            }
                        }));
                    },

                    // ============================================================================
                    // AUTHENTICATION ACTIONS
                    // ============================================================================

                    initializeAuth: async () => {
                        console.log('Initializing authentication...');

                        try {
                            const unsubscribe = authService.subscribeToAuthChanges((authState) => {
                                console.log('Auth state changed:', authState.isAuthenticated);

                                set(state => ({
                                    ...state,
                                    auth: {
                                        user: mapSupabaseUserToAppUser(authState.user),
                                        session: mapSupabaseSession(authState.session),
                                        isAuthenticated: authState.isAuthenticated,
                                        isLoading: authState.isLoading,
                                        error: null
                                    }
                                }));

                                if (authState.isAuthenticated && !authState.isLoading) {
                                    console.log('User authenticated, reloading data...');
                                    
                                    // Debounce data loading to prevent multiple calls
                                    const lastDataLoad = localStorage.getItem('last_data_load');
                                    const now = Date.now();
                                    if (!lastDataLoad || (now - parseInt(lastDataLoad)) > 5000) { // 5 second cooldown
                                        get().loadApplications();
                                        get().loadGoals();
                                        
                                        // Sync local applications to cloud after authentication
                                        get().syncLocalApplicationsToCloud();
                                        localStorage.setItem('last_data_load', now.toString());
                                    }
                                }
                            });

                            set(state => ({
                                ...state,
                                authSubscription: unsubscribe
                            }));

                            const currentAuth = authService.getAuthState();
                            set(state => ({
                                ...state,
                                auth: {
                                    user: mapSupabaseUserToAppUser(currentAuth.user),
                                    session: mapSupabaseSession(currentAuth.session),
                                    isAuthenticated: currentAuth.isAuthenticated,
                                    isLoading: currentAuth.isLoading,
                                    error: null
                                }
                            }));

                            console.log('Authentication initialized successfully');
                        } catch (error) {
                            console.error('Authentication initialization failed:', error);
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

                    signUp: async (email, password, displayName, privacyConsents) => {
                        set((s) => ({...s, auth: {...s.auth, isLoading: true, error: null}}));

                        try {
                            // Normalize email to avoid case issues
                            const normalizedEmail = (email || '').trim().toLowerCase();

                            // 1) Create auth user
                            const result = await authService.signUp(normalizedEmail, password, displayName);
                            const authUser = result?.user;
                            if (!authUser) {
                                const msg = 'Failed to create account';
                                set((s) => ({...s, auth: {...s.auth, isLoading: false, error: msg}}));
                                return {user: null, error: msg};
                            }

                            const authExternalId: string | undefined = (authUser as any)?.id; // Supabase Auth UID

                            // 2) Ensure a row in public.users (prefer find-by-email, then insert)
                            if (!supabase) throw new Error('Supabase client not initialized');
                            let {data: dbUser, error: selErr} = await supabase
                                .from('users')
                                .select('id, externalid, email, display_name')
                                .eq('email', normalizedEmail)
                                .maybeSingle();

                            if (selErr) console.warn('users select warning:', selErr);

                            if (!dbUser) {
                                const tz =
                                    (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
                                const lang = (typeof navigator !== 'undefined' && navigator.language?.slice(0, 2)) || 'en';

                                const {data: inserted, error: insErr} = await supabase
                                    .from('users')
                                    .insert({
                                        email: normalizedEmail,
                                        display_name: displayName ?? null,
                                        timezone: tz,
                                        language: lang,
                                        // IMPORTANT: tie app user to auth user
                                        externalid: authExternalId ?? undefined,
                                    })
                                    .select('id, externalid, email, display_name')
                                    .single();

                                if (insErr || !inserted) {
                                    const msg = insErr?.message || 'Failed to create user profile';
                                    set((s) => ({...s, auth: {...s.auth, isLoading: false, error: msg}}));
                                    return {user: null, error: msg};
                                }
                                dbUser = inserted;
                            } else if (authExternalId && dbUser.externalid !== authExternalId) {
                                // backfill or correct externalid if missing/mismatched
                                const {error: updErr} = await supabase
                                    .from('users')
                                    .update({externalid: authExternalId})
                                    .eq('id', dbUser.id);
                                if (!updErr) dbUser.externalid = authExternalId;
                            }

                            // 3) Seed privacy + email preferences (best-effort; don't fail signup if these error)
                            try {
                                // FORCE optional consents OFF at signup (not collecting now)
                                const analytics = false;
                                const marketing = false;

                                if (!supabase) throw new Error('Supabase client not initialized');
                                await supabase.from('privacy_settings').upsert(
                                    {
                                        userid: dbUser.id,
                                        analytics,
                                        marketing_consent: marketing,
                                        cloud_sync_consent: !!privacyConsents?.cloudSync,
                                        functional_cookies: true,
                                        tracking_level: 'minimal',
                                        consent_version: '1.0',
                                        consent_date: new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                    },
                                    {onConflict: 'userid'}
                                );

                                // email preferences — keep or adjust to your defaults
                                if (!supabase) throw new Error('Supabase client not initialized');
                                await supabase.from('email_preferences').upsert(
                                    {
                                        userid: dbUser.id,
                                        weekly_goals: true,
                                        weekly_tips: true,
                                        updated_at: new Date().toISOString(),
                                    },
                                    {onConflict: 'userid'}
                                );
                            } catch (e) {
                                console.warn('Non-fatal: seeding preferences failed', e);
                            }

                            // 4) Done
                            set((s) => ({...s, auth: {...s.auth, isLoading: false, error: null}}));

                            const appUser: AppUser = {
                                id: dbUser.id,
                                external_id: dbUser.externalid,
                                email: dbUser.email,
                                display_name: dbUser.display_name ?? null,
                            };

                            return {user: appUser};
                        } catch (e: any) {
                            const msg = e?.message || 'Failed to sign up';
                            set((s) => ({...s, auth: {...s.auth, isLoading: false, error: msg}}));
                            return {user: null, error: msg};
                        }
                    },

                    signIn: async (email: string, password: string) => {
                        console.log('Signing in user:', email);

                        set(state => ({
                            ...state,
                            auth: {...state.auth, isLoading: true, error: null}
                        }));

                        try {
                            await authService.signIn(email, password);

                            // Load complete user data from database after successful sign-in
                            try {
                                const { supabase } = await import('../services/databaseService');
                                if (!supabase) {
                                    console.warn('Supabase client not available for user data loading');
                                    return;
                                }
                                
                                const { data: { session } } = await supabase.auth.getSession();
                                
                                if (session?.user) {
                                    // Get user data from database
                                    const { data: dbUser, error: dbError } = await supabase
                                        .from('users')
                                        .select('id, externalid, email, display_name')
                                        .eq('externalid', session.user.id)
                                        .maybeSingle();

                                    if (!dbError && dbUser) {
                                        // Update auth state with complete user data
                                        const appUser: AppUser = {
                                            id: dbUser.id,
                                            external_id: dbUser.externalid,
                                            email: dbUser.email,
                                            display_name: dbUser.display_name ?? null,
                                        };

                                        set(state => ({
                                            ...state,
                                            auth: {
                                                ...state.auth,
                                                user: appUser,
                                                isAuthenticated: true,
                                                isLoading: false,
                                                error: null
                                            }
                                        }));

                                        console.log('User data loaded from database:', appUser);
                                    }
                                }
                            } catch (userDataError) {
                                console.warn('Failed to load user data from database:', userDataError);
                                // Don't fail sign-in if user data loading fails
                            }

                            get().showToast({
                                type: 'success',
                                message: 'Welcome back! Your data is now synced across devices.',
                                duration: 5000
                            });

                            get().closeAuthModal();

                            console.log('User signed in successfully');

                            // Sync local applications to cloud after successful authentication
                            get().syncLocalApplicationsToCloud();

                            get().trackEvent('user_signed_in', {
                                method: 'email',
                                timestamp: new Date().toISOString()
                            });
                        } catch (error) {
                            console.error('Sign in failed:', error);
                            const errorMessage = (error as any)?.message || 'Failed to sign in';

                            set(state => ({
                                ...state,
                                auth: {...state.auth, isLoading: false, error: errorMessage}
                            }));

                            get().showToast({
                                type: 'error',
                                message: `${errorMessage}`,
                                duration: 5000
                            });
                        }
                    },

                    signOut: async () => {
                        console.log('Signing out user...');

                        set(state => ({
                            ...state,
                            auth: {...state.auth, isLoading: true, error: null}
                        }));

                        try {
                            await authService.signOut();

                            // Clear all toast tracking data on sign out
                            get().clearToastTracking();

                            set(state => ({
                                ...state,
                                auth: {
                                    user: null,
                                    session: null,
                                    isAuthenticated: false,
                                    isLoading: false,
                                    error: null
                                },
                                ui: {
                                    ...state.ui,
                                    admin: {
                                        ...state.ui.admin,
                                        authenticated: false,
                                        dashboardOpen: false
                                    }
                                },
                                adminAnalytics: null,
                                adminFeedback: null
                            }));

                            get().showToast({
                                type: 'info',
                                message: 'Signed out successfully. Your data is still saved locally.',
                                duration: 4000
                            });

                            console.log('User signed out successfully');

                            get().trackEvent('user_signed_out', {
                                timestamp: new Date().toISOString()
                            });
                        } catch (error) {
                            console.error('Sign out failed:', error);
                            const errorMessage = (error as any)?.message || 'Failed to sign out';

                            set(state => ({
                                ...state,
                                auth: {...state.auth, isLoading: false, error: errorMessage}
                            }));

                            get().showToast({
                                type: 'error',
                                message: `${errorMessage}`,
                                duration: 5000
                            });
                        }
                    },

                    resetPassword: async (email: string) => {
                        console.log('Resetting password for:', email);

                        set(state => ({
                            ...state,
                            auth: {...state.auth, isLoading: true, error: null}
                        }));

                        try {
                            await authService.resetPassword(email);

                            get().showToast({
                                type: 'success',
                                message: 'Password reset email sent! Check your inbox.',
                                duration: 6000
                            });

                            get().closeAuthModal();

                            console.log('Password reset email sent');
                        } catch (error) {
                            console.error('Password reset failed:', error);
                            const errorMessage = (error as any)?.message || 'Failed to send reset email';

                            set(state => ({
                                ...state,
                                auth: {...state.auth, isLoading: false, error: errorMessage}
                            }));

                            get().showToast({
                                type: 'error',
                                message: `${errorMessage}`,
                                duration: 5000
                            });
                        }
                    },

                    openAuthModal: (mode: 'login' | 'signup' | 'reset') => {
                        console.log('Opening auth modal:', mode);

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
                            auth: {...state.auth, error: null}
                        }));

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
                                    resetPasswordOpen: false
                                }
                            },
                            auth: {...state.auth, error: null}
                        }));
                    },

                    openApplicationLimitModal: () => {
                        console.log('🚀 openApplicationLimitModal called - redirecting to features tab');
                        
                        // Redirect to features tab instead of showing modal
                        set(state => ({
                            ...state,
                            ui: {
                                ...state.ui,
                                selectedTab: 'features'
                            }
                        }));
                        get().trackEvent('application_limit_reached', {
                            applicationsCount: get().applications.length,
                            action: 'redirected_to_features',
                            timestamp: new Date().toISOString()
                        });
                        
                        // Show a toast message to inform the user
                        get().showToast({
                            type: 'info',
                            message: 'You\'ve reached the 50 application limit! Check out our features to see what\'s available.',
                            duration: 5000
                        });
                    },



                    openWelcomeTourModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                welcomeTour: {isOpen: true}
                            }
                        }));
                        get().trackEvent('welcome_tour_modal_opened', {
                            timestamp: new Date().toISOString()
                        });
                    },

                    closeWelcomeTourModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                welcomeTour: {isOpen: false}
                            }
                        }));
                    },

                    openUpgradeModal: (trigger: 'limit_reached' | 'analytics' | 'general' = 'general') => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                upgrade: {isOpen: true, trigger}
                            }
                        }));
                        get().trackEvent('upgrade_modal_opened', {trigger});
                    },

                    closeUpgradeModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                upgrade: {isOpen: false}
                            }
                        }));
                    },

                    openEditModal: (application: Application) => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                editApplication: {isOpen: true, application}
                            }
                        }));
                        // Track feature usage with error handling (commented out for debugging)
                        // get().trackFeatureUsage('edit_modal_opened').catch(error => {
                        //     console.warn('Failed to track edit modal usage:', error);
                        // });
                    },

                    closeEditModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                editApplication: {isOpen: false, application: null}
                            }
                        }));
                    },



                    syncLocalApplicationsToCloud: async () => {
                        try {
                            // Debounce sync calls to prevent multiple simultaneous syncs
                            const lastSync = localStorage.getItem('last_sync_attempt');
                            const now = Date.now();
                            if (lastSync && (now - parseInt(lastSync)) < 3000) { // 3 second cooldown
                                console.log('⏱️ Sync already in progress, skipping...');
                                return;
                            }
                            localStorage.setItem('last_sync_attempt', now.toString());
                            
                            console.log('🔄 Starting sync of local applications to cloud...');
                            
                            // Get local applications from IndexedDB
                            const localApplications = await databaseService.getApplications();
                            
                            if (localApplications.length === 0) {
                                console.log('📱 No local applications to sync');
                                return;
                            }

                            console.log(`📱 Found ${localApplications.length} local applications to sync`);

                            // Filter out applications that are already synced
                            const unsyncedApplications = localApplications.filter(app => 
                                app.syncStatus !== 'synced' || !app.cloudId
                            );

                            if (unsyncedApplications.length === 0) {
                                console.log('✅ All applications are already synced');
                                return;
                            }

                            console.log(`🔄 Syncing ${unsyncedApplications.length} unsynced applications to cloud...`);

                            // Use the existing bulkAddApplications function which handles cloud sync
                            const result = await get().bulkAddApplications(unsyncedApplications, { silent: true });

                            if (result.successCount > 0) {
                                // Silent sync success - no UI notifications
                                console.log(`✅ Successfully synced ${result.successCount} applications to cloud`);
                            }

                            if (result.errorCount > 0) {
                                console.warn(`⚠️ Failed to sync ${result.errorCount} applications`);
                            }

                            // Refresh applications to get updated sync status
                            await get().loadApplications();

                        } catch (error) {
                            console.error('❌ Error syncing local applications to cloud:', error);
                            // Silent error handling - no UI notifications
                        }
                    },




                    // ============================================================================
                    // PRIVACY ACTIONS
                    // ============================================================================

                    setPrivacySettings: (settings: PrivacySettings | null) => {
                        set(state => ({
                            ...state,
                            privacySettings: settings
                        }));
                    },

                    openPrivacySettings: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                privacySettings: {isOpen: true}
                            }
                        }));
                        get().trackFeatureUsage('privacy_settings_opened');
                    },

                    closePrivacySettings: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                privacySettings: {isOpen: false}
                            }
                        }));
                    },

                    loadUserPrivacySettings: async () => {
                        const state = get();
                        if (!state.auth.user?.id) return;

                        try {
                            const {privacyService} = await import('../services/privacyService');
                            const settings = await privacyService.getPrivacySettings(String(state.auth.user.id));

                            set(prevState => ({
                                ...prevState,
                                privacySettings: settings
                            }));

                            // Configure analytics based on settings
                            if (settings?.analytics) {
                                const {analyticsService} = await import('../services/analyticsService');
                                await analyticsService.enableAnalytics();
                            }
                        } catch (error) {
                            // Don't log as error - this is expected for new users or when privacy settings are not accessible
                            if (process.env.NODE_ENV === 'development') {
                                console.log('Privacy settings not available (normal for new users or 406 errors)');
                            }
                        }
                    },

                    // ============================================================================
                    // REALTIME ADMIN ACTIONS
                    // ============================================================================

                    enableRealtimeAdmin: () => {
                        const cleanup = realtimeAdminService.subscribeToRealtimeUpdates((data) => {
                            if (data.userMetrics) {
                                set(state => ({
                                    ...state,
                                    adminAnalytics: {
                                        ...data,
                                        ...(data.adminFeedback && {
                                            adminFeedback: {
                                                ...data.adminFeedback,
                                                topIssues: data.adminFeedback.topIssues?.map((issue: any) => ({
                                                    ...issue,
                                                    severity: issue.severity as 'low' | 'medium' | 'high'
                                                })) || []
                                            }
                                        })
                                    },
                                    lastAdminUpdate: new Date().toISOString()
                                }));

                                get().showToast({
                                    type: 'info',
                                    message: 'Admin data updated in real-time',
                                    duration: 2000
                                });
                            }
                        });

                        set(state => ({
                            ...state,
                            isAdminRealtime: true,
                            adminSubscription: cleanup
                        }));

                        console.log('Real-time admin mode enabled');
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

                        console.log('Real-time admin mode disabled');
                    },

                    loadRealtimeAdminAnalytics: async () => {
                        // Check if user is properly authenticated before making API calls
                        const { auth } = get();
                        if (!auth.isAuthenticated || !auth.user) {
                            console.log('⚠️ User not authenticated, skipping realtime admin analytics');
                            await get().loadAdminAnalytics(); // Fallback to local data
                            return;
                        }

                        const maxRetries = 2;
                        let retryCount = 0;

                        while (retryCount <= maxRetries) {
                            try {
                                set(state => ({
                                    ...state,
                                    ui: {...state.ui, isLoading: true}
                                }));

                                console.log(`Loading real-time admin analytics (attempt ${retryCount + 1})...`);

                                const analytics = await realtimeAdminService.getRealtimeAdminAnalyticsSafe();

                                set(state => ({
                                    ...state,
                                    adminAnalytics: analytics,
                                    lastAdminUpdate: new Date().toISOString(),
                                    ui: {...state.ui, isLoading: false}
                                }));

                                console.log('Real-time admin analytics loaded successfully');

                                get().showToast({
                                    type: 'success',
                                    message: 'Admin data updated',
                                    duration: 2000
                                });

                                return;

                            } catch (error) {
                                console.error(`Failed to load real-time admin analytics (attempt ${retryCount + 1}):`, error);
                                retryCount++;

                                if (retryCount > maxRetries) {
                                    console.log('Max retries exceeded, using local analytics as fallback...');
                                    await get().loadAdminAnalytics();

                                    set(state => ({
                                        ...state,
                                        ui: {...state.ui, isLoading: false}
                                    }));

                                    get().showToast({
                                        type: 'warning',
                                        message: 'Using local data - cloud sync unavailable',
                                        duration: 3000
                                    });
                                } else {
                                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                                }
                            }
                        }
                    },

                    loadRealtimeFeedbackSummary: async () => {
                        // Check if user is properly authenticated before making API calls
                        const { auth } = get();
                        if (!auth.isAuthenticated || !auth.user) {
                            console.log('⚠️ User not authenticated, skipping realtime feedback summary');
                            get().loadAdminFeedback(); // Fallback to local data
                            return;
                        }

                        try {
                            console.log('Loading real-time feedback summary...');

                            const feedback = await realtimeAdminService.getRealtimeFeedbackSummary();

                            set(state => ({
                                ...state,
                                adminFeedback: {
                                    ...feedback,
                                    topIssues: feedback.topIssues?.map(issue => ({
                                        ...issue,
                                        severity: issue.severity as 'low' | 'medium' | 'high'
                                    })) || [] as Array<{
                                        issue: string;
                                        count: number;
                                        severity: 'low' | 'medium' | 'high';
                                    }>
                                },
                                lastAdminUpdate: new Date().toISOString()
                            }));

                            console.log('Real-time feedback summary loaded');
                        } catch (error) {
                            console.error('Failed to load real-time feedback:', error);
                            get().loadAdminFeedback();
                        }
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

                    // ============================================================================
                    // APPLICATION ACTIONS
                    // ============================================================================

                    loadApplications: async () => {
                        set(state => ({...state, ui: {...state.ui, isLoading: true, error: null}}));
                        try {
                            const applications = await databaseService.getApplications();
                            
                            // Sort applications by dateApplied in descending order (most recent applications first)
                            const sortedApplications = applications.sort((a, b) => {
                                const dateA = new Date(a.dateApplied);
                                const dateB = new Date(b.dateApplied);
                                return dateB.getTime() - dateA.getTime();
                            });
                            
                            set({
                                applications: sortedApplications,
                                filteredApplications: sortedApplications,
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
                        const { applications, auth } = get();
                        
                        // Check application limit for non-authenticated users
                        if (!auth.isAuthenticated && applications.length >= 50) {
                            get().showToast({
                                type: 'warning',
                                message: 'You\'ve reached the 50 application limit. Sign up to continue tracking unlimited applications!',
                                duration: 6000
                            });
                            
                            // Open upgrade modal
                            get().openUpgradeModal('limit_reached');
                            
                            throw new Error('Application limit reached. Please sign up to continue.');
                        }

                        try {
                            const newApplication = await databaseService.addApplication(applicationData);
                            set(state => {
                                // Check for duplicates before adding
                                const existingApp = state.applications.find(app => 
                                    app.company === newApplication.company && 
                                    app.position === newApplication.position && 
                                    app.dateApplied === newApplication.dateApplied
                                );
                                
                                if (existingApp) {
                                    console.warn('⚠️ Duplicate application detected, skipping add:', newApplication);
                                    return state; // Don't add duplicate
                                }
                                
                                // Add new application and maintain sorting by dateApplied (most recent applications first)
                        const updatedApplications = [newApplication, ...state.applications].sort((a, b) => {
                            const dateA = new Date(a.dateApplied);
                            const dateB = new Date(b.dateApplied);
                            return dateB.getTime() - dateA.getTime();
                        });
                                
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

                                // Check achievements after adding application
                                const { applications, goalProgress, auth } = get();
                                // Check achievements asynchronously (non-blocking)
                                if (auth.user?.id) {
                                    const { useCloudAchievementStore } = require('../store/useCloudAchievementStore');
                                    const achievementStore = useCloudAchievementStore.getState();
                                    const userId = String(auth.user.id);
                                    achievementStore.checkAchievements(
                                        userId,
                                        applications,
                                        goalProgress.dailyStreak,
                                        goalProgress.weeklyProgress,
                                        goalProgress.monthlyProgress
                                    ).then((newlyUnlocked: any[]) => {
                                        // Show achievement notifications
                                        newlyUnlocked.forEach((achievement: any) => {
                                            get().showToast({
                                                type: 'success',
                                                message: `🎉 Achievement Unlocked: ${achievement.name}! +${achievement.xpReward} XP`,
                                                duration: 5000
                                            });
                                        });
                                    }).catch((error: any) => {
                                        console.error('Failed to check achievements:', error);
                                    });
                                }

                                const {ui} = get();
                                if (ui.admin?.dashboardOpen && ui.admin?.authenticated) {
                                    console.log('Auto-refreshing admin dashboard...');
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

                    updateApplication: async (id, updates) => {
                        try {
                            await databaseService.updateApplication(id, updates);
                            set(state => {
                                // Update application and maintain sorting by dateApplied (most recent applications first)
                        const applications = state.applications.map(app =>
                            app.id === id ? {...app, ...updates, updatedAt: new Date().toISOString()} : app
                        ).sort((a, b) => {
                            const dateA = new Date(a.dateApplied);
                            const dateB = new Date(b.dateApplied);
                            return dateB.getTime() - dateA.getTime();
                        });
                                
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
                            console.log('Delete prevented - operation in progress');
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
                                        isLoading: false
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
                                    ui: {...state.ui}
                                };
                            });
                            get().showToast({
                                type: 'success',
                                message: `${ids.length} application${ids.length > 1 ? 's' : ''} deleted successfully!`
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
                                    ui: {...state.ui}
                                };
                            });
                            get().showToast({
                                type: 'success',
                                message: `${ids.length} application${ids.length > 1 ? 's' : ''} updated to ${status}!`
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
                                // Update applications and maintain sorting by dateApplied (most recent applications first)
                                const applications = state.applications.map(app =>
                                    ids.includes(app.id) ? {
                                        ...app, ...updates,
                                        updatedAt: new Date().toISOString()
                                    } : app
                                ).sort((a, b) => {
                                    const dateA = new Date(a.dateApplied);
                                    const dateB = new Date(b.dateApplied);
                                    return dateB.getTime() - dateA.getTime();
                                });
                                
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
                                    ui: {...state.ui}
                                };
                            });
                            get().showToast({
                                type: 'success',
                                message: `${ids.length} application${ids.length > 1 ? 's' : ''} updated successfully!`
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

                    removeDuplicateApplications: async () => {
                        try {
                            const { applications } = get();
                            const uniqueApplications: Application[] = [];
                            const seen = new Set<string>();
                            const duplicatesToDelete: string[] = [];

                            for (const app of applications) {
                                const key = `${app.company}|${app.position}|${app.dateApplied}`;
                                if (seen.has(key)) {
                                    duplicatesToDelete.push(app.id);
                                    console.log('🗑️ Marking duplicate for deletion:', app);
                                } else {
                                    seen.add(key);
                                    uniqueApplications.push(app);
                                }
                            }

                            if (duplicatesToDelete.length > 0) {
                                console.log(`🧹 Found ${duplicatesToDelete.length} duplicate applications, removing...`);
                                
                                // Delete duplicates from database
                                await databaseService.deleteApplications(duplicatesToDelete);
                                
                                // Update store
                                set(state => ({
                                    ...state,
                                    applications: uniqueApplications,
                                    filteredApplications: state.ui.searchQuery
                                        ? uniqueApplications.filter(app => {
                                            const searchFields = [
                                                app.company,
                                                app.position,
                                                app.location,
                                                app.jobSource
                                            ].filter(Boolean).join(' ').toLowerCase();
                                            return searchFields.includes(state.ui.searchQuery.toLowerCase());
                                        })
                                        : uniqueApplications
                                }));

                                get().showToast({
                                    type: 'success',
                                    message: `Removed ${duplicatesToDelete.length} duplicate application${duplicatesToDelete.length > 1 ? 's' : ''}`,
                                    duration: 3000
                                });
                            } else {
                                get().showToast({
                                    type: 'info',
                                    message: 'No duplicate applications found',
                                    duration: 2000
                                });
                            }
                        } catch (error) {
                            console.error('Failed to remove duplicates:', error);
                            get().showToast({
                                type: 'error',
                                message: 'Failed to remove duplicate applications',
                                duration: 3000
                            });
                        }
                    },

                    bulkAddApplications: async (applications, options = {}) => {
                        const {auth, applications: existingApplications} = get();
                        
                        // Check if this import would exceed the limit for unauthenticated users
                        if (!auth.isAuthenticated && (existingApplications.length + applications.length) > 50) {
                            const remainingSlots = Math.max(0, 50 - existingApplications.length);
                            
                            if (remainingSlots === 0) {
                                // No slots remaining, show the limit modal
                                get().openApplicationLimitModal();
                                return { successCount: 0, errorCount: applications.length };
                            } else {
                                // Some slots remaining, show warning and limit the import
                                get().showToast({
                                    type: 'warning',
                                    message: `You can only import ${remainingSlots} more applications. Please sign up for unlimited imports!`,
                                    duration: 5000
                                });
                                
                                // Limit the import to remaining slots
                                applications = applications.slice(0, remainingSlots);
                            }
                        }

                        try {
                            let successCount = 0;
                            let errorCount = 0;
                            const addedApplications: Application[] = [];

                            console.log(`🔄 Starting bulk import of ${applications.length} applications`);
                            console.log('📋 Sample application data:', applications[0]);
                            
                            for (const appData of applications) {
                                try {
                                    // Check for duplicates before adding
                                    const existingApp = existingApplications.find(app => 
                                        app.company === appData.company && 
                                        app.position === appData.position && 
                                        app.dateApplied === appData.dateApplied
                                    );
                                    
                                    if (existingApp) {
                                        console.warn('⚠️ Duplicate application detected in bulk add, skipping:', appData);
                                        continue; // Skip duplicate
                                    }
                                    
                                    console.log('✅ Adding application:', appData.company, appData.position);
                                    const newApplication = await databaseService.addApplication(appData);
                                    addedApplications.push(newApplication);
                                    successCount++;
                                } catch (error) {
                                    errorCount++;
                                    console.error('❌ Failed to add application:', error, 'Data:', appData);
                                }
                            }
                            
                            console.log(`📊 Import results: ${successCount} success, ${errorCount} errors`);

                            if (addedApplications.length > 0) {
                                set(state => {
                                    // Combine existing and new applications, then sort by dateApplied (most recent first)
                                    const allApplications = [...addedApplications, ...state.applications].sort((a, b) => {
                                        const dateA = new Date(a.dateApplied);
                                        const dateB = new Date(b.dateApplied);
                                        return dateB.getTime() - dateA.getTime();
                                    });
                                    
                                    const allFilteredApplications = [...addedApplications, ...state.filteredApplications].sort((a, b) => {
                                        const dateA = new Date(a.dateApplied);
                                        const dateB = new Date(b.dateApplied);
                                        return dateB.getTime() - dateA.getTime();
                                    });
                                    
                                    return {
                                        ...state,
                                        applications: allApplications,
                                        filteredApplications: allFilteredApplications
                                    };
                                });
                            }

                            if (!options.silent) {
                                if (successCount > 0) {
                                    get().showToast({
                                        type: 'success',
                                        message: `${successCount} application${successCount > 1 ? 's' : ''} imported successfully!${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
                                        duration: 5000
                                    });
                                    get().trackEvent('applications_bulk_imported', {successCount, errorCount});
                                } else {
                                    get().showToast({
                                        type: 'error',
                                        message: 'Failed to import applications. Please check the file format.'
                                    });
                                }
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



                    handleImport: async (importedApplications) => {
                        const {auth, applications: existingApplications} = get();
                        
                        // Check if this import would exceed the limit for unauthenticated users
                        if (!auth.isAuthenticated && (existingApplications.length + importedApplications.length) > 50) {
                            const remainingSlots = Math.max(0, 50 - existingApplications.length);
                            
                            if (remainingSlots === 0) {
                                // No slots remaining, show the limit modal
                                get().openApplicationLimitModal();
                                return { successCount: 0, errorCount: importedApplications.length };
                            } else {
                                // Some slots remaining, show warning and limit the import
                                get().showToast({
                                    type: 'warning',
                                    message: `You can only import ${remainingSlots} more applications. Please sign up for unlimited imports!`,
                                    duration: 5000
                                });
                                
                                // Limit the import to remaining slots
                                importedApplications = importedApplications.slice(0, remainingSlots);
                            }
                        }

                        const applicationsToAdd = importedApplications.map(app => {
                            const {id, createdAt, updatedAt, ...appData} = app;
                            return appData;
                        });
                        return await get().bulkAddApplications(applicationsToAdd);
                    },

                    // ============================================================================
                    // GOALS ACTIONS
                    // ============================================================================

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
                            
                            // Check achievements after updating goals
                            const { applications, goalProgress, auth } = get();
                            // Check achievements asynchronously (non-blocking)
                            if (auth.user?.id) {
                                const { useCloudAchievementStore } = require('../store/useCloudAchievementStore');
                                const achievementStore = useCloudAchievementStore.getState();
                                const userId = String(auth.user.id);
                                achievementStore.checkAchievements(
                                    userId,
                                    applications,
                                    goalProgress.dailyStreak,
                                    goalProgress.weeklyProgress,
                                    goalProgress.monthlyProgress
                                ).then((newlyUnlocked: any[]) => {
                                    // Show achievement notifications
                                    newlyUnlocked.forEach((achievement: any) => {
                                        get().showToast({
                                            type: 'success',
                                            message: `🎉 Achievement Unlocked: ${achievement.name}! +${achievement.xpReward} XP`,
                                            duration: 5000
                                        });
                                    });
                                }).catch((error: any) => {
                                    console.error('Failed to check achievements:', error);
                                });
                            }
                            
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

                    calculateProgress: async () => {
                        const {applications, goals, auth} = get();
                        const userId = auth.user?.id?.toString();
                        const goalProgress = await calculateGoalProgress(applications, goals, userId);
                        set(state => ({...state, goalProgress}));
                    },

                    checkMilestones: () => {
                        const {applications, showToast} = get();
                        checkMilestones(applications.length, showToast);
                    },

                    // ============================================================================
                    // UI ACTIONS
                    // ============================================================================

                    setTheme: (theme) => {
                        set(state => ({...state, ui: {...state.ui, theme}}));
                        
                        // Apply theme to document
                        const isDark = theme === 'dark';
                        document.documentElement.classList.toggle('dark', isDark);
                        document.body.classList.toggle('dark', isDark);
                        document.documentElement.style.colorScheme = theme;
                        
                        // Update meta theme color
                        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                        if (metaThemeColor) {
                            metaThemeColor.setAttribute('content', isDark ? '#1f2937' : '#ffffff');
                        }
                        
                        // Save to localStorage
                        localStorage.setItem('theme', theme);
                        
                        get().trackEvent('theme_changed', {theme});
                    },





                    setSearchQuery: (query) => {
                        get().searchApplications(query);
                    },



                    setLoading: (loading) => {
                        set(state => ({...state, ui: {...state.ui, isLoading: loading}}));
                    },

                    setError: (error) => {
                        set(state => ({...state, ui: {...state.ui, error}}));
                    },

                            setSelectedTab: (tab: 'home' | 'applications' | 'goals' | 'analytics' | 'achievements' | 'profile' | 'features') => {
            set(state => ({...state, ui: {...state.ui, selectedTab: tab}}));
        },

                    setShowMarketingPage: (show: boolean) => {
                        set(state => ({...state, ui: {...state.ui, showMarketingPage: show}}));
                    },

                    // Utility function to reset marketing page for testing
                    resetMarketingPage: () => {
                        localStorage.removeItem('applytrak_has_visited');
                        set(state => ({...state, ui: {...state.ui, showMarketingPage: true}}));
                    },

                    // ============================================================================
                    // MODAL ACTIONS
                    // ============================================================================





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

                    openRecoveryModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                recovery: {isOpen: true}
                            }
                        }));
                        get().trackFeatureUsage('recovery_modal_opened');
                    },

                    closeRecoveryModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                recovery: {isOpen: false}
                            }
                        }));
                    },

                    openAdminLoginModal: (returnPath?: string) => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                adminLogin: returnPath ? {isOpen: true, returnPath} : {isOpen: true}
                            }
                        }));
                        get().trackFeatureUsage('admin_login_modal_opened');
                    },

                    closeAdminLoginModal: () => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                adminLogin: {isOpen: false}
                            }
                        }));
                    },

                    // ============================================================================
                    // TOAST ACTIONS
                    // ============================================================================

                    // Helper function to categorize toasts for better management
                    getToastCategory: (message: string) => {
                        const lowerMessage = message.toLowerCase();
                        
                        if (lowerMessage.includes('welcome') || lowerMessage.includes('signed in')) {
                            return 'welcome';
                        }
                        if (lowerMessage.includes('signed out') || lowerMessage.includes('logout')) {
                            return 'logout';
                        }
                        if (lowerMessage.includes('saved') || lowerMessage.includes('updated') || lowerMessage.includes('created')) {
                            return 'save';
                        }
                        if (lowerMessage.includes('deleted') || lowerMessage.includes('removed')) {
                            return 'delete';
                        }
                        if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
                            return 'error';
                        }
                        if (lowerMessage.includes('sync') || lowerMessage.includes('synced')) {
                            return 'sync';
                        }
                        if (lowerMessage.includes('refresh') || lowerMessage.includes('reload')) {
                            return 'refresh';
                        }
                        if (lowerMessage.includes('milestone') || lowerMessage.includes('achievement')) {
                            return 'milestone';
                        }
                        if (lowerMessage.includes('admin') || lowerMessage.includes('dashboard')) {
                            return 'admin';
                        }
                        
                        return null; // No special category
                    },

                    // Helper function to get cooldown period for different toast categories
                    getCategoryCooldown: (category: string) => {
                        const cooldowns: Record<string, number> = {
                            'welcome': 30000,    // 30 seconds - welcome messages
                            'logout': 10000,     // 10 seconds - logout messages
                            'save': 5000,        // 5 seconds - save/update messages
                            'delete': 5000,      // 5 seconds - delete messages
                            'error': 10000,      // 10 seconds - error messages
                            'sync': 15000,       // 15 seconds - sync messages
                            'refresh': 10000,    // 10 seconds - refresh messages
                            'milestone': 60000,  // 1 minute - milestone messages
                            'admin': 15000,      // 15 seconds - admin messages
                        };
                        
                        return cooldowns[category] || 5000; // Default 5 seconds
                    },

                    // Helper function to clear all toast tracking data
                    clearToastTracking: () => {
                        sessionStorage.removeItem('welcome_toast_shown');
                        sessionStorage.removeItem('recent_toasts');
                        ['welcome', 'logout', 'save', 'delete', 'error', 'sync', 'refresh', 'milestone', 'admin'].forEach(category => {
                            sessionStorage.removeItem(`${category}_toast_shown`);
                        });
                        console.log('🧹 Toast tracking data cleared');
                    },

                    showToast: (toast) => {
                        const now = Date.now();
                        const currentToasts = get().toasts;

                        // Create a unique key for this toast based on message and type
                        const toastKey = `${toast.type}:${toast.message}`;
                        
                        // Check if this exact toast was shown recently (within threshold)
                        const recentToasts = JSON.parse(sessionStorage.getItem('recent_toasts') || '{}');
                        const lastShown = recentToasts[toastKey];
                        
                        if (lastShown && (now - lastShown) < DUPLICATE_TOAST_THRESHOLD) {
                            console.log('🚫 Duplicate toast prevented (recent):', toast.message);
                            return;
                        }

                        // Check for similar toasts in current toast list
                        const isDuplicate = currentToasts.some(t => {
                            const toastTimestamp = parseInt(t.id.substring(0, 8), 36) * 1000;
                            const timeDiff = now - toastTimestamp;

                            return t.message === toast.message &&
                                t.type === toast.type &&
                                timeDiff < DUPLICATE_TOAST_THRESHOLD;
                        });

                        if (isDuplicate) {
                            console.log('🚫 Duplicate toast prevented (current):', toast.message);
                            return;
                        }

                        // Special handling for different toast categories
                        const category = get().getToastCategory(toast.message);
                        if (category) {
                            const categoryKey = `${category}_toast_shown`;
                            const categoryShown = sessionStorage.getItem(categoryKey);
                            
                            if (categoryShown && (now - parseInt(categoryShown)) < get().getCategoryCooldown(category)) {
                                console.log(`🚫 ${category} toast already shown recently, preventing duplicate`);
                                return;
                            }
                            
                            sessionStorage.setItem(categoryKey, now.toString());
                        }

                        // Update recent toasts tracking
                        recentToasts[toastKey] = now;
                        
                        // Clean up old entries (older than 1 hour)
                        Object.keys(recentToasts).forEach(key => {
                            if (now - recentToasts[key] > 3600000) { // 1 hour
                                delete recentToasts[key];
                            }
                        });
                        
                        sessionStorage.setItem('recent_toasts', JSON.stringify(recentToasts));

                        const timestamp = Math.floor(now / 1000).toString(36);
                        const random = Math.random().toString(36).substr(2, 5);
                        const id = `${timestamp}-${random}`;

                        const newToast = {...toast, id};

                        set(state => {
                            const filteredToasts = state.toasts.filter(t => {
                                const toastTimestamp = parseInt(t.id.substring(0, 8), 36) * 1000;
                                return (now - toastTimestamp) < TOAST_CLEANUP_THRESHOLD;
                            });

                            return {
                                ...state,
                                toasts: [newToast, ...filteredToasts.slice(0, MAX_TOAST_COUNT - 1)]
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

                    // ============================================================================
                    // ANALYTICS ACTIONS
                    // ============================================================================

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
                            Remote: typeDistribution['Remote'] || 0,
                            Onsite: typeDistribution['Onsite'] || 0,
                            Hybrid: typeDistribution['Hybrid'] || 0
                        };

                        const employmentTypeDistribution = applications.reduce((acc: Record<string, number>, app) => {
                            acc[app.employmentType] = (acc[app.employmentType] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>);

                        const completeEmploymentTypeDistribution = {
                            'Full-time': employmentTypeDistribution['Full-time'] || 0,
                            Contract: employmentTypeDistribution['Contract'] || 0,
                            'Part-time': employmentTypeDistribution['Part-time'] || 0,
                            Internship: employmentTypeDistribution['Internship'] || 0,
                            '-': employmentTypeDistribution['-'] || 0
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
                            employmentTypeDistribution: completeEmploymentTypeDistribution,
                            sourceDistribution,
                            sourceSuccessRates,
                            successRate,
                            averageResponseTime,
                            totalApplications: applications.length,
                            monthlyTrend: monthlyTrend.sort((a, b) => a.month.localeCompare(b.month))
                        };

                        set(state => ({...state, analytics}));
                    },

                    trackEvent: async (event: string, properties?: Record<string, any>) => {
                        const state = get();

                        // Check if user has consented to analytics
                        if (state.auth.user?.id && state.privacySettings) {
                            if (!state.privacySettings.analytics) {
                                console.log('Analytics event not tracked - no user consent');
                                return;
                            }
                        }

                        if (analyticsService.isEnabled()) {
                            try {
                                await analyticsService.trackEvent(event as any, properties);
                            } catch (error) {
                                console.warn('Analytics tracking failed:', error);
                            }
                        }
                    },



                    trackFeatureUsage: async (feature: string, context?: Record<string, any>) => {
                        const state = get();

                        // Check if user has consented to analytics
                        if (state.auth.user?.id && state.privacySettings) {
                            if (!state.privacySettings.analytics) {
                                return;
                            }
                        }

                        if (analyticsService.isEnabled()) {
                            await analyticsService.trackFeatureUsage(feature, context);
                        }
                    },

                    // ============================================================================
                    // FEEDBACK ACTIONS
                    // ============================================================================

                    openFeedbackModal: (initialType?: 'bug' | 'feature' | 'general' | 'love') => {
                        set(state => ({
                            ...state,
                            modals: {
                                ...state.modals,
                                feedback: initialType ? {isOpen: true, initialType} : {isOpen: true}
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

                            // Refresh admin dashboard data if it's open
                            const { ui } = get();
                            if (ui.admin.dashboardOpen && ui.admin.authenticated) {
                                console.log('🔄 Refreshing admin dashboard after feedback submission...');
                                console.log('📊 Admin dashboard state:', {
                                    dashboardOpen: ui.admin.dashboardOpen,
                                    authenticated: ui.admin.authenticated,
                                    supabaseConfigured: !!process.env.REACT_APP_SUPABASE_URL
                                });
                                try {
                                    if (process.env.REACT_APP_SUPABASE_URL) {
                                        console.log('🔄 Loading realtime feedback summary...');
                                        await get().loadRealtimeFeedbackSummary();
                                    } else {
                                        console.log('🔄 Loading local admin feedback...');
                                        await get().loadAdminFeedback();
                                    }
                                    console.log('✅ Admin dashboard refreshed successfully');
                                } catch (error) {
                                    console.warn('⚠️ Failed to refresh admin dashboard after feedback submission:', error);
                                }
                            } else {
                                console.log('ℹ️ Admin dashboard not open or not authenticated, skipping refresh');
                            }

                            get().showToast({
                                type: 'success',
                                message: 'Thank you for your feedback! This helps make ApplyTrak better.',
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

                    // ============================================================================
                    // ADMIN ACTIONS
                    // ============================================================================

                    authenticateAdmin: async (_password: string) => {
                        const {auth} = get();

                        if (!auth.isAuthenticated || !auth.user?.email) {
                            get().showToast({
                                type: 'error',
                                message: 'Please sign in first to access admin features.'
                            });
                            return false;
                        }

                        try {
                            const isAdmin = await verifyDatabaseAdmin(String(auth.user.id), auth.user.email);

                            if (isAdmin) {
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
                                    message: 'Access denied. Admin privileges required.'
                                });
                                return false;
                            }
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Authentication failed. Please try again.'
                            });
                            return false;
                        }
                    },

                    logoutAdmin: () => {
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
                            globalRefresh: {
                                isRefreshing: false,
                                lastRefreshTimestamp: null,
                                refreshStatus: 'idle',
                                autoRefreshEnabled: false,
                                autoRefreshInterval: AUTO_REFRESH_DEFAULT_INTERVAL,
                                autoRefreshIntervalSeconds: AUTO_REFRESH_DEFAULT_INTERVAL,
                                refreshErrors: []
                            },
                            autoRefreshTimer: null
                        }));

                        get().showToast({
                            type: 'info',
                            message: 'Admin logged out.',
                            duration: 2000
                        });

                        // Always redirect to home page after admin logout
                        if (typeof window !== 'undefined') {
                            // Set selected tab to home first
                            get().setSelectedTab('home');
                            // Then redirect to home page
                            window.location.href = '/';
                        }
                    },

                    loadAdminAnalytics: async () => {
                        try {
                            const {applications, userMetrics, auth} = get();
                            const sessions = await analyticsService.getAllSessions();
                            const events = await analyticsService.getAllEvents();

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
                            console.log('Admin analytics loaded with', applications.length, 'applications');
                        } catch (error) {
                            console.error('Failed to load admin analytics:', error);
                        }
                    },

                    loadAdminFeedback: async () => {
                        try {
                            console.log('🔄 Loading admin feedback data...');
                            const stats = feedbackService.getFeedbackStats();
                            const recentFeedback = feedbackService.getRecentFeedback(10);

                            console.log('📊 Admin feedback data loaded:', {
                                totalFeedback: stats.totalSubmissions,
                                recentFeedbackCount: recentFeedback.length,
                                averageRating: stats.averageRating,
                                typeDistribution: stats.typeDistribution
                            });

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
                                topIssues: [] as Array<{
                                    issue: string;
                                    count: number;
                                    severity: 'low' | 'medium' | 'high';
                                }>
                            };

                            set(state => ({...state, adminFeedback}));
                        } catch (error) {
                            console.error('Failed to load admin feedback:', error);
                        }
                    },

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

                        if (process.env.REACT_APP_SUPABASE_URL) {
                            get().loadRealtimeAdminAnalytics();
                            get().loadRealtimeFeedbackSummary();
                            get().enableRealtimeAdmin();
                        } else {
                            get().loadAdminAnalytics();
                            get().loadAdminFeedback();
                        }
                    },

                    closeAdminDashboard: () => {
                        const {autoRefreshTimer} = get();
                        if (autoRefreshTimer) {
                            clearInterval(autoRefreshTimer);
                        }

                        get().disableRealtimeAdmin();

                        set(state => ({
                            ...state,
                            ui: {
                                ...state.ui,
                                admin: {
                                    ...state.ui.admin,
                                    dashboardOpen: false,
                                    authenticated: false
                                }
                            },
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

                    // ============================================================================
                    // SYSTEM ACTIONS
                    // ============================================================================

                    cleanup: () => {
                        console.log('Cleaning up app store resources...');

                        const {autoRefreshTimer, authSubscription, adminSubscription} = get();

                        if (autoRefreshTimer) {
                            clearInterval(autoRefreshTimer);
                            console.log('Auto-refresh timer cleared');
                        }

                        if (authSubscription) {
                            authSubscription();
                            console.log('Auth subscription cleaned up');
                        }

                        if (adminSubscription) {
                            adminSubscription();
                            console.log('Admin subscription cleaned up');
                        }

                        realtimeAdminService.cleanup();
                        console.log('Realtime admin service cleaned up');

                        set(state => ({
                            ...state,
                            autoRefreshTimer: null,
                            authSubscription: null,
                            adminSubscription: null,
                            isAdminRealtime: false,
                            globalRefresh: {
                                isRefreshing: false,
                                lastRefreshTimestamp: null,
                                refreshStatus: 'idle',
                                autoRefreshEnabled: false,
                                autoRefreshInterval: AUTO_REFRESH_DEFAULT_INTERVAL,
                                autoRefreshIntervalSeconds: AUTO_REFRESH_DEFAULT_INTERVAL,
                                refreshErrors: []
                            }
                        }));

                        console.log('App store cleanup completed');
                    },

                    getConnectionStatus: () => {
                        const {auth, isAdminRealtime, globalRefresh} = get();
                        const supabaseConfigured = !!process.env.REACT_APP_SUPABASE_URL;

                        return {
                            isOnline: navigator.onLine,
                            supabaseConfigured,
                            isAuthenticated: auth.isAuthenticated,
                            isRealtimeEnabled: isAdminRealtime,
                            lastRefresh: globalRefresh.lastRefreshTimestamp,
                            connectionType: auth.isAuthenticated && supabaseConfigured ? 'cloud' : 'local',
                            syncStatus: auth.isAuthenticated ? 'synced' : 'local-only',
                            adminMode: isAdminRealtime ?
                                (auth.isAuthenticated ? 'saas_realtime' : 'local_realtime') :
                                'local_only'
                        };
                    },
                };
            },

            // ============================================================================
            // PERSISTENCE CONFIGURATION
            // ============================================================================
            {
                name: 'applytrak-store',
                partialize: (state: AppState) => ({
                    ui: {
                        theme: state.ui?.theme || 'light',
                        selectedTab: state.ui?.selectedTab || 'home',
                        feedback: {
                            buttonVisible: state.ui?.feedback?.buttonVisible ?? true
                        },
                        admin: {
                            authenticated: false,
                            dashboardOpen: false,
                            currentSection: state.ui?.admin?.currentSection || 'overview'
                        }
                    },
                    goals: state.goals,
                    privacySettings: state.privacySettings,
                    privacyConsents: state.privacyConsents,
                    isAdminRealtime: false,
                    autoRefreshPreferences: {
                        enabled: state.globalRefresh.autoRefreshEnabled,
                        interval: state.globalRefresh.autoRefreshInterval
                    }
                }),
                onRehydrateStorage: () => (state: AppState | undefined) => {
                    if (state) {
                        // Initialize missing UI state
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
                            };
                        }

                        // Initialize missing modal state
                        if (!state.modals.auth) {
                            state.modals.auth = {
                                loginOpen: false,
                                signupOpen: false,
                                resetPasswordOpen: false
                            };
                        }

                        // Initialize privacy modals
                        if (!state.modals.privacySettings) {
                            state.modals.privacySettings = {isOpen: false};
                        }

                        // Reset auth state on rehydration
                        state.auth = {
                            user: null,
                            session: null,
                            isAuthenticated: false,
                            isLoading: true,
                            error: null
                        };
                        state.authSubscription = null;

                        // Reset admin realtime state
                        state.isAdminRealtime = false;
                        state.adminSubscription = null;
                        state.lastAdminUpdate = null;

                        // Initialize global refresh state
                        state.globalRefresh = {
                            isRefreshing: false,
                            lastRefreshTimestamp: null,
                            refreshStatus: 'idle',
                            autoRefreshEnabled: false,
                            autoRefreshInterval: AUTO_REFRESH_DEFAULT_INTERVAL,
                            autoRefreshIntervalSeconds: AUTO_REFRESH_DEFAULT_INTERVAL,
                            refreshErrors: []
                        };
                        state.autoRefreshTimer = null;

                        // Restore auto-refresh preferences
                        if (state.autoRefreshPreferences) {
                            state.globalRefresh = {
                                ...state.globalRefresh,
                                autoRefreshEnabled: false,
                                autoRefreshInterval: state.autoRefreshPreferences.interval || AUTO_REFRESH_DEFAULT_INTERVAL,
                                autoRefreshIntervalSeconds: state.autoRefreshPreferences.interval || AUTO_REFRESH_DEFAULT_INTERVAL
                            };
                        }

                        // Reset admin authentication
                        if (state.ui?.admin) {
                            state.ui.admin.authenticated = false;
                            state.ui.admin.dashboardOpen = false;
                        }

                        // Initialize privacy state for existing users (done asynchronously after rehydration)
                        if (state && state.auth?.user?.id && !state.privacySettings) {
                            // Load privacy settings for authenticated users
                            state.loadUserPrivacySettings?.();
                        }

                        console.log('Store rehydrated with privacy integration');
                    }
                }
            }
        )
    )
);