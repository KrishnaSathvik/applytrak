// src/services/databaseService.ts - ENHANCED WITH SUPABASE CLOUD SYNC
import Dexie, {Table} from 'dexie';
import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {
    AdminAnalytics,
    AdminFeedbackSummary,
    AnalyticsEvent,
    Application,
    Backup,
    DatabaseService,
    FeedbackStats,
    FeedbackSubmission,
    Goals,
    PrivacySettings,
    UserMetrics,
    UserSession
} from '../types';

// ============================================================================
// SUPABASE CONFIGURATION & SETUP
// ============================================================================

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

// Initialize Supabase client only if environment variables are provided
const initializeSupabase = (): SupabaseClient | null => {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase environment variables not found. Running in offline-only mode.');
        return null;
    }

    try {
        if (!supabase) {
            supabase = createClient(supabaseUrl, supabaseAnonKey);
            console.log('✅ Supabase client initialized');
        }
        return supabase;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return null;
    }
};

// Check if online and Supabase is available
const isOnlineWithSupabase = (): boolean => {
    return navigator.onLine && !!initializeSupabase();
};

// ============================================================================
// EXISTING DATABASE SCHEMA (UNCHANGED)
// ============================================================================

export class JobTrackerDatabase extends Dexie {
    applications!: Table<Application, string>;
    goals!: Table<Goals, string>;
    backups!: Table<Backup, string>;

    // Analytics tables
    analyticsEvents!: Table<AnalyticsEvent, number>;
    userSessions!: Table<UserSession, number>;
    userMetrics!: Table<UserMetrics & { id: string }, string>;

    // Feedback tables
    feedback!: Table<FeedbackSubmission, number>;

    // Privacy settings
    privacySettings!: Table<PrivacySettings & { id: string }, string>;

    constructor() {
        super('JobTrackerDatabase');

        // Updated schema with new tables
        this.version(2).stores({
            // Existing tables
            applications: 'id, company, position, dateApplied, status, type, location, jobSource, createdAt, updatedAt',
            goals: 'id, totalGoal, weeklyGoal, monthlyGoal, createdAt, updatedAt',
            backups: 'id, timestamp',

            // Analytics tables
            analyticsEvents: '++id, event, timestamp, sessionId',
            userSessions: '++id, startTime, endTime, deviceType',
            userMetrics: 'id, sessionsCount, totalTimeSpent, applicationsCreated, lastActiveDate',

            // Feedback table
            feedback: '++id, type, rating, timestamp, email',

            // Privacy settings
            privacySettings: 'id, analytics, feedback, consentDate'
        });

        // Handle database upgrades
        this.version(1).stores({
            applications: 'id, company, position, dateApplied, status, type, location, jobSource, createdAt, updatedAt',
            goals: 'id, totalGoal, weeklyGoal, monthlyGoal, createdAt, updatedAt',
            backups: 'id, timestamp'
        });
    }
}

// Database instance (unchanged)
const db = new JobTrackerDatabase();

// Generate unique ID (unchanged)
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// ============================================================================
// CLOUD SYNC UTILITIES
// ============================================================================

// Get user ID for cloud sync (anonymous user identification)
const getUserId = (): string => {
    let userId = localStorage.getItem('applytrak_user_id');
    if (!userId) {
        userId = generateId();
        localStorage.setItem('applytrak_user_id', userId);
    }
    return userId;
};

// Sync data to cloud (non-blocking)
const syncToCloud = async (table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'insert'): Promise<void> => {
    if (!isOnlineWithSupabase()) return;

    try {
        const client = initializeSupabase()!;
        const userId = getUserId();

        const dataWithUser = {
            ...data,
            user_id: userId,
            synced_at: new Date().toISOString()
        };

        switch (operation) {
            case 'insert':
                await client.from(table).insert(dataWithUser);
                break;
            case 'update':
                await client.from(table).update(dataWithUser).eq('id', data.id).eq('user_id', userId);
                break;
            case 'delete':
                await client.from(table).delete().eq('id', data.id).eq('user_id', userId);
                break;
        }

        console.log(`✅ Synced to cloud: ${table} ${operation}`);
    } catch (error) {
        console.warn(`Cloud sync failed for ${table}:`, error);
        // Continue with local operation - cloud sync is non-blocking
    }
};

