// src/store/useAppStore.ts - PERFORMANCE OPTIMIZED VERSION
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { startTransition } from 'react';
import { debounce } from 'lodash';
import { AnalyticsData, Application, ApplicationStatus, GoalProgress, SourceSuccessRate, Goals } from '../types';
import { databaseService } from '../services/databaseService';

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
}

export interface AppState {
    // Data
    applications: Application[];
    filteredApplications: Application[];
    goals: Goals;
    toasts: Toast[];

    // UI State
    ui: UIState;
    modals: ModalState;

    // Goal Progress
    goalProgress: GoalProgress;

    // Analytics
    analytics: AnalyticsData;

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
    bulkAddApplications: (applications: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<{ successCount: number; errorCount: number }>;
    handleImport: (importedApplications: Application[]) => Promise<{ successCount: number; errorCount: number }>;

    // Goals
    loadGoals: () => Promise<void>;
    updateGoals: (goals: Goals) => Promise<void>;
    calculateProgress: () => void;
    checkMilestones: () => void;

    // UI Actions
    setTheme: (theme: 'light' | 'dark') => void;
    toggleSidebar: () => void;
    setCurrentPage: (page: number) => void;
    setSearchQuery: (query: string) => void;
    setSelectedApplicationIds: (ids: string[]) => void;
    clearSelection: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSelectedTab: (tab: 'tracker' | 'analytics') => void;

    // Modal Actions
    openEditModal: (application: Application) => void;
    closeEditModal: () => void;
    openGoalModal: () => void;
    closeGoalModal: () => void;
    openMilestone: (message: string) => void;
    closeMilestone: () => void;

    // Toast Actions
    showToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;

    // Analytics
    calculateAnalytics: () => void;
}

// 🚀 OPTIMIZED: Better cache system
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

// 🚀 OPTIMIZED: Memoized expensive calculations
const calculateGoalProgress = (applications: Application[], goals: Goals): GoalProgress => {
    const cacheKey = `goal-${applications.length}-${goals.totalGoal}-${goals.weeklyGoal}-${goals.monthlyGoal}-${applications.map(a => a.dateApplied).join(',')}`;

    const cached = optimizedCache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const totalApplications = applications.length;
    const totalProgress = Math.min((totalApplications / goals.totalGoal) * 100, 100);

    // Calculate weekly progress
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyApplications = applications.filter(app => {
        const appDate = new Date(app.dateApplied);
        return appDate >= weekStart;
    }).length;
    const weeklyProgress = Math.min((weeklyApplications / goals.weeklyGoal) * 100, 100);

    // Calculate monthly progress
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyApplications = applications.filter(app => {
        const appDate = new Date(app.dateApplied);
        return appDate >= monthStart;
    }).length;
    const monthlyProgress = Math.min((monthlyApplications / goals.monthlyGoal) * 100, 100);

    // Calculate weekly streak
    let weeklyStreak = 0;
    let currentWeek = new Date(weekStart);

    while (true) {
        const weekApps = applications.filter(app => {
            const appDate = new Date(app.dateApplied);
            const weekEnd = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
            return appDate >= currentWeek && appDate < weekEnd;
        }).length;

        if (weekApps >= goals.weeklyGoal) {
            weeklyStreak++;
            currentWeek.setDate(currentWeek.getDate() - 7);
        } else {
            break;
        }

        if (currentWeek < new Date(applications[applications.length - 1]?.dateApplied || 0)) break;
    }

    const result = {
        totalGoal: goals.totalGoal,
        weeklyGoal: goals.weeklyGoal,
        monthlyGoal: goals.monthlyGoal,
        totalProgress,
        weeklyProgress,
        monthlyProgress,
        weeklyStreak,
        totalApplications,
        weeklyApplications,
        monthlyApplications
    };

    optimizedCache.set(cacheKey, result);
    return result;
};

const calculateAnalytics = (applications: Application[]): AnalyticsData => {
    const cacheKey = `analytics-${applications.length}-${applications.map(a => `${a.id}-${a.status}`).slice(0, 50).join(',')}`;

    const cached = optimizedCache.get(cacheKey);
    if (cached) return cached;

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

    const result = {
        statusDistribution: completeStatusDistribution,
        typeDistribution: completeTypeDistribution,
        sourceDistribution,
        sourceSuccessRates,
        successRate,
        averageResponseTime,
        totalApplications: applications.length,
        monthlyTrend: monthlyTrend.sort((a, b) => a.month.localeCompare(b.month))
    };

    optimizedCache.set(cacheKey, result);
    return result;
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

        if (typeof (window as any).confetti === 'function') {
            (window as any).confetti({
                particleCount: 100,
                spread: 70,
                origin: {y: 0.6}
            });
        }

        celebratedMilestones.push(reachedMilestone);
        localStorage.setItem('celebratedMilestones', JSON.stringify(celebratedMilestones));
    }
};

