// src/utils/adminAuth.ts - Production Ready Admin Authentication
import type {AdminSession} from '../types';
import {createClient} from '@supabase/supabase-js';

// Enhanced interfaces for better type safety
interface AdminVerificationCache {
    [userId: string]: {
        isAdmin: boolean;
        timestamp: number;
        email: string;
        lastValidated: number;
        attempts: number;
    };
}

interface AdminHealthStatus {
    supabaseConnected: boolean;
    databaseAccessible: boolean;
    adminVerificationWorking: boolean;
    cacheHitRate: number;
    errorCount: number;
    lastHealthCheck: number;
}

interface LoginAttempt {
    timestamp: number;
    success: boolean;
    userAgent?: string;
    ipHash?: string;
}

interface AuditLogEntry {
    timestamp: string;
    userId: string;
    action: string;
    details?: any;
    sessionId: string;
    userAgent?: string;
    success: boolean;
}

interface SessionData extends AdminSession {
    createdAt: string;
    expiresAt: string;
    version: string;
    userAgent: string;
    lastActivity: string;
}

// Enhanced cache management
const adminCache: AdminVerificationCache = {};
const healthStatus: AdminHealthStatus = {
    supabaseConnected: false,
    databaseAccessible: false,
    adminVerificationWorking: false,
    cacheHitRate: 0,
    errorCount: 0,
    lastHealthCheck: 0
};

// Constants with better organization
const CACHE_CONFIG = {
    DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_ENTRIES: 100,
    CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
    VALIDATION_INTERVAL: 2 * 60 * 1000 // 2 minutes
} as const;

const SECURITY_CONFIG = {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000,
    SESSION_TIMEOUT: 30 * 60 * 1000,
    REFRESH_THRESHOLD: 5 * 60 * 1000,
    PASSWORD_MIN_LENGTH: 8,
    SESSION_ID_LENGTH: 32,
    QUERY_TIMEOUT: 10000
} as const;

// Enhanced admin configuration
export const ADMIN_CONFIG = {
    SESSION: {
        timeout: SECURITY_CONFIG.SESSION_TIMEOUT,
        refreshThreshold: SECURITY_CONFIG.REFRESH_THRESHOLD,
        maxAttempts: SECURITY_CONFIG.MAX_ATTEMPTS,
        lockoutDuration: SECURITY_CONFIG.LOCKOUT_DURATION,
        storageKey: 'applytrak_admin_session'
    },

    SECURITY: {
        minPasswordLength: SECURITY_CONFIG.PASSWORD_MIN_LENGTH,
        requireSpecialChars: false,
        hashIterations: 1000,
        sessionIdLength: SECURITY_CONFIG.SESSION_ID_LENGTH
    },

    ADMIN_EMAILS: [
        'applytrak@gmail.com',
        'krishnasathvikm@gmail.com'
    ],

    PERMISSIONS: {
        readonly: ['view_analytics', 'view_feedback'] as string[],
        standard: ['view_analytics', 'view_feedback', 'export_data'] as string[],
        full: ['view_analytics', 'view_feedback', 'export_data', 'manage_settings', 'delete_data'] as string[]
    }
} as const;

// Enhanced Supabase client management
let adminSupabaseClient: any = null;
let clientInitialized = false;
// Removed unused lastConnectionTest variable

const getSupabaseClient = () => {
    if (!adminSupabaseClient && !clientInitialized) {
        try {
            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
            const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                console.warn('Supabase configuration missing');
                clientInitialized = true;
                return null;
            }

            adminSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                },
                db: {
                    schema: 'public'
                }
            });

            clientInitialized = true;
            healthStatus.supabaseConnected = true;
            console.log('Supabase client initialized successfully');
        } catch (error) {
            console.error('Supabase client initialization failed:', error);
            clientInitialized = true;
            healthStatus.supabaseConnected = false;
        }
    }
    return adminSupabaseClient;
};

// Enhanced cache management
const getCachedAdminStatus = (userId: string, email: string): boolean | null => {
    const cached = adminCache[userId];
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_CONFIG.DURATION;
    if (isExpired) {
        delete adminCache[userId];
        return null;
    }

    // Security check: verify email matches
    if (cached.email !== email) {
        delete adminCache[userId];
        return null;
    }

    // Update last accessed time
    cached.lastValidated = Date.now();
    return cached.isAdmin;
};

