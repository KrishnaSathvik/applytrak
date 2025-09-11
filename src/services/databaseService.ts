// src/services/databaseService.ts - PRODUCTION-READY DATABASE SERVICE
import Dexie, {Table} from 'dexie';
import {createClient, Session, SupabaseClient, User} from '@supabase/supabase-js';
import {
    AdminAnalytics,
    AdminFeedbackSummary,
    AnalyticsEvent,
    Application,
    Attachment,
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
// CONFIGURATION & CONSTANTS
// ============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MIN_SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes
const QUERY_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
// chunked cloud sync helpers
const IMPORT_BATCH_SIZE = 50;
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// ============================================================================
// CACHING SYSTEM
// ============================================================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    isValid: boolean;
}

class DataCache {
    private static instance: DataCache;
    private cache = new Map<string, CacheEntry<any>>();

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

        const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
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

        const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
        return !isExpired && entry.isValid;
    }
}

const dataCache = DataCache.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = (): string => {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// DATABASE SCHEMA
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

        this.applications.hook('creating', (_primKey, obj, _trans) => {
            const now = new Date().toISOString();
            obj.createdAt = now;
            obj.updatedAt = now;
        });

        this.applications.hook('updating', (modifications, _primKey, _obj, _trans) => {
            (modifications as any).updatedAt = new Date().toISOString();
        });

        this.analyticsEvents.hook('creating', (_primKey, obj, _trans) => {
            if (!obj.timestamp) {
                obj.timestamp = new Date().toISOString();
            }
        });

        this.userSessions.hook('creating', (_primKey, obj, _trans) => {
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

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;

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
// ========================== STORAGE HELPERS ==========================
// Put this near the bottom of services/databaseService.ts (where your Supabase client lives)
// Make sure the file already has the Supabase client imported/created as `supabase`.
// And import the Attachment type:
// import type { Attachment } from '@/types';

function sanitizeFileName(name: string): string {
    return name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
}

function isoStamp(): string {
    return new Date().toISOString().replace(/[:.]/g, "-");
}

function randomToken(): string {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0].toString(36);
    }
    return Math.random().toString(36).slice(2, 10);
}

/** Maps auth.uid() -> users.id (bigint). Requires SQL function `public.current_user_id()` */
export async function getCurrentUserId(): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Check if we have a valid session first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        throw new Error("No active authentication session");
    }
    
    const {data, error} = await supabase.rpc("current_user_id");
    if (error) {
        console.error('❌ current_user_id RPC error:', error);
        // If the RPC fails, try to get the user ID directly
        const userId = await getUserDbId();
        if (userId) return userId;
        throw error;
    }
    if (data == null) {
        console.warn('⚠️ current_user_id() returned null, user may not exist in users table');
        // Try to get the user ID directly as fallback
        const userId = await getUserDbId();
        if (userId) return userId;
        throw new Error("current_user_id() returned null and no fallback user ID found");
    }
    return data as number;
}

/**
 * Upload a file to the private 'attachments' bucket with improved naming strategy.
 * Path: <authUid>/<applicationId>/<timestamp>-<uniqueId>/<originalFileName>
 * This allows same filenames across different applications while maintaining organization.
 */
export async function uploadAttachment(
    internalUserId: number,
    file: File,
    applicationId?: string, // Optional: group files by application
    fileIndex = 0
): Promise<Attachment> {
    const originalName = file.name;
    const safeName = sanitizeFileName(originalName);
    
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Create a more organized folder structure using internal user ID
    const timestamp = isoStamp();
    const uniqueId = randomToken();
    
    // If applicationId is provided, organize by application
    // Otherwise, use a general uploads folder
    const baseFolder = applicationId ? `applications/${applicationId}` : 'uploads';
    const uniqueFolder = `${timestamp}-${uniqueId}-${fileIndex}`;
    const storagePath = `${internalUserId}/${baseFolder}/${uniqueFolder}/${safeName}`;

    if (!supabase) throw new Error('Supabase client not initialized');
    const {error} = await supabase.storage
        .from("attachments")
        .upload(storagePath, file, {
            upsert: false, // keep history (no overwrites)
            contentType: file.type || 'application/octet-stream',
            cacheControl: "3600"
        });

    if (error) throw error;

    return {
        id: uniqueFolder,
        name: originalName, // Keep original filename for user display
        type: file.type,
        size: file.size,
        storagePath, // where the file lives
        uploadedAt: new Date().toISOString(),
        applicationId: applicationId || null, // Track which application this belongs to
    };
}

/** Get a short-lived signed URL to view/download a stored file */
export async function getAttachmentSignedUrl(
    storagePath: string,
    expiresInSeconds = 300
): Promise<string> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const {data, error} = await supabase.storage
        .from("attachments")
        .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) throw error ?? new Error("Failed to create signed URL");
    return data.signedUrl;
}

/** Resolve a VIEW URL (checks storagePath first, then legacy data) */
export async function resolveViewUrl(att: Attachment, ttlSeconds = 300): Promise<string> {
    if (att.storagePath) {
        return getAttachmentSignedUrl(att.storagePath, ttlSeconds);
    }
    if (att.data) {
        return att.data; // base64 data URL (legacy/offline)
    }
    throw new Error("Attachment has no storagePath or data to view.");
}

/** Resolve a DOWNLOAD URL (same as view for private buckets) */
export async function resolveDownloadUrl(att: Attachment, ttlSeconds = 300): Promise<string> {
    return resolveViewUrl(att, ttlSeconds);
}

/** Delete a stored file by its storagePath */
export async function deleteAttachment(storagePath: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const {error} = await supabase.storage
        .from("attachments")
        .remove([storagePath]);

    if (error) throw error;
}

/** Delete from cloud if the attachment has storagePath; no-op for legacy base64 */
export async function deleteAttachmentFromCloud(att: Attachment): Promise<void> {
    if (att.storagePath) {
        await deleteAttachment(att.storagePath);
    }
}

