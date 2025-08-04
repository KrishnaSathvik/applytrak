// src/services/databaseService.ts - COMPLETE IMPLEMENTATION WITH ANALYTICS & FEEDBACK
import Dexie, {Table} from 'dexie';
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

// Enhanced Database schema with analytics and feedback tables
export class JobTrackerDatabase extends Dexie {
    applications!: Table<Application, string>;
    goals!: Table<Goals, string>;
    backups!: Table<Backup, string>;

    // NEW: Analytics tables - using separate interfaces for DB storage
    analyticsEvents!: Table<AnalyticsEvent, number>;
    userSessions!: Table<UserSession, number>;
    userMetrics!: Table<UserMetrics & { id: string }, string>;

    // NEW: Feedback tables
    feedback!: Table<FeedbackSubmission, number>;

    // NEW: Privacy settings
    privacySettings!: Table<PrivacySettings & { id: string }, string>;

    constructor() {
        super('JobTrackerDatabase');

        // Updated schema with new tables
        this.version(2).stores({
            // Existing tables
            applications: 'id, company, position, dateApplied, status, type, location, jobSource, createdAt, updatedAt',
            goals: 'id, totalGoal, weeklyGoal, monthlyGoal, createdAt, updatedAt',
            backups: 'id, timestamp',

            // NEW: Analytics tables - auto-increment for events/sessions, string for metrics/settings
            analyticsEvents: '++id, event, timestamp, sessionId',
            userSessions: '++id, startTime, endTime, deviceType',
            userMetrics: 'id, sessionsCount, totalTimeSpent, applicationsCreated, lastActiveDate',

            // NEW: Feedback table - auto-increment
            feedback: '++id, type, rating, timestamp, email',

            // NEW: Privacy settings - string ID
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

// Database instance
const db = new JobTrackerDatabase();

// Generate unique ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Enhanced Database service implementation with all methods
export const databaseService: DatabaseService = {
    // ========================================================================
    // EXISTING APPLICATION METHODS
    // ========================================================================

    async getApplications(): Promise<Application[]> {
        try {
            const applications = await db.applications.orderBy('dateApplied').reverse().toArray();
            return applications;
        } catch (error) {
            console.error('Failed to get applications:', error);
            throw new Error('Failed to load applications');
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

    async addApplication(applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const application: Application = {
                ...applicationData,
                id: generateId(),
                createdAt: now,
                updatedAt: now
            };

            await db.applications.add(application);
            return application;
        } catch (error) {
            console.error('Failed to add application:', error);
            throw new Error('Failed to add application');
        }
    },

    async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
        try {
            const existingApp = await db.applications.get(id);
            if (!existingApp) {
                throw new Error('Application not found');
            }

            const updatedApp: Application = {
                ...existingApp,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await db.applications.update(id, updatedApp);
            return updatedApp;
        } catch (error) {
            console.error('Failed to update application:', error);
            throw new Error('Failed to update application');
        }
    },

    async deleteApplication(id: string): Promise<void> {
        try {
            const existingApp = await db.applications.get(id);
            if (!existingApp) {
                throw new Error('Application not found');
            }

            await db.applications.delete(id);
        } catch (error) {
            console.error('Failed to delete application:', error);
            throw new Error('Failed to delete application');
        }
    },

    async deleteApplications(ids: string[]): Promise<void> {
        try {
            await db.applications.bulkDelete(ids);
        } catch (error) {
            console.error('Failed to delete applications:', error);
            throw new Error('Failed to delete applications');
        }
    },

    async bulkUpdateApplications(ids: string[], updates: Partial<Application>): Promise<void> {
        try {
            const now = new Date().toISOString();
            const updateData = {...updates, updatedAt: now};

            await db.transaction('rw', db.applications, async () => {
                for (const id of ids) {
                    await db.applications.update(id, updateData);
                }
            });
        } catch (error) {
            console.error('Failed to bulk update applications:', error);
            throw new Error('Failed to update applications');
        }
    },

    async importApplications(applications: Application[]): Promise<void> {
        try {
            await db.transaction('rw', db.applications, async () => {
                for (const app of applications) {
                    const appWithId = {
                        ...app,
                        id: app.id || generateId(),
                        createdAt: app.createdAt || new Date().toISOString(),
                        updatedAt: app.updatedAt || new Date().toISOString()
                    };
                    await db.applications.put(appWithId);
                }
            });
        } catch (error) {
            console.error('Failed to import applications:', error);
            throw new Error('Failed to import applications');
        }
    },

    async clearAllData(): Promise<void> {
        try {
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
        } catch (error) {
            console.error('Failed to clear all data:', error);
            throw new Error('Failed to clear data');
        }
    },

    // ========================================================================
    // EXISTING GOALS METHODS
    // ========================================================================

    async getGoals(): Promise<Goals> {
        try {
            const goals = await db.goals.get('default');
            return goals || {
                id: 'default',
                totalGoal: 100,
                weeklyGoal: 5,
                monthlyGoal: 20,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get goals:', error);
            return {
                id: 'default',
                totalGoal: 100,
                weeklyGoal: 5,
                monthlyGoal: 20,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
    },

    async updateGoals(goalsData: Omit<Goals, 'id'>): Promise<Goals> {
        try {
            const now = new Date().toISOString();
            const goals: Goals = {
                ...goalsData,
                id: 'default',
                updatedAt: now,
                createdAt: goalsData.createdAt || now
            };

            await db.goals.put(goals);
            return goals;
        } catch (error) {
            console.error('Failed to update goals:', error);
            throw new Error('Failed to update goals');
        }
    },

    // ========================================================================
    // EXISTING BACKUP METHODS
    // ========================================================================

    async createBackup(): Promise<void> {
        try {
            const applications = await this.getApplications();
            const goals = await this.getGoals();

            const backupData = {
                applications,
                goals,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const backup: Backup = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                data: JSON.stringify(backupData)
            };

            await db.backups.add(backup);

            // Keep only the last 10 backups
            const allBackups = await db.backups.orderBy('timestamp').reverse().toArray();
            if (allBackups.length > 10) {
                const toDelete = allBackups.slice(10);
                await db.backups.bulkDelete(toDelete.map(b => b.id!));
            }
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
    // NEW: ANALYTICS METHODS
    // ========================================================================

    async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        try {
            // Create a copy for storage, letting Dexie auto-generate the ID
            const eventForStorage = {
                event: event.event,
                properties: event.properties,
                timestamp: event.timestamp,
                sessionId: event.sessionId,
                userId: event.userId
            };
            await db.analyticsEvents.add(eventForStorage as any);
        } catch (error) {
            console.error('Failed to save analytics event:', error);
            throw new Error('Failed to save analytics event');
        }
    },

    async getAnalyticsEvents(sessionId?: string): Promise<AnalyticsEvent[]> {
        try {
            if (sessionId) {
                // Get events for specific session and sort in memory
                const events = await db.analyticsEvents
                    .where('sessionId')
                    .equals(sessionId)
                    .toArray();
                return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            }
            return await db.analyticsEvents.orderBy('timestamp').reverse().toArray();
        } catch (error) {
            console.error('Failed to get analytics events:', error);
            return [];
        }
    },

    async getUserSession(sessionId: string): Promise<UserSession | null> {
        try {
            // Find session by the sessionId property, not the auto-generated id
            const sessions = await db.userSessions.toArray();
            const session = sessions.find(s => s.id === sessionId);
            return session || null;
        } catch (error) {
            console.error('Failed to get user session:', error);
            return null;
        }
    },

    async saveUserSession(session: UserSession): Promise<void> {
        try {
            // Create a copy without conflicting properties for storage
            const sessionForStorage = {
                id: session.id,
                startTime: session.startTime,
                endTime: session.endTime,
                duration: session.duration,
                events: session.events,
                deviceType: session.deviceType,
                userAgent: session.userAgent,
                timezone: session.timezone,
                language: session.language
            };
            await db.userSessions.put(sessionForStorage as any);
        } catch (error) {
            console.error('Failed to save user session:', error);
            throw new Error('Failed to save user session');
        }
    },

    async getUserMetrics(): Promise<UserMetrics> {
        try {
            const metrics = await db.userMetrics.get('default');

            if (!metrics) {
                // Create default metrics
                const defaultMetrics: UserMetrics = {
                    sessionsCount: 0,
                    totalTimeSpent: 0,
                    applicationsCreated: 0,
                    featuresUsed: [],
                    lastActiveDate: new Date().toISOString(),
                    deviceType: 'desktop',
                    firstVisit: new Date().toISOString(),
                    totalEvents: 0
                };

                await db.userMetrics.put({...defaultMetrics, id: 'default'} as any);
                return defaultMetrics;
            }

            // Remove the id field when returning
            const {id, ...metricsWithoutId} = metrics as any;
            return metricsWithoutId;
        } catch (error) {
            console.error('Failed to get user metrics:', error);
            // Return default metrics on error
            return {
                sessionsCount: 0,
                totalTimeSpent: 0,
                applicationsCreated: 0,
                featuresUsed: [],
                lastActiveDate: new Date().toISOString(),
                deviceType: 'desktop',
                firstVisit: new Date().toISOString(),
                totalEvents: 0
            };
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
    // NEW: FEEDBACK METHODS
    // ========================================================================

    async saveFeedback(feedback: FeedbackSubmission): Promise<void> {
        try {
            // Create a copy for storage, letting Dexie auto-generate the ID
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
                ? allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / totalSubmissions
                : 0;

            const typeDistribution = allFeedback.reduce((acc, fb) => {
                acc[fb.type] = (acc[fb.type] || 0) + 1;
                return acc;
            }, {bug: 0, feature: 0, general: 0, love: 0});

            const ratingDistribution = allFeedback.reduce((acc, fb) => {
                acc[fb.rating] = (acc[fb.rating] || 0) + 1;
                return acc;
            }, {} as { [rating: number]: number });

            return {
                totalSubmissions,
                averageRating,
                typeDistribution,
                ratingDistribution
            };
        } catch (error) {
            console.error('Failed to get feedback stats:', error);
            return {
                totalSubmissions: 0,
                averageRating: 0,
                typeDistribution: {bug: 0, feature: 0, general: 0, love: 0},
                ratingDistribution: {}
            };
        }
    },

    async markFeedbackAsRead(feedbackId: string): Promise<void> {
        try {
            // Find feedback by original ID property, not auto-generated DB ID
            const allFeedback = await db.feedback.toArray();
            const targetFeedback = allFeedback.find(f => f.id === feedbackId);

            if (targetFeedback) {
                const updated = {
                    ...targetFeedback,
                    metadata: {
                        ...targetFeedback.metadata,
                        read: true,
                        readAt: new Date().toISOString()
                    }
                };
                await db.feedback.update((targetFeedback as any).id, updated);
            }
        } catch (error) {
            console.error('Failed to mark feedback as read:', error);
            throw new Error('Failed to mark feedback as read');
        }
    },

    // ========================================================================
    // NEW: PRIVACY METHODS
    // ========================================================================

    async savePrivacySettings(settings: PrivacySettings): Promise<void> {
        try {
            const settingsWithId = {...settings, id: 'default'};
            await db.privacySettings.put(settingsWithId as any);
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
            throw new Error('Failed to save privacy settings');
        }
    },

    async getPrivacySettings(): Promise<PrivacySettings | null> {
        try {
            const settings = await db.privacySettings.get('default');
            if (!settings) return null;

            // Remove the id field when returning
            const {id, ...settingsWithoutId} = settings as any;
            return settingsWithoutId;
        } catch (error) {
            console.error('Failed to get privacy settings:', error);
            return null;
        }
    },

    // ========================================================================
    // NEW: ADMIN METHODS
    // ========================================================================

    async getAdminAnalytics(): Promise<AdminAnalytics> {
        try {
            const userMetrics = await this.getUserMetrics();
            const sessions = await db.userSessions.toArray();
            const events = await db.analyticsEvents.toArray();

            const adminAnalytics: AdminAnalytics = {
                userMetrics: {
                    totalUsers: 1, // Single user application
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
                    totalSessions: sessions.length,
                    averageSessionDuration: sessions.length > 0
                        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
                        : 0,
                    totalApplicationsCreated: userMetrics.applicationsCreated,
                    featuresUsage: events.reduce((acc, event) => {
                        if (event.event === 'feature_used' && event.properties?.feature) {
                            acc[event.properties.feature] = (acc[event.properties.feature] || 0) + 1;
                        }
                        return acc;
                    }, {} as { [key: string]: number })
                },
                deviceMetrics: {
                    mobile: userMetrics.deviceType === 'mobile' ? 1 : 0,
                    desktop: userMetrics.deviceType === 'desktop' ? 1 : 0
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

            return adminAnalytics;
        } catch (error) {
            console.error('Failed to get admin analytics:', error);
            throw new Error('Failed to get admin analytics');
        }
    },

    async getAdminFeedbackSummary(): Promise<AdminFeedbackSummary> {
        try {
            const stats = await this.getFeedbackStats();
            const allFeedback = await this.getAllFeedback();
            const recentFeedback = allFeedback.slice(0, 10);

            const adminFeedback: AdminFeedbackSummary = {
                totalFeedback: stats.totalSubmissions,
                unreadFeedback: recentFeedback.filter(f => !f.metadata?.read).length,
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

            return adminFeedback;
        } catch (error) {
            console.error('Failed to get admin feedback summary:', error);
            throw new Error('Failed to get admin feedback summary');
        }
    },

    async cleanupOldData(olderThanDays: number): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const cutoffTimestamp = cutoffDate.toISOString();

            await db.transaction('rw', [db.analyticsEvents, db.userSessions], async () => {
                // Clean old analytics events
                const oldEvents = await db.analyticsEvents.toArray();
                const eventsToDelete = oldEvents
                    .filter(event => event.timestamp < cutoffTimestamp)
                    .map(event => (event as any).id) // Use the auto-generated ID
                    .filter(id => id !== undefined);

                if (eventsToDelete.length > 0) {
                    await db.analyticsEvents.bulkDelete(eventsToDelete);
                }

                // Clean old sessions
                const oldSessions = await db.userSessions.toArray();
                const sessionsToDelete = oldSessions
                    .filter(session => session.startTime < cutoffTimestamp)
                    .map(session => (session as any).id) // Use the auto-generated ID
                    .filter(id => id !== undefined);

                if (sessionsToDelete.length > 0) {
                    await db.userSessions.bulkDelete(sessionsToDelete);
                }
            });

            console.log(`✅ Cleaned up data older than ${olderThanDays} days`);
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            throw new Error('Failed to cleanup old data');
        }
    }
};

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
    try {
        await db.open();
        console.log('✅ Database initialized successfully with analytics and feedback support');

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

export default databaseService;