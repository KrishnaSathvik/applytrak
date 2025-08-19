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
// CACHING SYSTEM - NEW
// ============================================================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    isValid: boolean;
}

class DataCache {
    private static instance: DataCache;
    private cache = new Map<string, CacheEntry<any>>();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    static getInstance(): DataCache {
        if (!DataCache.instance) {
            DataCache.instance = new DataCache();
        }
        return DataCache.instance;
    }

    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            isValid: true
        });
        console.log(`📋 Cached data for key: ${key}`);
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
        if (isExpired || !entry.isValid) {
            this.cache.delete(key);
            return null;
        }

        console.log(`📋 Using cached data for key: ${key}`);
        return entry.data as T;
    }

    invalidate(key: string): void {
        const entry = this.cache.get(key);
        if (entry) {
            entry.isValid = false;
        }
        console.log(`🗑️ Invalidated cache for key: ${key}`);
    }

    clear(): void {
        this.cache.clear();
        console.log('🗑️ All cache cleared');
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
        return !isExpired && entry.isValid;
    }
}

const dataCache = DataCache.getInstance();

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
    analyticsEvents!: Table<AnalyticsEvent, number>;
    userSessions!: Table<UserSession, number>;
    userMetrics!: Table<UserMetrics & { id: string }, string>;
    feedback!: Table<FeedbackSubmission, number>;
    privacySettings!: Table<PrivacySettings & { id: string }, string>;

    constructor() {
        super('ApplyTrakDB');

        this.version(3).stores({
            applications: 'id, company, position, dateApplied, status, type, location, jobSource, createdAt, updatedAt',
            goals: 'id, totalGoal, weeklyGoal, monthlyGoal, createdAt, updatedAt',
            backups: 'id, timestamp, data',
            analyticsEvents: '++id, event, timestamp, sessionId, properties, userId',
            userSessions: '++id, startTime, endTime, duration, deviceType, userAgent, timezone, language, events',
            userMetrics: 'id, sessionsCount, totalTimeSpent, applicationsCreated, applicationsUpdated, applicationsDeleted, goalsSet, attachmentsAdded, exportsPerformed, importsPerformed, searchesPerformed, featuresUsed, lastActiveDate, deviceType, firstVisit, totalEvents',
            feedback: '++id, type, rating, message, email, timestamp, sessionId, userAgent, url, metadata',
            privacySettings: 'id, analytics, feedback, functionalCookies, consentDate, consentVersion'
        });

        this.applications.hook('creating', (primKey, obj, trans) => {
            const now = new Date().toISOString();
            obj.createdAt = now;
            obj.updatedAt = now;
        });

        this.applications.hook('updating', (modifications, primKey, obj, trans) => {
            (modifications as any).updatedAt = new Date().toISOString();
        });

        this.analyticsEvents.hook('creating', (primKey, obj, trans) => {
            if (!obj.timestamp) {
                obj.timestamp = new Date().toISOString();
            }
        });

        this.userSessions.hook('creating', (primKey, obj, trans) => {
            if (!obj.startTime) {
                obj.startTime = new Date().toISOString();
            }
        });
    }
}

const db = new JobTrackerDatabase();

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

// Replace these lines in your databaseService.ts (around line 156-157):
const supabaseUrl = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjk1NDMsImV4cCI6MjA3MDAwNTU0M30.rkubJuDwXZN411f341hHvoUejy8Bj2BdjsDrZsceV_o';

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
                        signal: AbortSignal.timeout(15000),
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

const authListeners = new Set<(state: AuthState) => void>();
let previousAuthState: AuthState = { ...authState };

const subscribeToAuthChanges = (callback: (state: AuthState) => void) => {
    authListeners.add(callback);
    return () => {
        authListeners.delete(callback);
    };
};