/**
 * List all attachments for a given user (simple walker).
 * If you persist uploads in DB, prefer listing from DB instead.
 */
export async function listUserAttachments(
    internalUserId: number
): Promise<{ path: string; name: string; isFolder: boolean }[]> {
    const results: { path: string; name: string; isFolder: boolean }[] = [];

    if (!supabase) throw new Error('Supabase client not initialized');

    // list top-level entries under <internalUserId>/
    const {data: top, error: topErr} = await supabase.storage
        .from("attachments")
        .list(`${internalUserId}`, {limit: 100});

    if (topErr) throw topErr;

    const folders = (top || []).filter((e) => e.name && e.metadata?.name == null); // folders have no metadata.name
    const filesTop = (top || []).filter((e) => e.metadata?.name);                  // files

    for (const f of filesTop) {
        results.push({
            path: `${internalUserId}/${f.name}`,
            name: f.name!,
            isFolder: false,
        });
    }

    // walk each subfolder and list files
    for (const folder of folders) {
        const folderPath = `${internalUserId}/${folder.name}`;
        const {data: children, error} = await supabase.storage
            .from("attachments")
            .list(folderPath, {limit: 100});

        if (error) throw error;

        for (const c of children || []) {
            const p = `${folderPath}/${c.name}`;
            const isFolder = !c.metadata?.name;
            results.push({
                path: p,
                name: c.name!,
                isFolder,
            });
        }
    }

    return results;
}

