// src/services/databaseService.ts - ENHANCED WITH REAL SUPABASE AUTHENTICATION
import Dexie, {Table} from 'dexie';
import {createClient, Session, SupabaseClient, User} from '@supabase/supabase-js';
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
// SUPABASE CONFIGURATION - REAL AUTHENTICATION ENABLED
// ============================================================================

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;
const initializeSupabase = (): SupabaseClient | null => {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('❌ Supabase environment variables not configured');
        return null;
    }

    if (!supabase) {
        console.log('🔧 Creating optimized Supabase client...');
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                storage: window.localStorage,
                storageKey: 'applytrak-auth-token',
                debug: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'x-client-info': 'applytrak/1.0'
                },
                // ✅ ADD: Optimized fetch options
                fetch: (url, options = {}) => {
                    return fetch(url, {
                        ...options,
                        // ✅ Shorter timeout (5 seconds instead of default 20+)
                        signal: AbortSignal.timeout(5000),
                        // ✅ Optimize request
                        keepalive: true,
                        // ✅ Add retry logic at fetch level
                        cache: 'no-cache'
                    });
                }
            },
            // ✅ Disable realtime to reduce overhead
            realtime: {
                params: {
                    eventsPerSecond: 1
                }
            }
        });

        console.log('✅ Optimized Supabase client created with 5s timeout');
    }
    return supabase;
};

// ============================================================================
// AUTHENTICATION STATE MANAGEMENT
// ============================================================================

interface AuthState {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

let authState: AuthState = {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true
};

// Auth state change listeners
const authListeners = new Set<(state: AuthState) => void>();

// Subscribe to authentication state changes
const subscribeToAuthChanges = (callback: (state: AuthState) => void) => {
    authListeners.add(callback);

    // Return unsubscribe function
    return () => {
        authListeners.delete(callback);
    };
};

// Notify all listeners of auth state changes
const notifyAuthStateChange = () => {
    authListeners.forEach(listener => listener(authState));
};

// Initialize authentication listener
const initializeAuth = () => {
    const client = initializeSupabase();
    if (!client) return;

    // Listen for auth state changes with enhanced error handling
    client.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);

        // ✅ Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('⚠️ Token refresh failed - clearing session');
            await handleAuthError();
            return;
        }

        authState = {
            user: session?.user || null,
            session,
            isAuthenticated: !!session?.user,
            isLoading: false
        };

        notifyAuthStateChange();

        // Handle auth events
        switch (event) {
            case 'SIGNED_IN':
                console.log('✅ User signed in:', session?.user?.email);
                break;
            case 'SIGNED_OUT':
                console.log('🚪 User signed out');
                clearLocalStorageAuth();
                break;
            case 'TOKEN_REFRESHED':
                console.log('🔄 Token refreshed successfully');
                break;
            case 'PASSWORD_RECOVERY':
                console.log('🔐 Password recovery initiated');
                break;
        }
    });

    // ✅ Enhanced session check with error handling
    client.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
            console.error('❌ Error getting session:', error);
            // Clear corrupted session data
            handleAuthError();
            return;
        }

        authState = {
            user: session?.user || null,
            session,
            isAuthenticated: !!session?.user,
            isLoading: false
        };

        notifyAuthStateChange();
    }).catch((error) => {
        console.error('❌ Critical auth error:', error);
        handleAuthError();
    });
};

// ✅ NEW: Enhanced auth error handler
const handleAuthError = async () => {
    console.log('🧹 Handling authentication error...');

    try {
        // Clear all auth-related storage
        localStorage.removeItem('applytrak-auth-token');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('applytrak_user_id');
        localStorage.removeItem('applytrak_user_db_id');

        // Clear session cookies if any
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Reset auth state
        authState = {
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
        };

        notifyAuthStateChange();

        console.log('✅ Auth error handled - session cleared');
    } catch (error) {
        console.error('❌ Error during auth cleanup:', error);
    }
};

// ✅ Enhanced clear localStorage function
const clearLocalStorageAuth = () => {
    const authKeys = [
        'applytrak_user_id',
        'applytrak_user_db_id',
        'applytrak-auth-token',
        'supabase.auth.token'
    ];

    authKeys.forEach(key => {
        localStorage.removeItem(key);
    });

    console.log('🧹 Auth localStorage cleared');
};

// ============================================================================
// USER MANAGEMENT - REAL AUTHENTICATION
// ============================================================================

// Get current authenticated user
const getCurrentUser = (): User | null => {
    return authState.user;
};