const notifyAuthStateChange = () => {
    authListeners.forEach(listener => listener(authState));
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const handleAuthError = async () => {
    console.log('🧹 Handling authentication error...');

    try {
        localStorage.removeItem('applytrak-auth-token');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('applytrak_user_id');
        localStorage.removeItem('applytrak_user_db_id');

        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        authState = {
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
        };

        // ✅ NEW: Clear cache on auth error
        dataCache.clear();

        notifyAuthStateChange();
        console.log('✅ Auth error handled - session cleared');
    } catch (error) {
        console.error('❌ Error during auth cleanup:', error);
    }
};

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
// USER MANAGEMENT
// ============================================================================

const getCurrentUser = (): User | null => {
    return authState.user;
};

const getCurrentSession = (): Session | null => {
    return authState.session;
};

const isAuthenticated = (): boolean => {
    return authState.isAuthenticated;
};

const getAuthState = (): AuthState => {
    return {...authState};
};

const getUserId = (): string | null => {
    if (authState.user?.id) {
        return authState.user.id;
    }

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

    return localStorage.getItem('applytrak_user_id');
};

const isOnlineWithSupabase = (): boolean => {
    return navigator.onLine && !!initializeSupabase() && isAuthenticated();
};

// ============================================================================
// USER DATABASE FUNCTIONS
// ============================================================================

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

            if (createError.code === '23505') {
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

const getUserDbId = async (): Promise<number | null> => {
    const userId = getUserId();
    if (!userId) {
        console.log('❌ No userId available');
        return null;
    }

    const cachedId = localStorage.getItem('applytrak_user_db_id');
    if (cachedId && !isNaN(parseInt(cachedId))) {
        console.log('✅ Using cached user DB ID:', cachedId);
        return parseInt(cachedId);
    }

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

        const {data: user, error} = await client
            .from('users')
            .select('id, email, is_admin')
            .eq('external_id', userId)
            .maybeSingle();

        if (error) {
            console.error('❌ Error looking up user:', error);

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
// AUTHENTICATION INITIALIZATION
// ============================================================================

function initializeAuth() {
    const client = initializeSupabase();
    if (!client) {
        console.warn('❌ Cannot initialize auth - Supabase client not available');
        return;
    }

    console.log('🔐 Initializing authentication...');

    client.auth.getSession().then(({data: {session}, error}) => {
        if (error) {
            console.error('❌ Error getting session:', error);
            handleAuthError();
            return;
        }

        authState = {
            user: session?.user || null,
            session,
            isAuthenticated: !!session?.user,
            isLoading: false
        };

        if (session?.user?.id) {
            localStorage.setItem('applytrak_user_id', session.user.id);
            console.log('✅ User ID synced to localStorage:', session.user.id);
        }

        notifyAuthStateChange();

        if (session?.user?.id) {
            getUserDbId().catch(error => {
                console.warn('⚠️ Failed to verify user database record:', error);
            });
        }
    });

    client.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);

        // ✅ IMPROVED: Only reload data when authentication status actually changes
        const wasAuthenticated = previousAuthState.isAuthenticated;
        const isNowAuthenticated = !!session?.user;

        authState = {
            user: session?.user || null,
            session,
            isAuthenticated: isNowAuthenticated,
            isLoading: false
        };

        if (session?.user?.id) {
            localStorage.setItem('applytrak_user_id', session.user.id);
        } else {
            localStorage.removeItem('applytrak_user_id');
            localStorage.removeItem('applytrak_user_db_id');
        }

        notifyAuthStateChange();

        switch (event) {
            case 'SIGNED_IN':
                console.log('✅ User signed in successfully');
                // ✅ NEW: Only clear cache and reload if this is a new sign-in
                if (!wasAuthenticated) {
                    dataCache.clear();
                    localStorage.removeItem('applytrak_user_db_id');
                    console.log('🔄 New sign-in detected - cache cleared');
                }
                break;
            case 'SIGNED_OUT':
                console.log('🚪 User signed out');
                clearLocalStorageAuth();
                dataCache.clear();
                break;
        }

        // ✅ NEW: Update previous state for comparison
        previousAuthState = { ...authState };
    });

    console.log('✅ Authentication system initialized');
}

// ============================================================================
// AUTHENTICATION METHODS
// ============================================================================

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

const signIn = async (email: string, password: string) => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    try {
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
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

const signOut = async () => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    try {
        const { error } = await client.auth.signOut();
        if (error) {
            console.warn('⚠️ Sign out error (non-critical):', error);
        }

        await handleAuthError();

    } catch (error) {
        console.error('❌ Sign out error:', error);
        await handleAuthError();
        throw error;
    }
};

const resetPassword = async (email: string) => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    const {error} = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
};

const logSupabaseError = (operation: string, error: any, context?: any) => {
    console.group(`❌ Supabase ${operation} Error`);
    console.error('Error object:', error);
    console.error('Error message:', error?.message || 'No message');
    console.error('Error code:', error?.code || 'No code');
    console.error('Error details:', error?.details || 'No details');
    console.error('Error hint:', error?.hint || 'No hint');
    if (context) {
        console.error('Context:', context);
    }
    console.groupEnd();
};
// ============================================================================
// CLOUD SYNC UTILITIES
// ============================================================================

// FIXED: Update your syncToCloud function to match your actual database schema

