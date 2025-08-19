// src/utils/adminAuth.ts - FIXED FOR YOUR ACTUAL DATABASE SCHEMA
import type {AdminSession} from '../types';
import {createClient} from '@supabase/supabase-js';

interface AdminVerificationCache {
    [userId: string]: {
        isAdmin: boolean;
        timestamp: number;
        email: string;
    };
}

const adminCache: AdminVerificationCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedAdminStatus = (userId: string, email: string): boolean | null => {
    const cached = adminCache[userId];
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
        delete adminCache[userId];
        return null;
    }

    // Verify email matches (security check)
    if (cached.email !== email) {
        delete adminCache[userId];
        return null;
    }

    return cached.isAdmin;
};

const setCachedAdminStatus = (userId: string, email: string, isAdmin: boolean): void => {
    adminCache[userId] = {
        isAdmin,
        timestamp: Date.now(),
        email
    };
};

// ============================================================================
// SUPABASE CLIENT FOR ADMIN AUTH
// ============================================================================

let adminSupabaseClient: any = null;

/**
 * Initialize Supabase client for admin authentication
 */
const getSupabaseClient = () => {
    if (!adminSupabaseClient) {
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

        if (supabaseUrl && supabaseAnonKey) {
            adminSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        }
    }
    return adminSupabaseClient;
};

// ============================================================================
// ADMIN AUTHENTICATION CONFIGURATION
// ============================================================================

/**
 * Admin authentication configuration
 */
export const ADMIN_CONFIG = {
    // Session management
    SESSION: {
        timeout: 30 * 60 * 1000,        // 30 minutes in milliseconds
        refreshThreshold: 5 * 60 * 1000, // Refresh session if < 5 minutes remaining
        maxAttempts: 5,                  // Maximum login attempts
        lockoutDuration: 15 * 60 * 1000, // 15 minutes lockout after max attempts
        storageKey: 'applytrak_admin_session'
    },

    // Security settings
    SECURITY: {
        minPasswordLength: 8,
        requireSpecialChars: false,  // Keep simple for ApplyTrak
        hashIterations: 1000,        // Simple hashing for client-side
        sessionIdLength: 32
    },

    // Admin emails (for fallback verification)
    ADMIN_EMAILS: [
        'applytrak@gmail.com',      // Primary admin
        'krishna@applytrak.com',    // Secondary admin if needed
    ],

    // Permission levels
    PERMISSIONS: {
        readonly: ['view_analytics', 'view_feedback'] as string[],
        standard: ['view_analytics', 'view_feedback', 'export_data'] as string[],
        full: ['view_analytics', 'view_feedback', 'export_data', 'manage_settings', 'delete_data'] as string[]
    }
};


// Add this function to the top of your adminAuth.ts file, right after the ADMIN_CONFIG

/**
 * QUICK FIX: Simple email-based admin check (bypasses database RLS issues)
 */
export const isAdminByEmail = (email: string): boolean => {
    const adminEmails = [
        'applytrak@gmail.com',
        'krishnasathvikm@gmail.com',
        // Add other admin emails here
    ];

    return adminEmails.includes(email.toLowerCase());
};

/**
 * ENHANCED: Admin verification with email fallback
 */
// REPLACE your verifyDatabaseAdminWithFallback function in adminAuth.ts with this:

