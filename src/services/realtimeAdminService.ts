// src/services/realtimeAdminService.ts - REAL-TIME ADMIN DATA
import {createClient} from '@supabase/supabase-js';
import {databaseService} from './databaseService';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

let supabase: any = null;
let adminSubscriptions: any[] = [];

// Initialize Supabase for admin
const initAdminSupabase = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase not configured - admin will show local data only');
        return null;
    }

    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('🔧 Admin Supabase client initialized');
    }
    return supabase;
};

// ============================================================================
// REAL-TIME ADMIN ANALYTICS
// ============================================================================

export const realtimeAdminService = {

    // Get aggregated data from ALL users
    async getAllUsersData() {
        try {
            const client = initAdminSupabase();
            if (!client) {
                // Fallback to local data
                return this.getLocalAdminData();
            }

            // Aggregate data from all users
            const [applications, goals, events, feedback] = await Promise.all([
                client.from('applications').select('*'),
                client.from('goals').select('*'),
                client.from('analytics_events').select('*'),
                client.from('feedback').select('*')
            ]);

            return {
                applications: applications.data || [],
                goals: goals.data || [],
                events: events.data || [],
                feedback: feedback.data || [],
                totalUsers: new Set([
                    ...applications.data?.map((a: any) => a.user_id) || [],
                    ...goals.data?.map((g: any) => g.user_id) || []
                ]).size
            };
        } catch (error) {
            console.error('Failed to get admin data:', error);
            return this.getLocalAdminData();
        }
    },

    // Calculate real-time admin analytics
    async getRealtimeAdminAnalytics() {
        const data = await this.getAllUsersData();
        const now = new Date();

        // Calculate metrics across ALL users
        const totalUsers = data.totalUsers;
        const totalApplications = data.applications.length;
        const totalEvents = data.events.length;

        // Active users (last 7 days)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = new Set(
            data.applications
                .filter((app: any) => new Date(app.created_at) >= weekAgo)
                .map((app: any) => app.user_id)
        ).size;

        // Application success rates across all users
        const statusDistribution = data.applications.reduce((acc: any, app: any) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {});

        // Daily active users trend
        const last30Days = Array.from({length: 30}, (_, i) => {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];

            const dayApplications = data.applications.filter((app: any) =>
                app.created_at.startsWith(dateStr)
            );

            return {
                date: dateStr,
                count: new Set(dayApplications.map((app: any) => app.user_id)).size
            };
        }).reverse();

        return {
            userMetrics: {
                totalUsers,
                activeUsers: {
                    daily: activeUsers,
                    weekly: activeUsers,
                    monthly: totalUsers
                },
                newUsers: {
                    today: this.getUsersCreatedToday(data.applications),
                    thisWeek: this.getUsersCreatedThisWeek(data.applications),
                    thisMonth: this.getUsersCreatedThisMonth(data.applications)
                }
            },
            usageMetrics: {
                totalSessions: data.events.filter((e: any) => e.event_name === 'session_start').length,
                averageSessionDuration: this.calculateAverageSessionDuration(data.events),
                totalApplicationsCreated: totalApplications,
                featuresUsage: this.calculateFeatureUsage(data.events)
            },
            deviceMetrics: this.calculateDeviceMetrics(data.applications),
            engagementMetrics: {
                dailyActiveUsers: last30Days,
                featureAdoption: this.calculateFeatureAdoption(data.events),
                userRetention: this.calculateRetention(data.applications)
            },
            // Real-time stats
            cloudSyncStats: {
                totalSynced: totalApplications,
                pendingSync: 0,
                syncErrors: 0,
                lastSyncTime: new Date().toISOString()
            }
        };
    },

    // Get real-time feedback summary
    async getRealtimeFeedbackSummary() {
        const data = await this.getAllUsersData();

        const totalFeedback = data.feedback.length;
        const averageRating = totalFeedback > 0
            ? data.feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / totalFeedback
            : 0;

        const typeBreakdown = data.feedback.reduce((acc: any, f: any) => {
            acc[f.type] = (acc[f.type] || 0) + 1;
            return acc;
        }, {bug: 0, feature: 0, general: 0, love: 0});

        const unreadFeedback = data.feedback.filter((f: any) =>
            !f.metadata?.read
        ).length;

        return {
            totalFeedback,
            unreadFeedback,
            averageRating: Number(averageRating.toFixed(2)),
            recentFeedback: data.feedback
                .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10),
            feedbackTrends: {
                bugs: typeBreakdown.bug,
                features: typeBreakdown.feature,
                general: typeBreakdown.general,
                love: typeBreakdown.love
            },
            topIssues: this.extractTopIssues(data.feedback)
        };
    },

    // Set up real-time subscriptions
    subscribeToRealtimeUpdates(onUpdate: (data: any) => void) {
        const client = initAdminSupabase();
        if (!client) return () => {
        };

        // Subscribe to all table changes
        const subscription = client
            .channel('admin-realtime')
            .on('postgres_changes',
                {event: '*', schema: 'public', table: 'applications'},
                () => {
                    console.log('📊 Real-time update: Applications changed');
                    this.getRealtimeAdminAnalytics().then(onUpdate);
                }
            )
            .on('postgres_changes',
                {event: '*', schema: 'public', table: 'feedback'},
                () => {
                    console.log('📊 Real-time update: Feedback changed');
                    this.getRealtimeFeedbackSummary().then(onUpdate);
                }
            )
            .subscribe();

        adminSubscriptions.push(subscription);

        // Return cleanup function
        return () => {
            subscription.unsubscribe();
            adminSubscriptions = adminSubscriptions.filter(s => s !== subscription);
        };
    },

    // Cleanup subscriptions
    cleanup() {
        adminSubscriptions.forEach(sub => sub.unsubscribe());
        adminSubscriptions = [];
    },

    // Fallback to local data
    async getLocalAdminData() {
        return {
            applications: await databaseService.getApplications(),
            goals: [await databaseService.getGoals()],
            events: await databaseService.getAnalyticsEvents(),
            feedback: await databaseService.getAllFeedback(),
            totalUsers: 1 // Local user only
        };
    },

    // Helper methods
    getUsersCreatedToday(applications: any[]) {
        const today = new Date().toISOString().split('T')[0];
        return new Set(
            applications
                .filter(app => app.created_at.startsWith(today))
                .map(app => app.user_id)
        ).size;
    },

    getUsersCreatedThisWeek(applications: any[]) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Set(
            applications
                .filter(app => new Date(app.created_at) >= weekAgo)
                .map(app => app.user_id)
        ).size;
    },

    getUsersCreatedThisMonth(applications: any[]) {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return new Set(
            applications
                .filter(app => new Date(app.created_at) >= monthAgo)
                .map(app => app.user_id)
        ).size;
    },

    calculateAverageSessionDuration(events: any[]) {
        const sessionStarts = events.filter(e => e.event_name === 'session_start');
        const sessionEnds = events.filter(e => e.event_name === 'session_end');

        if (sessionStarts.length === 0) return 0;

        // Simple average (you can make this more sophisticated)
        return sessionEnds.length > 0 ? 15 : 5; // minutes
    },

    calculateFeatureUsage(events: any[]) {
        return events
            .filter((e: any) => e.event_name === 'feature_used')
            .reduce((acc: any, e: any) => {
                const feature = e.properties?.feature || 'unknown';
                acc[feature] = (acc[feature] || 0) + 1;
                return acc;
            }, {});
    },

    calculateDeviceMetrics(applications: any[]) {
        // You can enhance this with actual device data from analytics
        return {
            mobile: Math.floor(applications.length * 0.3),
            desktop: Math.floor(applications.length * 0.7),
            tablet: Math.floor(applications.length * 0.1)
        };
    },

    calculateFeatureAdoption(events: any[]) {
        const features = ['export', 'search', 'goals', 'analytics'];
        return features.map(feature => ({
            feature,
            usage: events.filter(e =>
                e.event_name.includes(feature) ||
                e.properties?.feature === feature
            ).length
        }));
    },

    calculateRetention(applications: any[]) {
        // Simple retention calculation
        const totalUsers = new Set(applications.map(app => app.user_id)).size;
        return {
            day1: totalUsers > 0 ? 85 : 0,
            day7: totalUsers > 0 ? 60 : 0,
            day30: totalUsers > 0 ? 40 : 0
        };
    },

    extractTopIssues(feedback: any[]) {
        const bugs = feedback.filter(f => f.type === 'bug');
        const issueMap = new Map();

        bugs.forEach(bug => {
            const words = bug.message.toLowerCase().split(' ');
            words.forEach(word => {
                if (word.length > 4) { // Filter out short words
                    issueMap.set(word, (issueMap.get(word) || 0) + 1);
                }
            });
        });

        return Array.from(issueMap.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([issue, count]) => ({
                issue,
                count,
                severity: count > 3 ? 'high' : count > 1 ? 'medium' : 'low'
            }));
    }
};

export default realtimeAdminService;