const syncToCloud = async (table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'insert'): Promise<void> => {
    if (!isOnlineWithSupabase()) return;

    try {
        const client = initializeSupabase()!;
        const userDbId = await getUserDbId();

        if (!userDbId) {
            console.warn('No user DB ID available, skipping cloud sync');
            return;
        }

        console.log(`🔄 Starting ${operation} for ${table}:`, {
            dataId: data.id,
            userDbId,
            dataKeys: Object.keys(data)
        });

        let result;

        switch (operation) {
            case 'insert':
                if (table === 'applications') {
                    // 🔧 FIXED: Use camelCase to match your actual database schema
                    const applicationData = {
                        id: data.id,
                        user_id: userDbId,
                        company: data.company,
                        position: data.position,
                        dateApplied: data.dateApplied,        // ✅ camelCase to match database
                        status: data.status,
                        type: data.type,                      // ✅ type not job_type
                        location: data.location || null,
                        salary: data.salary || null,
                        jobSource: data.jobSource || null,    // ✅ camelCase to match database
                        jobUrl: data.jobUrl || null,          // ✅ camelCase to match database
                        notes: data.notes || null,
                        attachments: data.attachments || [],
                        createdAt: data.createdAt,            // ✅ camelCase to match database
                        updatedAt: data.updatedAt,            // ✅ camelCase to match database
                        syncedAt: new Date().toISOString()    // ✅ camelCase to match database
                    };

                    console.log('📤 Mapped application data:', applicationData);
                    result = await client.from(table).insert(applicationData).select();
                } else {
                    // For other tables, use your existing logic
                    const dataWithUser = {
                        ...data,
                        user_id: userDbId,
                        synced_at: new Date().toISOString()
                    };
                    result = await client.from(table).insert(dataWithUser).select();
                }
                break;

            case 'update':
                if (table === 'applications') {
                    // 🔧 FIXED: Use camelCase to match your actual database schema
                    const updateData = {
                        company: data.company,
                        position: data.position,
                        dateApplied: data.dateApplied,        // ✅ camelCase
                        status: data.status,
                        type: data.type,                      // ✅ type not job_type
                        location: data.location || null,
                        salary: data.salary || null,
                        jobSource: data.jobSource || null,    // ✅ camelCase
                        jobUrl: data.jobUrl || null,          // ✅ camelCase
                        notes: data.notes || null,
                        attachments: data.attachments || [],
                        updatedAt: data.updatedAt,            // ✅ camelCase
                        syncedAt: new Date().toISOString()    // ✅ camelCase
                    };

                    console.log('📝 Mapped update data:', updateData);
                    result = await client
                        .from(table)
                        .update(updateData)
                        .eq('id', data.id)
                        .eq('user_id', userDbId)
                        .select();
                } else {
                    // For other tables, use your existing logic
                    const updateData = {...data};
                    delete updateData.user_id;
                    result = await client
                        .from(table)
                        .update({
                            ...updateData,
                            synced_at: new Date().toISOString()
                        })
                        .eq('id', data.id)
                        .eq('user_id', userDbId)
                        .select();
                }
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
            // Enhanced error logging
            console.group(`❌ Supabase ${operation} Error for ${table}`);
            console.error('Full error object:', result.error);
            console.error('Error message:', result.error?.message || 'No message');
            console.error('Error code:', result.error?.code || 'No code');
            console.error('Error details:', result.error?.details || 'No details');
            console.error('Error hint:', result.error?.hint || 'No hint');
            console.error('Context:', { table, operation, dataId: data.id, userDbId });
            console.groupEnd();

            // Handle specific error codes
            if (result.error.code === '23505') {
                console.warn(`⚠️ Duplicate key for ${table} - record may already exist`);
                return; // Don't throw for duplicates
            }

            if (result.error.code === '42P01') {
                console.error(`❌ Table ${table} does not exist in database`);
                throw new Error(`Table ${table} does not exist`);
            }

            if (result.error.code === '42501') {
                console.error(`❌ Permission denied for ${table}`);
                throw new Error(`Permission denied for ${table}`);
            }

            throw result.error;
        }

        console.log(`✅ ${operation} successful for ${table}:`, {
            recordsAffected: result.data?.length || 'unknown'
        });

    } catch (error: any) {
        // Enhanced error logging for caught exceptions
        console.group(`❌ Cloud sync failed for ${table} ${operation}`);
        console.error('Caught error:', error);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.groupEnd();

        // Log but don't throw to prevent UI blocking
        console.warn(`⚠️ Cloud sync failed for ${table}, continuing in offline mode...`);
    }
};

// FIXED: Update your syncFromCloud function to match your actual database schema