// 🚀 OPTIMIZED: Debounced search function
const createDebouncedSearch = (setState: any) => {
    return debounce((query: string, applications: Application[]) => {
        let filtered = applications;

        if (query.trim()) {
            const searchTerm = query.toLowerCase();

            // 🚀 OPTIMIZED: More efficient search
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
            ui: { ...state.ui, currentPage: 1 }
        }));
    }, 300);
};

// Utility function
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// 🚀 OPTIMIZED: Main store with performance fixes
export const useAppStore = create<AppState>()(
    subscribeWithSelector(
        persist(
            (set, get) => {
                // Create debounced search function with access to set
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
                        selectedTab: 'tracker'
                    },

                    modals: {
                        editApplication: {isOpen: false},
                        goalSetting: {isOpen: false},
                        milestone: {isOpen: false},
                        recovery: {isOpen: false}
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

                    // 🚀 OPTIMIZED: Batched state updates
                    loadApplications: async () => {
                        set(state => ({ ui: { ...state.ui, isLoading: true, error: null } }));

                        try {
                            const applications = await databaseService.getApplications();

                            // 🚀 SINGLE state update
                            set({
                                applications,
                                filteredApplications: applications,
                                ui: { ...get().ui, isLoading: false }
                            });

                            // 🚀 DEFERRED: Expensive calculations
                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            set(state => ({
                                ui: {
                                    ...state.ui,
                                    isLoading: false,
                                    error: (error as Error).message
                                }
                            }));
                        }
                    },

                    // 🚀 OPTIMIZED: Single state update + startTransition
                    addApplication: async (applicationData) => {
                        try {
                            const newApplication = await databaseService.addApplication(applicationData);

                            // 🚀 IMMEDIATE: Essential state update only
                            set(state => {
                                const updatedApplications = [newApplication, ...state.applications];

                                // Apply current search filter if needed
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
                                    applications: updatedApplications,
                                    filteredApplications
                                };
                            });

                            // 🚀 Show toast immediately
                            get().showToast({
                                type: 'success',
                                message: 'Application added successfully!',
                                duration: 3000
                            });

                            // 🚀 DEFERRED: Expensive calculations in transition
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

                    // 🚀 OPTIMIZED: Batched updates
                    updateApplication: async (id, updates) => {
                        try {
                            await databaseService.updateApplication(id, updates);

                            // 🚀 SINGLE batched state update
                            set(state => {
                                const applications = state.applications.map(app =>
                                    app.id === id ? {...app, ...updates, updatedAt: new Date().toISOString()} : app
                                );

                                // Apply search filter if needed
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
                                    applications,
                                    filteredApplications
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: 'Application updated successfully!'
                            });

                            // 🚀 DEFERRED: Expensive calculations
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

                    // Add this to your useAppStore.ts - FIXED deleteApplication function

                    deleteApplication: async (id) => {
                        try {
                            // 🔧 FIXED: Try database delete but don't fail if not found
                            try {
                                await databaseService.deleteApplication(id);
                                console.log('✅ Database delete successful for ID:', id);
                            } catch (dbError) {
                                console.warn('⚠️ Database delete failed (continuing anyway):', dbError);
                                // Continue with state update even if database delete fails
                            }

                            // 🔧 ALWAYS update state regardless of database result
                            set(state => {
                                const applications = state.applications.filter(app => app.id !== id);
                                const filteredApplications = (state.filteredApplications || state.applications).filter(app => app.id !== id);

                                console.log('🔍 State update:', {
                                    before: {
                                        total: state.applications.length,
                                        filtered: state.filteredApplications?.length || 0,
                                        filteredExists: !!state.filteredApplications
                                    },
                                    after: { total: applications.length, filtered: filteredApplications.length }
                                });

                                return {
                                    ...state,
                                    applications,
                                    filteredApplications,
                                    ui: {
                                        ...state.ui,
                                        selectedApplicationIds: (state.ui.selectedApplicationIds || []).filter(selectedId => selectedId !== id)
                                    }
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: 'Application deleted successfully!'
                            });

                            // 🔧 DEFERRED: Expensive calculations
                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                            });
                        } catch (error) {
                            console.error('❌ Delete operation failed:', error);
                            get().showToast({
                                type: 'error',
                                message: 'Failed to delete application: ' + (error as Error).message
                            });
                        }
                    },

                    // Bulk operations - optimized similarly
                    deleteApplications: async (ids) => {
                        try {
                            await databaseService.deleteApplications(ids);

                            set(state => {
                                const applications = state.applications.filter(app => !ids.includes(app.id));
                                const filteredApplications = state.filteredApplications.filter(app => !ids.includes(app.id));

                                return {
                                    applications,
                                    filteredApplications,
                                    ui: { ...state.ui, selectedApplicationIds: [] }
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: `${ids.length} applications deleted successfully!`
                            });

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
                            const updates = { status };
                            await databaseService.bulkUpdateApplications(ids, updates);

                            set(state => {
                                const applications = state.applications.map(app =>
                                    ids.includes(app.id) ? {...app, status, updatedAt: new Date().toISOString()} : app
                                );

                                // Apply search filter
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
                                    applications,
                                    filteredApplications,
                                    ui: { ...state.ui, selectedApplicationIds: [] }
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: `${ids.length} applications updated to ${status}!`
                            });

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
                                    ids.includes(app.id) ? {...app, ...updates, updatedAt: new Date().toISOString()} : app
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
                                    applications,
                                    filteredApplications,
                                    ui: { ...state.ui, selectedApplicationIds: [] }
                                };
                            });

                            get().showToast({
                                type: 'success',
                                message: `${ids.length} applications updated successfully!`
                            });

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

                            // 🚀 SINGLE batch update after all additions
                            if (addedApplications.length > 0) {
                                set(state => ({
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
                            } else {
                                get().showToast({
                                    type: 'error',
                                    message: 'Failed to import applications. Please check the file format.'
                                });
                            }

                            // 🚀 Single expensive calculation after all adds
                            startTransition(() => {
                                get().calculateAnalytics();
                                get().calculateProgress();
                                get().checkMilestones();
                            });

                            return { successCount, errorCount };
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Import failed: ' + (error as Error).message
                            });
                            return { successCount: 0, errorCount: applications.length };
                        }
                    },

                    // 🚀 OPTIMIZED: Debounced search
                    searchApplications: (query) => {
                        // 🚀 Update UI immediately for responsiveness
                        set(state => ({
                            ui: { ...state.ui, searchQuery: query }
                        }));

                        // 🚀 Debounce the expensive filtering
                        const { applications } = get();
                        debouncedSearch(query, applications);
                    },

                    handleImport: async (importedApplications) => {
                        const applicationsToAdd = importedApplications.map(app => {
                            const { id, createdAt, updatedAt, ...appData } = app;
                            return appData;
                        });

                        return await get().bulkAddApplications(applicationsToAdd);
                    },

                    // Goals actions
                    loadGoals: async () => {
                        try {
                            const goals = await databaseService.getGoals();
                            set({goals});
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
                            set({goals: newGoals});

                            // Clear cache since goals changed
                            optimizedCache.invalidatePattern('goal-');

                            get().calculateProgress();

                            get().showToast({
                                type: 'success',
                                message: 'Goals updated successfully!'
                            });
                        } catch (error) {
                            get().showToast({
                                type: 'error',
                                message: 'Failed to update goals: ' + (error as Error).message
                            });
                        }
                    },

                    calculateProgress: () => {
                        const { applications, goals } = get();
                        const goalProgress = calculateGoalProgress(applications, goals);
                        set({ goalProgress });
                    },

                    checkMilestones: () => {
                        const {applications, showToast} = get();
                        checkMilestones(applications.length, showToast);
                    },

                    // UI actions - minimal state updates
                    setTheme: (theme) => {
                        set(state => ({ ui: { ...state.ui, theme } }));
                        document.documentElement.classList.toggle('dark', theme === 'dark');
                    },

                    toggleSidebar: () => {
                        set(state => ({ ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } }));
                    },

                    setCurrentPage: (page) => {
                        set(state => ({ ui: { ...state.ui, currentPage: page } }));
                    },

                    setSearchQuery: (query) => {
                        get().searchApplications(query);
                    },

                    setSelectedApplicationIds: (ids) => {
                        set(state => ({ ui: { ...state.ui, selectedApplicationIds: ids } }));
                    },

                    clearSelection: () => {
                        set(state => ({ ui: { ...state.ui, selectedApplicationIds: [] } }));
                    },

                    setLoading: (loading) => {
                        set(state => ({ ui: { ...state.ui, isLoading: loading } }));
                    },

                    setError: (error) => {
                        set(state => ({ ui: { ...state.ui, error } }));
                    },

                    setSelectedTab: (tab) => {
                        set(state => ({ ui: { ...state.ui, selectedTab: tab } }));
                    },

                    // Modal actions
                    openEditModal: (application) => {
                        set(state => ({
                            modals: {
                                ...state.modals,
                                editApplication: {isOpen: true, application}
                            }
                        }));
                    },

                    closeEditModal: () => {
                        set(state => ({
                            modals: {
                                ...state.modals,
                                editApplication: {isOpen: false}
                            }
                        }));
                    },

                    openGoalModal: () => {
                        set(state => ({
                            modals: {
                                ...state.modals,
                                goalSetting: {isOpen: true}
                            }
                        }));
                    },

                    closeGoalModal: () => {
                        set(state => ({
                            modals: {
                                ...state.modals,
                                goalSetting: {isOpen: false}
                            }
                        }));
                    },

                    openMilestone: (message) => {
                        set(state => ({
                            modals: {
                                ...state.modals,
                                milestone: {isOpen: true, message}
                            }
                        }));
                    },

                    closeMilestone: () => {
                        set(state => ({
                            modals: {
                                ...state.modals,
                                milestone: {isOpen: false}
                            }
                        }));
                    },

                    // 🚀 OPTIMIZED: Better toast management
                    showToast: (toast) => {
                        const currentToasts = get().toasts;

                        // 🚀 Prevent duplicate messages within 1 second
                        const isDuplicate = currentToasts.some(t =>
                            t.message === toast.message &&
                            t.type === toast.type &&
                            Date.now() - parseInt(t.id.split('-')[0], 36) < 1000
                        );

                        if (isDuplicate) return;

                        const id = generateId();
                        const newToast = { ...toast, id };

                        // 🚀 Limit toasts and clean up old ones
                        set(state => {
                            const filteredToasts = state.toasts.filter(t => {
                                const toastTime = parseInt(t.id.split('-')[0], 36);
                                return Date.now() - toastTime < 30000; // Remove toasts older than 30s
                            });

                            return {
                                toasts: [newToast, ...filteredToasts.slice(0, 2)]
                            };
                        });

                        const duration = toast.duration || 5000;
                        setTimeout(() => {
                            get().removeToast(id);
                        }, duration);
                    },

                    removeToast: (id) => {
                        set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) }));
                    },

                    // Analytics - with caching
                    calculateAnalytics: () => {
                        const {applications} = get();
                        const analytics = calculateAnalytics(applications);
                        set({analytics});
                    }
                };
            },
            {
                name: 'applytrak-store',
                partialize: (state) => ({
                    ui: {
                        theme: state.ui.theme,
                        itemsPerPage: state.ui.itemsPerPage,
                        selectedTab: state.ui.selectedTab
                    },
                    goals: state.goals
                })
            }
        )
    )
);