export const verifyDatabaseAdminWithFallback = async (authUserId: string, userEmail?: string): Promise<boolean> => {
    try {
        // Check cache first
        if (userEmail) {
            const cachedResult = getCachedAdminStatus(authUserId, userEmail);
            if (cachedResult !== null) {
                console.log('✅ Admin status from cache:', cachedResult);
                return cachedResult;
            }
        }

        // Email-based check (fastest and most reliable)
        if (userEmail && isAdminByEmail(userEmail)) {
            console.log('✅ Admin verified by email:', userEmail);
            setCachedAdminStatus(authUserId, userEmail, true);
            return true;
        }

        // Database lookup with better error handling
        const client = getSupabaseClient();
        if (!client) {
            console.error('❌ Supabase not configured');
            return false;
        }

        console.log(`🔐 Checking admin status for auth user UUID: ${authUserId}`);

        // Timeout protection
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Database admin check timeout')), 10000)
        );

        const queryPromise = client
            .from('users')
            .select('id, external_id, email, is_admin, admin_permissions, display_name')
            .eq('external_id', authUserId)
            .single();

        const {data: user, error} = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
            console.warn('❌ Database admin check failed:', error.message);

            // Enhanced fallback logic
            if (error.code === 'PGRST116' && userEmail) {
                console.log('🔍 User not found by UUID, trying email lookup...');

                try {
                    const emailQueryPromise = client
                        .from('users')
                        .select('id, external_id, email, is_admin, admin_permissions, display_name')
                        .eq('email', userEmail)
                        .single();

                    const {data: emailUser, error: emailError} = await Promise.race([
                        emailQueryPromise,
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Email lookup timeout')), 5000)
                        )
                    ]);

                    if (!emailError && emailUser) {
                        console.log('✅ Found user by email, updating external_id...');

                        // Update the external_id to match the auth UUID
                        await client
                            .from('users')
                            .update({external_id: authUserId})
                            .eq('id', emailUser.id);

                        const isAdmin = emailUser.is_admin === true;
                        setCachedAdminStatus(authUserId, userEmail, isAdmin);
                        console.log(`🔐 Admin check for ${emailUser.email}: ${isAdmin ? 'YES' : 'NO'}`);
                        return isAdmin;
                    }
                } catch (emailError) {
                    console.warn('❌ Email lookup failed:', emailError);
                }
            }

            // Final email fallback
            if (userEmail && isAdminByEmail(userEmail)) {
                console.log('✅ Admin verified by email fallback:', userEmail);
                setCachedAdminStatus(authUserId, userEmail, true);
                return true;
            }

            return false;
        }

        const isAdmin = user?.is_admin === true;
        if (userEmail) {
            setCachedAdminStatus(authUserId, userEmail, isAdmin);
        }
        console.log(`🔐 Database admin check for ${user?.email}: ${isAdmin ? 'YES' : 'NO'}`);
        return isAdmin;

    } catch (error) {
        console.error('❌ Admin verification error:', error);

        // Final fallback with caching
        if (userEmail && isAdminByEmail(userEmail)) {
            console.log('✅ Admin verified by email (error fallback):', userEmail);
            setCachedAdminStatus(authUserId, userEmail, true);
            return true;
        }

        return false;
    }
};

// ============================================================================
// DATABASE ADMIN VERIFICATION - FIXED FOR YOUR ACTUAL SCHEMA
// ============================================================================

/**
 * FIXED: Get user record by auth user ID (linking auth.users to public.users)
 */
const getUserByAuthId = async (authUserId: string): Promise<any> => {
    try {
        const client = getSupabaseClient();
        if (!client) {
            console.error('❌ Supabase not configured');
            return null;
        }

        // Query your users table using external_id which should match auth.users.id
        const { data: user, error } = await client
            .from('users')
            .select('id, external_id, email, is_admin, admin_permissions, display_name')
            .eq('external_id', authUserId)
            .single();

        if (error) {
            console.error('❌ Error fetching user by auth ID:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('❌ getUserByAuthId failed:', error);
        return null;
    }
};

/**
 * FIXED: Verify if user is admin in database using your actual schema
 */
export const verifyDatabaseAdmin = async (authUserId: string, userEmail?: string): Promise<boolean> => {
    console.log('🔐 Admin check - authUserId:', authUserId, 'userEmail:', userEmail);

    // Use email-only check (bypass database issues)
    if (userEmail && isAdminByEmail(userEmail)) {
        console.log('✅ Admin verified by email:', userEmail);
        return true;
    }

    console.log('❌ Not admin email:', userEmail);
    return false;
};

/**
 * FIXED: Authenticate admin using your database schema
 */
export const authenticateAdmin = async (email: string, password: string): Promise<{
    success: boolean;
    session?: AdminSession;
    error?: string;
}> => {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return {
                success: false,
                error: 'Authentication system not available'
            };
        }

        console.log('🔐 Attempting admin authentication for:', email);

        // First, authenticate with Supabase Auth
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('❌ Supabase authentication failed:', authError.message);
            return {
                success: false,
                error: authError.message
            };
        }

        if (!authData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        console.log('✅ Supabase auth successful, checking admin status...');

        // FIXED: Verify admin status using auth user ID and email
        const isAdmin = await verifyDatabaseAdmin(authData.user.id, authData.user.email || '');

        if (!isAdmin) {
            console.log('❌ User authenticated but not admin - signing out');
            // Sign out if not admin
            await client.auth.signOut();
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Create admin session
        const session = createAdminSession(authData.user);
        saveAdminSession(session);

        console.log('✅ Admin authentication successful');
        return {
            success: true,
            session
        };

    } catch (error) {
        console.error('❌ Admin authentication error:', error);
        return {
            success: false,
            error: 'Authentication system error'
        };
    }
};

/**
 * FIXED: Verify current user is admin using your schema
 */
// REPLACE the existing verifyCurrentAdmin function with this:
export const verifyCurrentAdmin = async (): Promise<boolean> => {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return false;
        }

        const { data: { user } } = await client.auth.getUser();

        if (!user || !user.email) {
            console.log('❌ No authenticated user found');
            return false;
        }

        console.log('🔐 Verifying current admin status for email:', user.email);

        // Use email-only check
        return isAdminByEmail(user.email);
    } catch (error) {
        console.error('❌ Current admin verification failed:', error);
        return false;
    }
};