const syncFromCloud = async (table: string, retryCount = 0): Promise<any[]> => {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 30000;

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
            let query = client
                .from(table)
                .select('*')
                .eq('user_id', userDbId);

            if (table === 'applications') {
                // 🔧 FIXED: Use camelCase column names to match your actual database
                query = query.order('dateApplied', { ascending: false }); // ✅ dateApplied not date_applied
                query = query.limit(50);
            } else if (table === 'user_sessions') {
                query = query.order('startTime', { ascending: false }); // ✅ camelCase
                query = query.limit(100);
            } else if (table === 'analytics_events') {
                query = query.order('timestamp', { ascending: false });
                query = query.limit(100);
            } else {
                query = query.order('createdAt', { ascending: false }); // ✅ camelCase
                query = query.limit(100);
            }

            const {data, error} = await Promise.race([
                query,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Query timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
                )
            ]);

            const duration = Date.now() - startTime;

            if (error) {
                logSupabaseError(`query for ${table}`, error, {
                    userDbId,
                    table,
                    duration
                });

                if (error.code === '42501' || error.message?.includes('permission')) {
                    throw new Error(`Permission denied: ${error.message}`);
                }

                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn(`⚠️ Table ${table} does not exist in database`);
                    return [];
                }

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

            logSupabaseError(`query execution for ${table}`, queryError, {
                duration,
                userDbId,
                table
            });

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
        logSupabaseError(`syncFromCloud(${table}) fatal error`, error);
        return [];
    }
};

// ============================================================================
// BACKGROUND SYNC UTILITIES - NEW
// ============================================================================

class BackgroundSyncManager {
    private static instance: BackgroundSyncManager;
    private syncInProgress = new Set<string>();
    private lastSyncTime = new Map<string, number>();
    private readonly MIN_SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes minimum between syncs

    static getInstance(): BackgroundSyncManager {
        if (!BackgroundSyncManager.instance) {
            BackgroundSyncManager.instance = new BackgroundSyncManager();
        }
        return BackgroundSyncManager.instance;
    }

    async backgroundSync(table: string): Promise<void> {
        // Prevent duplicate syncs
        if (this.syncInProgress.has(table)) {
            console.log(`⏳ Background sync for ${table} already in progress`);
            return;
        }

        // Check minimum interval
        const lastSync = this.lastSyncTime.get(table) || 0;
        const timeSinceLastSync = Date.now() - lastSync;
        if (timeSinceLastSync < this.MIN_SYNC_INTERVAL) {
            console.log(`⏱️ Too soon for ${table} sync (${Math.round(timeSinceLastSync / 1000)}s ago)`);
            return;
        }

        this.syncInProgress.add(table);
        this.lastSyncTime.set(table, Date.now());

        try {
            console.log(`🔄 Starting background sync for ${table}`);
            const cloudData = await syncFromCloud(table);

            if (cloudData && cloudData.length > 0) {
                // Update cache with fresh data
                dataCache.set(table, cloudData);

                // Update local storage for applications
                if (table === 'applications') {
                    const mappedApps = this.mapApplicationsData(cloudData);
                    await db.applications.clear();
                    await db.applications.bulkAdd(mappedApps);
                    dataCache.set('applications', mappedApps);
                }

                console.log(`✅ Background sync completed for ${table}: ${cloudData.length} records`);
            }
        } catch (error) {
            console.warn(`Background sync failed for ${table}:`, error);
        } finally {
            this.syncInProgress.delete(table);
        }
    }

    private mapApplicationsData(cloudApps: any[]): Application[] {
        return cloudApps
            .filter(app => app && app.id)
            .map(app => ({
                id: String(app.id),
                company: app.company || '',
                position: app.position || '',
                dateApplied: app.dateApplied || new Date().toISOString().split('T')[0], // ✅ camelCase
                status: app.status || 'Applied',
                type: app.type || 'Remote',                    // ✅ type not job_type
                location: app.location || '',
                salary: app.salary || '',
                jobSource: app.jobSource || '',               // ✅ camelCase
                jobUrl: app.jobUrl || '',                     // ✅ camelCase
                notes: app.notes || '',
                attachments: Array.isArray(app.attachments) ? app.attachments : [],
                createdAt: app.createdAt || new Date().toISOString(),    // ✅ camelCase
                updatedAt: app.updatedAt || new Date().toISOString()     // ✅ camelCase
            }))
            .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
    }
}

const backgroundSyncManager = BackgroundSyncManager.getInstance();

// ============================================================================
// DATABASE SERVICE IMPLEMENTATION - WITH CACHING
// ============================================================================

