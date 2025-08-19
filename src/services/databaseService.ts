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
// MISSING UTILITIES - ADDED
// ============================================================================

// Generate unique ID utility
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// ============================================================================
// COMPLETE DATABASE SCHEMA - FIXED
// ============================================================================

export class JobTrackerDatabase extends Dexie {
    applications!: Table<Application, string>;
    goals!: Table<Goals, string>;
    backups!: Table<Backup, string>;

    // ✅ MISSING ANALYTICS TABLES - ADDED:
    analyticsEvents!: Table<AnalyticsEvent, number>;
    userSessions!: Table<UserSession, number>;
    userMetrics!: Table<UserMetrics & { id: string }, string>;
    feedback!: Table<FeedbackSubmission, number>;
    privacySettings!: Table<PrivacySettings & { id: string }, string>;

    constructor() {
        super('ApplyTrakDB');

        // ✅ IMPORTANT: Increment version to trigger schema update
        this.version(3).stores({
            // Existing tables
            applications: 'id, company, position, dateApplied, status, type, location, jobSource, createdAt, updatedAt',
            goals: 'id, totalGoal, weeklyGoal, monthlyGoal, createdAt, updatedAt',
            backups: 'id, timestamp, data',

            // ✅ NEW: Missing analytics tables
            analyticsEvents: '++id, event, timestamp, sessionId, properties, userId',
            userSessions: '++id, startTime, endTime, duration, deviceType, userAgent, timezone, language, events',
            userMetrics: 'id, sessionsCount, totalTimeSpent, applicationsCreated, applicationsUpdated, applicationsDeleted, goalsSet, attachmentsAdded, exportsPerformed, importsPerformed, searchesPerformed, featuresUsed, lastActiveDate, deviceType, firstVisit, totalEvents',
            feedback: '++id, type, rating, message, email, timestamp, sessionId, userAgent, url, metadata',
            privacySettings: 'id, analytics, feedback, functionalCookies, consentDate, consentVersion'
        });

        // Add hooks for automatic timestamps
        this.applications.hook('creating', (primKey, obj, trans) => {
            const now = new Date().toISOString();
            obj.createdAt = now;
            obj.updatedAt = now;
        });

        this.applications.hook('updating', (modifications, primKey, obj, trans) => {
            (modifications as any).updatedAt = new Date().toISOString();
        });

        // ✅ NEW: Add analytics event hooks
        this.analyticsEvents.hook('creating', (primKey, obj, trans) => {
            if (!obj.timestamp) {
                obj.timestamp = new Date().toISOString();
            }
        });

        // ✅ NEW: Add user session hooks
        this.userSessions.hook('creating', (primKey, obj, trans) => {
            if (!obj.startTime) {
                obj.startTime = new Date().toISOString();
            }
        });
    }
}

// ✅ DATABASE INSTANCE - ADDED
const db = new JobTrackerDatabase();

// ✅ ADD: Initialize default analytics data after database opens
const initializeDefaultData = async () => {
    try {
        console.log('✅ Database opened with analytics support');

        // Initialize default user metrics if they don't exist
        const metrics = await db.userMetrics.get('default');
        if (!metrics) {
            // ✅ FIXED: Proper device type detection with correct types
            const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
                const userAgent = navigator.userAgent.toLowerCase();
                if (/ipad|android(?!.*mobile)|tablet/.test(userAgent)) {
                    return 'tablet';
                } else if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(userAgent)) {
                    return 'mobile';
                } else {
                    return 'desktop';
                }
            };

            const defaultMetrics = {
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
                deviceType: getDeviceType(),
                firstVisit: new Date().toISOString(),
                totalEvents: 0
            };

            await db.userMetrics.put(defaultMetrics);
            console.log('✅ Default user metrics initialized');
        }

        // Initialize default privacy settings if they don't exist
        const settings = await db.privacySettings.get('default');
        if (!settings) {
            const defaultSettings = {
                id: 'default',
                analytics: true,
                feedback: true,
                functionalCookies: true,
                consentDate: new Date().toISOString(),
                consentVersion: '1.0'
            };

            await db.privacySettings.put(defaultSettings);
            console.log('✅ Default privacy settings initialized');
        }
    } catch (error) {
        console.warn('⚠️ Failed to initialize default data:', error);
    }
};