const setCachedAdminStatus = (userId: string, email: string, isAdmin: boolean): void => {
    try {
        // Cleanup cache if it's getting too large
        if (Object.keys(adminCache).length >= CACHE_CONFIG.MAX_ENTRIES) {
            cleanupExpiredCacheEntries();
        }

        adminCache[userId] = {
            isAdmin,
            timestamp: Date.now(),
            email,
            lastValidated: Date.now(),
            attempts: (adminCache[userId]?.attempts || 0) + 1
        };

        // Update cache hit rate
        updateCacheHitRate();
    } catch (error) {
        console.warn('Failed to update admin cache:', error);
    }
};

const cleanupExpiredCacheEntries = (): void => {
    try {
        const now = Date.now();
        const expiredKeys = Object.keys(adminCache).filter(
            key => now - adminCache[key].timestamp > CACHE_CONFIG.DURATION
        );

        expiredKeys.forEach(key => delete adminCache[key]);
        console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    } catch (error) {
        console.warn('Cache cleanup failed:', error);
    }
};

const updateCacheHitRate = (): void => {
    try {
        const totalEntries = Object.keys(adminCache).length;
        const validEntries = Object.values(adminCache).filter(
            entry => Date.now() - entry.timestamp < CACHE_CONFIG.DURATION
        ).length;

        healthStatus.cacheHitRate = totalEntries > 0 ? Math.round((validEntries / totalEntries) * 100) : 0;
    } catch (error) {
        console.warn('Cache hit rate calculation failed:', error);
    }
};

// Enhanced email-based admin check
export const isAdminByEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') {
        console.log('❌ Admin check failed: Invalid email provided');
        return false;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAdmin = ADMIN_CONFIG.ADMIN_EMAILS.map(adminEmail =>
        adminEmail.toLowerCase().trim()
    ).includes(normalizedEmail);
    
    console.log(`🔐 Admin check for ${normalizedEmail}: ${isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);
    console.log(`📋 Authorized admin emails: ${ADMIN_CONFIG.ADMIN_EMAILS.join(', ')}`);
    
    return isAdmin;
};

// Enhanced database admin verification with comprehensive fallbacks
export const verifyDatabaseAdminWithFallback = async (
    authUserId: string,
    userEmail?: string
): Promise<boolean> => {
    const startTime = Date.now();

    try {
        // Input validation
        if (!authUserId || typeof authUserId !== 'string') {
            console.warn('Invalid auth user ID provided');
            return false;
        }

        // Check cache first
        if (userEmail) {
            const cachedResult = getCachedAdminStatus(authUserId, userEmail);
            if (cachedResult !== null) {
                console.log('Admin status retrieved from cache:', cachedResult);
                return cachedResult;
            }
        }

        // Primary email-based check (fastest and most reliable)
        if (userEmail && isAdminByEmail(userEmail)) {
            console.log('Admin verified by email:', userEmail);
            setCachedAdminStatus(authUserId, userEmail, true);
            return true;
        }

        // Database lookup with enhanced error handling
        const client = getSupabaseClient();
        if (!client) {
            console.warn('Supabase client not available');
            healthStatus.databaseAccessible = false;
            return userEmail ? isAdminByEmail(userEmail) : false;
        }

        console.log('Performing database admin check for user:', authUserId);

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), SECURITY_CONFIG.QUERY_TIMEOUT)
        );

        // Primary query by external_id
        const queryPromise = client
            .from('users')
                    .select('id, externalid, email, adminpermissions, display_name')
        .eq('externalid', authUserId)
            .maybeSingle(); // Use maybeSingle to handle no results gracefully

        const {data: user, error} = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
            console.warn('Database admin check failed:', error.message);
            healthStatus.databaseAccessible = false;
            healthStatus.errorCount++;

            // Enhanced fallback: try email lookup if provided
            if (error.code === 'PGRST116' && userEmail) {
                console.log('Attempting email-based user lookup...');

                try {
                    const emailQueryPromise = client
                        .from('users')
                        .select('id, externalid, email, adminpermissions, display_name')
                        .eq('email', userEmail)
                        .maybeSingle();

                    const {data: emailUser, error: emailError} = await Promise.race([
                        emailQueryPromise,
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Email lookup timeout')), 5000)
                        )
                    ]);

                    if (!emailError && emailUser) {
                        console.log('User found by email, updating external_id mapping...');

                                // Update externalid mapping
        const {error: updateError} = await client
            .from('users')
            .update({externalid: authUserId})
                            .eq('id', emailUser.id);

                        if (updateError) {
                            console.warn('Failed to update external_id:', updateError.message);
                        }

                        // Check if user is admin by email (since we can't select isadmin column)
                        const isAdmin = isAdminByEmail(emailUser.email);
                        if (userEmail) {
                            setCachedAdminStatus(authUserId, userEmail, isAdmin);
                        }

                        console.log(`Database admin check via email for ${emailUser.email}: ${isAdmin}`);
                        return isAdmin;
                    }
                } catch (emailLookupError) {
                    console.warn('Email lookup failed:', emailLookupError);
                    healthStatus.errorCount++;
                }
            }

            // Final email fallback
            if (userEmail && isAdminByEmail(userEmail)) {
                console.log('Admin verified by email fallback:', userEmail);
                setCachedAdminStatus(authUserId, userEmail, true);
                return true;
            }

            return false;
        }

        // Successful database query
        healthStatus.databaseAccessible = true;

        if (!user) {
            console.log('User not found in database');

            // Email fallback for new users
            if (userEmail && isAdminByEmail(userEmail)) {
                console.log('Admin verified by email (user not in DB):', userEmail);
                setCachedAdminStatus(authUserId, userEmail, true);
                return true;
            }

            return false;
        }

        // Check if user is admin by email (since we can't select isadmin column)
        const isAdmin = isAdminByEmail(user.email);

        // Cache the result
        if (userEmail || user.email) {
            const email = userEmail || user.email;
            setCachedAdminStatus(authUserId, email, isAdmin);
        }

        const duration = Date.now() - startTime;
        console.log(`Database admin check completed in ${duration}ms for ${user.email}: ${isAdmin}`);

        return isAdmin;

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Admin verification failed after ${duration}ms:`, error);
        healthStatus.errorCount++;

        // Final email-based fallback
        if (userEmail && isAdminByEmail(userEmail)) {
            console.log('Admin verified by email (error fallback):', userEmail);
            setCachedAdminStatus(authUserId, userEmail, true);
            return true;
        }

        return false;
    }
};

