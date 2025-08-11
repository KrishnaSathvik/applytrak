// src/utils/adminAuth.ts - FIXED FOR YOUR DATABASE SCHEMA
import type {AdminSession} from '../types';
import {createClient} from '@supabase/supabase-js';
import {useAppStore} from '../store/useAppStore';

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

    // Admin emails (database-verified admin users)
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

// ============================================================================
// DATABASE ADMIN VERIFICATION - FIXED FOR YOUR SCHEMA
// ============================================================================

/**
 * Verify if user is admin in database - UPDATED FOR YOUR SCHEMA
 */
export const verifyDatabaseAdmin = async (userEmail: string): Promise<boolean> => {
    try {
        const client = getSupabaseClient();
        if (!client) {
            console.error('❌ Supabase not configured');
            return false;
        }

        // FIXED: Query by email directly since that's your schema
        const { data: user, error } = await client
            .from('users')
            .select('is_admin, email, admin_permissions')
            .eq('email', userEmail)
            .single();

        if (error) {
            console.error('❌ Error checking admin status:', error);
            return false;
        }

        if (!user) {
            console.log('❌ User not found in database');
            return false;
        }

        const isAdmin = user.is_admin === true;
        console.log(`🔐 Admin check for ${user.email}: ${isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);

        if (isAdmin) {
            console.log(`🔑 Admin permissions: ${user.admin_permissions || 'none'}`);
        }

        return isAdmin;
    } catch (error) {
        console.error('❌ Database admin verification failed:', error);
        return false;
    }
};

/**
 * Authenticate admin using database verification - UPDATED FOR YOUR SCHEMA
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

        // First, authenticate with Supabase
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('❌ Authentication failed:', authError.message);
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

        // FIXED: Verify admin status using email instead of auth_user_id
        const isAdmin = await verifyDatabaseAdmin(authData.user.email || '');

        if (!isAdmin) {
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
 * Verify current user is admin - UPDATED FOR YOUR SCHEMA
 */
export const verifyCurrentAdmin = async (): Promise<boolean> => {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return false;
        }

        const { data: { user } } = await client.auth.getUser();

        if (!user || !user.email) {
            return false;
        }

        // FIXED: Use email to verify admin status
        return await verifyDatabaseAdmin(user.email);
    } catch (error) {
        console.error('❌ Current admin verification failed:', error);
        return false;
    }
};

// ============================================================================
// SESSION MANAGEMENT (ENHANCED)
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
 * Create new admin session (enhanced with user info)
 */
export const createAdminSession = (user: any): AdminSession => {
    return {
        authenticated: true,
        lastLogin: new Date().toISOString(),
        sessionTimeout: ADMIN_CONFIG.SESSION.timeout,
        userId: user.id,
        // Note: email and permissions are stored in session data but not in AdminSession interface
    };
};

/**
 * Get permission level based on email (database admin)
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
        const sessionData = {
            ...session,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ADMIN_CONFIG.SESSION.timeout).toISOString(),
            // Store additional user info in session data (not in AdminSession interface)
            email: session.userId ? 'admin@applytrak.com' : undefined,
            permissions: 'full'
        };

        localStorage.setItem(
            ADMIN_CONFIG.SESSION.storageKey,
            JSON.stringify(sessionData)
        );

        console.log('✅ Admin session saved');
    } catch (error) {
        console.error('❌ Failed to save admin session:', error);
    }
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
        clearAdminSession(); // Clear corrupted session
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
// SECURITY & VALIDATION (ENHANCED)
// ============================================================================

/**
 * Validate admin credentials (now uses database verification)
 */
export const validateAdminCredentials = async (email: string, password: string): Promise<boolean> => {
    const result = await authenticateAdmin(email, password);
    return result.success;
};

/**
 * Admin logout (enhanced with Supabase signout)
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
        // Still clear session even if Supabase signout fails
        clearAdminSession();
    }
};

// ============================================================================
// RATE LIMITING (EXISTING FUNCTIONALITY PRESERVED)
// ============================================================================

/**
 * Track login attempts for rate limiting
 */
export const trackLoginAttempt = (email: string, success: boolean): void => {
    try {
        const key = `admin_attempts_${email}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();

        // Add this attempt
        attempts.push({ timestamp: now, success });

        // Clean old attempts (older than lockout duration)
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

        // Count failed attempts in lockout period
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
// PERMISSIONS & AUDIT (ENHANCED)
// ============================================================================

/**
 * Check if user has specific permission
 */
export const hasPermission = (session: AdminSession | null, permission: string): boolean => {
    if (!session || !session.authenticated) {
        return false;
    }

    // For now, all authenticated admin sessions have full permissions
    // This can be enhanced later with role-based permissions
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

    // For now, all authenticated admin sessions have full permissions
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
            email: 'admin@applytrak.com', // Default admin email since not stored in session
            action,
            details,
            sessionId: generateSessionId()
        };

        const existingLogs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
        existingLogs.push(logEntry);

        // Keep only last 1000 entries
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
// UTILITIES (ENHANCED)
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
// EXPORT ADMIN AUTH UTILITIES (ENHANCED)
// ============================================================================

export const adminAuthUtils = {
    // Database Admin Verification (UPDATED FOR YOUR SCHEMA)
    verifyDatabaseAdmin,
    authenticateAdmin,
    verifyCurrentAdmin,
    adminLogout,

    // Session Management (ENHANCED)
    generateSessionId,
    createAdminSession,
    saveAdminSession,
    loadAdminSession,
    clearAdminSession,
    isSessionExpired,
    shouldRefreshSession,
    refreshAdminSession,

    // Security & Validation (ENHANCED)
    validateAdminCredentials,
    getPermissionLevel,

    // Rate Limiting (PRESERVED)
    trackLoginAttempt,
    isLoginRateLimited,
    clearLoginAttempts,

    // Permissions (ENHANCED)
    hasPermission,
    getPermissions,
    canPerformAction,

    // Audit Logging (ENHANCED)
    logAdminAction,
    getAuditLogs,
    clearAuditLogs,

    // Utilities (ENHANCED)
    formatRemainingTime,
    isDevelopmentMode,
    getSessionStatus
};

export default adminAuthUtils;