// Get current session
const getCurrentSession = (): Session | null => {
    return authState.session;
};

// Check if user is authenticated
const isAuthenticated = (): boolean => {
    return authState.isAuthenticated;
};

// Get auth state
const getAuthState = (): AuthState => {
    return {...authState};
};

// Get user ID from authenticated user
const getUserId = (): string | null => {
    if (authState.user?.id) {
        return authState.user.id;
    }

    // Fallback to localStorage for backward compatibility during migration
    return localStorage.getItem('applytrak_user_id');
};

// Get user database ID (numeric ID from users table)
const getUserDbId = async (): Promise<number | null> => {
    const userId = getUserId();
    if (!userId) return null;

    // Try cache first
    const cachedId = localStorage.getItem('applytrak_user_db_id');
    if (cachedId && !isNaN(parseInt(cachedId))) {
        return parseInt(cachedId);
    }

    // Look up in database
    if (!isOnlineWithSupabase()) return null;

    try {
        const client = initializeSupabase()!;

        // FIXED: Use external_id instead of auth_user_id
        const {data: user, error} = await client
            .from('users')
            .select('id')
            .eq('external_id', userId)  // ✅ FIXED: Use external_id (matches your schema)
            .maybeSingle();

        if (error) {
            console.error('Error looking up user:', error);
            return null;
        }

        if (!user) {
            // Create user record if it doesn't exist
            const {data: newUser, error: createError} = await client
                .from('users')
                .insert({
                    external_id: userId,  // ✅ FIXED: Use external_id
                    email: authState.user?.email || `user-${userId}@applytrak.local`,
                    display_name: authState.user?.user_metadata?.full_name || 'ApplyTrak User',
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                return null;
            }

            const dbId = parseInt(newUser.id.toString());
            localStorage.setItem('applytrak_user_db_id', dbId.toString());
            console.log('✅ User created in database:', dbId);
            return dbId;
        }

        const dbId = parseInt(user.id.toString());
        localStorage.setItem('applytrak_user_db_id', dbId.toString());
        return dbId;
    } catch (error) {
        console.warn('Error getting user DB ID:', error);
        return null;
    }
};

// ============================================================================
// AUTHENTICATION METHODS
// ============================================================================

// Sign up with email and password
const signUp = async (email: string, password: string, displayName?: string) => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    const {data, error} = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: displayName
            }
        }
    });

    if (error) throw error;
    return data;
};

// Sign in with email and password
const signIn = async (email: string, password: string) => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    try {
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            // Handle specific auth errors
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Invalid email or password');
            }
            if (error.message.includes('Email not confirmed')) {
                throw new Error('Please check your email and click the confirmation link');
            }
            throw error;
        }

        return data;
    } catch (error: any) {
        console.error('❌ Sign in failed:', error);
        throw error;
    }
};

// Sign out
const signOut = async () => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    try {
        const { error } = await client.auth.signOut();
        if (error) {
            console.warn('⚠️ Sign out error (non-critical):', error);
        }

        // Always clear local state even if signOut API fails
        await handleAuthError();

    } catch (error) {
        console.error('❌ Sign out error:', error);
        // Still clear local state
        await handleAuthError();
        throw error;
    }
};

// Reset password
const resetPassword = async (email: string) => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    const {error} = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
};

// ============================================================================
// LOCAL DATABASE (DEXIE) - UNCHANGED STRUCTURE
// ============================================================================

export class JobTrackerDatabase extends Dexie {
    applications!: Table<Application, string>;
    goals!: Table<Goals, string>;
    backups!: Table<Backup, string>;
    analyticsEvents!: Table<AnalyticsEvent, number>;
    userSessions!: Table<UserSession, number>;
    userMetrics!: Table<UserMetrics & { id: string }, string>;
    feedback!: Table<FeedbackSubmission, number>;
    privacySettings!: Table<PrivacySettings & { id: string }, string>;

    constructor() {
        super('JobTrackerDatabase');

        this.version(2).stores({
            applications: 'id, company, position, dateApplied, status, type, location, jobSource, createdAt, updatedAt',
            goals: 'id, totalGoal, weeklyGoal, monthlyGoal, createdAt, updatedAt',
            backups: 'id, timestamp',
            analyticsEvents: '++id, event, timestamp, sessionId',
            userSessions: '++id, startTime, endTime, deviceType',
            userMetrics: 'id, sessionsCount, totalTimeSpent, applicationsCreated, lastActiveDate',
            feedback: '++id, type, rating, timestamp, email',
            privacySettings: 'id, analytics, feedback, consentDate'
        });
    }
}