// Simplified database admin verification (email-only for reliability)
export const verifyDatabaseAdmin = async (authUserId: string, userEmail?: string): Promise<boolean> => {
    try {
        console.log('🔐 ADMIN VERIFICATION START');
        console.log('📧 User email:', userEmail);
        console.log('🆔 Auth user ID:', authUserId);
        console.log('📋 Authorized admin emails:', ADMIN_CONFIG.ADMIN_EMAILS);

        // Primary email-based verification
        if (userEmail && isAdminByEmail(userEmail)) {
            console.log('✅ ADMIN VERIFIED - User has admin privileges');
            return true;
        }

        console.log('❌ ADMIN DENIED - User does not have admin privileges');
        console.log('📧 User email not in admin list:', userEmail);
        return false;
    } catch (error) {
        console.error('❌ Admin verification error:', error);
        return false;
    }
};

// Enhanced admin authentication
export const authenticateAdmin = async (email: string, password: string): Promise<{
    success: boolean;
    session?: AdminSession;
    error?: string;
}> => {
    const startTime = Date.now();

    try {
        // Input validation
        if (!email || !password) {
            return {
                success: false,
                error: 'Email and password are required'
            };
        }

        if (password.length < ADMIN_CONFIG.SECURITY.minPasswordLength) {
            return {
                success: false,
                error: 'Password too short'
            };
        }

        // Check rate limiting
        if (isLoginRateLimited(email)) {
            const remainingTime = getRemainingLockoutTime(email);
            return {
                success: false,
                error: `Too many failed attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`
            };
        }

        const client = getSupabaseClient();
        if (!client) {
            return {
                success: false,
                error: 'Authentication system not available'
            };
        }

        console.log('Attempting admin authentication for:', email);

        // Authenticate with Supabase
        const {data: authData, error: authError} = await client.auth.signInWithPassword({
            email: email.trim(),
            password
        });

        if (authError) {
            console.error('Supabase authentication failed:', authError.message);
            trackLoginAttempt(email, false);

            return {
                success: false,
                error: getHumanReadableAuthError(authError.message)
            };
        }

        if (!authData.user) {
            trackLoginAttempt(email, false);
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        console.log('Supabase authentication successful, verifying admin status...');

        // Verify admin status
        const isAdmin = await verifyDatabaseAdmin(authData.user.id, authData.user.email || '');

        if (!isAdmin) {
            console.log('User authenticated but not admin - signing out');

            // Sign out non-admin user
            await client.auth.signOut();
            trackLoginAttempt(email, false);

            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Create and save admin session
        const session = createAdminSession(authData.user);
        saveAdminSession(session);

        // Clear failed attempts on success
        clearLoginAttempts(email);
        trackLoginAttempt(email, true);

        // Log successful authentication
        logAdminAction(session, 'admin_login', {
            email: authData.user.email,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
        });

        console.log('Admin authentication successful');
        return {
            success: true,
            session
        };

    } catch (error) {
        console.error('Admin authentication error:', error);
        trackLoginAttempt(email, false);

        return {
            success: false,
            error: 'Authentication system error'
        };
    }
};

// Enhanced current admin verification
export const verifyCurrentAdmin = async (): Promise<boolean> => {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return false;
        }

        const {data: {user}, error} = await client.auth.getUser();

        if (error) {
            console.warn('Failed to get current user:', error.message);
            return false;
        }

        if (!user || !user.email) {
            console.log('No authenticated user found');
            return false;
        }

        console.log('Verifying admin status for current user:', user.email);

        // Use email-based verification for reliability
        const isAdmin = isAdminByEmail(user.email);

        // Update health status
        healthStatus.adminVerificationWorking = true;
        healthStatus.lastHealthCheck = Date.now();

        return isAdmin;
    } catch (error) {
        console.error('Current admin verification failed:', error);
        healthStatus.adminVerificationWorking = false;
        healthStatus.errorCount++;
        return false;
    }
};