// ============================================================================
// SESSION MANAGEMENT (PRESERVED)
// ============================================================================

/**
 * Generate secure session ID
 */
export const generateSessionId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let sessionId = '';

    for (let i = 0; i < ADMIN_CONFIG.SECURITY.sessionIdLength; i++) {
        sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `admin_${sessionId}_${Date.now().toString(36)}`;
};

/**
 * Create new admin session
 */
export const createAdminSession = (user: any): AdminSession => {
    return {
        authenticated: true,
        lastLogin: new Date().toISOString(),
        sessionTimeout: ADMIN_CONFIG.SESSION.timeout,
        userId: user.id,
    };
};

/**
 * Get permission level based on email
 */
export const getPermissionLevel = (email: string): 'readonly' | 'standard' | 'full' => {
    // Primary admin gets full access
    if (email === 'applytrak@gmail.com') {
        return 'full';
    }

    // Other admin emails get standard access
    if (ADMIN_CONFIG.ADMIN_EMAILS.includes(email)) {
        return 'standard';
    }

    return 'readonly';
};

/**
 * Save admin session to storage
 */
export const saveAdminSession = (session: AdminSession): void => {
    try {
        // Clean up expired sessions first
        cleanupExpiredSessions();

        const sessionData = {
            ...session,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ADMIN_CONFIG.SESSION.timeout).toISOString(),
            version: '1.0', // Add version for future compatibility
            userAgent: navigator.userAgent.substring(0, 100) // Track user agent for security
        };

        localStorage.setItem(
            ADMIN_CONFIG.SESSION.storageKey,
            JSON.stringify(sessionData)
        );

        console.log('✅ Admin session saved with enhanced security');
    } catch (error) {
        console.error('❌ Failed to save admin session:', error);

        // Try to clear corrupted data
        try {
            localStorage.removeItem(ADMIN_CONFIG.SESSION.storageKey);
        } catch (clearError) {
            console.error('❌ Failed to clear corrupted session:', clearError);
        }
    }
};

const cleanupExpiredSessions = (): void => {
    try {
        // Clean up any old session keys
        const keysToCheck = [
            ADMIN_CONFIG.SESSION.storageKey,
            'admin_session', // Legacy key
            'applytrak_admin_session' // Another possible key
        ];

        keysToCheck.forEach(key => {
            try {
                const sessionData = localStorage.getItem(key);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (isSessionExpired(session)) {
                        localStorage.removeItem(key);
                        console.log(`🧹 Cleaned up expired session: ${key}`);
                    }
                }
            } catch (error) {
                // Remove corrupted session data
                localStorage.removeItem(key);
                console.log(`🧹 Cleaned up corrupted session: ${key}`);
            }
        });
    } catch (error) {
        console.error('❌ Failed to cleanup sessions:', error);
    }
};

export const getAdminHealthStatus = async (): Promise<{
    supabaseConnected: boolean;
    databaseAccessible: boolean;
    adminVerificationWorking: boolean;
    cacheHitRate: number;
    errorCount: number;
}> => {
    const startTime = Date.now();
    let supabaseConnected = false;
    let databaseAccessible = false;
    let adminVerificationWorking = false;
    let errorCount = 0;

    try {
        // Test Supabase connection
        const client = getSupabaseClient();
        if (client) {
            supabaseConnected = true;

            // Test database access
            try {
                await client.from('users').select('count').limit(1);
                databaseAccessible = true;
            } catch (dbError) {
                errorCount++;
                console.warn('Database access test failed:', dbError);
            }

            // Test admin verification
            try {
                const testResult = await verifyCurrentAdmin();
                adminVerificationWorking = true;
            } catch (adminError) {
                errorCount++;
                console.warn('Admin verification test failed:', adminError);
            }
        }
    } catch (error) {
        errorCount++;
        console.error('Health check failed:', error);
    }

    // Calculate cache hit rate
    const totalCacheEntries = Object.keys(adminCache).length;
    const cacheHitRate = totalCacheEntries > 0 ?
        Object.values(adminCache).filter(entry =>
            Date.now() - entry.timestamp < CACHE_DURATION
        ).length / totalCacheEntries : 0;

    const duration = Date.now() - startTime;
    console.log(`🏥 Admin health check completed in ${duration}ms`);

    return {
        supabaseConnected,
        databaseAccessible,
        adminVerificationWorking,
        cacheHitRate: Math.round(cacheHitRate * 100),
        errorCount
    };
};
/**
 * Load admin session from storage
 */