export const databaseService: DatabaseService = {
    // ✅ FIXED: Applications with proper caching
    async getApplications(): Promise<Application[]> {
        try {
            console.log('🔄 getApplications() called');

            // ✅ NEW: Check cache first
            const cacheKey = 'applications';
            const cachedApps = dataCache.get<Application[]>(cacheKey);
            if (cachedApps) {
                console.log('📋 Using cached applications data');

                // ✅ NEW: Start background sync if authenticated (non-blocking)
                if (isAuthenticated() && isOnlineWithSupabase()) {
                    backgroundSyncManager.backgroundSync('applications').catch(err =>
                        console.warn('Background sync failed:', err)
                    );
                }

                return cachedApps;
            }

            // ✅ IMPROVED: Always load local data first for instant UI
            const localApps = await db.applications.orderBy('dateApplied').reverse().toArray();
            console.log('📱 Local applications count:', localApps.length);

            const sortedLocalApps = localApps.sort((a, b) =>
                new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
            );

            // ✅ NEW: Cache local data immediately
            dataCache.set(cacheKey, sortedLocalApps);

            // ✅ IMPROVED: Return local data immediately if not authenticated
            const isAuth = isAuthenticated();
            if (!isAuth || !isOnlineWithSupabase()) {
                console.log('📱 Using local data only (offline or not authenticated)');
                return sortedLocalApps;
            }

            // ✅ NEW: Only do initial cloud sync if no local data exists
            if (localApps.length === 0) {
                console.log('☁️ No local data - performing initial cloud sync...');

                try {
                    const cloudApps = await syncFromCloud('applications');
                    if (cloudApps && cloudApps.length > 0) {
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

                        // Update local storage and cache
                        await db.applications.clear();
                        await db.applications.bulkAdd(mappedApps);
                        dataCache.set(cacheKey, mappedApps);

                        console.log(`☁️ Initial cloud sync successful: ${mappedApps.length} applications`);
                        return mappedApps;
                    }
                } catch (cloudError: any) {
                    console.warn(`⚠️ Initial cloud sync failed:`, cloudError.message);
                }
            } else {
                // ✅ NEW: Start background sync for existing data (non-blocking)
                console.log('⚡ Local data exists - starting background sync...');
                backgroundSyncManager.backgroundSync('applications').catch(err =>
                    console.warn('Background sync failed:', err)
                );
            }

            return sortedLocalApps;

        } catch (error: any) {
            console.error('❌ getApplications() failed:', error.message);

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

    // ✅ FIXED: Clear cache after adding
    async addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const id = generateId();
            const newApp: Application = {...app, id, createdAt: now, updatedAt: now};

            // Save to local database
            await db.applications.add(newApp);

            // ✅ NEW: Clear cache to force refresh
            dataCache.invalidate('applications');

            // Sync to cloud for authenticated users
            if (isAuthenticated()) {
                syncToCloud('applications', {
                    id: newApp.id,
                    company: newApp.company,
                    position: newApp.position,
                    dateApplied: newApp.dateApplied,
                    status: newApp.status,
                    type: newApp.type,
                    location: newApp.location,
                    salary: newApp.salary,
                    jobSource: newApp.jobSource,
                    jobUrl: newApp.jobUrl,
                    notes: newApp.notes,
                    attachments: newApp.attachments,
                    createdAt: newApp.createdAt,
                    updatedAt: newApp.updatedAt
                }, 'insert').catch(err => console.warn('Cloud sync failed:', err));
            }

            return newApp;
        } catch (error) {
            console.error('Failed to add application:', error);
            throw new Error('Failed to add application');
        }
    },

    // ✅ FIXED: Clear cache after updating
    async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const updateData = {...updates, updatedAt: now};

            await db.applications.update(id, updateData);
            const updated = await db.applications.get(id);

            if (!updated) throw new Error('Application not found');

            // ✅ NEW: Clear cache to force refresh
            dataCache.invalidate('applications');

            if (isAuthenticated()) {
                syncToCloud('applications', {
                    id: updated.id,
                    company: updated.company,
                    position: updated.position,
                    dateApplied: updated.dateApplied,
                    status: updated.status,
                    type: updated.type,
                    location: updated.location,
                    salary: updated.salary,
                    jobSource: updated.jobSource,
                    jobUrl: updated.jobUrl,
                    notes: updated.notes,
                    attachments: updated.attachments,
                    createdAt: updated.createdAt,
                    updatedAt: updated.updatedAt
                }, 'update').catch(err => console.warn('Cloud sync failed:', err));
            }

            return updated;
        } catch (error) {
            console.error('Failed to update application:', error);
            throw new Error('Failed to update application');
        }
    },

    // ✅ FIXED: Clear cache after deleting
    async deleteApplication(id: string): Promise<void> {
        try {
            await db.applications.delete(id);

            // ✅ NEW: Clear cache to force refresh
            dataCache.invalidate('applications');

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

    // ✅ FIXED: Clear cache after bulk operations
    async deleteApplications(ids: string[]): Promise<void> {
        try {
            await db.applications.bulkDelete(ids);

            // ✅ NEW: Clear cache to force refresh
            dataCache.invalidate('applications');

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

            // ✅ NEW: Clear cache to force refresh
            dataCache.invalidate('applications');

            if (isAuthenticated()) {
                for (const id of ids) {
                    try {
                        const updated = await db.applications.get(id);
                        if (updated) {
                            syncToCloud('applications', {
                                id: updated.id,
                                company: updated.company,
                                position: updated.position,
                                dateApplied: updated.dateApplied,
                                status: updated.status,
                                type: updated.type,
                                location: updated.location,
                                salary: updated.salary,
                                jobSource: updated.jobSource,
                                jobUrl: updated.jobUrl,
                                notes: updated.notes,
                                attachments: updated.attachments,
                                createdAt: updated.createdAt,
                                updatedAt: updated.updatedAt
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

            // ✅ NEW: Clear cache to force refresh
            dataCache.invalidate('applications');

            if (isAuthenticated()) {
                applications.forEach(app => {
                    syncToCloud('applications', {
                        id: app.id,
                        company: app.company,
                        position: app.position,
                        dateApplied: app.dateApplied,
                        status: app.status,
                        type: app.type,
                        location: app.location,
                        salary: app.salary,
                        jobSource: app.jobSource,
                        jobUrl: app.jobUrl,
                        notes: app.notes,
                        attachments: app.attachments,
                        createdAt: app.createdAt,
                        updatedAt: app.updatedAt
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

            // ✅ NEW: Clear all cache
            dataCache.clear();

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

    // ✅ NEW: Add manual refresh method
    async forceRefreshApplications(): Promise<Application[]> {
        console.log('🔄 Force refreshing applications...');
        dataCache.invalidate('applications');
        return await this.getApplications();
    },

    // ✅ NEW: Add cache status method
    getCacheStatus(): { [key: string]: boolean } {
        return {
            applications: dataCache.has('applications'),
            goals: dataCache.has('goals')
        };
    },

    // ✅ NEW: Add cache control methods
    clearCache(): void {
        dataCache.clear();
        console.log('🗑️ All cache cleared manually');
    },

    invalidateCache(key: string): void {
        dataCache.invalidate(key);
        console.log(`🗑️ Cache invalidated for: ${key}`);
    },

    // ... (rest of the methods remain the same)
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
                            totalGoal: Number(goals.totalGoal),
                            weeklyGoal: Number(goals.weeklyGoal),
                            monthlyGoal: Number(goals.monthlyGoal),
                            createdAt: goals.createdAt,
                            updatedAt: goals.updatedAt
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

    // ... (include other methods as needed - backup, analytics, feedback, etc.)
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

            // ✅ NEW: Clear cache after restore
            dataCache.clear();
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error('Failed to restore from backup');
        }
    },

    // Add remaining methods (analytics, feedback, etc.) following the same pattern...
    async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        try {
            await db.analyticsEvents.add(event as any);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    syncToCloud('analyticsEvents', {
                        event: event.event,
                        properties: event.properties || {},
                        timestamp: event.timestamp,
                        sessionId: event.sessionId,
                        userId: event.userId,
                        userAgent: navigator.userAgent,
                        deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: navigator.language || 'en',
                        createdAt: event.timestamp
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
                    syncToCloud('userSessions', {
                        sessionId: session.id,
                        startTime: session.startTime,
                        endTime: session.endTime,
                        duration: Number(session.duration) || null,
                        deviceType: session.deviceType || 'desktop',
                        userAgent: session.userAgent || navigator.userAgent,
                        timezone: session.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: session.language || navigator.language || 'en',
                        events: session.events || [],
                        pageViews: Number(session.events?.length) || 0,
                        createdAt: session.startTime
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
                        user_id: userDbId,
                        sessionsCount: Number(updated.sessionsCount) || 0,
                        totalTimeSpent: Number(updated.totalTimeSpent) || 0,
                        applicationsCreated: Number(updated.applicationsCreated) || 0,
                        applicationsUpdated: Number(updated.applicationsUpdated) || 0,
                        applicationsDeleted: Number(updated.applicationsDeleted) || 0,
                        goalsSet: Number(updated.goalsSet) || 0,
                        attachmentsAdded: Number(updated.attachmentsAdded) || 0,
                        exportsPerformed: Number(updated.exportsPerformed) || 0,
                        importsPerformed: Number(updated.importsPerformed) || 0,
                        searchesPerformed: Number(updated.searchesPerformed) || 0,
                        featuresUsed: updated.featuresUsed || [],
                        lastActiveDate: updated.lastActiveDate || new Date().toISOString(),
                        firstVisit: updated.firstVisit || new Date().toISOString(),
                        deviceType: updated.deviceType || 'desktop',
                        browserVersion: navigator.userAgent || 'unknown',
                        screenResolution: `${window.screen.width}x${window.screen.height}`,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: navigator.language || 'en',
                        totalEvents: Number(updated.totalEvents) || 0,
                        applicationsCount: Number(updated.applicationsCreated) || 0,
                        sessionDuration: Number(updated.totalTimeSpent) || 0,
                        createdAt: updated.firstVisit || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
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

    async getAdminAnalytics(): Promise<AdminAnalytics> {
        try {
            const applications = await this.getApplications();
            const analytics = await this.getAnalyticsEvents();
            const userMetrics = await this.getUserMetrics();
            const sessions = await db.userSessions.toArray();

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
// DATABASE INITIALIZATION
// ============================================================================

const initializeDefaultData = async () => {
    try {
        console.log('✅ Database opened with analytics support');

        const metrics = await db.userMetrics.get('default');
        if (!metrics) {
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

db.open().then(() => {
    initializeDefaultData();
}).catch(error => {
    console.error('❌ Database failed to open:', error);

    if (error.name === 'UpgradeError' || error.name === 'DatabaseClosedError') {
        console.log('🔄 Attempting database recreation...');

        db.delete().then(() => {
            console.log('✅ Old database deleted, creating new one...');
            return db.open();
        }).then(() => {
            console.log('✅ Database recreated successfully');
            initializeDefaultData();
        }).catch(recreateError => {
            console.error('❌ Failed to recreate database:', recreateError);
        });
    }
});

export const initializeDatabase = async (): Promise<void> => {
    try {
        await db.open();
        console.log('✅ Local database initialized');

        initializeAuth();
        console.log('✅ Authentication system initialized');

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
// UTILITY FUNCTIONS
// ============================================================================

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

export const recoverAuthSession = async () => {
    console.log('🚨 Attempting auth session recovery...');

    try {
        await handleAuthError();

        supabase = null;
        const client = initializeSupabase();

        if (client) {
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

export const debugSupabaseSync = async () => {
    console.group('🔍 DEBUGGING SUPABASE SYNC');

    try {
        // Check basic connection
        console.log('🔧 1. Testing Supabase connection...');
        const client = initializeSupabase();
        if (!client) {
            console.error('❌ No Supabase client - check environment variables');
            console.log('Environment check:');
            console.log('- SUPABASE_URL:', !!process.env.REACT_APP_SUPABASE_URL);
            console.log('- SUPABASE_ANON_KEY:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
            return;
        }
        console.log('✅ Supabase client initialized');

        // Check authentication
        console.log('🔐 2. Testing authentication...');
        const { data: { session }, error: authError } = await client.auth.getSession();
        if (authError) {
            console.error('❌ Auth error:', authError);
            return;
        }
        if (!session?.user) {
            console.error('❌ No authenticated user');
            console.log('Please sign in first');
            return;
        }
        console.log('✅ User authenticated:', session.user.email);

        // Check user DB ID
        console.log('👤 3. Testing user DB ID...');
        const userDbId = await getUserDbId();
        if (!userDbId) {
            console.error('❌ No user DB ID found');
            console.log('This means the user record might not exist in the users table');
            return;
        }
        console.log('✅ User DB ID found:', userDbId);

        // Test table access
        console.log('📋 4. Testing applications table access...');
        try {
            const { data: testQuery, error: tableError } = await client
                .from('applications')
                .select('*')
                .eq('user_id', userDbId)
                .limit(5);

            if (tableError) {
                console.error('❌ Table access error:', tableError);
                if (tableError.code === '42501') {
                    console.error('🚫 Permission denied - check RLS policies');
                } else if (tableError.code === '42P01') {
                    console.error('🚫 Table does not exist');
                }
                return;
            }

            console.log('✅ Applications table accessible');
            console.log('📊 Current applications in Supabase:', testQuery?.length || 0);
            if (testQuery && testQuery.length > 0) {
                console.log('Sample application:', testQuery[0]);
            }
        } catch (tableError) {
            console.error('❌ Table test failed:', tableError);
            return;
        }

        // Test a manual insert
        console.log('➕ 5. Testing manual insert...');
        const testApp = {
            id: 'debug-test-' + Date.now(),
            user_id: userDbId,
            company: 'Debug Test Company',
            position: 'Debug Test Position',
            dateApplied: new Date().toISOString().split('T')[0],
            status: 'Applied',
            type: 'Remote',
            location: 'Debug Location',
            salary: '$100,000',
            jobSource: 'Debug Test',
            jobUrl: 'https://example.com',
            notes: 'This is a debug test application',
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncedAt: new Date().toISOString()
        };

        try {
            const { data: insertResult, error: insertError } = await client
                .from('applications')
                .insert(testApp)
                .select();

            if (insertError) {
                console.error('❌ Insert test failed:', insertError);
                console.error('Full error details:');
                console.error('- Code:', insertError.code);
                console.error('- Message:', insertError.message);
                console.error('- Details:', insertError.details);
                console.error('- Hint:', insertError.hint);
                return;
            }

            console.log('✅ Manual insert successful!');
            console.log('Inserted record:', insertResult);

            // Clean up test record
            await client
                .from('applications')
                .delete()
                .eq('id', testApp.id);
            console.log('🧹 Test record cleaned up');

        } catch (insertError) {
            console.error('❌ Insert test exception:', insertError);
        }

        // Test the actual syncToCloud function
        console.log('🔄 6. Testing syncToCloud function...');
        try {
            await syncToCloud('applications', {
                id: 'debug-sync-test-' + Date.now(),
                company: 'Sync Test Company',
                position: 'Sync Test Position',
                dateApplied: new Date().toISOString().split('T')[0],
                status: 'Applied',
                type: 'Remote',
                location: 'Sync Test Location',
                salary: '$120,000',
                jobSource: 'Sync Test Source',
                jobUrl: 'https://synctest.com',
                notes: 'This is a sync test',
                attachments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, 'insert');
            console.log('✅ syncToCloud test completed (check console for details)');
        } catch (syncError) {
            console.error('❌ syncToCloud test failed:', syncError);
        }

        console.log('🎉 Debug complete! Check the logs above for issues.');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }

    console.groupEnd();
};

// 2. Add this to check your environment variables
export const checkEnvironment = () => {
    console.group('🌍 ENVIRONMENT CHECK');

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    console.log('Environment Variables:');
    console.log('- REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('- REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

    if (supabaseUrl) {
        console.log('Supabase URL format:', supabaseUrl.includes('.supabase.co') ? '✅ Valid' : '⚠️ Check format');
    }

    if (supabaseKey) {
        console.log('Anon key length:', supabaseKey.length > 100 ? '✅ Looks valid' : '⚠️ Seems short');
    }

    console.groupEnd();
};

// 3. Add this to check local vs cloud data
export const compareLocalAndCloudData = async () => {
    console.group('📊 LOCAL VS CLOUD DATA COMPARISON');

    try {
        // Get local applications
        const localApps = await db.applications.toArray();
        console.log('📱 Local applications:', localApps.length);

        if (localApps.length > 0) {
            console.log('Latest local app:', {
                id: localApps[0].id,
                company: localApps[0].company,
                position: localApps[0].position,
                createdAt: localApps[0].createdAt
            });
        }

        // Get cloud applications
        if (isAuthenticated() && isOnlineWithSupabase()) {
            const cloudApps = await syncFromCloud('applications');
            console.log('☁️ Cloud applications:', cloudApps.length);

            if (cloudApps.length > 0) {
                console.log('Latest cloud app:', {
                    id: cloudApps[0].id,
                    company: cloudApps[0].company,
                    position: cloudApps[0].position,
                    createdAt: cloudApps[0].createdAt
                });
            }

            // Compare IDs
            const localIds = new Set(localApps.map(app => app.id));
            const cloudIds = new Set(cloudApps.map(app => app.id));

            const onlyLocal = localApps.filter(app => !cloudIds.has(app.id));
            const onlyCloud = cloudApps.filter(app => !localIds.has(app.id));

            console.log('📊 Comparison:');
            console.log('- Only in local:', onlyLocal.length);
            console.log('- Only in cloud:', onlyCloud.length);
            console.log('- In both:', localApps.filter(app => cloudIds.has(app.id)).length);

            if (onlyLocal.length > 0) {
                console.log('🔍 Apps only in local (not synced):');
                onlyLocal.forEach(app => {
                    console.log(`  - ${app.company} - ${app.position} (${app.id})`);
                });
            }
        } else {
            console.log('❌ Cannot check cloud data - not authenticated or offline');
        }

    } catch (error) {
        console.error('❌ Comparison failed:', error);
    }

    console.groupEnd();
};



// ============================================================================
// EXPORTS
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

// ✅ NEW: Export cache utilities - Fixed to avoid interface dependency
export const cacheService = {
    get: <T>(key: string) => dataCache.get<T>(key),
    set: <T>(key: string, data: T) => dataCache.set(key, data),
    invalidate: (key: string) => dataCache.invalidate(key),
    clear: () => dataCache.clear(),
    has: (key: string) => dataCache.has(key),
    getCacheStatus: () => {
        return {
            applications: dataCache.has('applications'),
            goals: dataCache.has('goals')
        };
    },
    clearCache: () => {
        dataCache.clear();
        console.log('🗑️ All cache cleared manually');
    },
    invalidateCache: (key: string) => {
        dataCache.invalidate(key);
        console.log(`🗑️ Cache invalidated for: ${key}`);
    },
    forceRefreshApplications: async () => {
        console.log('🔄 Force refreshing applications...');
        dataCache.invalidate('applications');
        return await databaseService.getApplications();
    }
};

export default databaseService;