// Enhanced session management
export const generateSessionId = (): string => {
    try {
        // Use crypto.getRandomValues for better security if available
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            const randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
            return `admin_${randomHex}_${Date.now().toString(36)}`;
        }
    } catch (error) {
        console.warn('Crypto random failed, using fallback:', error);
    }

    // Fallback to Math.random
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let sessionId = '';

    for (let i = 0; i < ADMIN_CONFIG.SECURITY.sessionIdLength; i++) {
        sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `admin_${sessionId}_${Date.now().toString(36)}`;
};

export const createAdminSession = (user: any): AdminSession => {
    return {
        authenticated: true,
        lastLogin: new Date().toISOString(),
        sessionTimeout: ADMIN_CONFIG.SESSION.timeout,
        userId: user.id
    };
};

export const getPermissionLevel = (email: string): 'readonly' | 'standard' | 'full' => {
    if (!email) return 'readonly';

    const normalizedEmail = email.toLowerCase().trim();

    // Primary admin gets full access
    if (normalizedEmail === 'applytrak@gmail.com') {
        return 'full';
    }

    // Other admin emails get standard access
    if (ADMIN_CONFIG.ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
        return 'standard';
    }

    return 'readonly';
};

// Enhanced session storage with encryption-like encoding
export const saveAdminSession = (session: AdminSession): void => {
    try {
        cleanupExpiredSessions();

        const sessionData: SessionData = {
            ...session,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ADMIN_CONFIG.SESSION.timeout).toISOString(),
            version: '1.1',
            userAgent: navigator.userAgent.substring(0, 100),
            lastActivity: new Date().toISOString()
        };

        // Simple encoding for basic security
        const encodedSession = btoa(JSON.stringify(sessionData));

        localStorage.setItem(ADMIN_CONFIG.SESSION.storageKey, encodedSession);
        console.log('Admin session saved with enhanced security');
    } catch (error) {
        console.error('Failed to save admin session:', error);

        // Cleanup on error
        try {
            localStorage.removeItem(ADMIN_CONFIG.SESSION.storageKey);
        } catch (clearError) {
            console.error('Failed to clear corrupted session:', clearError);
        }
    }
};