const db = new JobTrackerDatabase();
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);


// ✅ NEW: Force session refresh utility
export const forceSessionRefresh = async () => {
    const client = initializeSupabase();
    if (!client) return false;

    try {
        const { data, error } = await client.auth.refreshSession();
        if (error) {
            console.error('❌ Force refresh failed:', error);
            await handleAuthError();
            return false;
        }

        console.log('✅ Session forcefully refreshed');
        return true;
    } catch (error) {
        console.error('❌ Force refresh error:', error);
        await handleAuthError();
        return false;
    }
};

// ✅ NEW: Auth recovery utility for emergency use
export const recoverAuthSession = async () => {
    console.log('🚨 Attempting auth session recovery...');

    try {
        // Clear everything first
        await handleAuthError();

        // Reinitialize Supabase client
        supabase = null;
        const client = initializeSupabase();

        if (client) {
            // Try to get fresh session
            const { data, error } = await client.auth.getSession();
            if (!error && data.session) {
                console.log('✅ Auth session recovered');
                return true;
            }
        }

        console.log('ℹ️ No valid session to recover - user needs to sign in');
        return false;
    } catch (error) {
        console.error('❌ Auth recovery failed:', error);
        return false;
    }
};
// ============================================================================
// CLOUD SYNC UTILITIES - AUTHENTICATION AWARE
// ============================================================================

// Check if online and authenticated
const isOnlineWithSupabase = (): boolean => {
    return navigator.onLine && !!initializeSupabase() && isAuthenticated();
};

// Sync data to cloud (authenticated users only)
const syncToCloud = async (table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'insert'): Promise<void> => {
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

        let result;
        switch (operation) {
            case 'insert':
                result = await client.from(table).insert(dataWithUser).select();
                break;
            case 'update':
                const updateData = {...dataWithUser};
                delete updateData.user_id;
                result = await client
                    .from(table)
                    .update(updateData)
                    .eq('id', data.id)
                    .eq('user_id', userDbId)
                    .select();
                break;
            case 'delete':
                result = await client
                    .from(table)
                    .delete()
                    .eq('id', data.id)
                    .eq('user_id', userDbId);
                break;
        }

        if (result.error) {
            console.error('❌ Supabase operation error:', result.error);
            throw result.error;
        }

        console.log(`✅ Synced to cloud: ${table} ${operation}`);
    } catch (error) {
        console.warn(`Cloud sync failed for ${table}:`, error);
    }
};

const syncFromCloud = async (table: string, retryCount = 0): Promise<any[]> => {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 20000; // 20 seconds instead of default

    console.log(`🔄 syncFromCloud(${table}) - attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);

    if (!isOnlineWithSupabase()) {
        console.log('❌ Not online with Supabase');
        return [];
    }

    try {
        const client = initializeSupabase();
        if (!client) {
            console.log('❌ No Supabase client');
            return [];
        }

        const userDbId = await getUserDbId();
        console.log(`🔍 syncFromCloud userDbId: ${userDbId}`);

        if (!userDbId) {
            console.log('❌ No userDbId available for cloud sync');
            return [];
        }

        console.log(`📤 Querying Supabase for ${table} with user_id: ${userDbId} (timeout: ${TIMEOUT_MS}ms)`);
        const startTime = Date.now();

        // ✅ Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Query timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        );

        // ✅ Create query promise with smaller limit for faster response
        const queryPromise = client
            .from(table)
            .select('*')
            .eq('user_id', userDbId)
            .limit(50) // Even smaller - get 50 most recent apps first
            .order('created_at', { ascending: false });

        // ✅ Race between query and timeout
        const result = await Promise.race([queryPromise, timeoutPromise]);

        const duration = Date.now() - startTime;

        if (result.error) {
            console.error(`❌ Supabase query error for ${table}:`, result.error);

            // ✅ Retry on certain errors
            if (retryCount < MAX_RETRIES &&
                (result.error.message?.includes('timeout') ||
                    result.error.message?.includes('connection'))) {
                console.log(`🔄 Retrying ${table} query in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return syncFromCloud(table, retryCount + 1);
            }

            throw result.error;
        }

        console.log(`✅ Supabase query for ${table} completed:`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Records: ${result.data?.length || 0}`);
        console.log(`   Sample record:`, result.data?.[0]);

        return result.data || [];
    } catch (error: any) {
        const duration = Date.now() - Date.now();
        console.error(`❌ syncFromCloud(${table}) error after ${duration}ms:`, error.message);

        // ✅ Retry on timeout/connection errors
        if (retryCount < MAX_RETRIES &&
            (error.message?.includes('timeout') ||
                error.message?.includes('connection') ||
                error.message?.includes('fetch'))) {
            console.log(`🔄 Connection error - retrying ${table} in ${(retryCount + 1) * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
            return syncFromCloud(table, retryCount + 1);
        }

        console.log(`❌ Max retries exceeded for ${table} - falling back to local data`);
        return [];
    }
};