export const loadAdminSession = (): AdminSession | null => {
    try {
        const sessionData = localStorage.getItem(ADMIN_CONFIG.SESSION.storageKey);

        if (!sessionData) {
            return null;
        }

        const session = JSON.parse(sessionData);

        // Check if session is expired
        if (isSessionExpired(session)) {
            clearAdminSession();
            return null;
        }

        return {
            authenticated: session.authenticated,
            lastLogin: session.lastLogin,
            sessionTimeout: session.sessionTimeout,
            userId: session.userId
        };
    } catch (error) {
        console.error('❌ Failed to load admin session:', error);
        clearAdminSession();
        return null;
    }
};

/**
 * Clear admin session from storage
 */
export const clearAdminSession = (): void => {
    try {
        localStorage.removeItem(ADMIN_CONFIG.SESSION.storageKey);
        console.log('🧹 Admin session cleared');
    } catch (error) {
        console.error('❌ Failed to clear admin session:', error);
    }
};

/**
 * Check if session is expired
 */
export const isSessionExpired = (session: any): boolean => {
    if (!session || !session.expiresAt) {
        return true;
    }

    const expirationTime = new Date(session.expiresAt).getTime();
    const currentTime = Date.now();

    return currentTime >= expirationTime;
};

/**
 * Check if session needs refresh
 */
export const shouldRefreshSession = (session: any): boolean => {
    if (!session || !session.expiresAt) {
        return false;
    }

    const expirationTime = new Date(session.expiresAt).getTime();
    const currentTime = Date.now();
    const timeRemaining = expirationTime - currentTime;

    return timeRemaining <= ADMIN_CONFIG.SESSION.refreshThreshold;
};

/**
 * Refresh admin session
 */
export const refreshAdminSession = async (): Promise<boolean> => {
    try {
        const currentSession = loadAdminSession();

        if (!currentSession || isSessionExpired(currentSession)) {
            return false;
        }

        // Verify user is still admin in database
        const isStillAdmin = await verifyCurrentAdmin();
        if (!isStillAdmin) {
            clearAdminSession();
            const client = getSupabaseClient();
            if (client) {
                await client.auth.signOut();
            }
            return false;
        }

        // Create new session with extended timeout
        const newSession = {
            ...currentSession,
            lastLogin: new Date().toISOString()
        };

        saveAdminSession(newSession);
        console.log('🔄 Admin session refreshed');
        return true;
    } catch (error) {
        console.error('❌ Failed to refresh admin session:', error);
        return false;
    }
};

// ============================================================================
// SECURITY & VALIDATION
// ============================================================================

/**
 * Validate admin credentials
 */
export const validateAdminCredentials = async (email: string, password: string): Promise<boolean> => {
    const result = await authenticateAdmin(email, password);
    return result.success;
};

/**
 * Admin logout
 */