const cleanupExpiredSessions = (): void => {
    try {
        const sessionKeys = [
            ADMIN_CONFIG.SESSION.storageKey,
            'admin_session',
            'applytrak_admin_session'
        ];

        sessionKeys.forEach(key => {
            try {
                const sessionData = localStorage.getItem(key);
                if (sessionData) {
                    let session;
                    try {
                        // Try to decode if it's encoded
                        session = JSON.parse(atob(sessionData));
                    } catch {
                        // Fallback to direct parsing
                        session = JSON.parse(sessionData);
                    }

                    if (isSessionExpired(session)) {
                        localStorage.removeItem(key);
                        console.log(`Cleaned up expired session: ${key}`);
                    }
                }
            } catch (error) {
                localStorage.removeItem(key);
                console.log(`Cleaned up corrupted session: ${key}`);
            }
        });
    } catch (error) {
        console.error('Session cleanup failed:', error);
    }
};

export const loadAdminSession = (): AdminSession | null => {
    try {
        const sessionData = localStorage.getItem(ADMIN_CONFIG.SESSION.storageKey);

        if (!sessionData) {
            return null;
        }

        let session;
        try {
            // Try to decode if encoded
            session = JSON.parse(atob(sessionData));
        } catch {
            // Fallback to direct parsing for backwards compatibility
            session = JSON.parse(sessionData);
        }

        if (isSessionExpired(session)) {
            clearAdminSession();
            return null;
        }

        // Update last activity
        if (session.version === '1.1') {
            session.lastActivity = new Date().toISOString();
            saveAdminSession({
                authenticated: session.authenticated,
                lastLogin: session.lastLogin,
                sessionTimeout: session.sessionTimeout,
                userId: session.userId
            });
        }

        return {
            authenticated: session.authenticated,
            lastLogin: session.lastLogin,
            sessionTimeout: session.sessionTimeout,
            userId: session.userId
        };
    } catch (error) {
        console.error('Failed to load admin session:', error);
        clearAdminSession();
        return null;
    }
};

export const clearAdminSession = (): void => {
    try {
        localStorage.removeItem(ADMIN_CONFIG.SESSION.storageKey);
        console.log('Admin session cleared');
    } catch (error) {
        console.error('Failed to clear admin session:', error);
    }
};

export const isSessionExpired = (session: any): boolean => {
    if (!session || !session.expiresAt) {
        return true;
    }

    try {
        const expirationTime = new Date(session.expiresAt).getTime();
        const currentTime = Date.now();
        return currentTime >= expirationTime;
    } catch {
        return true;
    }
};

export const shouldRefreshSession = (session: any): boolean => {
    if (!session || !session.expiresAt) {
        return false;
    }

    try {
        const expirationTime = new Date(session.expiresAt).getTime();
        const currentTime = Date.now();
        const timeRemaining = expirationTime - currentTime;
        return timeRemaining <= ADMIN_CONFIG.SESSION.refreshThreshold;
    } catch {
        return false;
    }
};

export const refreshAdminSession = async (): Promise<boolean> => {
    try {
        const currentSession = loadAdminSession();

        if (!currentSession || isSessionExpired(currentSession)) {
            return false;
        }

        const isStillAdmin = await verifyCurrentAdmin();
        if (!isStillAdmin) {
            clearAdminSession();
            const client = getSupabaseClient();
            if (client) {
                await client.auth.signOut();
            }
            return false;
        }

        const newSession = {
            ...currentSession,
            lastLogin: new Date().toISOString()
        };

        saveAdminSession(newSession);
        console.log('Admin session refreshed');
        return true;
    } catch (error) {
        console.error('Failed to refresh admin session:', error);
        return false;
    }
};

// Enhanced rate limiting
export const trackLoginAttempt = (email: string, success: boolean): void => {
    try {
        const key = `admin_attempts_${btoa(email.toLowerCase())}`;
        const attempts: LoginAttempt[] = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();

        const newAttempt: LoginAttempt = {
            timestamp: now,
            success,
            userAgent: navigator.userAgent.substring(0, 50)
        };

        attempts.push(newAttempt);

        // Keep only recent attempts
        const recentAttempts = attempts.filter(
            attempt => now - attempt.timestamp < ADMIN_CONFIG.SESSION.lockoutDuration
        );

        localStorage.setItem(key, JSON.stringify(recentAttempts));
    } catch (error) {
        console.error('Failed to track login attempt:', error);
    }
};

