// src/utils/adminAuth.ts - Admin Authentication and Session Management
import type {AdminSession} from '../types';

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

    // Admin passwords (in production, these should be environment variables)
    PASSWORDS: {
        primary: 'applytrak-admin-2024',     // Main admin password
        secondary: 'krishna-analytics-2024', // Secondary access
        emergency: 'applytrak-emergency-key' // Emergency access
    },

    // Permission levels
    PERMISSIONS: {
        readonly: ['view_analytics', 'view_feedback'] as string[],
        standard: ['view_analytics', 'view_feedback', 'export_data'] as string[],
        full: ['view_analytics', 'view_feedback', 'export_data', 'manage_settings', 'delete_data'] as string[]
    }
};

// ============================================================================
// SESSION MANAGEMENT
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
export const createAdminSession = (password: string): AdminSession => {
    const permissionLevel = getPermissionLevel(password);

    return {
        authenticated: true,
        lastLogin: new Date().toISOString(),
        sessionTimeout: ADMIN_CONFIG.SESSION.timeout
    };
};

/**
 * Get permission level based on password
 */
export const getPermissionLevel = (password: string): 'readonly' | 'standard' | 'full' => {
    const passwords = ADMIN_CONFIG.PASSWORDS;

    if (password === passwords.primary) {
        return 'full';
    } else if (password === passwords.secondary) {
        return 'standard';
    } else if (password === passwords.emergency) {
        return 'readonly';
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
            expiresAt: new Date(Date.now() + ADMIN_CONFIG.SESSION.timeout).toISOString()
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
            sessionTimeout: session.sessionTimeout
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
export const refreshAdminSession = (): boolean => {
    try {
        const currentSession = loadAdminSession();

        if (!currentSession || isSessionExpired(currentSession)) {
            return false;
        }

        // Create new session with extended timeout
        const refreshedSession: AdminSession = {
            ...currentSession,
            lastLogin: new Date().toISOString()
        };

        saveAdminSession(refreshedSession);
        console.log('🔄 Admin session refreshed');
        return true;
    } catch (error) {
        console.error('❌ Failed to refresh admin session:', error);
        return false;
    }
};

// ============================================================================
// PASSWORD VALIDATION AND SECURITY
// ============================================================================

/**
 * Validate admin password
 */
export const validateAdminPassword = (password: string): boolean => {
    if (!password || typeof password !== 'string') {
        return false;
    }

    // Check against all valid admin passwords
    const passwords = ADMIN_CONFIG.PASSWORDS;
    const validPasswords = [passwords.primary, passwords.secondary, passwords.emergency];
    return validPasswords.includes(password);
};

/**
 * Get password strength score
 */
export const getPasswordStrength = (password: string): {
    score: number;
    feedback: string[];
} => {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
        return {score: 0, feedback: ['Password is required']};
    }

    // Length check
    if (password.length >= ADMIN_CONFIG.SECURITY.minPasswordLength) {
        score += 25;
    } else {
        feedback.push(`Password must be at least ${ADMIN_CONFIG.SECURITY.minPasswordLength} characters`);
    }

    // Complexity checks
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    // Additional length bonus
    if (password.length >= 12) score += 15;

    // Feedback based on score
    if (score < 40) {
        feedback.push('Password is weak');
    } else if (score < 70) {
        feedback.push('Password is moderate');
    } else {
        feedback.push('Password is strong');
    }

    return {score: Math.min(100, score), feedback};
};

/**
 * Simple password hash for client-side verification
 */
export const hashPassword = (password: string): string => {
    let hash = 0;

    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
};

// ============================================================================
// RATE LIMITING AND SECURITY
// ============================================================================

interface LoginAttempt {
    timestamp: number;
    ip: string;
    success: boolean;
}

/**
 * Track login attempts for rate limiting
 */
export const trackLoginAttempt = (success: boolean): void => {
    try {
        const attemptsKey = 'applytrak_admin_attempts';
        const attempts: LoginAttempt[] = JSON.parse(
            localStorage.getItem(attemptsKey) || '[]'
        );

        // Add new attempt
        attempts.push({
            timestamp: Date.now(),
            ip: 'local', // Since this is client-side, we can't get real IP
            success
        });

        // Keep only last 50 attempts and last 24 hours
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentAttempts = attempts
            .filter(attempt => attempt.timestamp > twentyFourHoursAgo)
            .slice(-50);

        localStorage.setItem(attemptsKey, JSON.stringify(recentAttempts));
    } catch (error) {
        console.error('❌ Failed to track login attempt:', error);
    }
};

/**
 * Check if admin login is rate limited
 */
export const isLoginRateLimited = (): {
    limited: boolean;
    remainingTime?: number;
    attemptsRemaining?: number;
} => {
    try {
        const attemptsKey = 'applytrak_admin_attempts';
        const attempts: LoginAttempt[] = JSON.parse(
            localStorage.getItem(attemptsKey) || '[]'
        );

        const now = Date.now();
        const lockoutPeriod = ADMIN_CONFIG.SESSION.lockoutDuration;

        // Check recent failed attempts
        const recentFailedAttempts = attempts.filter(attempt =>
            !attempt.success &&
            (now - attempt.timestamp) < lockoutPeriod
        );

        if (recentFailedAttempts.length >= ADMIN_CONFIG.SESSION.maxAttempts) {
            const oldestFailedAttempt = Math.min(
                ...recentFailedAttempts.map(a => a.timestamp)
            );
            const remainingTime = lockoutPeriod - (now - oldestFailedAttempt);

            return {
                limited: true,
                remainingTime: Math.max(0, remainingTime)
            };
        }

        return {
            limited: false,
            attemptsRemaining: ADMIN_CONFIG.SESSION.maxAttempts - recentFailedAttempts.length
        };
    } catch (error) {
        console.error('❌ Failed to check rate limit:', error);
        return {limited: false};
    }
};

/**
 * Clear all login attempts (admin override)
 */
export const clearLoginAttempts = (): void => {
    try {
        localStorage.removeItem('applytrak_admin_attempts');
        console.log('🧹 Login attempts cleared');
    } catch (error) {
        console.error('❌ Failed to clear login attempts:', error);
    }
};

// ============================================================================
// PERMISSION SYSTEM
// ============================================================================

/**
 * Check if user has specific permission
 */
export const hasPermission = (
    permission: string,
    userPermissions: string[] = ADMIN_CONFIG.PERMISSIONS.readonly
): boolean => {
    return userPermissions.includes(permission);
};

/**
 * Get all permissions for a permission level
 */
export const getPermissions = (level: keyof typeof ADMIN_CONFIG.PERMISSIONS): string[] => {
    return [...ADMIN_CONFIG.PERMISSIONS[level]];
};

/**
 * Check if admin can perform action
 */
export const canPerformAction = (
    action: string,
    session: AdminSession | null
): boolean => {
    if (!session || !session.authenticated) {
        return false;
    }

    if (isSessionExpired(session)) {
        return false;
    }

    // For now, all authenticated admins can perform all actions
    // In a more complex system, you'd check specific permissions here
    return true;
};

// ============================================================================
// AUDIT LOGGING
// ============================================================================

interface AuditLog {
    timestamp: string;
    action: string;
    details?: any;
    sessionId?: string;
}

/**
 * Log admin action for audit trail
 */
export const logAdminAction = (
    action: string,
    details?: any,
    sessionId?: string
): void => {
    try {
        const auditKey = 'applytrak_admin_audit';
        const logs: AuditLog[] = JSON.parse(
            localStorage.getItem(auditKey) || '[]'
        );

        logs.push({
            timestamp: new Date().toISOString(),
            action,
            details,
            sessionId
        });

        // Keep only last 100 audit logs
        const recentLogs = logs.slice(-100);
        localStorage.setItem(auditKey, JSON.stringify(recentLogs));

        console.log(`📝 Admin action logged: ${action}`);
    } catch (error) {
        console.error('❌ Failed to log admin action:', error);
    }
};

/**
 * Get admin audit logs
 */
export const getAuditLogs = (limit: number = 50): AuditLog[] => {
    try {
        const auditKey = 'applytrak_admin_audit';
        const logs: AuditLog[] = JSON.parse(
            localStorage.getItem(auditKey) || '[]'
        );

        return logs
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    } catch (error) {
        console.error('❌ Failed to get audit logs:', error);
        return [];
    }
};

/**
 * Clear audit logs (admin action)
 */
export const clearAuditLogs = (): void => {
    try {
        localStorage.removeItem('applytrak_admin_audit');
        console.log('🧹 Audit logs cleared');
    } catch (error) {
        console.error('❌ Failed to clear audit logs:', error);
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format remaining time for display
 */
export const formatRemainingTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return '0m';

    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
};

/**
 * Check if running in development mode
 */
export const isDevelopmentMode = (): boolean => {
    return (
        process.env.NODE_ENV === 'development' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:'
    );
};

/**
 * Get admin session status summary
 */
export const getSessionStatus = (): {
    authenticated: boolean;
    timeRemaining?: number;
    needsRefresh: boolean;
    isExpired: boolean;
} => {
    const session = loadAdminSession();

    if (!session) {
        return {
            authenticated: false,
            needsRefresh: false,
            isExpired: true
        };
    }

    const sessionData = JSON.parse(
        localStorage.getItem(ADMIN_CONFIG.SESSION.storageKey) || '{}'
    );

    const isExpired = isSessionExpired(sessionData);
    const needsRefresh = shouldRefreshSession(sessionData);

    let timeRemaining: number | undefined;
    if (sessionData.expiresAt) {
        timeRemaining = Math.max(0, new Date(sessionData.expiresAt).getTime() - Date.now());
    }

    return {
        authenticated: session.authenticated && !isExpired,
        timeRemaining,
        needsRefresh,
        isExpired
    };
};

// ============================================================================
// EXPORT ADMIN AUTH UTILITIES
// ============================================================================

export const adminAuthUtils = {
    // Session Management
    generateSessionId,
    createAdminSession,
    saveAdminSession,
    loadAdminSession,
    clearAdminSession,
    isSessionExpired,
    shouldRefreshSession,
    refreshAdminSession,

    // Password & Security
    validateAdminPassword,
    getPasswordStrength,
    hashPassword,
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