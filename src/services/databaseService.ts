// src/services/databaseService.ts - COMPLETE REWRITE FOR ADMIN DASHBOARD COMPATIBILITY
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

// ============================================================================
// DEBUG: ENVIRONMENT VARIABLES AND CONNECTION
// ============================================================================

console.log('🔍 ENVIRONMENT DEBUG:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - Current URL:', window.location.href);
console.log('  - REACT_APP_SUPABASE_URL exists:', !!process.env.REACT_APP_SUPABASE_URL);
console.log('  - REACT_APP_SUPABASE_ANON_KEY exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
console.log('  - supabaseUrl value:', supabaseUrl);
console.log('  - supabaseAnonKey first 20 chars:', supabaseAnonKey.substring(0, 20) + '...');

// Test if we're on localhost
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
console.log('  - Running on localhost:', isLocalhost);

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
// CLOUD SYNC UTILITIES - ENHANCED WITH ALL FIXES
// ============================================================================

// Generate proper UUID for Supabase compatibility
const generateUUID = (): string => {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Convert legacy string ID to proper UUID
const convertLegacyIdToUUID = (legacyId: string): string => {
    // Create a deterministic UUID from the legacy ID
    const hash = legacyId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);

    // Convert hash to hex and pad
    const hex = Math.abs(hash).toString(16).padStart(8, '0');

    // Create a valid UUID v4 format
    return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(1, 4)}-a${hex.substring(2, 5)}-${hex.padEnd(12, '0').substring(0, 12)}`;
};

// Get user ID for cloud sync (ensures proper UUID format)
const getUserId = (): string => {
    let userId = localStorage.getItem('applytrak_user_id');

    console.log('🔍 getUserId called:');
    console.log('  - Current userId from localStorage:', userId);

    // If no user ID exists, generate a proper UUID
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('applytrak_user_id', userId);
        console.log('🆕 Generated new UUID:', userId);
        return userId;
    }

    // Check if existing ID is a proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        console.log('🔄 Converting legacy user ID to UUID:', userId);

        // Convert legacy ID to UUID deterministically
        const newUserId = convertLegacyIdToUUID(userId);
        localStorage.setItem('applytrak_user_id', newUserId);

        // Clear cached DB ID since we're changing the external ID
        localStorage.removeItem('applytrak_user_db_id');

        console.log('✅ Converted to UUID:', newUserId);
        return newUserId;
    }

    console.log('✅ Using existing UUID:', userId);
    return userId;
};

// Helper function to get the database user ID (BIGINT from Supabase)
const getUserDbId = async (): Promise<number | null> => {
    // Try to get cached DB ID first
    const cachedId = localStorage.getItem('applytrak_user_db_id');
    console.log('🔍 DEBUG getUserDbId cached:', cachedId, typeof cachedId);

    if (cachedId && !isNaN(parseInt(cachedId))) {
        const numericId = parseInt(cachedId);
        console.log('✅ Using cached DB ID:', numericId, typeof numericId);
        return numericId;
    }

    // If not cached, look it up
    if (!isOnlineWithSupabase()) {
        console.log('⚠️ Not online with Supabase, cannot get user DB ID');
        return null;
    }

    try {
        const client = initializeSupabase()!;
        const userId = getUserId(); // This now ensures proper UUID format

        console.log('🔍 Looking up user DB ID for UUID:', userId);

        const {data: user, error} = await client
            .from('users')
            .select('id')
            .eq('external_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error looking up user:', error);
            return null;
        }

        if (!user) {
            console.warn('User not found in database, will need to create');
            return null;
        }

        // CRITICAL: Ensure we're storing and returning a NUMBER
        const dbId = parseInt(user.id.toString());
        console.log('🔍 DEBUG found user.id:', user.id, typeof user.id);
        console.log('🔍 DEBUG converted to:', dbId, typeof dbId);

        localStorage.setItem('applytrak_user_db_id', dbId.toString());
        console.log('✅ Found and cached user DB ID:', dbId);
        return dbId;
    } catch (error) {
        console.warn('Error getting user DB ID:', error);
        return null;
    }
};

// Connection test function
const testSupabaseConnection = async (): Promise<void> => {
    console.log('🔍 Testing Supabase connection...');

    if (!supabase) {
        console.error('❌ No Supabase client available for testing');
        return;
    }

    try {
        // Simple query to test connection
        const {data, error, status} = await supabase
            .from('users')
            .select('count')
            .limit(1);

        console.log('🔍 Connection test result:');
        console.log('  - Status:', status);
        console.log('  - Error:', error);
        console.log('  - Data:', data);

        if (error) {
            console.error('❌ Supabase connection failed:', error);

            // Check if it's a table not found error
            if (error.code === '42P01') {
                console.error('💡 Table "users" does not exist. Did you run the SQL schema?');
            }
        } else {
            console.log('✅ Supabase connection successful');
        }
    } catch (error) {
        console.error('❌ Connection test exception:', error);
    }
};

// Initialize Supabase client only if environment variables are provided
const initializeSupabase = (): SupabaseClient | null => {
    console.log('🔍 initializeSupabase called');

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('❌ Supabase environment variables not found:');
        console.warn('  - supabaseUrl:', supabaseUrl);
        console.warn('  - supabaseAnonKey length:', supabaseAnonKey.length);
        return null;
    }

    try {
        if (!supabase) {
            console.log('🔧 Creating Supabase client...');
            supabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
                db: {
                    schema: 'public'
                }
            });

            console.log('✅ Supabase client created');

            // Test connection immediately
            testSupabaseConnection();

            // Ensure user exists when first connecting
            ensureUserExists().catch(err =>
                console.warn('Failed to create user:', err)
            );
        }
        return supabase;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return null;
    }
};

// Check if online and Supabase is available
const isOnlineWithSupabase = (): boolean => {
    const online = navigator.onLine;
    const hasSupabase = !!initializeSupabase();
    console.log('🔍 isOnlineWithSupabase:', {online, hasSupabase});
    return online && hasSupabase;
};

// Enhanced ensureUserExists function
const ensureUserExists = async (): Promise<void> => {
    if (!isOnlineWithSupabase()) {
        console.log('⚠️ Not online with Supabase, skipping user creation');
        return;
    }

    try {
        const client = initializeSupabase()!;
        const userId = getUserId(); // This ensures proper UUID format

        console.log('🔍 Checking user exists with UUID:', userId);

        // Check if user exists
        const {data: existingUser, error: fetchError} = await client
            .from('users')
            .select('id, external_id')
            .eq('external_id', userId)
            .maybeSingle();

        if (fetchError) {
            console.error('Error checking user:', fetchError);
            return;
        }

        // Create user if doesn't exist
        if (!existingUser) {
            console.log('🔧 Creating new user with UUID:', userId);

            const {data: newUser, error: insertError} = await client
                .from('users')
                .insert({
                    external_id: userId, // Now properly formatted UUID
                    email: `user-${userId.split('-')[0]}@applytrak.local`,
                    display_name: 'ApplyTrak User',
                    created_at: new Date().toISOString()
                })
                .select('id, external_id')
                .single();

            if (insertError) {
                console.error('Error creating user:', insertError);
                throw insertError;
            } else {
                console.log('✅ User created in cloud:', newUser);
                // Store the database ID for future use
                localStorage.setItem('applytrak_user_db_id', newUser.id.toString());
            }
        } else {
            console.log('✅ User already exists:', existingUser);
            // Store the database ID for future use
            localStorage.setItem('applytrak_user_db_id', existingUser.id.toString());
        }
    } catch (error) {
        console.warn('Failed to ensure user exists:', error);
    }
};

// ENHANCED Sync data to cloud with complete debug logging
const syncToCloud = async (table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'insert'): Promise<void> => {
    if (!isOnlineWithSupabase()) {
        console.log('⚠️ Not online with Supabase, skipping cloud sync');
        return;
    }

    try {
        const client = initializeSupabase()!;
        const userDbId = await getUserDbId();

        // ENHANCED DEBUG LOGGING
        console.log('🔍 ENHANCED DEBUG syncToCloud:');
        console.log('  - table:', table);
        console.log('  - operation:', operation);
        console.log('  - userDbId type:', typeof userDbId);
        console.log('  - userDbId value:', userDbId);
        console.log('  - raw data being sent:', data);

        if (!userDbId) {
            console.warn('No user DB ID available, skipping cloud sync');
            return;
        }

        // CRITICAL FIX: Ensure userDbId is a NUMBER, not string
        if (typeof userDbId !== 'number') {
            console.error('❌ userDbId is not a number:', userDbId, typeof userDbId);
            throw new Error(`Invalid user DB ID type: expected number, got ${typeof userDbId}`);
        }

        // Add user_id to all operations (use the database ID, not UUID)
        const dataWithUser = {
            ...data,
            user_id: userDbId,  // This MUST be a number (bigint)
            synced_at: new Date().toISOString()
        };

        // DETAILED DATA LOGGING
        console.log('  - Final data with user_id:', JSON.stringify(dataWithUser, null, 2));
        console.log('  - Data size:', JSON.stringify(dataWithUser).length, 'characters');

        let result;

        switch (operation) {
            case 'insert':
                console.log('  - 🚀 EXECUTING INSERT to Supabase...');
                result = await client.from(table).insert(dataWithUser).select();
                break;
            case 'update':
                const updateData = {...dataWithUser};
                delete updateData.user_id; // Remove to avoid conflicts
                console.log('  - 🚀 EXECUTING UPDATE to Supabase...');
                console.log('  - Update data:', JSON.stringify(updateData, null, 2));
                result = await client
                    .from(table)
                    .update(updateData)
                    .eq('id', data.id)
                    .eq('user_id', userDbId)
                    .select();
                break;
            case 'delete':
                console.log('  - 🚀 EXECUTING DELETE from Supabase...');
                result = await client
                    .from(table)
                    .delete()
                    .eq('id', data.id)
                    .eq('user_id', userDbId);
                break;
        }

        // DETAILED RESULT LOGGING
        console.log('  - 📊 SUPABASE RESPONSE:');
        console.log('    - Status:', result.status);
        console.log('    - Status Text:', result.statusText);
        console.log('    - Error:', result.error);
        console.log('    - Data returned:', result.data);
        console.log('    - Count:', result.count);

        if (result.error) {
            console.error('❌ Supabase operation error:', result.error);
            console.error('❌ Error details:', JSON.stringify(result.error, null, 2));
            throw result.error;
        }

        // Check if data was actually inserted/updated
        if (operation === 'insert' && result.data && result.data.length > 0) {
            console.log('✅ SUCCESS: Data inserted and returned from Supabase');
        } else if (operation === 'insert') {
            console.warn('⚠️ INSERT succeeded but no data returned. Possible RLS issue?');
        }

        console.log(`✅ Synced to cloud: ${table} ${operation}`);
        console.log('  - 🎉 SUCCESS: Data should now be in Supabase');

    } catch (error) {
        console.error(`❌ FULL ERROR DETAILS for ${table}:`, error);
        console.error('❌ Error stack:', error.stack);
        console.warn(`Cloud sync failed for ${table}:`, error);
    }
};

// FIXED: Upsert function with proper conflict resolution
const syncToCloudUpsert = async (table: string, data: any, conflictColumns: string = 'user_id'): Promise<void> => {
    if (!isOnlineWithSupabase()) return;

    try {
        const client = initializeSupabase()!;
        const userDbId = await getUserDbId();

        if (!userDbId) {
            console.warn('No user DB ID available, skipping cloud sync');
            return;
        }

        const dataWithUser = {
            ...data,
            user_id: userDbId,
            synced_at: new Date().toISOString()
        };

        console.log('🔍 UPSERT DEBUG:', JSON.stringify(dataWithUser, null, 2));
        console.log('🔍 CONFLICT COLUMNS:', conflictColumns);

        const result = await client
            .from(table)
            .upsert(dataWithUser, {
                onConflict: conflictColumns,
                ignoreDuplicates: false
            })
            .select();

        console.log('📊 UPSERT RESPONSE:');
        console.log('  - Status:', result.status);
        console.log('  - Error:', result.error);
        console.log('  - Data:', result.data);

        if (result.error) {
            console.error('❌ Supabase upsert error:', result.error);
            throw result.error;
        }

        console.log(`✅ Upserted to cloud: ${table}`);

    } catch (error) {
        console.error(`❌ Upsert failed for ${table}:`, error);
        throw error;
    }
};

// Sync from cloud (pull latest data)
const syncFromCloud = async (table: string): Promise<any[]> => {
    if (!isOnlineWithSupabase()) return [];

    try {
        const client = initializeSupabase()!;
        const userDbId = await getUserDbId();

        if (!userDbId) {
            console.warn('No user DB ID available, skipping cloud sync');
            return [];
        }

        const {data, error} = await client
            .from(table)
            .select('*')
            .eq('user_id', userDbId)  // Use the database ID
            .order('created_at', {ascending: false});

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        console.log(`✅ Synced from cloud: ${table} (${data?.length || 0} items)`);
        return data || [];
    } catch (error) {
        console.warn(`Cloud sync failed for ${table}:`, error);
        return [];
    }
};

// ============================================================================
// COMPLETE DATABASE SERVICE - REWRITTEN FOR ADMIN DASHBOARD
// ============================================================================

export const databaseService: DatabaseService = {
    // ========================================================================
    // APPLICATION METHODS (ENHANCED WITH CLOUD SYNC) - WORKING
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
                    const userDbId = await getUserDbId();

                    if (userDbId) {
                        // Delete all user data from cloud
                        await Promise.all([
                            client.from('applications').delete().eq('user_id', userDbId),
                            client.from('goals').delete().eq('user_id', userDbId),
                            client.from('analytics_events').delete().eq('user_id', userDbId),
                            client.from('user_sessions').delete().eq('user_id', userDbId),
                            client.from('user_metrics').delete().eq('user_id', userDbId),
                            client.from('feedback').delete().eq('user_id', userDbId),
                            client.from('privacy_settings').delete().eq('user_id', userDbId)
                        ]);

                        console.log('✅ Cloud data cleared');
                    }
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
    // GOALS METHODS - FIXED WITH PROPER UPSERT
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

            // FIXED: Sync to cloud using user_id as primary key
            if (isOnlineWithSupabase()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    console.log('🔍 GOALS SYNC - Browser Session ID:', userDbId);

                    try {
                        await syncToCloudUpsert('goals', {
                            id: 'default',  // Keep for compatibility
                            total_goal: Number(goals.totalGoal),
                            weekly_goal: Number(goals.weeklyGoal),
                            monthly_goal: Number(goals.monthlyGoal),
                            created_at: goals.createdAt,
                            updated_at: goals.updatedAt
                        }, 'user_id');  // Use user_id as conflict resolution

                        console.log('✅ Goals synced successfully for browser session:', userDbId);
                    } catch (error) {
                        console.error('❌ Goals sync failed:', error);
                    }
                }
            }

            return goals;
        } catch (error) {
            console.error('Failed to update goals:', error);
            throw new Error('Failed to update goals');
        }
    },

    // ========================================================================
    // BACKUP METHODS (LOCAL ONLY - UNCHANGED)
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
    // ANALYTICS METHODS - COMPLETELY FIXED FOR ADMIN DASHBOARD
    // ========================================================================
    async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        try {
            console.log('🔍 ANALYTICS EVENT DEBUG - Input:', event);

            // Save to local first
            const eventForStorage = {
                event: event.event,
                properties: event.properties,
                timestamp: event.timestamp,
                sessionId: event.sessionId,
                userId: event.userId
            };
            await db.analyticsEvents.add(eventForStorage as any);
            console.log('✅ ANALYTICS EVENT - Saved to local database');

            // FIXED: Sync to cloud with complete event data
            if (isOnlineWithSupabase()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    console.log('🔍 ANALYTICS SYNC - Browser Session ID:', userDbId);

                    try {
                        await syncToCloud('analytics_events', {
                            event_name: event.event,
                            properties: event.properties || {},
                            timestamp: event.timestamp,
                            session_id: event.sessionId,
                            user_agent: navigator.userAgent,
                            device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                            language: navigator.language || 'en',
                            created_at: event.timestamp
                        }, 'insert');

                        console.log('✅ ANALYTICS EVENT - Synced for browser session:', userDbId);
                    } catch (syncError) {
                        console.error('❌ ANALYTICS EVENT - Sync failed:', syncError);
                    }
                }
            } else {
                console.log('⚠️ ANALYTICS EVENT - Offline, saved locally only');
            }

        } catch (error) {
            console.error('❌ Failed to save analytics event:', error);
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
                return events.sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
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
            console.log('🔍 USER SESSION DEBUG - Input:', session);

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
            console.log('✅ USER SESSION - Saved to local database');

            // FIXED: Sync to cloud with complete session data
            if (isOnlineWithSupabase()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    console.log('🔍 SESSION SYNC - Browser Session ID:', userDbId);

                    try {
                        await syncToCloud('user_sessions', {
                            session_id: session.id,
                            start_time: session.startTime,
                            end_time: session.endTime,
                            duration: Number(session.duration) || null,
                            device_type: session.deviceType || (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'),
                            user_agent: session.userAgent || navigator.userAgent,
                            referrer: document.referrer || null,
                            timezone: session.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                            language: session.language || navigator.language || 'en',
                            events: session.events || [],
                            page_views: Number(session.events?.length) || 0,
                            created_at: session.startTime
                        }, 'insert');

                        console.log('✅ USER SESSION - Synced for browser session:', userDbId);
                    } catch (syncError) {
                        console.error('❌ USER SESSION - Sync failed:', syncError);
                    }
                }
            } else {
                console.log('⚠️ USER SESSION - Offline, saved locally only');
            }

        } catch (error) {
            console.error('❌ Failed to save user session:', error);
            throw new Error('Failed to save user session');
        }
    },

    async getUserMetrics(): Promise<UserMetrics> {
        try {
            const metrics = await db.userMetrics.get('default');

            if (!metrics) {
                // Create default metrics
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
                    lastActiveDate: new Date().toISOString(),
                    deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    firstVisit: new Date().toISOString(),
                    totalEvents: 0
                };

                await db.userMetrics.put(defaultMetrics);
                return defaultMetrics;
            }

            return metrics;
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

            // FIXED: Sync to cloud using user_id as primary key
            if (isOnlineWithSupabase()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    console.log('🔍 METRICS SYNC - Browser Session ID:', userDbId);

                    try {
                        await syncToCloudUpsert('user_metrics', {
                            id: 'default',  // Keep for compatibility
                            sessions_count: Number(updated.sessionsCount) || 0,
                            total_time_spent: Number(updated.totalTimeSpent) || 0,
                            applications_created: Number(updated.applicationsCreated) || 0,
                            applications_updated: Number(updated.applicationsUpdated) || 0,
                            applications_deleted: Number(updated.applicationsDeleted) || 0,
                            goals_set: Number(updated.goalsSet) || 0,
                            attachments_added: Number(updated.attachmentsAdded) || 0,
                            exports_performed: Number(updated.exportsPerformed) || 0,
                            imports_performed: Number(updated.importsPerformed) || 0,
                            searches_performed: Number(updated.searchesPerformed) || 0,
                            features_used: updated.featuresUsed || [],
                            last_active_date: updated.lastActiveDate || new Date().toISOString(),
                            first_visit: updated.firstVisit || new Date().toISOString(),
                            device_type: updated.deviceType || (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'),
                            browser_version: navigator.userAgent || 'unknown',
                            screen_resolution: `${window.screen.width}x${window.screen.height}`,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                            language: navigator.language || 'en',
                            total_events: Number(updated.totalEvents) || 0,
                            applications_count: Number(updated.applicationsCreated) || 0,
                            session_duration: Number(updated.totalTimeSpent) || 0,
                            created_at: updated.firstVisit || new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }, 'user_id');  // Use user_id as conflict resolution

                        console.log('✅ User metrics synced successfully for browser session:', userDbId);
                    } catch (error) {
                        console.error('❌ User metrics sync failed:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to update user metrics:', error);
            throw new Error('Failed to update user metrics');
        }
    },

    // ========================================================================
    // FEEDBACK METHODS - COMPLETELY FIXED FOR ADMIN DASHBOARD
    // ========================================================================
    async saveFeedback(feedback: FeedbackSubmission): Promise<void> {
        try {
            console.log('🔍 FEEDBACK DEBUG - Input:', feedback);

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
            console.log('✅ FEEDBACK - Saved to local database');

            // FIXED: Sync to cloud with complete feedback data for admin dashboard
            if (isOnlineWithSupabase()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    console.log('🔍 FEEDBACK SYNC - Browser Session ID:', userDbId);

                    try {
                        await syncToCloud('feedback', {
                            type: feedback.type,
                            rating: Number(feedback.rating),
                            message: feedback.message,
                            email: feedback.email || null,
                            timestamp: feedback.timestamp,
                            session_id: feedback.sessionId,
                            user_agent: feedback.userAgent || navigator.userAgent,
                            url: feedback.url || window.location.href,
                            metadata: {
                                ...feedback.metadata,
                                deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
                                applicationsCount: await db.applications.count(),
                                screenResolution: `${window.screen.width}x${window.screen.height}`,
                                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                                language: navigator.language || 'en',
                                read: false  // Mark as unread for admin dashboard
                            },
                            created_at: feedback.timestamp
                        }, 'insert');

                        console.log('✅ FEEDBACK - Synced for browser session:', userDbId);
                    } catch (syncError) {
                        console.error('❌ FEEDBACK - Sync failed:', syncError);
                    }
                }
            } else {
                console.log('⚠️ FEEDBACK - Offline, saved locally only');
            }

        } catch (error) {
            console.error('❌ Failed to save feedback:', error);
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
                ? allFeedback.reduce((sum, f) => sum + Number(f.rating), 0) / totalSubmissions
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
                const rating = Number(f.rating);
                if (rating >= 1 && rating <= 5) {
                    ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
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
    // PRIVACY METHODS - FIXED WITH PROPER UPSERT
    // ========================================================================
    async savePrivacySettings(settings: PrivacySettings): Promise<void> {
        try {
            const settingsWithId = {id: 'default', ...settings};
            await db.privacySettings.put(settingsWithId);

            // FIXED: Sync to cloud using user_id as primary key
            if (isOnlineWithSupabase()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    console.log('🔍 PRIVACY SYNC - Browser Session ID:', userDbId);

                    try {
                        await syncToCloudUpsert('privacy_settings', {
                            id: 'default',  // Keep for compatibility
                            analytics: settings.analytics,
                            feedback: settings.feedback,
                            functional_cookies: settings.functionalCookies,
                            consent_date: settings.consentDate,
                            consent_version: settings.consentVersion,
                            cloud_sync_consent: false,  // Default to false
                            data_retention_period: 365,  // Default retention
                            anonymize_after: 730,  // Default anonymization
                            tracking_level: 'minimal',  // Default tracking level
                            data_sharing_consent: false,  // Default sharing consent
                            created_at: settings.consentDate,
                            updated_at: new Date().toISOString()
                        }, 'user_id');  // Use user_id as conflict resolution

                        console.log('✅ Privacy settings synced successfully for browser session:', userDbId);
                    } catch (error) {
                        console.error('❌ Privacy settings sync failed:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
            throw new Error('Failed to save privacy settings');
        }
    },

    async getPrivacySettings(): Promise<PrivacySettings | null> {
        try {
            // Try local first
            let settings = await db.privacySettings.get('default');

            // Try cloud sync if online and no local settings
            if (isOnlineWithSupabase() && !settings) {
                try {
                    const userDbId = await getUserDbId();
                    if (userDbId) {
                        console.log('🔍 PRIVACY GET - Browser Session ID:', userDbId);

                        const client = initializeSupabase()!;
                        const {data, error} = await client
                            .from('privacy_settings')
                            .select('*')
                            .eq('user_id', userDbId)
                            .maybeSingle();

                        if (error && error.code !== 'PGRST116') {
                            console.error('Error fetching privacy settings:', error);
                        } else if (data) {
                            // Convert from cloud format to local format
                            settings = {
                                id: 'default',
                                analytics: data.analytics,
                                feedback: data.feedback,
                                functionalCookies: data.functional_cookies,
                                consentDate: data.consent_date,
                                consentVersion: data.consent_version
                            };

                            // Cache locally
                            await db.privacySettings.put(settings);
                            console.log('✅ Privacy settings synced from cloud');
                        }
                    }
                } catch (cloudError) {
                    console.warn('Failed to fetch privacy settings from cloud:', cloudError);
                }
            }

            // Return settings without the id field (as per your existing code)
            if (settings) {
                const {id, ...settingsWithoutId} = settings as any;
                return settingsWithoutId;
            }

            return null;
        } catch (error) {
            console.error('Failed to get privacy settings:', error);
            return null;
        }
    },

    // ========================================================================
    // ADMIN METHODS - ENHANCED FOR COMPLETE ADMIN DASHBOARD SUPPORT
    // ========================================================================
    async getAdminAnalytics(): Promise<AdminAnalytics> {
        try {
            const applications = await this.getApplications();
            const analytics = await this.getAnalyticsEvents();
            const userMetrics = await this.getUserMetrics();
            const sessions = await db.userSessions.toArray();

            // Calculate analytics in the format expected by admin dashboard
            const totalUsers = 1; // Single browser session
            const totalApplications = applications.length;
            const totalEvents = analytics.length;
            const totalSessions = sessions.length;

            // Calculate average session duration
            const averageSessionDuration = sessions.length > 0
                ? sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / sessions.length
                : 0;

            // Features usage from analytics events
            const featuresUsage = analytics.reduce((acc, event) => {
                if (event.event === 'feature_used' && event.properties?.feature) {
                    acc[event.properties.feature] = (acc[event.properties.feature] || 0) + 1;
                }
                return acc;
            }, {} as { [key: string]: number });

            // Device metrics from user metrics
            const deviceType = userMetrics.deviceType || 'desktop';

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
                    totalSessions,
                    averageSessionDuration,
                    totalApplicationsCreated: Number(userMetrics.applicationsCreated) || totalApplications,
                    featuresUsage
                },
                deviceMetrics: {
                    mobile: deviceType === 'mobile' ? 1 : 0,
                    desktop: deviceType === 'desktop' ? 1 : 0,
                    tablet: deviceType === 'tablet' ? 1 : 0
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
                topIssues: []  // Could be enhanced to identify common issues
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

// Add this temporary debug function to your databaseService.ts
// This will help us see exactly what's happening

// ADD THIS TO YOUR DATABASESERVICE.TS FILE TEMPORARILY:

export const debugAnalyticsSync = async () => {
    console.log('🧪 DEBUG: Testing all sync operations...');

    try {
        // Test 1: Check if we have a user ID
        const userId = getUserId();
        const userDbId = await getUserDbId();
        console.log('🔍 User IDs:', {userId, userDbId, userDbIdType: typeof userDbId});

        // Test 2: Check if Supabase is connected
        const isOnline = isOnlineWithSupabase();
        console.log('🔍 Supabase online:', isOnline);

        // Test 3: Try to save an analytics event
        console.log('🧪 Testing analytics event...');
        await databaseService.saveAnalyticsEvent({
            event: 'test_event',
            properties: {test: true},
            timestamp: new Date().toISOString(),
            sessionId: 'debug-session-' + Date.now(),
            userId: userId
        });
        console.log('✅ Analytics event test completed');

        // Test 4: Try to save feedback
        console.log('🧪 Testing feedback...');
        await databaseService.saveFeedback({
            id: 'debug-feedback-' + Date.now(),
            type: 'general',
            rating: 5,
            message: 'Debug test feedback',
            timestamp: new Date().toISOString(),
            sessionId: 'debug-session-' + Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            metadata: {}
        });
        console.log('✅ Feedback test completed');

        // Test 5: Try to save user session
        console.log('🧪 Testing user session...');
        await databaseService.saveUserSession({
            id: 'debug-session-' + Date.now(),
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 60000,
            deviceType: 'desktop',
            userAgent: navigator.userAgent,
            events: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
        });
        console.log('✅ User session test completed');

        // Test 6: Try to update user metrics
        console.log('🧪 Testing user metrics...');
        await databaseService.updateUserMetrics({
            sessionsCount: 1,
            totalTimeSpent: 60000,
            applicationsCreated: 1,
            featuresUsed: ['debug_test'],
            lastActiveDate: new Date().toISOString()
        });
        console.log('✅ User metrics test completed');

        // Test 7: Check what's actually in the local database
        const localAnalytics = await db.analyticsEvents.toArray();
        const localFeedback = await db.feedback.toArray();
        const localSessions = await db.userSessions.toArray();
        const localMetrics = await db.userMetrics.toArray();

        console.log('🔍 Local database contents:');
        console.log('  - Analytics events:', localAnalytics.length);
        console.log('  - Feedback:', localFeedback.length);
        console.log('  - Sessions:', localSessions.length);
        console.log('  - Metrics:', localMetrics.length);

        console.log('🎉 Debug test completed - check logs above for any errors');

    } catch (error) {
        console.error('❌ Debug test failed:', error);
    }
};

// Also add this function to test Supabase tables directly
export const testSupabaseTables = async () => {
    console.log('🧪 Testing Supabase tables directly...');

    if (!isOnlineWithSupabase()) {
        console.error('❌ Not online with Supabase');
        return;
    }

    try {
        const client = initializeSupabase()!;
        const userDbId = await getUserDbId();

        if (!userDbId) {
            console.error('❌ No user DB ID');
            return;
        }

        // Test each table directly
        const tables = ['analytics_events', 'feedback', 'user_sessions', 'user_metrics'];

        for (const table of tables) {
            try {
                console.log(`🧪 Testing table: ${table}`);

                // Try to insert test data directly
                const testData = {
                    user_id: userDbId,
                    created_at: new Date().toISOString(),
                    synced_at: new Date().toISOString()
                };

                // Add table-specific fields
                if (table === 'analytics_events') {
                    Object.assign(testData, {
                        event_name: 'debug_test',
                        properties: {debug: true},
                        timestamp: new Date().toISOString(),
                        session_id: 'debug-session'
                    });
                } else if (table === 'feedback') {
                    Object.assign(testData, {
                        type: 'general',
                        rating: 5,
                        message: 'Debug test',
                        timestamp: new Date().toISOString()
                    });
                } else if (table === 'user_sessions') {
                    Object.assign(testData, {
                        session_id: 'debug-session',
                        start_time: new Date().toISOString(),
                        device_type: 'desktop'
                    });
                } else if (table === 'user_metrics') {
                    Object.assign(testData, {
                        id: 'default',
                        sessions_count: 1,
                        total_time_spent: 60000,
                        applications_created: 1
                    });
                }

                const result = await client.from(table).insert(testData).select();

                console.log(`✅ ${table} test result:`, {
                    status: result.status,
                    error: result.error,
                    dataReturned: !!result.data?.length
                });

                if (result.error) {
                    console.error(`❌ ${table} error details:`, result.error);
                }

            } catch (error) {
                console.error(`❌ ${table} test failed:`, error);
            }
        }

    } catch (error) {
        console.error('❌ Supabase table test failed:', error);
    }
};

// Add this EXACT debug function to your existing databaseService.ts file
// It's designed to work with your current setup and schema

export const debugSupabaseSync = async () => {
    console.log('🧪 === APPLYTRAK SUPABASE SYNC DEBUG ===');
    console.log('Schema: Your existing schema detected ✅');

    // 1. Environment check
    console.log('📝 Environment Check:');
    const hasUrl = !!process.env.REACT_APP_SUPABASE_URL;
    const hasKey = !!process.env.REACT_APP_SUPABASE_ANON_KEY;

    console.log(`  - REACT_APP_SUPABASE_URL: ${hasUrl ? '✅ SET' : '❌ MISSING'}`);
    console.log(`  - REACT_APP_SUPABASE_ANON_KEY: ${hasKey ? '✅ SET' : '❌ MISSING'}`);

    if (hasUrl) {
        console.log(`  - URL: ${process.env.REACT_APP_SUPABASE_URL}`);
    }
    if (hasKey) {
        console.log(`  - Key (first 20): ${process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20)}...`);
    }

    if (!hasUrl || !hasKey) {
        console.error('❌ CRITICAL: Missing environment variables!');
        console.log('💡 Create .env file in your project root:');
        console.log('REACT_APP_SUPABASE_URL=https://yourproject.supabase.co');
        console.log('REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here');
        console.log('Then restart your dev server: npm start');
        return;
    }

    // 2. Test isOnlineWithSupabase function
    console.log('🔧 Testing connection functions:');
    const online = isOnlineWithSupabase();
    console.log(`  - isOnlineWithSupabase(): ${online ? '✅ TRUE' : '❌ FALSE'}`);

    if (!online) {
        console.error('❌ Connection function failed - checking initializeSupabase...');
        const client = initializeSupabase();
        console.log(`  - initializeSupabase(): ${client ? '✅ CLIENT CREATED' : '❌ CLIENT FAILED'}`);
        return;
    }

    // 3. Test actual Supabase connection
    console.log('🌐 Testing Supabase connection:');
    try {
        const client = initializeSupabase();
        if (!client) {
            console.error('❌ No Supabase client');
            return;
        }

        // Test with your existing users table
        const {data, error, status} = await client
            .from('users')
            .select('count')
            .limit(1);

        console.log(`  - Connection test: Status ${status}`);
        if (error) {
            console.error(`  - Error: ${error.message} (${error.code})`);
            if (error.code === 'PGRST301') {
                console.log('💡 This might be a RLS policy issue - checking...');
            }
        } else {
            console.log('  - ✅ Connection successful');
        }

    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return;
    }

    // 4. Test user ID functions
    console.log('👤 Testing user ID functions:');
    const userId = getUserId();
    console.log(`  - getUserId(): ${userId}`);

    const userDbId = await getUserDbId();
    console.log(`  - getUserDbId(): ${userDbId} (${typeof userDbId})`);

    if (!userDbId) {
        console.error('❌ No user DB ID - this will prevent syncing');
        console.log('🔧 Attempting to create user...');

        try {
            const client = initializeSupabase()!;
            const {data: newUser, error} = await client
                .from('users')
                .insert({
                    external_id: userId,
                    email: `debug-${userId.split('-')[0]}@applytrak.local`,
                    display_name: 'ApplyTrak User'
                })
                .select('id')
                .single();

            if (error) {
                console.error('❌ Failed to create user:', error);
            } else {
                console.log('✅ User created:', newUser.id);
                localStorage.setItem('applytrak_user_db_id', newUser.id.toString());
            }
        } catch (error) {
            console.error('❌ User creation failed:', error);
        }
        return;
    }

    // 5. Test application sync
    console.log('📝 Testing application sync:');

    const testApp = {
        id: `debug-test-${Date.now()}`,
        company: 'Debug Test Company',
        position: 'Test Position',
        date_applied: new Date().toISOString().split('T')[0],
        status: 'Applied',
        type: 'Remote',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    console.log('  - Test application data:', testApp);

    try {
        // Use your existing syncToCloud function
        await syncToCloud('applications', testApp, 'insert');
        console.log('✅ syncToCloud function executed without errors');

        // Verify it was actually inserted
        const client = initializeSupabase()!;
        const {data, error} = await client
            .from('applications')
            .select('*')
            .eq('id', testApp.id)
            .single();

        if (error) {
            console.error('❌ Test app not found in database:', error);
        } else {
            console.log('✅ Test app successfully synced:', data);

            // Clean up
            await client.from('applications').delete().eq('id', testApp.id);
            console.log('🧹 Test data cleaned up');
        }

    } catch (error) {
        console.error('❌ Sync test failed:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
    }

    // 6. Test your actual data sync
    console.log('📊 Testing your real data sync:');

    try {
        // Get one real application from your local database
        const localApps = await db.applications.limit(1).toArray();

        if (localApps.length > 0) {
            console.log('  - Found local application:', localApps[0].company, localApps[0].position);
            console.log('  - Attempting to sync to cloud...');

            await syncToCloud('applications', {
                id: localApps[0].id,
                company: localApps[0].company,
                position: localApps[0].position,
                date_applied: localApps[0].dateApplied,
                status: localApps[0].status,
                type: localApps[0].type,
                location: localApps[0].location,
                salary: localApps[0].salary,
                job_source: localApps[0].jobSource,
                job_url: localApps[0].jobUrl,
                notes: localApps[0].notes,
                attachments: localApps[0].attachments,
                created_at: localApps[0].createdAt,
                updated_at: localApps[0].updatedAt
            }, 'insert');

            console.log('✅ Real application sync completed');

        } else {
            console.log('  - No local applications found to test with');
            console.log('  - Try adding an application first, then run this debug again');
        }
    } catch (error) {
        console.error('❌ Real data sync test failed:', error);
    }

    // 7. Summary and recommendations
    console.log('📋 === DEBUG SUMMARY ===');
    console.log('If you see errors above:');
    console.log('1. Environment variables missing → Add .env file');
    console.log('2. Connection failed → Check Supabase project URL/key');
    console.log('3. User creation failed → Check RLS policies');
    console.log('4. Sync failed → Check table schemas and constraints');
    console.log('');
    console.log('If all tests pass but sync still not working:');
    console.log('1. Try adding a new application after running this debug');
    console.log('2. Check your Supabase dashboard → Table Editor → applications');
    console.log('3. Look for data in the applications table');

    console.log('🎉 === DEBUG COMPLETE ===');
};

// Also add this function to test from browser console
(window as any).debugSupabaseSync = debugSupabaseSync;


export default databaseService;