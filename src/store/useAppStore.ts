// src/store/useAppStore.ts - COMPLETELY FIXED VERSION
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
import {databaseService} from '../services/databaseService';
import {analyticsService} from '../services/analyticsService';
import {feedbackService} from '../services/feedbackService';

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
        currentSection: 'overview' | 'analytics' | 'feedback' | 'users';
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
}

export interface AppState {
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

    // Actions
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
    trackEvent: (event: string, properties?: Record<string, any>) => void;
    trackPageView: (page: string) => void;
    trackFeatureUsage: (feature: string, context?: Record<string, any>) => void;
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
    setAdminSection: (section: 'overview' | 'analytics' | 'feedback' | 'users') => void;
}

// Utility functions
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

const optimizedCache = createOptimizedCache();

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

export const useAppStore = create<AppState>()(
    subscribeWithSelector(
        persist(
            (set, get): AppState => {
                const debouncedSearch = createDebouncedSearch(set);

                return {
                    // Initial state
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
                            currentSection: 'overview',
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

                    // Actions
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
                        try {
                            await databaseService.deleteApplication(id);
                            set(state => {
                                const applications = state.applications.filter(app => app.id !== id);
                                const filteredApplications = state.filteredApplications.filter(app => app.id !== id);
                                return {
                                    ...state,
                                    applications,
                                    filteredApplications,
                                    ui: {
                                        ...state.ui,
                                        selectedApplicationIds: state.ui.selectedApplicationIds.filter(selectedId => selectedId !== id)
                                    }
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: 'Application deleted successfully!'
                            });

                            get().trackEvent('application_deleted', {applicationId: id});

                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
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
                        const currentToasts = get().toasts;
                        const isDuplicate = currentToasts.some(t =>
                            t.message === toast.message &&
                            t.type === toast.type &&
                            Date.now() - parseInt(t.id.split('-')[0], 36) < 2000
                        );

                        if (isDuplicate) {
                            return;
                        }

                        const id = generateId();
                        const newToast = {...toast, id};

                        set(state => {
                            const filteredToasts = state.toasts.filter(t => {
                                const toastTime = parseInt(t.id.split('-')[0], 36);
                                return Date.now() - toastTime < 30000;
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
                        const analytics = calculateAnalytics(applications);
                        set(state => ({...state, analytics}));
                    },

                    // Analytics Actions
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
                                const userMetrics = analyticsService.getUserMetrics();
                                set(state => ({...state, userMetrics}));
                            } else {
                                get().openAnalyticsConsent('first-visit');
                            }
                        } catch (error) {
                            console.warn('Analytics initialization failed:', error);
                        }
                    },

                    enableAnalytics: async (settings = {}) => {
                        try {
                            await analyticsService.enableAnalytics(settings);
                            const analyticsSettings: AnalyticsSettings = {
                                enabled: true,
                                consentGiven: true,
                                consentDate: new Date().toISOString(),
                                trackingLevel: settings.trackingLevel || 'standard'
                            };

                            set(state => ({...state, analyticsSettings}));

                            const userMetrics = analyticsService.getUserMetrics();
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

                    trackEvent: (event, properties) => {
                        if (analyticsService.isEnabled()) {
                            analyticsService.trackEvent(event as any, properties);
                        }
                    },

                    trackPageView: (page) => {
                        if (analyticsService.isEnabled()) {
                            analyticsService.trackPageView(page);
                        }
                    },

                    trackFeatureUsage: (feature, context) => {
                        if (analyticsService.isEnabled()) {
                            analyticsService.trackFeatureUsage(feature, context);
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
                            adminFeedback: null
                        }));

                        get().showToast({
                            type: 'info',
                            message: 'Admin logged out.',
                            duration: 2000
                        });
                    },

                    loadAdminAnalytics: async () => {
                        try {
                            const userMetrics = analyticsService.getUserMetrics();
                            const sessions = analyticsService.getAllSessions();
                            const events = analyticsService.getAllEvents();

                            const adminAnalytics: AdminAnalytics = {
                                userMetrics: {
                                    totalUsers: userMetrics ? 1 : 0,
                                    activeUsers: {
                                        daily: userMetrics ? 1 : 0,
                                        weekly: userMetrics ? 1 : 0,
                                        monthly: userMetrics ? 1 : 0
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
                                        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
                                        : 0,
                                    totalApplicationsCreated: userMetrics?.applicationsCreated || 0,
                                    featuresUsage: events.reduce((acc, event) => {
                                        if (event.event === 'feature_used' && event.properties?.feature) {
                                            acc[event.properties.feature] = (acc[event.properties.feature] || 0) + 1;
                                        }
                                        return acc;
                                    }, {} as { [key: string]: number })
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

                        get().loadAdminAnalytics();
                        get().loadAdminFeedback();
                    },

                    closeAdminDashboard: () => {
                        set(state => ({
                            ...state,
                            ui: {
                                ...state.ui,
                                admin: {
                                    ...state.ui.admin,
                                    dashboardOpen: false
                                }
                            }
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
                            authenticated: false,
                            dashboardOpen: false,
                            currentSection: state.ui?.admin?.currentSection || 'overview'
                        }
                    },
                    goals: state.goals,
                    analyticsSettings: state.analyticsSettings
                }),
                onRehydrateStorage: () => (state: AppState | undefined) => {
                    if (state) {
                        // Ensure admin state exists after rehydration
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

                        // Force admin to be logged out on page refresh for security
                        if (state.ui?.admin) {
                            state.ui.admin.authenticated = false;
                            state.ui.admin.dashboardOpen = false;
                        }
                        console.log('🔧 Store rehydrated with admin state fix');
                    }
                }
            }
        )
    )
);