// ======================== END STORAGE HELPERS ========================


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
let previousAuthState: AuthState = {...authState};

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
// AUTHENTICATION HELPER FUNCTIONS
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
// USER MANAGEMENT FUNCTIONS
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

        // First check if user already exists to avoid conflicts
        const {data: existingUser, error: lookupError} = await client
            .from('users')
            .select('id, email')
            .eq('externalid', authUserId)
            .maybeSingle();

        if (existingUser && !lookupError) {
            console.log('✅ User already exists, using existing record');
            const dbId = parseInt(existingUser.id.toString());
            // Don't cache user ID 1 (likely test/default value)
        if (dbId !== 1) {
            localStorage.setItem('applytrak_user_db_id', dbId.toString());
        }
            return dbId;
        }

        // Also check by email to handle cases where externalid might be different
        if (currentUser.email) {
            try {
                console.log('🔍 Checking for existing user by email:', currentUser.email);
                const {data: emailUser, error: emailError} = await client
                    .from('users')
                    .select('id, email')
                    .eq('email', currentUser.email)
                    .maybeSingle();

                if (emailError) {
                    console.warn('Email lookup failed:', emailError.message);
                    // If it's a schema error, skip further attempts
                    if (emailError.message.includes('does not exist')) {
                        console.warn('Database schema error detected, skipping further attempts');
                        return null;
                    }
                } else if (emailUser) {
                    console.log('✅ User found by email, using existing record');
                    const dbId = parseInt(emailUser.id.toString());
                    // Don't cache user ID 1 (likely test/default value)
        if (dbId !== 1) {
            localStorage.setItem('applytrak_user_db_id', dbId.toString());
        }
                    return dbId;
                } else {
                    console.log('📝 No existing user found by email, will create new record');
                }
            } catch (emailLookupError) {
                console.warn('Email lookup error:', emailLookupError);
            }
        }

        const {data: newUser, error: createError} = await client
            .from('users')
            .insert({
                externalid: authUserId,
                email: currentUser.email || `user-${authUserId}@applytrak.local`,
                display_name: currentUser.user_metadata?.full_name ||
                    currentUser.user_metadata?.name ||
                    currentUser.email?.split('@')[0] ||
                    'ApplyTrak User',
                avatarurl: currentUser.user_metadata?.avatar_url || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                language: navigator.language || 'en',
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
            })
            .select('id, email')
            .single();

        if (createError) {
            console.error('❌ Error creating user:', createError);

            // Handle specific error codes
            if (createError.code === '23505') {
                console.log('🔄 Duplicate key error - user already exists, fetching existing record...');
                const {data: existingUser} = await client
                    .from('users')
                    .select('id, email')
                    .eq('externalid', authUserId)
                    .single();

                if (existingUser) {
                    const dbId = parseInt(existingUser.id.toString());
                    // Don't cache user ID 1 (likely test/default value)
        if (dbId !== 1) {
            localStorage.setItem('applytrak_user_db_id', dbId.toString());
        }
                    return dbId;
                }
            }

            if (createError.code === '42501') {
                console.error('❌ Permission denied - check RLS policies');
                return null;
            }

            return null;
        }

        const dbId = parseInt(newUser.id.toString());
        // Don't cache user ID 1 (likely test/default value)
        if (dbId !== 1) {
            localStorage.setItem('applytrak_user_db_id', dbId.toString());
        }

        console.log('✅ User created successfully:', {
            dbId,
            email: newUser.email
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
        const parsedId = parseInt(cachedId);
        // Clear cached ID if it's 1 (likely test/default value)
        if (parsedId === 1) {
            localStorage.removeItem('applytrak_user_db_id');
            console.log('🧹 Cleared cached user DB ID 1 (likely test/default value)');
            return null;
        }
        console.log('✅ Using cached user DB ID:', cachedId);
        return parsedId;
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

        // Check if we have a valid session before querying
        const { data: { session } } = await client.auth.getSession();
        if (!session?.user) {
            console.log('❌ No active session - skipping user lookup');
            return null;
        }

        console.log('🔍 Looking up user in database with externalid:', userId);

        const {data: user, error} = await client
            .from('users')
            .select('id, email')
            .eq('externalid', userId)
            .maybeSingle();

        if (error) {
            console.error('❌ Error looking up user:', error);

            if (error.code === 'PGRST116' || error.message?.includes('No rows found') || error.code === '406' || error.code === '400') {
                console.log('👤 User not found in database, creating new user record...');
                return await createUserRecord(userId);
            }

            // For other errors, try to get user by email as fallback
            const { data: { session } } = await client.auth.getSession();
            if (session?.user?.email) {
                try {
                    console.log('🔄 Trying fallback lookup by email:', session.user.email);
                    const {data: emailUser, error: emailError} = await client
                        .from('users')
                        .select('id, email')
                        .eq('email', session.user.email)
                        .maybeSingle();

                    if (emailError) {
                        console.warn('Fallback email lookup failed:', emailError.message);
                    } else if (emailUser) {
                        console.log('✅ Found user by email fallback');
                        const dbId = parseInt(emailUser.id.toString());
                        // Don't cache user ID 1 (likely test/default value)
        if (dbId !== 1) {
            localStorage.setItem('applytrak_user_db_id', dbId.toString());
        }
                        return dbId;
                    }
                } catch (fallbackError) {
                    console.warn('Fallback email lookup error:', fallbackError);
                }
            }

            return null;
        }

        if (!user) {
            console.log('👤 No user found, creating new user record...');
            return await createUserRecord(userId);
        }

        const dbId = parseInt(user.id.toString());
        // Don't cache user ID 1 (likely test/default value)
        if (dbId !== 1) {
            localStorage.setItem('applytrak_user_db_id', dbId.toString());
        }
        console.log('✅ Found existing user:', {
            dbId,
            email: user.email
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
            isLoading: false,
        };

        if (session?.user?.id) {
            localStorage.setItem('applytrak_user_id', session.user.id);
            console.log('✅ User ID synced to localStorage:', session.user.id);
        }

        notifyAuthStateChange();

        // Don't call getUserDbId immediately - wait for proper authentication flow
        // This prevents premature database queries before RLS policies are active
    });

    client.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);

        const wasAuthenticated = previousAuthState.isAuthenticated;
        const isNowAuthenticated = !!session?.user;

        authState = {
            user: session?.user || null,
            session,
            isAuthenticated: isNowAuthenticated,
            isLoading: false,
        };

        if (session?.user?.id) {
            localStorage.setItem('applytrak_user_id', session.user.id);
        } else {
            localStorage.removeItem('applytrak_user_id');
            localStorage.removeItem('applytrak_user_db_id');
        }

        notifyAuthStateChange();

        switch (event) {
            case 'SIGNED_IN': {
                console.log('✅ User signed in successfully');

                if (!wasAuthenticated) {
                    dataCache.clear();
                    localStorage.removeItem('applytrak_user_db_id');
                    console.log('🔄 New sign-in detected - cache cleared');

                    // Wait for authentication to be fully established before database operations
                    setTimeout(async () => {
                        try {
                            console.log('🔄 Starting delayed user verification after sign-in...');
                            const userDbId = await getUserDbId();
                            if (!userDbId) {
                                console.warn('⚠️ Could not resolve userDbId; skipping migration');
                                return;
                            }

                            // Load complete user data from database
                            try {
                                const { data: dbUser, error: dbError } = await client
                                    .from('users')
                                    .select('id, externalid, email, display_name')
                                    .eq('id', userDbId)
                                    .maybeSingle();

                                if (!dbError && dbUser && authState.user) {
                                    // Update auth state with complete user data
                                    authState = {
                                        ...authState,
                                        user: {
                                            ...authState.user,
                                            user_metadata: {
                                                ...authState.user.user_metadata,
                                                full_name: dbUser.display_name
                                            }
                                        }
                                    };
                                    notifyAuthStateChange();
                                    console.log('✅ User data loaded from database:', dbUser);
                                }
                            } catch (userDataError) {
                                console.warn('⚠️ Failed to load user data from database:', userDataError);
                            }

                            const localApps = await db.applications.toArray();
                            if (!localApps?.length) {
                                console.log('ℹ️ No local applications to migrate');
                                return;
                            }

                            console.log(`🚚 Migrating ${localApps.length} local applications to cloud...`);
                            for (const app of localApps) {
                                await syncToCloud('applications', app, 'insert'); // uses your existing path
                            }
                            console.log('🎉 Local → cloud migration complete');
                        } catch (err) {
                            console.warn('⚠️ Local → cloud migration failed:', err);
                        }
                    }, 2000); // Wait 2 seconds for auth to be fully established
                }

                break;
            }

            case 'SIGNED_OUT': {
                console.log('🚪 User signed out');
                clearLocalStorageAuth();
                dataCache.clear();
                break;
            }

            default:
                break;
        }

        previousAuthState = {...authState};
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
        const {data, error} = await client.auth.signInWithPassword({
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
        const {error} = await client.auth.signOut();
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

const updateUserProfile = async (updates: { full_name?: string; email?: string }) => {
    const client = initializeSupabase();
    if (!client) throw new Error('Supabase not initialized');

    // Update Supabase auth metadata
    const {data: authData, error: authError} = await client.auth.updateUser({
        data: updates
    });

    if (authError) throw authError;

    // Also update the database record
    try {
        const currentUser = authData.user;
        if (!currentUser) {
            throw new Error('No user data received from auth update');
        }

        // Get the database user ID
        const dbUserId = await getUserDbId();
        if (!dbUserId) {
            console.warn('Could not get database user ID, skipping database update');
            return;
        }

        // Update the users table
        const dbUpdates: any = {
            updatedat: new Date().toISOString()
        };

        if (updates.full_name) {
            dbUpdates.display_name = updates.full_name;
        }

        if (updates.email) {
            dbUpdates.email = updates.email;
        }

        const {error: dbError} = await client
            .from('users')
            .update(dbUpdates)
            .eq('id', dbUserId);

        if (dbError) {
            console.error('Failed to update database user record:', dbError);
            // Don't throw here - auth update succeeded, just log the database error
        } else {
            console.log('Successfully updated database user record');
        }

    } catch (error) {
        console.error('Error updating database user record:', error);
        // Don't throw here - auth update succeeded, just log the error
    }

    return authData;
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

const handleDatabaseError = (error: any, operation: string, table: string) => {
    console.group(`❌ Database Error: ${operation} ${table}`);
    console.error('Error:', error);

    if (error.code === '23505') {
        console.error('DUPLICATE KEY - Record already exists');
        return 'duplicate';
    }

    if (error.code === '23503') {
        console.error('FOREIGN KEY VIOLATION - User ID not found');
        return 'foreign_key';
    }

    if (error.code === '42501') {
        console.error('PERMISSION DENIED - Check RLS policies');
        return 'permission';
    }

    if (error.code === '42P01') {
        console.error('TABLE NOT FOUND');
        return 'table_missing';
    }

    if (error.message?.includes('violates check constraint')) {
        console.error('CHECK CONSTRAINT VIOLATION - Invalid data format');
        return 'invalid_data';
    }

    console.groupEnd();
    return 'unknown';
};

// ============================================================================
// CLOUD SYNC UTILITIES
// ============================================================================

const syncToCloud = async (
    table: string,
    data: any | any[],
    operation: 'insert' | 'update' | 'delete' = 'insert'
): Promise<void> => {
    if (!isOnlineWithSupabase()) return;

    try {
        const client = initializeSupabase()!;
        const userDbId = await getUserDbId();

        if (!userDbId) {
            console.warn('No user DB ID available, skipping cloud sync');
            return;
        }

        const isArray = Array.isArray(data);
        const nowIso = new Date().toISOString();

        // Smarter logging for single vs array
        console.log(`🔄 Starting ${operation} for ${table}:`, {
            isArray,
            count: isArray ? data.length : 1,
            userDbId,
            dataId: !isArray ? data?.id : undefined,
        });

        let result;

        switch (operation) {
            case 'insert': {
                if (table === 'applications') {
                    // Normalize to an array and map each row like your single-record path
                    const rows = (isArray ? data : [data]).map((d) => {
                        const applicationData = {
                            id: String(d.id),
                            userid: userDbId,
                            company: String(d.company),
                            position: String(d.position),
                            dateApplied: String(d.dateApplied),
                            status: String(d.status),
                            type: String(d.type),
                            location: d.location ? String(d.location) : null,
                            salary: d.salary ? String(d.salary) : null,
                            jobSource: d.jobSource ? String(d.jobSource) : null,
                            jobUrl: d.jobUrl ? String(d.jobUrl) : null,
                            notes: d.notes ? String(d.notes) : null,
                            attachments: Array.isArray(d.attachments) ? d.attachments : [],
                            createdAt: d.createdAt || nowIso,
                            updatedAt: d.updatedAt || nowIso,
                            syncedAt: nowIso,
                        };

                        if (!applicationData.id || !applicationData.company || !applicationData.position) {
                            throw new Error('Missing required fields: id, company, or position');
                        }
                        return applicationData;
                    });

                    console.log(`📤 Mapped application data (${rows.length} rows)`);

                    // Use upsert on 'id' like your original
                    result = await client
                        .from(table)
                        .upsert(rows, {onConflict: 'id'}) // PK is 'id' in your schema
                        .select(); // keep .select() if you need it; remove for speed
                } else {
                    // Other tables: attach user + syncedAt; accept single or array
                    const rows = (isArray ? data : [data]).map((d) => ({
                        ...d,
                        userid: userDbId,
                        syncedAt: nowIso,
                    }));

                    result = await client.from(table).insert(rows).select();
                }
                break;
            }

            case 'update': {
                // Keep existing single-record update logic (no batch update support here)
                if (isArray) {
                    console.warn('Batch update not supported in syncToCloud; processing items one by one.');
                    for (const item of data as any[]) {
                        await syncToCloud(table, item, 'update'); // reuse single path
                    }
                    return;
                }

                if (table === 'applications') {
                    const updateData = {
                        company: data.company,
                        position: data.position,
                        dateApplied: data.dateApplied,
                        status: data.status,
                        type: data.type,
                        location: data.location || null,
                        salary: data.salary || null,
                        jobSource: data.jobSource || null,
                        jobUrl: data.jobUrl || null,
                        notes: data.notes || null,
                        attachments: data.attachments || [],
                        updatedAt: data.updatedAt || nowIso,
                        syncedAt: nowIso,
                    };

                    console.log('📝 Mapped update data:', updateData);
                    result = await client
                        .from(table)
                        .update(updateData)
                        .eq('id', data.id)
                        .eq('userid', userDbId)
                        .select();
                } else {
                    const updateData = {...data};
                    delete (updateData as any).userid;
                    result = await client
                        .from(table)
                        .update({...updateData, syncedAt: nowIso})
                        .eq('id', data.id)
                        .eq('userid', userDbId)
                        .select();
                }
                break;
            }

            case 'delete': {
                // Keep existing single-record delete logic (no batch delete support here)
                if (isArray) {
                    console.warn('Batch delete not supported in syncToCloud; processing items one by one.');
                    for (const item of data as any[]) {
                        await syncToCloud(table, item, 'delete'); // reuse single path
                    }
                    return;
                }

                result = await client.from(table).delete().eq('id', data.id).eq('userid', userDbId);
                break;
            }
        }

        if (result?.error) {
            console.group(`❌ Supabase ${operation} Error for ${table}`);
            console.error('Full error object:', result.error);
            console.error('Error message:', result.error?.message || 'No message');
            console.error('Error code:', result.error?.code || 'No code');
            console.error('Error details:', result.error?.details || 'No details');
            console.error('Error hint:', result.error?.hint || 'No hint');
            console.error('Context:', {
                table,
                operation,
                userDbId,
                isArray,
                count: isArray ? (data as any[]).length : 1,
            });
            console.groupEnd();

            if (result.error.code === '23505') {
                console.warn(`⚠️ Duplicate key for ${table} - record may already exist`);
                return;
            }
            if (result.error.code === '42P01') {
                throw new Error(`Table ${table} does not exist`);
            }
            if (result.error.code === '42501') {
                throw new Error(`Permission denied for ${table}`);
            }

            throw result.error;
        }

        console.log(`✅ ${operation} successful for ${table}:`, {
            recordsAffected: result?.data?.length ?? 'unknown',
        });
    } catch (error: any) {
        console.group(`❌ Cloud sync failed for ${table} ${operation}`);
        console.error('Caught error:', error);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.groupEnd();
        console.warn(`⚠️ Cloud sync failed for ${table}, continuing in offline mode...`);
    }
};

const syncFromCloud = async (table: string, retryCount = 0): Promise<any[]> => {
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

        console.log(`📤 Querying Supabase for ${table} with userid: ${userDbId}`);
        const startTime = Date.now();

        try {
            let query = client
                .from(table)
                .select('*')
                .eq('userid', userDbId);

            if (table === 'applications') {
                query = query.order('dateApplied', {ascending: false});
                query = query.limit(50);
            } else if (table === 'user_sessions') {
                query = query.order('startTime', {ascending: false});
                query = query.limit(100);
            } else if (table === 'analytics_events') {
                query = query.order('timestamp', {ascending: false});
                query = query.limit(100);
            } else {
                query = query.order('createdAt', {ascending: false});
                query = query.limit(100);
            }

            const {data, error} = await Promise.race([
                query,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Query timeout after ${QUERY_TIMEOUT}ms`)), QUERY_TIMEOUT)
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
// BACKGROUND SYNC UTILITIES
// ============================================================================

class BackgroundSyncManager {
    private static instance: BackgroundSyncManager;
    private syncInProgress = new Set<string>();
    private lastSyncTime = new Map<string, number>();

    static getInstance(): BackgroundSyncManager {
        if (!BackgroundSyncManager.instance) {
            BackgroundSyncManager.instance = new BackgroundSyncManager();
        }
        return BackgroundSyncManager.instance;
    }

    async backgroundSync(table: string): Promise<void> {
        if (this.syncInProgress.has(table)) {
            console.log(`⏳ Background sync for ${table} already in progress`);
            return;
        }

        const lastSync = this.lastSyncTime.get(table) || 0;
        const timeSinceLastSync = Date.now() - lastSync;
        if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
            console.log(`⏱️ Too soon for ${table} sync (${Math.round(timeSinceLastSync / 1000)}s ago)`);
            return;
        }

        this.syncInProgress.add(table);
        this.lastSyncTime.set(table, Date.now());

        try {
            console.log(`🔄 Starting background sync for ${table}`);
            const cloudData = await syncFromCloud(table);

            if (cloudData && cloudData.length > 0) {
                dataCache.set(table, cloudData);

                if (table === 'applications') {
                    const mappedApps = mapApplicationsData(cloudData);
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


}

const backgroundSyncManager = BackgroundSyncManager.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const mapApplicationsData = (cloudApps: any[]): Application[] => {
    return cloudApps
        .filter(app => app && app.id)
        .map(app => ({
            id: String(app.id),
            company: app.company || '-',
            position: app.position || '-',
            dateApplied: app.dateApplied || new Date().toISOString().split('T')[0],
            status: app.status || 'Applied',
            type: app.type || 'Remote',
            employmentType: app.employmentType || '-',
            location: app.location || '-',
            salary: app.salary || '-',
            jobSource: app.jobSource || '-',
            jobUrl: app.jobUrl || '-',
            notes: app.notes || '-',
            attachments: Array.isArray(app.attachments) ? app.attachments : [],
            createdAt: app.createdAt || new Date().toISOString(),
            updatedAt: app.updatedAt || new Date().toISOString()
        }))
        .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
};

// ============================================================================
// DATABASE SERVICE IMPLEMENTATION
// ============================================================================

export const databaseService: DatabaseService = {
    // ============================================================================
    // APPLICATION METHODS
    // ============================================================================

    async getApplications(): Promise<Application[]> {
        try {
            console.log('🔄 getApplications() called');

            const cacheKey = 'applications';
            const cachedApps = dataCache.get<Application[]>(cacheKey);
            if (cachedApps) {
                console.log('📋 Using cached applications data');

                if (isAuthenticated() && isOnlineWithSupabase()) {
                    backgroundSyncManager.backgroundSync('applications').catch(err =>
                        console.warn('Background sync failed:', err)
                    );
                }

                return cachedApps;
            }

            const localApps = await db.applications.orderBy('dateApplied').reverse().toArray();
            console.log('📱 Local applications count:', localApps.length);

            const sortedLocalApps = localApps.sort((a, b) =>
                new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
            );

            dataCache.set(cacheKey, sortedLocalApps);

            const isAuth = isAuthenticated();
            if (!isAuth || !isOnlineWithSupabase()) {
                console.log('📱 Using local data only (offline or not authenticated)');
                return sortedLocalApps;
            }

            if (localApps.length === 0) {
                console.log('☁️ No local data - performing initial cloud sync...');

                try {
                    const cloudApps = await syncFromCloud('applications');
                    if (cloudApps && cloudApps.length > 0) {
                        const mappedApps = mapApplicationsData(cloudApps);

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

    async addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const id = generateId();

            const dateApplied = app.dateApplied.includes('T') ?
                app.dateApplied.split('T')[0] :
                app.dateApplied;

            const newApp: Application = {
                ...app,
                id,
                dateApplied,
                createdAt: now,
                updatedAt: now
            };

            await db.applications.add(newApp);
            dataCache.invalidate('applications');

            if (isAuthenticated()) {
                syncToCloud('applications', newApp, 'insert').catch(err =>
                    console.warn('Cloud sync failed:', err)
                );
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

    async deleteApplication(id: string): Promise<void> {
        try {
            await db.applications.delete(id);
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

    async deleteApplications(ids: string[]): Promise<void> {
        try {
            await db.applications.bulkDelete(ids);
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
            // Local import — Dexie handles large arrays well
            await db.applications.bulkAdd(applications);

            // Invalidate local cache immediately
            dataCache.invalidate('applications');

            // Cloud sync (only if signed in): ONE request per chunk
            if (isAuthenticated() && applications.length) {
                for (let i = 0; i < applications.length; i += IMPORT_BATCH_SIZE) {
                    const batch = applications.slice(i, i + IMPORT_BATCH_SIZE);

                    // shape the payload array once per chunk
                    const payloadArray = batch.map(app => ({
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
                    }));

                    // 👇 ONE network call per chunk instead of N calls
                    await syncToCloud('applications', payloadArray, 'insert')
                        .catch(err => console.warn('Cloud batch sync failed:', err));

                    // gentle pause between chunks to avoid 429s
                    await sleep(120);
                }
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

            dataCache.clear();

            if (isOnlineWithSupabase()) {
                try {
                    const client = initializeSupabase()!;
                    const userDbId = await getUserDbId();

                    if (userDbId) {
                        await Promise.all([
                            client.from('applications').delete().eq('userid', userDbId),
                            client.from('goals').delete().eq('userid', userDbId),
                            client.from('analytics_events').delete().eq('userid', userDbId),
                            client.from('user_sessions').delete().eq('userid', userDbId),
                            client.from('user_metrics').delete().eq('userid', userDbId),
                            client.from('feedback').delete().eq('userid', userDbId),
                            client.from('privacy_settings').delete().eq('userid', userDbId)
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

    async forceRefreshApplications(): Promise<Application[]> {
        console.log('🔄 Force refreshing applications...');
        dataCache.invalidate('applications');
        return await this.getApplications();
    },

    getCacheStatus(): { [key: string]: boolean } {
        return {
            applications: dataCache.has('applications'),
            goals: dataCache.has('goals')
        };
    },

    clearCache(): void {
        dataCache.clear();
        console.log('🗑️ All cache cleared manually');
    },

    invalidateCache(key: string): void {
        dataCache.invalidate(key);
        console.log(`🗑️ Cache invalidated for: ${key}`);
    },

    // ============================================================================
    // GOALS METHODS
    // ============================================================================

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
                            userid: userDbId,
                            totalGoal: Number(goals.totalGoal),
                            weeklyGoal: Number(goals.weeklyGoal),
                            monthlyGoal: Number(goals.monthlyGoal),
                            createdAt: goals.createdAt,
                            updatedAt: goals.updatedAt
                        }, {
                            onConflict: 'userid'
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

    // ============================================================================
    // BACKUP METHODS
    // ============================================================================

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

            dataCache.clear();
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error('Failed to restore from backup');
        }
    },

    // ============================================================================
    // ANALYTICS METHODS
    // ============================================================================

    async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        try {
            await db.analyticsEvents.add(event as any);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId) {
                    syncToCloud('analytics_events', {
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
                    syncToCloud('user_sessions', {
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
                        userid: userDbId,
                        sessions_count: Number(updated.sessionsCount) || 0,        // was sessionsCount
                        total_time_spent: Number(updated.totalTimeSpent) || 0,    // was totalTimeSpent
                        applications_created: Number(updated.applicationsCreated) || 0,    // was applicationsCreated
                        applications_updated: Number(updated.applicationsUpdated) || 0,    // was applicationsUpdated
                        applications_deleted: Number(updated.applicationsDeleted) || 0,    // was applicationsDeleted
                        goals_set: Number(updated.goalsSet) || 0,                 // was goalsSet
                        attachments_added: Number(updated.attachmentsAdded) || 0, // was attachmentsAdded
                        exports_performed: Number(updated.exportsPerformed) || 0, // was exportsPerformed
                        imports_performed: Number(updated.importsPerformed) || 0, // was importsPerformed
                        searches_performed: Number(updated.searchesPerformed) || 0, // was searchesPerformed
                        features_used: updated.featuresUsed || [],
                        last_active_date: updated.lastActiveDate || new Date().toISOString(),    // was lastActiveDate
                        first_visit: updated.firstVisit || new Date().toISOString(),
                        device_type: updated.deviceType || 'desktop',             // was deviceType
                        browser_version: navigator.userAgent || 'unknown',        // was browserVersion
                        screen_resolution: `${window.screen.width}x${window.screen.height}`,   // was screenResolution
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: navigator.language || 'en',
                        total_events: Number(updated.totalEvents) || 0,           // was totalEvents
                        applications_count: Number(updated.applicationsCreated) || 0,  // was applicationsCount
                        session_duration: Number(updated.totalTimeSpent) || 0,    // was sessionDuration
                        created_at: updated.firstVisit || new Date().toISOString(),     // was createdAt
                        updated_at: new Date().toISOString()                      // was updatedAt
                                            }, {
                            onConflict: 'userid'
                        });
                        console.log('✅ User metrics synced to cloud');
                }
            }
        } catch (error) {
            console.error('Failed to update user metrics:', error);
            throw new Error('Failed to update user metrics');
        }
    },

    // ============================================================================
    // FEEDBACK METHODS
    // ============================================================================

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

    // ============================================================================
    // PRIVACY SETTINGS METHODS
    // ============================================================================

    async savePrivacySettings(settings: PrivacySettings): Promise<void> {
        try {
            const settingsWithId = {id: 'default', ...settings};
            await db.privacySettings.put(settingsWithId);

            if (isAuthenticated()) {
                const userDbId = await getUserDbId();
                if (userDbId && userDbId !== 1) { // Skip if userDbId is 1 (likely test/default value)
                    const client = initializeSupabase()!;
                    await client.from('privacy_settings').upsert({
                        userid: userDbId,
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
                        onConflict: 'userid'
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
                    if (userDbId && userDbId !== 1) { // Skip if userDbId is 1 (likely test/default value)
                        const client = initializeSupabase()!;
                        // Debug: Log the userDbId being used
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Attempting to fetch privacy settings for userDbId:', userDbId);
                        }
                        
                        const {data, error} = await client
                            .from('privacy_settings')
                            .select('*')
                            .eq('userid', userDbId)
                            .maybeSingle();

                        if (error) {
                            if (error.code === 'PGRST116') {
                                // No privacy settings found - this is normal for new users
                                if (process.env.NODE_ENV === 'development') {
                                    console.log('No privacy settings found for user (normal for new users)');
                                }
                            } else if (error.code === 'PGRST301' || error.message?.includes('406')) {
                                // Handle 406 Not Acceptable error gracefully
                                if (process.env.NODE_ENV === 'development') {
                                    console.log('Privacy settings table not accessible (406 error) - skipping');
                                }
                            } else {
                                console.error('Error fetching privacy settings:', error);
                            }
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

    // ============================================================================
    // ADMIN ANALYTICS METHODS
    // ============================================================================

    async getAdminAnalytics(): Promise<AdminAnalytics> {
        try {
            const applications = await this.getApplications();
            const analytics = await this.getAnalyticsEvents();
            const userMetrics = await this.getUserMetrics();
            const sessions = await db.userSessions.toArray();

            const totalUsers = sessions.length > 0 ? 1 : 0;
            const totalApplications = applications.length;
            // Removed unused totalEvents variable
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
                recentFeedback: stats.recentFeedback || [],
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

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    async getApplicationsByDateRange(startDate: Date, endDate: Date): Promise<Application[]> {
        try {
            const applications = await this.getApplications();
            return applications.filter(app => {
                const appDate = new Date(app.dateApplied);
                return appDate >= startDate && appDate <= endDate;
            });
        } catch (error) {
            console.error('Failed to get applications by date range:', error);
            return [];
        }
    },

    async getApplicationsByStatus(status: string): Promise<Application[]> {
        try {
            return await db.applications.where('status').equals(status).toArray();
        } catch (error) {
            console.error('Failed to get applications by status:', error);
            return [];
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
    },
    

    // Enhanced import with progress tracking and memory management
    async importApplicationsWithProgress(
        applications: Application[],
        onProgress?: (progress: {
            stage: 'local-import' | 'cloud-sync' | 'complete';
            current: number;
            total: number;
            percentage: number;
            message: string;
        }) => void
    ): Promise<void> {
        try {
            const total = applications.length;
            
            // Stage 1: Local import with progress
            onProgress?.({
                stage: 'local-import',
                current: 0,
                total,
                percentage: 0,
                message: 'Importing to local database...'
            });

            // Use Dexie's bulkAdd for efficient local storage
            // Handle duplicates gracefully by either skipping or generating new IDs
            try {
                await db.applications.bulkAdd(applications);
                console.log(`✅ Successfully imported ${applications.length} applications`);
                
                onProgress?.({
                    stage: 'local-import',
                    current: total,
                    total,
                    percentage: 100,
                    message: 'Local import complete'
                });
                
            } catch (bulkError) {
                console.warn('Bulk import failed due to duplicates, trying individual import...');
                
                // If bulkAdd fails due to duplicates, try individual import with duplicate handling
                let successCount = 0;
                let duplicateCount = 0;
                let errorCount = 0;
                
                for (let i = 0; i < applications.length; i++) {
                    try {
                        const app = applications[i];
                        
                        // Check if application already exists
                        const existingApp = await db.applications.get(app.id);
                        
                        if (existingApp) {
                            // Skip duplicate or update existing
                            duplicateCount++;
                            console.log(`⚠️ Skipping duplicate: ${app.company} - ${app.position}`);
                        } else {
                            // Add new application
                            await db.applications.add(app);
                            successCount++;
                        }
                        
                        // Update progress every 10 applications
                        if (i % 10 === 0) {
                            onProgress?.({
                                stage: 'local-import',
                                current: i + 1,
                                total,
                                percentage: Math.round(((i + 1) / total) * 100),
                                message: `Processing applications... ${i + 1}/${total}`
                            });
                        }
                        
                    } catch (error) {
                        errorCount++;
                        console.error(`Failed to import application ${i + 1}:`, error);
                    }
                }
                
                console.log(`📊 Import summary: ${successCount} added, ${duplicateCount} duplicates, ${errorCount} errors`);
                
                // Update progress to reflect actual results
                onProgress?.({
                    stage: 'local-import',
                    current: total,
                    total,
                    percentage: 100,
                    message: `Import complete: ${successCount} added, ${duplicateCount} duplicates`
                });
                
                // If no applications were added, throw an error
                if (successCount === 0) {
                    throw new Error(`No new applications were imported. ${duplicateCount} duplicates found, ${errorCount} errors.`);
                }
            }

            // Invalidate local cache immediately
            dataCache.invalidate('applications');

            // Stage 2: Cloud sync (only if signed in) with optimized batching
            if (isAuthenticated() && applications.length) {
                onProgress?.({
                    stage: 'cloud-sync',
                    current: 0,
                    total,
                    percentage: 0,
                    message: 'Syncing to cloud...'
                });

                // Optimize batch size based on application count
                const optimalBatchSize = applications.length > 500 ? 25 : IMPORT_BATCH_SIZE;
                let syncedCount = 0;

                for (let i = 0; i < applications.length; i += optimalBatchSize) {
                    const batch = applications.slice(i, i + optimalBatchSize);

                    // Shape the payload array once per chunk
                    const payloadArray = batch.map(app => ({
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
                    }));

                    try {
                        // Sync batch to cloud
                        await syncToCloud('applications', payloadArray, 'insert');
                        syncedCount += batch.length;

                        // Update progress
                        onProgress?.({
                            stage: 'cloud-sync',
                            current: syncedCount,
                            total,
                            percentage: Math.round((syncedCount / total) * 100),
                            message: `Synced ${syncedCount} of ${total} applications...`
                        });

                    } catch (err) {
                        console.warn('Cloud batch sync failed:', err);
                        // Continue with next batch instead of failing entire import
                    }

                    // Adaptive delay based on batch size and application count
                    const delay = applications.length > 1000 ? 50 : 120;
                    await sleep(delay);

                    // Allow UI to update every few batches
                    if (i % (optimalBatchSize * 4) === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                onProgress?.({
                    stage: 'cloud-sync',
                    current: total,
                    total,
                    percentage: 100,
                    message: 'Cloud sync complete'
                });
            }

            // Stage 3: Complete
            onProgress?.({
                stage: 'complete',
                current: total,
                total,
                percentage: 100,
                message: `Successfully imported ${total} applications`
            });

            // Memory cleanup
            await this.cleanupAfterLargeImport();

        } catch (error) {
            console.error('Failed to import applications:', error);
            throw new Error('Failed to import applications');
        }
    },

    // Memory cleanup after large imports
    async cleanupAfterLargeImport(): Promise<void> {
        try {
            // Clear caches to free memory
            dataCache.clear();
            
            // Force garbage collection if available (Chrome/Node.js)
            if (global.gc) {
                global.gc();
            }
            
            // Clear any temporary data
            if (typeof window !== 'undefined' && 'caches' in window) {
                // Clear service worker caches if they exist
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
            }
            
            console.log('🧹 Memory cleanup completed after large import');
        } catch (error) {
            console.warn('Memory cleanup failed:', error);
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
// UTILITY & DEBUGGING FUNCTIONS
// ============================================================================

export const forceSessionRefresh = async () => {
    const client = initializeSupabase();
    if (!client) return false;

    try {
        const {error} = await client.auth.refreshSession();
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
            const {data, error} = await client.auth.getSession();
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

        console.log('🔐 2. Testing authentication...');
        const {data: {session}, error: authError} = await client.auth.getSession();
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

        console.log('👤 3. Testing user DB ID...');
        const userDbId = await getUserDbId();
        if (!userDbId) {
            console.error('❌ No user DB ID found');
            console.log('This means the user record might not exist in the users table');
            return;
        }
        console.log('✅ User DB ID found:', userDbId);

        console.log('📋 4. Testing applications table access...');
        try {
            const {data: testQuery, error: tableError} = await client
                .from('applications')
                .select('*')
                .eq('userid', userDbId)
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

        console.log('🎉 Debug complete! Check the logs above for issues.');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }

    console.groupEnd();
};

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

export const compareLocalAndCloudData = async () => {
    console.group('📊 LOCAL VS CLOUD DATA COMPARISON');

    try {
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

export const testDatabaseConnection = async () => {
    console.group('🔧 TESTING DATABASE CONNECTION');

    try {
        const url = process.env.REACT_APP_SUPABASE_URL;
        const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

        console.log('Environment Variables:');
        console.log('- URL:', url ? '✅ Set' : '❌ Missing');
        console.log('- Key:', key ? '✅ Set' : '❌ Missing');

        if (!url || !key) {
            console.error('❌ Environment variables not set properly');
            console.log('Create .env.local with:');
            console.log('REACT_APP_SUPABASE_URL=your_url');
            console.log('REACT_APP_SUPABASE_ANON_KEY=your_key');
            return false;
        }

        const client = initializeSupabase();
        if (!client) {
            console.error('❌ Failed to initialize Supabase client');
            return false;
        }
        console.log('✅ Supabase client initialized');

        const {data: {session}, error: authError} = await client.auth.getSession();
        if (authError) {
            console.error('❌ Auth error:', authError);
            return false;
        }

        if (!session?.user) {
            console.log('⚠️ No authenticated user - sign in first');
            return false;
        }
        console.log('✅ User authenticated:', session.user.email);

        const userDbId = await getUserDbId();
        if (!userDbId) {
            console.error('❌ No user DB ID found');
            return false;
        }
        console.log('✅ User DB ID:', userDbId);

        const {count, error} = await client
            .from('applications')
            .select('*', {count: 'exact', head: true})
            .eq('userid', userDbId);

        if (error) {
            console.error('Table access error:', error);
            handleDatabaseError(error, 'SELECT', 'applications');
            return false;
        }

        console.log('Database connection working!');
        console.log('Current applications count:', count || 0);

        return true;

    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    } finally {
        console.groupEnd();
    }
};

// ============================================================================
// AUTO-BACKUP FUNCTIONALITY
// ============================================================================

export const setupAutoBackup = () => {
    const backupInterval = setInterval(async () => {
        try {
            await databaseService.createBackup();
            console.log('Auto-backup created successfully');
        } catch (error) {
            console.error('Auto-backup failed:', error);
        }
    }, 3600000); // 1 hour

    const handleBeforeUnload = async () => {
        try {
            await databaseService.createBackup();
        } catch (error) {
            console.error('Backup on unload failed:', error);
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    databaseService.createBackup().catch(console.error);

    return () => {
        clearInterval(backupInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
};

// ============================================================================
// EXPORTS
// ============================================================================

export const authService = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
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
    forceRefreshApplications: async () => {
        console.log('🔄 Force refreshing applications...');
        dataCache.invalidate('applications');
        return await databaseService.getApplications();
    }
};

// Export recovery utils from separate file (keep this file as-is)
export {recoveryUtils} from './recoveryUtils';

// Export the database instance for direct access if needed
export {db};

export default databaseService;