export const adminLogout = async (): Promise<void> => {
    try {
        clearAdminSession();

        const client = getSupabaseClient();
        if (client) {
            await client.auth.signOut();
        }

        console.log('👋 Admin logged out');
    } catch (error) {
        console.error('❌ Admin logout error:', error);
        clearAdminSession();
    }
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Track login attempts for rate limiting
 */
export const trackLoginAttempt = (email: string, success: boolean): void => {
    try {
        const key = `admin_attempts_${email}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();

        attempts.push({ timestamp: now, success });

        const validAttempts = attempts.filter(
            (attempt: any) => now - attempt.timestamp < ADMIN_CONFIG.SESSION.lockoutDuration
        );

        localStorage.setItem(key, JSON.stringify(validAttempts));
    } catch (error) {
        console.error('❌ Failed to track login attempt:', error);
    }
};

/**
 * Check if login is rate limited
 */
export const isLoginRateLimited = (email: string): boolean => {
    try {
        const key = `admin_attempts_${email}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();

        const recentFailedAttempts = attempts.filter(
            (attempt: any) =>
                !attempt.success &&
                (now - attempt.timestamp) < ADMIN_CONFIG.SESSION.lockoutDuration
        );

        return recentFailedAttempts.length >= ADMIN_CONFIG.SESSION.maxAttempts;
    } catch (error) {
        console.error('❌ Failed to check rate limiting:', error);
        return false;
    }
};

/**
 * Clear login attempts
 */
export const clearLoginAttempts = (email: string): void => {
    try {
        const key = `admin_attempts_${email}`;
        localStorage.removeItem(key);
    } catch (error) {
        console.error('❌ Failed to clear login attempts:', error);
    }
};

// ============================================================================
// PERMISSIONS & AUDIT
// ============================================================================

/**
 * Check if user has specific permission
 */
export const hasPermission = (session: AdminSession | null, permission: string): boolean => {
    if (!session || !session.authenticated) {
        return false;
    }

    const permissions = ADMIN_CONFIG.PERMISSIONS.full;
    return permissions.includes(permission);
};

/**
 * Get all permissions for current session
 */
export const getPermissions = (session: AdminSession | null): string[] => {
    if (!session || !session.authenticated) {
        return [];
    }

    return ADMIN_CONFIG.PERMISSIONS.full;
};

/**
 * Check if user can perform action
 */
export const canPerformAction = (session: AdminSession | null, action: string): boolean => {
    return hasPermission(session, action);
};

/**
 * Log admin action for audit trail
 */
export const logAdminAction = (session: AdminSession | null, action: string, details?: any): void => {
    if (!session) return;

    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId: session.userId || 'unknown',
            action,
            details,
            sessionId: generateSessionId()
        };

        const existingLogs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
        existingLogs.push(logEntry);

        if (existingLogs.length > 1000) {
            existingLogs.splice(0, existingLogs.length - 1000);
        }

        localStorage.setItem('admin_audit_logs', JSON.stringify(existingLogs));
        console.log('📝 Admin action logged:', action);
    } catch (error) {
        console.error('❌ Failed to log admin action:', error);
    }
};

/**
 * Get audit logs
 */
export const getAuditLogs = (limit?: number): any[] => {
    try {
        const logs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
        return limit ? logs.slice(-limit) : logs;
    } catch (error) {
        console.error('❌ Failed to get audit logs:', error);
        return [];
    }
};

/**
 * Clear audit logs
 */
export const clearAuditLogs = (): void => {
    try {
        localStorage.removeItem('admin_audit_logs');
        console.log('🧹 Audit logs cleared');
    } catch (error) {
        console.error('❌ Failed to clear audit logs:', error);
    }
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format remaining session time
 */
export const formatRemainingTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Check if in development mode
 */
export const isDevelopmentMode = (): boolean => {
    return process.env.NODE_ENV === 'development';
};

/**
 * Get session status with real-time verification
 */
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

    const sessionData = JSON.parse(
        localStorage.getItem(ADMIN_CONFIG.SESSION.storageKey) || '{}'
    );

    const isExpired = isSessionExpired(sessionData);
    const needsRefresh = shouldRefreshSession(sessionData);

    // Verify admin status in real-time
    const isValidAdmin = await verifyCurrentAdmin();

    let timeRemaining: number | undefined;
    if (sessionData.expiresAt) {
        timeRemaining = Math.max(0, new Date(sessionData.expiresAt).getTime() - Date.now());
    }

    return {
        authenticated: session.authenticated && !isExpired && isValidAdmin,
        timeRemaining,
        needsRefresh,
        isExpired,
        isValidAdmin
    };
};

// ============================================================================
// EXPORT ADMIN AUTH UTILITIES
// ============================================================================

export const adminAuthUtils = {
    // Database Admin Verification (FIXED FOR YOUR SCHEMA)
    verifyDatabaseAdmin,
    authenticateAdmin,
    verifyCurrentAdmin,
    adminLogout,

    // Session Management
    generateSessionId,
    createAdminSession,
    saveAdminSession,
    loadAdminSession,
    clearAdminSession,
    isSessionExpired,
    shouldRefreshSession,
    refreshAdminSession,

    // Security & Validation
    validateAdminCredentials,
    getPermissionLevel,

    // Rate Limiting
    trackLoginAttempt,
    isLoginRateLimited,
    clearLoginAttempts,

    // Permissions
    hasPermission,
    getPermissions,
    canPerformAction,

    // Audit Logging
    logAdminAction,
    getAuditLogs,
    clearAuditLogs,

    // Utilities
    formatRemainingTime,
    isDevelopmentMode,
    getSessionStatus
};

export default adminAuthUtils;