export const isLoginRateLimited = (email: string): boolean => {
    try {
        const key = `admin_attempts_${btoa(email.toLowerCase())}`;
        const attempts: LoginAttempt[] = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();

        const recentFailedAttempts = attempts.filter(
            attempt =>
                !attempt.success &&
                (now - attempt.timestamp) < ADMIN_CONFIG.SESSION.lockoutDuration
        );

        return recentFailedAttempts.length >= ADMIN_CONFIG.SESSION.maxAttempts;
    } catch (error) {
        console.error('Failed to check rate limiting:', error);
        return false;
    }
};

const getRemainingLockoutTime = (email: string): number => {
    try {
        const key = `admin_attempts_${btoa(email.toLowerCase())}`;
        const attempts: LoginAttempt[] = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();

        const failedAttempts = attempts.filter(attempt => !attempt.success);
        if (failedAttempts.length === 0) return 0;

        const oldestFailedAttempt = Math.min(...failedAttempts.map(a => a.timestamp));
        const lockoutEndTime = oldestFailedAttempt + ADMIN_CONFIG.SESSION.lockoutDuration;

        return Math.max(0, lockoutEndTime - now);
    } catch {
        return 0;
    }
};

export const clearLoginAttempts = (email: string): void => {
    try {
        const key = `admin_attempts_${btoa(email.toLowerCase())}`;
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to clear login attempts:', error);
    }
};

// Enhanced error handling
const getHumanReadableAuthError = (errorMessage: string): string => {
    const errorMap: Record<string, string> = {
        'Invalid login credentials': 'Invalid email or password',
        'Email not confirmed': 'Please verify your email address',
        'Too many requests': 'Too many attempts. Please try again later.',
        'User not found': 'Invalid email or password',
        'Invalid email': 'Please enter a valid email address'
    };

    return errorMap[errorMessage] || 'Authentication failed. Please try again.';
};

// Enhanced permissions and audit
export const hasPermission = (session: AdminSession | null, permission: string): boolean => {
    if (!session || !session.authenticated) {
        return false;
    }

    return ADMIN_CONFIG.PERMISSIONS.full.includes(permission);
};

export const getPermissions = (session: AdminSession | null): string[] => {
    if (!session || !session.authenticated) {
        return [];
    }

    return [...ADMIN_CONFIG.PERMISSIONS.full];
};

export const canPerformAction = (session: AdminSession | null, action: string): boolean => {
    return hasPermission(session, action);
};

export const logAdminAction = (
    session: AdminSession | null,
    action: string,
    details?: any
): void => {
    if (!session) return;

    try {
        const logEntry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            userId: session.userId || 'unknown',
            action,
            details,
            sessionId: generateSessionId(),
            userAgent: navigator.userAgent.substring(0, 100),
            success: true
        };

        const existingLogs: AuditLogEntry[] = JSON.parse(
            localStorage.getItem('admin_audit_logs') || '[]'
        );

        existingLogs.push(logEntry);

        // Maintain log size limit
        if (existingLogs.length > 1000) {
            existingLogs.splice(0, existingLogs.length - 1000);
        }

        localStorage.setItem('admin_audit_logs', JSON.stringify(existingLogs));
        console.log('Admin action logged:', action);
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
};

export const getAuditLogs = (limit?: number): AuditLogEntry[] => {
    try {
        const logs: AuditLogEntry[] = JSON.parse(
            localStorage.getItem('admin_audit_logs') || '[]'
        );
        return limit ? logs.slice(-limit) : logs;
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return [];
    }
};

export const clearAuditLogs = (): void => {
    try {
        localStorage.removeItem('admin_audit_logs');
        console.log('Audit logs cleared');
    } catch (error) {
        console.error('Failed to clear audit logs:', error);
    }
};

// Enhanced utilities
export const formatRemainingTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return '0:00';

    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const isDevelopmentMode = (): boolean => {
    return process.env.NODE_ENV === 'development';
};