// ✅ ADD: Error handling for database upgrades
db.open().then(() => {
    // Initialize default data after successful open
    initializeDefaultData();
}).catch(error => {
    console.error('❌ Database failed to open:', error);

    // If upgrade fails, try to delete and recreate
    if (error.name === 'UpgradeError' || error.name === 'DatabaseClosedError') {
        console.log('🔄 Attempting database recreation...');

        db.delete().then(() => {
            console.log('✅ Old database deleted, creating new one...');
            return db.open();
        }).then(() => {
            console.log('✅ Database recreated successfully');
            // Initialize default data after recreation
            initializeDefaultData();
        }).catch(recreateError => {
            console.error('❌ Failed to recreate database:', recreateError);
        });
    }
});

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
                fetch: (url, options = {}) => {
                    return fetch(url, {
                        ...options,
                        signal: AbortSignal.timeout(5000),
                        keepalive: true,
                        cache: 'no-cache'
                    });
                }
            },
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
    return () => {
        authListeners.delete(callback);
    };
};

// Notify all listeners of auth state changes
const notifyAuthStateChange = () => {
    authListeners.forEach(listener => listener(authState));
};

// ============================================================================
// HELPER FUNCTIONS - DEFINED FIRST
// ============================================================================

// Enhanced auth error handler
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

// Enhanced clear localStorage function
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
    // ✅ FIXED: Check auth state first
    if (authState.user?.id) {
        return authState.user.id;
    }

    // ✅ FIXED: Fallback to localStorage token
    try {
        const authToken = localStorage.getItem('applytrak-auth-token');
        if (authToken) {
            const parsed = JSON.parse(authToken);
            if (parsed.user?.id) {
                console.log('📱 Using localStorage token for user ID');
                return parsed.user.id;
            }
        }
    } catch (error) {
        console.warn('Failed to parse auth token from localStorage:', error);
    }

    // Last resort - legacy storage
    return localStorage.getItem('applytrak_user_id');
};

// Check if online and authenticated
const isOnlineWithSupabase = (): boolean => {
    return navigator.onLine && !!initializeSupabase() && isAuthenticated();
};

// ============================================================================
// USER CREATION FUNCTION - DEFINED BEFORE USAGE
// ============================================================================