// Sync from cloud (pull latest data)
const syncFromCloud = async (table: string): Promise<any[]> => {
    if (!isOnlineWithSupabase()) return [];

    try {
        const client = initializeSupabase()!;
        const userId = getUserId();

        const {data, error} = await client
            .from(table)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', {ascending: false});

        if (error) throw error;

        console.log(`✅ Synced from cloud: ${table} (${data?.length || 0} items)`);
        return data || [];
    } catch (error) {
        console.warn(`Cloud sync failed for ${table}:`, error);
        return [];
    }
};

// ============================================================================
// ENHANCED DATABASE SERVICE WITH CLOUD SYNC
// ============================================================================

export const databaseService: DatabaseService = {
    // ========================================================================
    // EXISTING APPLICATION METHODS (ENHANCED WITH CLOUD SYNC)
    // ========================================================================

    async getApplications(): Promise<Application[]> {
        try {
            // Get local applications
            const localApps = await db.applications.orderBy('dateApplied').reverse().toArray();

            // Try to sync from cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                try {
                    const cloudApps = await syncFromCloud('applications');

                    // Merge cloud and local data (cloud takes precedence for conflicts)
                    const mergedApps = new Map<string, Application>();

                    // Add local apps
                    localApps.forEach(app => mergedApps.set(app.id, app));

                    // Override with cloud apps (newer data)
                    cloudApps.forEach(app => {
                        if (app.id) {
                            mergedApps.set(app.id, {
                                id: app.id,
                                company: app.company,
                                position: app.position,
                                dateApplied: app.date_applied,
                                status: app.status,
                                type: app.type,
                                location: app.location,
                                salary: app.salary,
                                jobSource: app.job_source,
                                jobUrl: app.job_url,
                                notes: app.notes,
                                attachments: app.attachments,
                                createdAt: app.created_at,
                                updatedAt: app.updated_at
                            });
                        }
                    });

                    return Array.from(mergedApps.values()).sort((a, b) =>
                        new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
                    );
                } catch (cloudError) {
                    console.warn('Cloud sync failed, using local data:', cloudError);
                }
            }

            return localApps;
        } catch (error) {
            console.error('Failed to get applications:', error);
            throw new Error('Failed to get applications');
        }
    },

    async getApplicationCount(): Promise<number> {
        try {
            return await db.applications.count();
        } catch (error) {
            console.error('Failed to get application count:', error);
            return 0;
        }
    },

    async addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const id = generateId();
            const newApp: Application = {
                ...app,
                id,
                createdAt: now,
                updatedAt: now
            };

            // Save to local database first
            await db.applications.add(newApp);

            // Sync to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                syncToCloud('applications', {
                    id: newApp.id,
                    company: newApp.company,
                    position: newApp.position,
                    date_applied: newApp.dateApplied,
                    status: newApp.status,
                    type: newApp.type,
                    location: newApp.location,
                    salary: newApp.salary,
                    job_source: newApp.jobSource,
                    job_url: newApp.jobUrl,
                    notes: newApp.notes,
                    attachments: newApp.attachments,
                    created_at: newApp.createdAt,
                    updated_at: newApp.updatedAt
                }, 'insert').catch(err => console.warn('Cloud sync failed:', err));
            }

            return newApp;
        } catch (error) {
            console.error('Failed to add application:', error);
            throw new Error('Failed to add application');
        }
    },

    async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const updateData = {...updates, updatedAt: now};

            // Update local database first
            await db.applications.update(id, updateData);
            const updated = await db.applications.get(id);

            if (!updated) {
                throw new Error('Application not found');
            }

            // Sync to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                syncToCloud('applications', {
                    id: updated.id,
                    company: updated.company,
                    position: updated.position,
                    date_applied: updated.dateApplied,
                    status: updated.status,
                    type: updated.type,
                    location: updated.location,
                    salary: updated.salary,
                    job_source: updated.jobSource,
                    job_url: updated.jobUrl,
                    notes: updated.notes,
                    attachments: updated.attachments,
                    created_at: updated.createdAt,
                    updated_at: updated.updatedAt
                }, 'update').catch(err => console.warn('Cloud sync failed:', err));
            }

            return updated;
        } catch (error) {
            console.error('Failed to update application:', error);
            throw new Error('Failed to update application');
        }
    },

    async deleteApplication(id: string): Promise<void> {
        try {
            // Delete from local database first
            await db.applications.delete(id);

            // Sync deletion to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                syncToCloud('applications', {id}, 'delete').catch(err =>
                    console.warn('Cloud sync failed:', err)
                );
            }
        } catch (error) {
            console.error('Failed to delete application:', error);
            throw new Error('Failed to delete application');
        }
    },

    async deleteApplications(ids: string[]): Promise<void> {
        try {
            // Delete from local database first
            await db.applications.bulkDelete(ids);

            // Sync deletions to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                ids.forEach(id => {
                    syncToCloud('applications', {id}, 'delete').catch(err =>
                        console.warn('Cloud sync failed:', err)
                    );
                });
            }
        } catch (error) {
            console.error('Failed to delete applications:', error);
            throw new Error('Failed to delete applications');
        }
    },

    async bulkUpdateApplications(ids: string[], updates: Partial<Application>): Promise<void> {
        try {
            const now = new Date().toISOString();
            const updateData = {...updates, updatedAt: now};

            // Update local database first
            await Promise.all(ids.map(id => db.applications.update(id, updateData)));

            // Sync updates to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                ids.forEach(async (id) => {
                    try {
                        const updated = await db.applications.get(id);
                        if (updated) {
                            syncToCloud('applications', {
                                id: updated.id,
                                company: updated.company,
                                position: updated.position,
                                date_applied: updated.dateApplied,
                                status: updated.status,
                                type: updated.type,
                                location: updated.location,
                                salary: updated.salary,
                                job_source: updated.jobSource,
                                job_url: updated.jobUrl,
                                notes: updated.notes,
                                attachments: updated.attachments,
                                created_at: updated.createdAt,
                                updated_at: updated.updatedAt
                            }, 'update').catch(err => console.warn('Cloud sync failed:', err));
                        }
                    } catch (error) {
                        console.warn('Failed to sync update for id:', id, error);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to bulk update applications:', error);
            throw new Error('Failed to bulk update applications');
        }
    },

    async importApplications(applications: Application[]): Promise<void> {
        try {
            // Import to local database first
            await db.applications.bulkAdd(applications);

            // Sync to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                applications.forEach(app => {
                    syncToCloud('applications', {
                        id: app.id,
                        company: app.company,
                        position: app.position,
                        date_applied: app.dateApplied,
                        status: app.status,
                        type: app.type,
                        location: app.location,
                        salary: app.salary,
                        job_source: app.jobSource,
                        job_url: app.jobUrl,
                        notes: app.notes,
                        attachments: app.attachments,
                        created_at: app.createdAt,
                        updated_at: app.updatedAt
                    }, 'insert').catch(err => console.warn('Cloud sync failed:', err));
                });
            }
        } catch (error) {
            console.error('Failed to import applications:', error);
            throw new Error('Failed to import applications');
        }
    },

    async clearAllData(): Promise<void> {
        try {
            // Clear local database first
            await db.transaction('rw', [
                db.applications,
                db.goals,
                db.backups,
                db.analyticsEvents,
                db.userSessions,
                db.userMetrics,
                db.feedback,
                db.privacySettings
            ], async () => {
                await db.applications.clear();
                await db.goals.clear();
                await db.backups.clear();
                await db.analyticsEvents.clear();
                await db.userSessions.clear();
                await db.userMetrics.clear();
                await db.feedback.clear();
                await db.privacySettings.clear();
            });

            // Clear cloud data (non-blocking)
            if (isOnlineWithSupabase()) {
                try {
                    const client = initializeSupabase()!;
                    const userId = getUserId();

                    // Delete all user data from cloud
                    await Promise.all([
                        client.from('applications').delete().eq('user_id', userId),
                        client.from('goals').delete().eq('user_id', userId),
                        client.from('analytics_events').delete().eq('user_id', userId),
                        client.from('feedback').delete().eq('user_id', userId)
                    ]);

                    console.log('✅ Cloud data cleared');
                } catch (cloudError) {
                    console.warn('Failed to clear cloud data:', cloudError);
                }
            }
        } catch (error) {
            console.error('Failed to clear all data:', error);
            throw new Error('Failed to clear all data');
        }
    },

    // ========================================================================
    // EXISTING GOALS METHODS (ENHANCED WITH CLOUD SYNC)
    // ========================================================================

    async getGoals(): Promise<Goals> {
        try {
            // Try local first
            let goals = await db.goals.get('default');

            // Try cloud sync if online
            if (isOnlineWithSupabase() && !goals) {
                try {
                    const cloudGoals = await syncFromCloud('goals');
                    if (cloudGoals.length > 0) {
                        const latestGoals = cloudGoals[0];
                        goals = {
                            id: 'default',
                            totalGoal: latestGoals.total_goal,
                            weeklyGoal: latestGoals.weekly_goal,
                            monthlyGoal: latestGoals.monthly_goal,
                            createdAt: latestGoals.created_at,
                            updatedAt: latestGoals.updated_at
                        };

                        // Save to local cache
                        await db.goals.put(goals);
                    }
                } catch (cloudError) {
                    console.warn('Cloud sync failed for goals:', cloudError);
                }
            }

            // Default goals if none found
            if (!goals) {
                const now = new Date().toISOString();
                goals = {
                    id: 'default',
                    totalGoal: 100,
                    weeklyGoal: 5,
                    monthlyGoal: 20,
                    createdAt: now,
                    updatedAt: now
                };
                await db.goals.put(goals);
            }

            return goals;
        } catch (error) {
            console.error('Failed to get goals:', error);
            throw new Error('Failed to get goals');
        }
    },

    async updateGoals(newGoals: Omit<Goals, 'id'>): Promise<Goals> {
        try {
            const now = new Date().toISOString();
            const goals: Goals = {
                id: 'default',
                ...newGoals,
                updatedAt: now,
                createdAt: newGoals.createdAt || now
            };

            // Update local first
            await db.goals.put(goals);

            // Sync to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                syncToCloud('goals', {
                    id: 'default',
                    total_goal: goals.totalGoal,
                    weekly_goal: goals.weeklyGoal,
                    monthly_goal: goals.monthlyGoal,
                    created_at: goals.createdAt,
                    updated_at: goals.updatedAt
                }, 'update').catch(err => console.warn('Cloud sync failed:', err));
            }

            return goals;
        } catch (error) {
            console.error('Failed to update goals:', error);
            throw new Error('Failed to update goals');
        }
    },

    // ========================================================================
    // EXISTING BACKUP METHODS (UNCHANGED - LOCAL ONLY)
    // ========================================================================

    async createBackup(): Promise<void> {
        try {
            const applications = await db.applications.toArray();
            const goals = await db.goals.get('default');

            const backupData = {
                applications,
                goals,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };

            const backup: Backup = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                data: JSON.stringify(backupData)
            };

            await db.backups.add(backup);
        } catch (error) {
            console.error('Failed to create backup:', error);
            throw new Error('Failed to create backup');
        }
    },

    async getBackups(): Promise<Backup[]> {
        try {
            return await db.backups.orderBy('timestamp').reverse().toArray();
        } catch (error) {
            console.error('Failed to get backups:', error);
            return [];
        }
    },

    async restoreFromBackup(backup: Backup): Promise<void> {
        try {
            const backupData = JSON.parse(backup.data);

            await db.transaction('rw', [db.applications, db.goals], async () => {
                // Clear existing data
                await db.applications.clear();
                await db.goals.clear();

                // Restore applications
                if (backupData.applications && Array.isArray(backupData.applications)) {
                    await db.applications.bulkAdd(backupData.applications);
                }

                // Restore goals
                if (backupData.goals) {
                    await db.goals.put(backupData.goals);
                }
            });
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error('Failed to restore from backup');
        }
    },

    // ========================================================================
    // EXISTING ANALYTICS METHODS (ENHANCED WITH CLOUD SYNC)
    // ========================================================================

    async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        try {
            // Save to local first
            const eventForStorage = {
                event: event.event,
                properties: event.properties,
                timestamp: event.timestamp,
                sessionId: event.sessionId,
                userId: event.userId
            };
            await db.analyticsEvents.add(eventForStorage as any);

            // Sync to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                syncToCloud('analytics_events', {
                    event_name: event.event,
                    properties: event.properties,
                    timestamp: event.timestamp,
                    session_id: event.sessionId,
                    created_at: event.timestamp
                }, 'insert').catch(err => console.warn('Analytics cloud sync failed:', err));
            }
        } catch (error) {
            console.error('Failed to save analytics event:', error);
            throw new Error('Failed to save analytics event');
        }
    },

    async getAnalyticsEvents(sessionId?: string): Promise<AnalyticsEvent[]> {
        try {
            let query = db.analyticsEvents.orderBy('timestamp');
            if (sessionId) {
                query = query.filter(event => event.sessionId === sessionId);
            }
            return await query.reverse().toArray();
        } catch (error) {
            console.error('Failed to get analytics events:', error);
            return [];
        }
    },

    async getUserSession(sessionId: string): Promise<UserSession | null> {
        try {
            return await db.userSessions.where('id').equals(sessionId as any).first() || null;
        } catch (error) {
            console.error('Failed to get user session:', error);
            return null;
        }
    },

    async saveUserSession(session: UserSession): Promise<void> {
        try {
            await db.userSessions.add(session as any);
        } catch (error) {
            console.error('Failed to save user session:', error);
            throw new Error('Failed to save user session');
        }
    },

    async getUserMetrics(): Promise<UserMetrics> {
        try {
            const existing = await db.userMetrics.get('default');
            if (existing) {
                return existing;
            }

            // Default metrics
            const defaultMetrics: UserMetrics & { id: string } = {
                id: 'default',
                sessionsCount: 0,
                totalTimeSpent: 0,
                applicationsCreated: 0,
                applicationsUpdated: 0,
                applicationsDeleted: 0,
                goalsSet: 0,
                attachmentsAdded: 0,
                exportsPerformed: 0,
                importsPerformed: 0,
                searchesPerformed: 0,
                featuresUsed: [],
                lastActiveDate: new Date().toISOString()
            };

            await db.userMetrics.put(defaultMetrics);
            return defaultMetrics;
        } catch (error) {
            console.error('Failed to get user metrics:', error);
            throw new Error('Failed to get user metrics');
        }
    },

    async updateUserMetrics(updates: Partial<UserMetrics>): Promise<void> {
        try {
            const existing = await db.userMetrics.get('default');
            const updated = existing
                ? {...existing, ...updates}
                : {id: 'default', ...updates};

            await db.userMetrics.put(updated as any);
        } catch (error) {
            console.error('Failed to update user metrics:', error);
            throw new Error('Failed to update user metrics');
        }
    },

    // ========================================================================
    // EXISTING FEEDBACK METHODS (ENHANCED WITH CLOUD SYNC)
    // ========================================================================

    async saveFeedback(feedback: FeedbackSubmission): Promise<void> {
        try {
            // Save to local first
            const feedbackForStorage = {
                type: feedback.type,
                rating: feedback.rating,
                message: feedback.message,
                email: feedback.email,
                timestamp: feedback.timestamp,
                sessionId: feedback.sessionId,
                userAgent: feedback.userAgent,
                url: feedback.url,
                metadata: feedback.metadata
            };
            await db.feedback.add(feedbackForStorage as any);

            // Sync to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                syncToCloud('feedback', {
                    type: feedback.type,
                    rating: feedback.rating,
                    message: feedback.message,
                    email: feedback.email,
                    timestamp: feedback.timestamp,
                    session_id: feedback.sessionId,
                    user_agent: feedback.userAgent,
                    url: feedback.url,
                    metadata: feedback.metadata,
                    created_at: feedback.timestamp
                }, 'insert').catch(err => console.warn('Feedback cloud sync failed:', err));
            }
        } catch (error) {
            console.error('Failed to save feedback:', error);
            throw new Error('Failed to save feedback');
        }
    },

    async getAllFeedback(): Promise<FeedbackSubmission[]> {
        try {
            return await db.feedback.orderBy('timestamp').reverse().toArray();
        } catch (error) {
            console.error('Failed to get feedback:', error);
            return [];
        }
    },

    async getFeedbackStats(): Promise<FeedbackStats> {
        try {
            const allFeedback = await db.feedback.toArray();
            const totalSubmissions = allFeedback.length;
            const averageRating = totalSubmissions > 0
                ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalSubmissions
                : 0;

            // Initialize with required properties first
            const typeDistribution: {
                [key: string]: number;
                bug: number;
                feature: number;
                general: number;
                love: number;
            } = {
                bug: 0,
                feature: 0,
                general: 0,
                love: 0
            };

            // Count feedback by type
            allFeedback.forEach(f => {
                typeDistribution[f.type] = (typeDistribution[f.type] || 0) + 1;
            });

            // Initialize rating distribution
            const ratingDistribution: {
                [rating: number]: number;
                1: number;
                2: number;
                3: number;
                4: number;
                5: number;
            } = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };

            // Count ratings
            allFeedback.forEach(f => {
                if (f.rating >= 1 && f.rating <= 5) {
                    ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
                }
            });

            return {
                totalSubmissions,
                averageRating: Number(averageRating.toFixed(2)),
                typeDistribution,
                ratingDistribution,
                recentFeedback: allFeedback.slice(0, 10)
            };
        } catch (error) {
            console.error('Failed to get feedback stats:', error);
            return {
                totalSubmissions: 0,
                averageRating: 0,
                typeDistribution: {
                    bug: 0,
                    feature: 0,
                    general: 0,
                    love: 0
                },
                ratingDistribution: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0
                },
                recentFeedback: []
            };
        }
    },

    async markFeedbackAsRead(feedbackId: string): Promise<void> {
        try {
            const feedback = await db.feedback.where('id').equals(feedbackId as any).first();
            if (feedback) {
                const updated = {
                    ...feedback,
                    metadata: {
                        ...feedback.metadata,
                        read: true,
                        readAt: new Date().toISOString()
                    }
                };
                await db.feedback.put(updated);
            }
        } catch (error) {
            console.error('Failed to mark feedback as read:', error);
            throw new Error('Failed to mark feedback as read');
        }
    },

    // ========================================================================
    // EXISTING PRIVACY METHODS (ENHANCED WITH CLOUD SYNC)
    // ========================================================================

    async savePrivacySettings(settings: PrivacySettings): Promise<void> {
        try {
            const settingsWithId = {id: 'default', ...settings};
            await db.privacySettings.put(settingsWithId);

            // Sync to cloud (non-blocking)
            if (isOnlineWithSupabase()) {
                syncToCloud('privacy_settings', {
                    id: 'default',
                    analytics: settings.analytics,
                    feedback: settings.feedback,
                    functional_cookies: settings.functionalCookies,
                    consent_date: settings.consentDate,
                    consent_version: settings.consentVersion,
                    created_at: settings.consentDate,
                    updated_at: new Date().toISOString()
                }, 'update').catch(err => console.warn('Privacy settings cloud sync failed:', err));
            }
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
            throw new Error('Failed to save privacy settings');
        }
    },

    async getPrivacySettings(): Promise<PrivacySettings | null> {
        try {
            const settings = await db.privacySettings.get('default');
            return settings || null;
        } catch (error) {
            console.error('Failed to get privacy settings:', error);
            return null;
        }
    },

    // ========================================================================
    // EXISTING ADMIN METHODS (ENHANCED WITH CLOUD SYNC)
    // ========================================================================

    async getAdminAnalytics(): Promise<AdminAnalytics> {
        try {
            const applications = await this.getApplications();
            const analytics = await this.getAnalyticsEvents();
            const userMetrics = await this.getUserMetrics();

            // Calculate analytics in the expected format
            const totalUsers = 1; // Single user for now
            const totalApplications = applications.length;
            const totalEvents = analytics.length;

            const statusDistribution = applications.reduce((acc, app) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                userMetrics: {
                    totalUsers,
                    activeUsers: {
                        daily: 1,
                        weekly: 1,
                        monthly: 1
                    },
                    newUsers: {
                        today: 0,
                        thisWeek: 0,
                        thisMonth: 0
                    }
                },
                usageMetrics: {
                    totalSessions: userMetrics.sessionsCount,
                    averageSessionDuration: userMetrics.totalTimeSpent / Math.max(userMetrics.sessionsCount, 1),
                    totalApplicationsCreated: userMetrics.applicationsCreated,
                    featuresUsage: userMetrics.featuresUsed.reduce((acc, feature) => {
                        acc[feature] = (acc[feature] || 0) + 1;
                        return acc;
                    }, {} as { [key: string]: number })
                },
                deviceMetrics: {
                    mobile: userMetrics.deviceType === 'mobile' ? 1 : 0,
                    desktop: userMetrics.deviceType === 'desktop' ? 1 : 0,
                    tablet: userMetrics.deviceType === 'tablet' ? 1 : 0
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
        } catch (error) {
            console.error('Failed to get admin analytics:', error);
            throw new Error('Failed to get admin analytics');
        }
    },

    async getAdminFeedbackSummary(): Promise<AdminFeedbackSummary> {
        try {
            const stats = await this.getFeedbackStats();
            const allFeedback = await this.getAllFeedback();

            return {
                totalFeedback: stats.totalSubmissions,
                unreadFeedback: allFeedback.filter(f => !f.metadata?.read).length,
                averageRating: stats.averageRating,
                recentFeedback: stats.recentFeedback,
                feedbackTrends: {
                    bugs: stats.typeDistribution.bug || 0,
                    features: stats.typeDistribution.feature || 0,
                    general: stats.typeDistribution.general || 0,
                    love: stats.typeDistribution.love || 0
                },
                topIssues: []
            };
        } catch (error) {
            console.error('Failed to get admin feedback summary:', error);
            throw new Error('Failed to get admin feedback summary');
        }
    },

    async cleanupOldData(olderThanDays: number): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

            await db.transaction('rw', [db.analyticsEvents, db.userSessions, db.backups], async () => {
                // Clean old analytics events
                await db.analyticsEvents.where('timestamp').below(cutoffDate.toISOString()).delete();

                // Clean old user sessions
                await db.userSessions.where('startTime').below(cutoffDate.toISOString()).delete();

                // Keep only recent backups
                const allBackups = await db.backups.orderBy('timestamp').reverse().toArray();
                if (allBackups.length > 10) {
                    const toDelete = allBackups.slice(10);
                    await db.backups.bulkDelete(toDelete.map(b => b.id!));
                }
            });

            console.log(`✅ Cleaned up data older than ${olderThanDays} days`);
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            throw new Error('Failed to cleanup old data');
        }
    }
};

// Initialize database function (for App.tsx compatibility)
export const initializeDatabase = async (): Promise<void> => {
    try {
        await db.open();
        console.log('✅ Database initialized successfully with analytics and feedback support');

        // Initialize Supabase (non-blocking)
        initializeSupabase();

        // Run periodic cleanup (30 days)
        try {
            await databaseService.cleanupOldData(30);
        } catch (cleanupError) {
            console.warn('⚠️ Data cleanup failed (non-critical):', cleanupError);
        }
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw new Error('Failed to initialize database');
    }
};

// Initialize Supabase on service load (but don't block if it fails)
initializeSupabase();

export default databaseService;