// ============================================================================
// DATABASE SERVICE IMPLEMENTATION - AUTHENTICATION AWARE
// ============================================================================

export const databaseService: DatabaseService = {
    // Application methods (unchanged but now authentication-aware)
    async getApplications(): Promise<Application[]> {
        try {
            console.log('🔄 getApplications() called');

            const authState = getAuthState();
            const currentUser = getCurrentUser();
            const isAuth = isAuthenticated();

            console.log('🔐 Auth Debug Info:');
            console.log('   isAuthenticated():', isAuth);
            console.log('   currentUser email:', currentUser?.email);

            const localApps = await db.applications.orderBy('dateApplied').reverse().toArray();
            console.log('📱 Local applications count:', localApps.length);

            // ✅ Try cloud sync for authenticated users with timeout protection
            if (isAuth && isOnlineWithSupabase()) {
                console.log('☁️ Starting cloud sync for authenticated user...');

                try {
                    // ✅ Add overall timeout for the entire cloud sync operation
                    const cloudSyncPromise = syncFromCloud('applications');
                    const overallTimeoutPromise = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Overall cloud sync timeout')), 30000)
                    );

                    const cloudApps = await Promise.race([cloudSyncPromise, overallTimeoutPromise]);

                    console.log(`☁️ Cloud sync result:`, cloudApps.length, 'applications');

                    if (cloudApps.length > 0) {
                        const mappedApps = cloudApps.map(app => ({
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
                        }));

                        const sortedApps = mappedApps.sort((a, b) =>
                            new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
                        );

                        console.log(`✅ SUCCESS: Using ${sortedApps.length} cloud applications for ${currentUser?.email}`);
                        return sortedApps;
                    } else {
                        console.log('⚠️ No cloud apps found - user may have no data or connection failed');
                    }
                } catch (cloudError: any) {
                    console.error('❌ Cloud sync failed:', cloudError.message);
                    console.log('📱 Falling back to local data due to cloud error');

                    // ✅ Show user-friendly message for timeouts
                    if (cloudError.message?.includes('timeout')) {
                        console.log('🐌 Connection is slow - using cached local data');
                        // You could also show a toast here: "Using cached data due to slow connection"
                    }
                }
            } else {
                console.log('📱 Using local data - not authenticated or offline');
            }

            console.log(`📱 FALLBACK: Using ${localApps.length} local applications`);
            return localApps;
        } catch (error) {
            console.error('❌ getApplications() failed:', error);
            throw new Error('Failed to get applications');
        }
    },

    async addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const id = generateId();
            const newApp: Application = {...app, id, createdAt: now, updatedAt: now};

            // Save to local database
            await db.applications.add(newApp);

            // Sync to cloud for authenticated users
            if (isAuthenticated()) {
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

    // Additional methods follow the same pattern...
    // (Implementing remaining methods with authentication awareness)

    async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const updateData = {...updates, updatedAt: now};

            await db.applications.update(id, updateData);
            const updated = await db.applications.get(id);

            if (!updated) throw new Error('Application not found');

            // Sync to cloud for authenticated users
            if (isAuthenticated()) {
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
            await db.applications.delete(id);

            if (isAuthenticated()) {
                syncToCloud('applications', {id}, 'delete').catch(err =>
                    console.warn('Cloud sync failed:', err)
                );
            }
        } catch (error) {
            console.error('Failed to delete application:', error);
            throw new Error('Failed to delete application');
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

    async deleteApplications(ids: string[]): Promise<void> {
        try {
            await db.applications.bulkDelete(ids);

            if (isAuthenticated()) {
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

            await Promise.all(ids.map(id => db.applications.update(id, updateData)));

            if (isAuthenticated()) {
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
            await db.applications.bulkAdd(applications);

            if (isAuthenticated()) {
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
            await db.transaction('rw', [
                db.applications, db.goals, db.backups, db.analyticsEvents,
                db.userSessions, db.userMetrics, db.feedback, db.privacySettings
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

            // Clear cloud data for authenticated users
            if (isOnlineWithSupabase()) {
                try {
                    const client = initializeSupabase()!;
                    const userDbId = await getUserDbId();

                    if (userDbId) {
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

    // Goals methods (authentication-aware)
    async getGoals(): Promise<Goals> {
        try {
            let goals = await db.goals.get('default');

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
                        await db.goals.put(goals);
                    }
                } catch (cloudError) {
                    console.warn('Cloud sync failed for goals:', cloudError);
                }
            }

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

            await db.goals.put(goals);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    try {
                        const client = initializeSupabase()!;
                        await client.from('goals').upsert({
                            user_id: userDbId,
                            total_goal: Number(goals.totalGoal),
                            weekly_goal: Number(goals.weeklyGoal),
                            monthly_goal: Number(goals.monthlyGoal),
                            created_at: goals.createdAt,
                            updated_at: goals.updatedAt
                        }, {
                            onConflict: 'user_id'
                        });
                        console.log('✅ Goals synced to cloud');
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

    // Backup methods (local only - unchanged)
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
                await db.applications.clear();
                await db.goals.clear();

                if (backupData.applications && Array.isArray(backupData.applications)) {
                    await db.applications.bulkAdd(backupData.applications);
                }

                if (backupData.goals) {
                    await db.goals.put(backupData.goals);
                }
            });
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error('Failed to restore from backup');
        }
    },

    // Analytics methods (authentication-aware - simplified)
    async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        try {
            await db.analyticsEvents.add(event as any);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    syncToCloud('analytics_events', {
                        event_name: event.event,
                        properties: event.properties || {},
                        timestamp: event.timestamp,
                        session_id: event.sessionId,
                        user_agent: navigator.userAgent,
                        device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: navigator.language || 'en',
                        created_at: event.timestamp
                    }, 'insert').catch(err => console.warn('Analytics sync failed:', err));
                }
            }
        } catch (error) {
            console.error('❌ Failed to save analytics event:', error);
            throw new Error('Failed to save analytics event');
        }
    },

    async getAnalyticsEvents(sessionId?: string): Promise<AnalyticsEvent[]> {
        try {
            if (sessionId) {
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
            const sessions = await db.userSessions.toArray();
            return sessions.find(s => s.id === sessionId) || null;
        } catch (error) {
            console.error('Failed to get user session:', error);
            return null;
        }
    },

    async saveUserSession(session: UserSession): Promise<void> {
        try {
            await db.userSessions.put(session as any);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    syncToCloud('user_sessions', {
                        session_id: session.id,
                        start_time: session.startTime,
                        end_time: session.endTime,
                        duration: Number(session.duration) || null,
                        device_type: session.deviceType || 'desktop',
                        user_agent: session.userAgent || navigator.userAgent,
                        timezone: session.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: session.language || navigator.language || 'en',
                        events: session.events || [],
                        page_views: Number(session.events?.length) || 0,
                        created_at: session.startTime
                    }, 'insert').catch(err => console.warn('Session sync failed:', err));
                }
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
            const updated = existing ? {...existing, ...updates} : {id: 'default', ...updates};

            await db.userMetrics.put(updated as any);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    const client = initializeSupabase()!;
                    await client.from('user_metrics').upsert({
                        user_id: userDbId,
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
                        device_type: updated.deviceType || 'desktop',
                        browser_version: navigator.userAgent || 'unknown',
                        screen_resolution: `${window.screen.width}x${window.screen.height}`,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: navigator.language || 'en',
                        total_events: Number(updated.totalEvents) || 0,
                        applications_count: Number(updated.applicationsCreated) || 0,
                        session_duration: Number(updated.totalTimeSpent) || 0,
                        created_at: updated.firstVisit || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    });
                    console.log('✅ User metrics synced to cloud');
                }
            }
        } catch (error) {
            console.error('Failed to update user metrics:', error);
            throw new Error('Failed to update user metrics');
        }
    },

    // Feedback methods (authentication-aware)
    async saveFeedback(feedback: FeedbackSubmission): Promise<void> {
        try {
            await db.feedback.add(feedback as any);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    syncToCloud('feedback', {
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
                            read: false
                        },
                        created_at: feedback.timestamp
                    }, 'insert').catch(err => console.warn('Feedback sync failed:', err));
                }
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

            const typeDistribution: {
                [key: string]: number;
                bug: number;
                feature: number;
                general: number;
                love: number;
            } = {
                bug: 0, feature: 0, general: 0, love: 0
            };

            const ratingDistribution: {
                [rating: number]: number;
                1: number;
                2: number;
                3: number;
                4: number;
                5: number;
            } = {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            };

            allFeedback.forEach(f => {
                typeDistribution[f.type] = (typeDistribution[f.type] || 0) + 1;
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
                typeDistribution: {bug: 0, feature: 0, general: 0, love: 0},
                ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
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

    // Privacy methods (authentication-aware)
    async savePrivacySettings(settings: PrivacySettings): Promise<void> {
        try {
            const settingsWithId = {id: 'default', ...settings};
            await db.privacySettings.put(settingsWithId);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    const client = initializeSupabase()!;
                    await client.from('privacy_settings').upsert({
                        user_id: userDbId,
                        analytics: settings.analytics,
                        feedback: settings.feedback,
                        functional_cookies: settings.functionalCookies,
                        consent_date: settings.consentDate,
                        consent_version: settings.consentVersion,
                        cloud_sync_consent: false,
                        data_retention_period: 365,
                        anonymize_after: 730,
                        tracking_level: 'minimal',
                        data_sharing_consent: false,
                        created_at: settings.consentDate,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    });
                    console.log('✅ Privacy settings synced to cloud');
                }
            }
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
            throw new Error('Failed to save privacy settings');
        }
    },

    async getPrivacySettings(): Promise<PrivacySettings | null> {
        try {
            let settings = await db.privacySettings.get('default');

            if (isOnlineWithSupabase() && !settings) {
                try {
                    const userDbId = await getUserDbId();
                    if (userDbId) {
                        const client = initializeSupabase()!;
                        const {data, error} = await client
                            .from('privacy_settings')
                            .select('*')
                            .eq('user_id', userDbId)
                            .maybeSingle();

                        if (error && error.code !== 'PGRST116') {
                            console.error('Error fetching privacy settings:', error);
                        } else if (data) {
                            settings = {
                                id: 'default',
                                analytics: data.analytics,
                                feedback: data.feedback,
                                functionalCookies: data.functional_cookies,
                                consentDate: data.consent_date,
                                consentVersion: data.consent_version
                            };
                            await db.privacySettings.put(settings);
                        }
                    }
                } catch (cloudError) {
                    console.warn('Failed to fetch privacy settings from cloud:', cloudError);
                }
            }

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

    // Admin methods (authentication-aware)
    async getAdminAnalytics(): Promise<AdminAnalytics> {
        try {
            const applications = await this.getApplications();
            const analytics = await this.getAnalyticsEvents();
            const userMetrics = await this.getUserMetrics();
            const sessions = await db.userSessions.toArray();

            const totalUsers = isAuthenticated() ? 1 : 0;
            const totalApplications = applications.length;
            const totalEvents = analytics.length;
            const totalSessions = sessions.length;

            const averageSessionDuration = sessions.length > 0
                ? sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / sessions.length
                : 0;

            const featuresUsage = analytics.reduce((acc, event) => {
                if (event.event === 'feature_used' && event.properties?.feature) {
                    acc[event.properties.feature] = (acc[event.properties.feature] || 0) + 1;
                }
                return acc;
            }, {} as { [key: string]: number });

            const deviceType = userMetrics.deviceType || 'desktop';

            return {
                userMetrics: {
                    totalUsers,
                    activeUsers: {daily: totalUsers, weekly: totalUsers, monthly: totalUsers},
                    newUsers: {today: 0, thisWeek: 0, thisMonth: 0}
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
                    userRetention: {day1: 0, day7: 0, day30: 0}
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
                await db.analyticsEvents.where('timestamp').below(cutoffDate.toISOString()).delete();
                await db.userSessions.where('startTime').below(cutoffDate.toISOString()).delete();

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

// Initialize database and authentication
export const initializeDatabase = async (): Promise<void> => {
    try {
        await db.open();
        console.log('✅ Local database initialized');

        // Initialize authentication
        initializeAuth();
        console.log('✅ Authentication system initialized');

        // Run periodic cleanup
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

// Export authentication utilities as authService
export const authService = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    getCurrentUser,
    getCurrentSession,
    isAuthenticated,
    getAuthState,
    subscribeToAuthChanges,
    forceSessionRefresh,
    recoverAuthSession,
    handleAuthError
};

export default databaseService;