export const getSessionStatus = async (): Promise<{
    authenticated: boolean;
    timeRemaining?: number;
    needsRefresh: boolean;
    isExpired: boolean;
    isValidAdmin: boolean;
}> => {
    const session = loadAdminSession();

    if (!session) {
        return {
            authenticated: false,
            needsRefresh: false,
            isExpired: true,
            isValidAdmin: false
        };
    }

    let sessionData;
    try {
        const rawData = localStorage.getItem(ADMIN_CONFIG.SESSION.storageKey);
        if (rawData) {
            try {
                sessionData = JSON.parse(atob(rawData));
            } catch {
                sessionData = JSON.parse(rawData);
            }
        } else {
            sessionData = {};
        }
    } catch {
        sessionData = {};
    }

    const isExpired = isSessionExpired(sessionData);
    const needsRefresh = shouldRefreshSession(sessionData);
    const isValidAdmin = await verifyCurrentAdmin();

    let timeRemaining: number | undefined;
    if (sessionData.expiresAt) {
        timeRemaining = Math.max(0, new Date(sessionData.expiresAt).getTime() - Date.now());
    }

    return {
        authenticated: session.authenticated && !isExpired && isValidAdmin,
        ...(timeRemaining !== undefined && { timeRemaining }),
        needsRefresh,
        isExpired,
        isValidAdmin
    };
};

// Enhanced admin health monitoring
export const getAdminHealthStatus = async (): Promise<AdminHealthStatus> => {
    const startTime = Date.now();

    try {
        // Test Supabase connection
        const client = getSupabaseClient();
        healthStatus.supabaseConnected = !!client;

        if (client) {
            // Test database access
            try {
                await client.from('users').select('count').limit(1);
                healthStatus.databaseAccessible = true;
            } catch (dbError) {
                healthStatus.databaseAccessible = false;
                healthStatus.errorCount++;
            }

            // Test admin verification
            try {
                await verifyCurrentAdmin();
                healthStatus.adminVerificationWorking = true;
            } catch (adminError) {
                healthStatus.adminVerificationWorking = false;
                healthStatus.errorCount++;
            }
        }

        // Update cache hit rate
        updateCacheHitRate();

        healthStatus.lastHealthCheck = Date.now();

        const duration = Date.now() - startTime;
        console.log(`Admin health check completed in ${duration}ms`);

        return {...healthStatus};
    } catch (error) {
        console.error('Health check failed:', error);
        healthStatus.errorCount++;
        return {...healthStatus};
    }
};

// Enhanced admin logout
export const adminLogout = async (): Promise<void> => {
    try {
        const session = loadAdminSession();

        // Log logout action
        if (session) {
            logAdminAction(session, 'admin_logout', {
                timestamp: new Date().toISOString()
            });
        }

        clearAdminSession();

        const client = getSupabaseClient();
        if (client) {
            await client.auth.signOut();
        }

        console.log('Admin logged out successfully');
    } catch (error) {
        console.error('Admin logout error:', error);
        clearAdminSession();
    }
};

export const validateAdminCredentials = async (email: string, password: string): Promise<boolean> => {
    const result = await authenticateAdmin(email, password);
    return result.success;
};

// Initialize cache cleanup interval
if (typeof window !== 'undefined') {
    setInterval(() => {
        cleanupExpiredCacheEntries();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
}

// Export comprehensive utilities
export const adminAuthUtils = {
    // Core verification functions
    verifyDatabaseAdmin,
    verifyDatabaseAdminWithFallback,
    authenticateAdmin,
    verifyCurrentAdmin,
    adminLogout,
    isAdminByEmail,

    // Session management
    generateSessionId,
    createAdminSession,
    saveAdminSession,
    loadAdminSession,
    clearAdminSession,
    isSessionExpired,
    shouldRefreshSession,
    refreshAdminSession,

    // Security and validation
    validateAdminCredentials,
    getPermissionLevel,

    // Rate limiting
    trackLoginAttempt,
    isLoginRateLimited,
    clearLoginAttempts,

    // Permissions
    hasPermission,
    getPermissions,
    canPerformAction,

    // Audit logging
    logAdminAction,
    getAuditLogs,
    clearAuditLogs,

    // Utilities
    formatRemainingTime,
    isDevelopmentMode,
    getSessionStatus,
    getAdminHealthStatus
};

export default adminAuthUtils;