// Helper function to create user record
const createUserRecord = async (authUserId: string): Promise<number | null> => {
    try {
        const client = initializeSupabase();
        if (!client) return null;

        const currentUser = authState.user;
        if (!currentUser) {
            console.log('❌ No current user for record creation');
            return null;
        }

        console.log('📝 Creating user record for:', currentUser.email);

        const {data: newUser, error: createError} = await client
            .from('users')
            .insert({
                external_id: authUserId,
                email: currentUser.email || `user-${authUserId}@applytrak.local`,
                display_name: currentUser.user_metadata?.full_name ||
                    currentUser.user_metadata?.name ||
                    currentUser.email?.split('@')[0] ||
                    'ApplyTrak User',
                avatar_url: currentUser.user_metadata?.avatar_url || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                language: navigator.language || 'en',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id, email, is_admin')
            .single();

        if (createError) {
            console.error('❌ Error creating user:', createError);

            // If it's a duplicate error, try to fetch the existing record
            if (createError.code === '23505') { // Unique constraint violation
                console.log('🔄 User already exists, fetching existing record...');
                const {data: existingUser} = await client
                    .from('users')
                    .select('id, email, is_admin')
                    .eq('external_id', authUserId)
                    .single();

                if (existingUser) {
                    const dbId = parseInt(existingUser.id.toString());
                    localStorage.setItem('applytrak_user_db_id', dbId.toString());
                    return dbId;
                }
            }

            return null;
        }

        const dbId = parseInt(newUser.id.toString());
        localStorage.setItem('applytrak_user_db_id', dbId.toString());

        console.log('✅ User created successfully:', {
            dbId,
            email: newUser.email,
            isAdmin: newUser.is_admin
        });

        return dbId;

    } catch (error) {
        console.error('❌ Error creating user record:', error);
        return null;
    }
};

// ============================================================================
// USER DATABASE ID FUNCTION - NOW WITH PROPER DEPENDENCIES
// ============================================================================

// Get user database ID (numeric ID from users table)
const getUserDbId = async (): Promise<number | null> => {
    const userId = getUserId();
    if (!userId) {
        console.log('❌ No userId available');
        return null;
    }

    // Try cache first
    const cachedId = localStorage.getItem('applytrak_user_db_id');
    if (cachedId && !isNaN(parseInt(cachedId))) {
        console.log('✅ Using cached user DB ID:', cachedId);
        return parseInt(cachedId);
    }

    // Look up in database
    if (!isOnlineWithSupabase()) {
        console.log('❌ Not online with Supabase');
        return null;
    }

    try {
        const client = initializeSupabase();
        if (!client) {
            console.log('❌ No Supabase client');
            return null;
        }

        console.log('🔍 Looking up user in database with external_id:', userId);

        // Better query with error handling
        const {data: user, error} = await client
            .from('users')
            .select('id, email, is_admin')
            .eq('external_id', userId)
            .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record

        if (error) {
            console.error('❌ Error looking up user:', error);

            // If user doesn't exist, try to create them
            if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
                console.log('👤 User not found in database, creating new user record...');
                return await createUserRecord(userId);
            }

            return null;
        }

        if (!user) {
            console.log('👤 No user found, creating new user record...');
            return await createUserRecord(userId);
        }

        const dbId = parseInt(user.id.toString());
        localStorage.setItem('applytrak_user_db_id', dbId.toString());
        console.log('✅ Found existing user:', {
            dbId,
            email: user.email,
            isAdmin: user.is_admin
        });

        return dbId;

    } catch (error) {
        console.error('❌ Critical error in getUserDbId:', error);
        return null;
    }
};

// ============================================================================
// AUTHENTICATION INITIALIZATION - MOVED BEFORE USAGE
// ============================================================================

// Initialize authentication listener
function initializeAuth() {
    const client = initializeSupabase();
    if (!client) {
        console.warn('❌ Cannot initialize auth - Supabase client not available');
        return;
    }

    console.log('🔐 Initializing authentication...');

    // ✅ IMPROVED: Check existing session immediately
    client.auth.getSession().then(({data: {session}, error}) => {
        if (error) {
            console.error('❌ Error getting session:', error);
            handleAuthError();
            return;
        }

        // ✅ FIXED: Force sync auth state immediately
        authState = {
            user: session?.user || null,
            session,
            isAuthenticated: !!session?.user,
            isLoading: false
        };

        // ✅ ADDED: Force sync localStorage
        if (session?.user?.id) {
            localStorage.setItem('applytrak_user_id', session.user.id);
            console.log('✅ User ID synced to localStorage:', session.user.id);
        }

        notifyAuthStateChange();

        // Pre-fetch user DB ID if signed in
        if (session?.user?.id) {
            getUserDbId().catch(error => {
                console.warn('⚠️ Failed to verify user database record:', error);
            });
        }
    });

    // Listen for auth state changes
    client.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);

        // ✅ FIXED: Always update auth state properly
        authState = {
            user: session?.user || null,
            session,
            isAuthenticated: !!session?.user,
            isLoading: false
        };

        // ✅ ADDED: Always sync localStorage
        if (session?.user?.id) {
            localStorage.setItem('applytrak_user_id', session.user.id);
        } else {
            localStorage.removeItem('applytrak_user_id');
            localStorage.removeItem('applytrak_user_db_id');
        }

        notifyAuthStateChange();

        // Handle specific events
        switch (event) {
            case 'SIGNED_IN':
                console.log('✅ User signed in successfully');
                // Clear cached user DB ID to force fresh lookup
                localStorage.removeItem('applytrak_user_db_id');
                break;
            case 'SIGNED_OUT':
                console.log('🚪 User signed out');
                clearLocalStorageAuth();
                break;
        }
    });

    console.log('✅ Authentication system initialized');
}

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
// UTILITY FUNCTIONS
// ============================================================================

// Force session refresh utility
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

// Auth recovery utility for emergency use
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
    const MAX_RETRIES = 2; // Reduced retries
    const TIMEOUT_MS = 30000; // Increased to 30 seconds

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

        console.log(`📤 Querying Supabase for ${table} with user_id: ${userDbId}`);
        const startTime = Date.now();

        try {
            // ✅ IMPROVED: Add pagination and ordering for better performance
            const query = client
                .from(table)
                .select('*')
                .eq('user_id', userDbId)
                .order('created_at', { ascending: false });

            // ✅ IMPROVED: Add pagination for large datasets
            if (table === 'applications') {
                query.limit(50); // Only fetch latest 50 applications initially
            } else {
                query.limit(100);
            }

            const {data, error} = await Promise.race([
                query,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Query timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
                )
            ]);

            const duration = Date.now() - startTime;

            if (error) {
                console.error(`❌ Supabase query error for ${table}:`, {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });

                // ✅ IMPROVED: Don't retry on certain errors
                if (error.code === '42501' || error.message?.includes('permission')) {
                    throw new Error(`Permission denied: ${error.message}`);
                }

                // Retry on timeout/connection errors only
                if (retryCount < MAX_RETRIES &&
                    (error.message?.includes('timeout') ||
                        error.message?.includes('connection'))) {
                    console.log(`🔄 Retrying ${table} query in 3 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return syncFromCloud(table, retryCount + 1);
                }

                throw new Error(`Database error: ${error.message}`);
            }

            console.log(`✅ Supabase query for ${table} completed:`);
            console.log(`   Duration: ${duration}ms`);
            console.log(`   Records: ${data?.length || 0}`);

            return data || [];

        } catch (queryError: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ Query execution error for ${table} after ${duration}ms:`, {
                message: queryError.message,
                name: queryError.name
            });

            // ✅ IMPROVED: Only retry on network/timeout errors
            if (retryCount < MAX_RETRIES &&
                (queryError.message?.includes('timeout') ||
                    queryError.message?.includes('connection') ||
                    queryError.message?.includes('fetch'))) {
                console.log(`🔄 Network error - retrying ${table} in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return syncFromCloud(table, retryCount + 1);
            }

            throw queryError;
        }

    } catch (error: any) {
        console.error(`❌ syncFromCloud(${table}) fatal error:`, error.message);
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

            // ✅ IMPROVED: Always load local data first for instant UI
            const localApps = await db.applications.orderBy('dateApplied').reverse().toArray();
            console.log('📱 Local applications count:', localApps.length);

            // ✅ IMPROVED: Return local data immediately if user prefers offline mode
            const isAuth = isAuthenticated();
            if (!isAuth || !isOnlineWithSupabase()) {
                console.log('📱 Using local data only (offline or not authenticated)');
                return localApps.sort((a, b) =>
                    new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
                );
            }

            // ✅ IMPROVED: Attempt cloud sync with shorter timeout for better UX
            console.log('☁️ Attempting background cloud sync...');

            try {
                // ✅ IMPROVED: Shorter timeout for better UX
                const CLOUD_SYNC_TIMEOUT = 8000; // Reduced to 8 seconds

                const cloudSyncPromise = syncFromCloud('applications');
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Cloud sync timeout after ${CLOUD_SYNC_TIMEOUT / 1000}s`)), CLOUD_SYNC_TIMEOUT)
                );

                const cloudApps = await Promise.race([cloudSyncPromise, timeoutPromise]);

                if (cloudApps && cloudApps.length > 0) {
                    console.log(`☁️ Cloud sync successful: ${cloudApps.length} applications`);

                    // ✅ IMPROVED: Better data mapping with error handling
                    const mappedApps = cloudApps
                        .filter(app => app && app.id)
                        .map(app => ({
                            id: String(app.id),
                            company: app.company || '',
                            position: app.position || '',
                            dateApplied: app.dateApplied || new Date().toISOString().split('T')[0],
                            status: app.status || 'Applied',
                            type: app.type || 'Remote',
                            location: app.location || '',
                            salary: app.salary || '',
                            jobSource: app.jobSource || '',
                            jobUrl: app.jobUrl || '',
                            notes: app.notes || '',
                            attachments: Array.isArray(app.attachments) ? app.attachments : [],
                            createdAt: app.createdAt || new Date().toISOString(),
                            updatedAt: app.updatedAt || new Date().toISOString()
                        }))
                        .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());

                    // ✅ IMPROVED: Update local cache in background
                    try {
                        await db.applications.clear();
                        await db.applications.bulkAdd(mappedApps);
                        console.log('💾 Cloud data cached locally');
                    } catch (cacheError) {
                        console.warn('⚠️ Failed to cache cloud data locally:', cacheError);
                    }

                    return mappedApps;
                }
            } catch (cloudError: any) {
                // ✅ IMPROVED: Log the specific error but don't throw
                console.warn(`⚠️ Cloud sync failed (using local data):`, cloudError.message);

                // ✅ IMPROVED: Show user-friendly message based on error type
                if (cloudError.message?.includes('timeout')) {
                    console.log('🐌 Cloud sync timed out - using local data');
                    // Consider showing a toast: "Sync taking longer than expected - using cached data"
                } else if (cloudError.message?.includes('permission')) {
                    console.log('🔒 Permission error - check database access');
                } else {
                    console.log('🌐 Cloud sync unavailable - using local data');
                }
            }

            // ✅ IMPROVED: Always return sorted local data as fallback
            console.log(`📱 Using ${localApps.length} local applications`);
            return localApps.sort((a, b) =>
                new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
            );

        } catch (error: any) {
            console.error('❌ getApplications() failed:', error.message);

            // ✅ IMPROVED: Emergency fallback
            try {
                const emergencyApps = await db.applications.orderBy('dateApplied').reverse().toArray();
                console.log(`🚨 Emergency recovery: ${emergencyApps.length} applications`);
                return emergencyApps;
            } catch (emergencyError) {
                console.error('🚨 Emergency recovery failed:', emergencyError);
                return [];
            }
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
                    dateApplied: newApp.dateApplied,    // ✅ camelCase
                    status: newApp.status,
                    type: newApp.type,
                    location: newApp.location,
                    salary: newApp.salary,
                    jobSource: newApp.jobSource,        // ✅ camelCase
                    jobUrl: newApp.jobUrl,              // ✅ camelCase
                    notes: newApp.notes,
                    attachments: newApp.attachments,
                    createdAt: newApp.createdAt,        // ✅ camelCase
                    updatedAt: newApp.updatedAt         // ✅ camelCase
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

            await db.applications.update(id, updateData);
            const updated = await db.applications.get(id);

            if (!updated) throw new Error('Application not found');

            // ✅ FIXED: Sync to cloud with camelCase fields
            if (isAuthenticated()) {
                syncToCloud('applications', {
                    id: updated.id,
                    company: updated.company,
                    position: updated.position,
                    dateApplied: updated.dateApplied,       // ✅ camelCase
                    status: updated.status,
                    type: updated.type,
                    location: updated.location,
                    salary: updated.salary,
                    jobSource: updated.jobSource,           // ✅ camelCase
                    jobUrl: updated.jobUrl,                 // ✅ camelCase
                    notes: updated.notes,
                    attachments: updated.attachments,
                    createdAt: updated.createdAt,           // ✅ camelCase
                    updatedAt: updated.updatedAt            // ✅ camelCase
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
                for (const id of ids) {
                    try {
                        const updated = await db.applications.get(id);
                        if (updated) {
                            syncToCloud('applications', {
                                id: updated.id,
                                company: updated.company,
                                position: updated.position,
                                dateApplied: updated.dateApplied,       // ✅ camelCase
                                status: updated.status,
                                type: updated.type,
                                location: updated.location,
                                salary: updated.salary,
                                jobSource: updated.jobSource,           // ✅ camelCase
                                jobUrl: updated.jobUrl,                 // ✅ camelCase
                                notes: updated.notes,
                                attachments: updated.attachments,
                                createdAt: updated.createdAt,           // ✅ camelCase
                                updatedAt: updated.updatedAt            // ✅ camelCase
                            }, 'update').catch(err => console.warn('Cloud sync failed:', err));
                        }
                    } catch (error) {
                        console.warn('Failed to sync update for id:', id, error);
                    }
                }
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
                        id: app.id,                         // ✅ Use 'app' not 'newApp'
                        company: app.company,               // ✅ Use 'app' not 'newApp'
                        position: app.position,             // ✅ Use 'app' not 'newApp'
                        dateApplied: app.dateApplied,       // ✅ camelCase
                        status: app.status,
                        type: app.type,
                        location: app.location,
                        salary: app.salary,
                        jobSource: app.jobSource,           // ✅ camelCase
                        jobUrl: app.jobUrl,                 // ✅ camelCase
                        notes: app.notes,
                        attachments: app.attachments,
                        createdAt: app.createdAt,           // ✅ camelCase
                        updatedAt: app.updatedAt            // ✅ camelCase
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
                        // ✅ FIXED: Use camelCase field names for goals
                        await client.from('goals').upsert({
                            user_id: userDbId,                   // Keep as user_id (foreign key)
                            totalGoal: Number(goals.totalGoal),  // ✅ camelCase
                            weeklyGoal: Number(goals.weeklyGoal), // ✅ camelCase
                            monthlyGoal: Number(goals.monthlyGoal), // ✅ camelCase
                            createdAt: goals.createdAt,          // ✅ camelCase
                            updatedAt: goals.updatedAt           // ✅ camelCase
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
                    // ✅ FIXED: Use camelCase field names for analytics
                    syncToCloud('analyticsEvents', {        // ✅ camelCase table
                        event: event.event,                 // ✅ camelCase field
                        properties: event.properties || {},
                        timestamp: event.timestamp,
                        sessionId: event.sessionId,         // ✅ camelCase field
                        userId: event.userId,               // ✅ camelCase field
                        userAgent: navigator.userAgent,     // ✅ camelCase field
                        deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: navigator.language || 'en',
                        createdAt: event.timestamp          // ✅ camelCase field
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
                    // ✅ FIXED: Use camelCase field names for user sessions
                    syncToCloud('userSessions', {           // ✅ camelCase table
                        sessionId: session.id,              // ✅ camelCase field
                        startTime: session.startTime,       // ✅ camelCase field
                        endTime: session.endTime,           // ✅ camelCase field
                        duration: Number(session.duration) || null,
                        deviceType: session.deviceType || 'desktop', // ✅ camelCase field
                        userAgent: session.userAgent || navigator.userAgent, // ✅ camelCase field
                        timezone: session.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: session.language || navigator.language || 'en',
                        events: session.events || [],
                        pageViews: Number(session.events?.length) || 0, // ✅ camelCase field
                        createdAt: session.startTime        // ✅ camelCase field
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
                // ✅ FIXED: Proper device type detection with correct types
                const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
                    const userAgent = navigator.userAgent.toLowerCase();
                    if (/ipad|android(?!.*mobile)|tablet/.test(userAgent)) {
                        return 'tablet';
                    } else if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(userAgent)) {
                        return 'mobile';
                    } else {
                        return 'desktop';
                    }
                };

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
                    deviceType: getDeviceType(),
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
                        user_id: userDbId,                          // Keep as user_id (foreign key)
                        sessionsCount: Number(updated.sessionsCount) || 0,     // ✅ camelCase
                        totalTimeSpent: Number(updated.totalTimeSpent) || 0,   // ✅ camelCase
                        applicationsCreated: Number(updated.applicationsCreated) || 0, // ✅ camelCase
                        applicationsUpdated: Number(updated.applicationsUpdated) || 0, // ✅ camelCase
                        applicationsDeleted: Number(updated.applicationsDeleted) || 0, // ✅ camelCase
                        goalsSet: Number(updated.goalsSet) || 0,    // ✅ camelCase
                        attachmentsAdded: Number(updated.attachmentsAdded) || 0, // ✅ camelCase
                        exportsPerformed: Number(updated.exportsPerformed) || 0, // ✅ camelCase
                        importsPerformed: Number(updated.importsPerformed) || 0, // ✅ camelCase
                        searchesPerformed: Number(updated.searchesPerformed) || 0, // ✅ camelCase
                        featuresUsed: updated.featuresUsed || [],   // ✅ camelCase
                        lastActiveDate: updated.lastActiveDate || new Date().toISOString(), // ✅ camelCase
                        firstVisit: updated.firstVisit || new Date().toISOString(), // ✅ camelCase
                        deviceType: updated.deviceType || 'desktop', // ✅ camelCase
                        browserVersion: navigator.userAgent || 'unknown', // ✅ camelCase
                        screenResolution: `${window.screen.width}x${window.screen.height}`, // ✅ camelCase
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: navigator.language || 'en',
                        totalEvents: Number(updated.totalEvents) || 0, // ✅ camelCase
                        applicationsCount: Number(updated.applicationsCreated) || 0, // ✅ camelCase
                        sessionDuration: Number(updated.totalTimeSpent) || 0, // ✅ camelCase
                        createdAt: updated.firstVisit || new Date().toISOString(), // ✅ camelCase
                        updatedAt: new Date().toISOString()         // ✅ camelCase
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

            // ✅ FIXED: Show actual analytics data instead of auth-dependent data
            const totalUsers = sessions.length > 0 ? 1 : 0;
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

            // ✅ FIXED: Calculate based on actual session activity
            const isSessionToday = (timestamp: string): boolean => {
                const today = new Date();
                const sessionDate = new Date(timestamp);
                return sessionDate.toDateString() === today.toDateString();
            };

            const isSessionThisWeek = (timestamp: string): boolean => {
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const sessionDate = new Date(timestamp);
                return sessionDate >= weekAgo;
            };

            const isSessionThisMonth = (timestamp: string): boolean => {
                const now = new Date();
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                const sessionDate = new Date(timestamp);
                return sessionDate >= monthAgo;
            };

            return {
                userMetrics: {
                    totalUsers,
                    activeUsers: {
                        daily: sessions.filter(s => isSessionToday(s.startTime)).length > 0 ? 1 : 0,
                        weekly: sessions.filter(s => isSessionThisWeek(s.startTime)).length > 0 ? 1 : 0,
                        monthly: sessions.filter(s => isSessionThisMonth(s.startTime)).length > 0 ? 1 : 0
                    },
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

// ============================================================================
// DATABASE INITIALIZATION - NOW PROPERLY ORDERED
// ============================================================================

export const initializeDatabase = async (): Promise<void> => {
    try {
        await db.open();
        console.log('✅ Local database initialized');

        // Initialize authentication - now initializeAuth is defined above
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

// ============================================================================
// EXPORT AUTHENTICATION UTILITIES
// ============================================================================

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
    initializeAuth,
    handleAuthError,
    getUserDbId,
    isOnlineWithSupabase,
    syncToCloud,
    syncFromCloud
};

export default databaseService;