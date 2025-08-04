// src/utils/analytics.ts - Analytics Helper Functions and Event Tracking Utilities
import type {AnalyticsEvent, AnalyticsEventType, AnalyticsSettings, UserMetrics, UserSession} from '../types';

// ============================================================================
// DEVICE AND ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detect device type based on user agent and screen size
 */
export const detectDeviceType = (): 'mobile' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isMobileScreen = window.innerWidth <= 768;

    return isMobileUA || isMobileScreen ? 'mobile' : 'desktop';
};

/**
 * Get comprehensive browser and system information
 */
export const getBrowserInfo = () => {
    if (typeof window === 'undefined') {
        return {
            userAgent: 'unknown',
            language: 'en',
            timezone: 'UTC',
            screenResolution: 'unknown',
            deviceType: 'desktop' as const,
            platform: 'unknown',
            cookieEnabled: false,
            onlineStatus: false
        };
    }

    return {
        userAgent: navigator.userAgent,
        language: navigator.language || 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        deviceType: detectDeviceType(),
        platform: navigator.platform || 'unknown',
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine
    };
};

/**
 * Generate anonymous user identifier
 */
export const generateAnonymousUserId = (): string => {
    // Create a stable but anonymous identifier
    const browserInfo = getBrowserInfo();
    const fingerprint = [
        browserInfo.screenResolution,
        browserInfo.timezone,
        browserInfo.language,
        browserInfo.platform
    ].join('|');

    // Create hash-like identifier (not for security, just for anonymity)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return `anon_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Generate unique session ID
 */
export const generateSessionId = (): string => {
    return `session_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate session duration
 */
export const calculateSessionDuration = (startTime: string, endTime?: string): number => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    return Math.max(0, end - start);
};

/**
 * Check if session is still active (within last 30 minutes)
 */
export const isSessionActive = (lastActivity: string): boolean => {
    const now = Date.now();
    const lastActivityTime = new Date(lastActivity).getTime();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

    return (now - lastActivityTime) < thirtyMinutes;
};

/**
 * Create new user session
 */
export const createUserSession = (): UserSession => {
    const browserInfo = getBrowserInfo();
    const sessionId = generateSessionId();

    return {
        id: sessionId,
        startTime: new Date().toISOString(),
        events: [],
        deviceType: browserInfo.deviceType,
        userAgent: browserInfo.userAgent,
        timezone: browserInfo.timezone,
        language: browserInfo.language
    };
};

// ============================================================================
// EVENT TRACKING UTILITIES
// ============================================================================

/**
 * Create analytics event with proper structure
 */
export const createAnalyticsEvent = (
    eventType: AnalyticsEventType,
    properties: Record<string, any> = {},
    sessionId: string,
    userId?: string
): AnalyticsEvent => {
    // Sanitize properties to ensure they're serializable
    const sanitizedProperties = sanitizeEventProperties(properties);

    return {
        event: eventType,
        properties: sanitizedProperties,
        timestamp: new Date().toISOString(),
        sessionId,
        userId
    };
};

/**
 * Sanitize event properties to ensure they're safe for storage
 */
export const sanitizeEventProperties = (properties: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
        // Skip functions, undefined, and complex objects
        if (typeof value === 'function' || value === undefined) {
            continue;
        }

        // Handle different data types
        if (value === null) {
            sanitized[key] = null;
        } else if (typeof value === 'string') {
            // Truncate long strings and remove sensitive info
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            sanitized[key] = value;
        } else if (Array.isArray(value)) {
            // Sanitize array elements
            sanitized[key] = value.slice(0, 10).map(item =>
                typeof item === 'string' ? sanitizeString(item) : item
            );
        } else if (typeof value === 'object') {
            // Handle simple objects (one level deep only)
            sanitized[key] = sanitizeSimpleObject(value);
        }
    }

    return sanitized;
};

/**
 * Sanitize string values to remove sensitive information
 */
export const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return '';

    // Truncate long strings
    const maxLength = 200;
    let sanitized = str.length > maxLength ? str.substring(0, maxLength) + '...' : str;

    // Remove potential sensitive patterns (emails, phone numbers, etc.)
    sanitized = sanitized
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
        .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[card]');

    return sanitized;
};

/**
 * Sanitize simple objects (one level deep)
 */
export const sanitizeSimpleObject = (obj: any): Record<string, any> => {
    const sanitized: Record<string, any> = {};

    if (!obj || typeof obj !== 'object') return sanitized;

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
            sanitized[key] = value;
        }
        // Skip complex nested objects
    }

    return sanitized;
};

// ============================================================================
// USER METRICS CALCULATIONS
// ============================================================================

/**
 * Calculate user engagement score based on metrics
 */
export const calculateEngagementScore = (metrics: UserMetrics): number => {
    if (!metrics) return 0;

    const weights = {
        sessions: 0.3,
        timeSpent: 0.3,
        applicationsCreated: 0.25,
        featuresUsed: 0.15
    };

    // Normalize metrics to 0-100 scale
    const normalizedSessions = Math.min(metrics.sessionsCount / 50, 1) * 100; // 50+ sessions = max
    const normalizedTime = Math.min(metrics.totalTimeSpent / (1000 * 60 * 60 * 10), 1) * 100; // 10+ hours = max
    const normalizedApps = Math.min(metrics.applicationsCreated / 100, 1) * 100; // 100+ apps = max
    const normalizedFeatures = Math.min(metrics.featuresUsed.length / 20, 1) * 100; // 20+ features = max

    const score = (
        normalizedSessions * weights.sessions +
        normalizedTime * weights.timeSpent +
        normalizedApps * weights.applicationsCreated +
        normalizedFeatures * weights.featuresUsed
    );

    return Math.round(score);
};

/**
 * Calculate average session duration
 */
export const calculateAverageSessionDuration = (sessions: UserSession[]): number => {
    if (!sessions.length) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
        return sum + (session.duration || 0);
    }, 0);

    return Math.round(totalDuration / sessions.length);
};

/**
 * Get most used features from events
 */
export const getMostUsedFeatures = (events: AnalyticsEvent[], limit: number = 10): Array<{
    feature: string,
    count: number
}> => {
    const featureUsage: Record<string, number> = {};

    events.forEach(event => {
        if (event.event === 'feature_used' && event.properties?.feature) {
            const feature = event.properties.feature as string;
            featureUsage[feature] = (featureUsage[feature] || 0) + 1;
        }
    });

    return Object.entries(featureUsage)
        .map(([feature, count]) => ({feature, count}))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

// ============================================================================
// TIME AND DATE UTILITIES
// ============================================================================

/**
 * Format duration in human-readable format
 */
export const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 1000) return '< 1s';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

/**
 * Get time period boundaries
 */
export const getTimePeriods = () => {
    const now = new Date();

    return {
        today: {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
        },
        thisWeek: {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString(),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7).toISOString()
        },
        thisMonth: {
            start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
        },
        last30Days: {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: now.toISOString()
        }
    };
};

/**
 * Check if timestamp is within period
 */
export const isWithinPeriod = (timestamp: string, period: { start: string; end: string }): boolean => {
    const time = new Date(timestamp).getTime();
    const start = new Date(period.start).getTime();
    const end = new Date(period.end).getTime();

    return time >= start && time < end;
};

// ============================================================================
// DATA AGGREGATION UTILITIES
// ============================================================================

/**
 * Group events by time period
 */
export const groupEventsByPeriod = (
    events: AnalyticsEvent[],
    period: 'hour' | 'day' | 'week' | 'month'
): Record<string, AnalyticsEvent[]> => {
    const grouped: Record<string, AnalyticsEvent[]> = {};

    events.forEach(event => {
        const date = new Date(event.timestamp);
        let key: string;

        switch (period) {
            case 'hour':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
                break;
            case 'day':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}`;
                break;
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            default:
                key = date.toISOString().split('T')[0];
        }

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(event);
    });

    return grouped;
};

/**
 * Calculate event frequency
 */
export const calculateEventFrequency = (events: AnalyticsEvent[]): Record<string, number> => {
    const frequency: Record<string, number> = {};

    events.forEach(event => {
        frequency[event.event] = (frequency[event.event] || 0) + 1;
    });

    return frequency;
};

// ============================================================================
// PRIVACY AND COMPLIANCE UTILITIES
// ============================================================================

/**
 * Check if analytics are enabled and consented
 */
export const canTrackAnalytics = (settings: AnalyticsSettings): boolean => {
    return settings.enabled && settings.consentGiven;
};

/**
 * Get allowed tracking level events
 */
export const getAllowedEvents = (trackingLevel: AnalyticsSettings['trackingLevel']): AnalyticsEventType[] => {
    const minimalEvents: AnalyticsEventType[] = [
        'session_start',
        'session_end'
    ];

    const standardEvents: AnalyticsEventType[] = [
        ...minimalEvents,
        'page_view',
        'application_created',
        'application_updated',
        'feature_used'
    ];

    const detailedEvents: AnalyticsEventType[] = [
        ...standardEvents,
        'application_deleted',
        'applications_bulk_deleted',
        'applications_status_updated',
        'applications_bulk_updated',
        'applications_bulk_imported',
        'search_performed',
        'export_data',
        'import_data',
        'goal_set',
        'goals_updated',
        'attachment_added',
        'feedback_submitted',
        'feedback_modal_opened',
        'theme_changed',
        'analytics_enabled',
        'analytics_disabled'
    ];

    switch (trackingLevel) {
        case 'minimal':
            return minimalEvents;
        case 'standard':
            return standardEvents;
        case 'detailed':
            return detailedEvents;
        default:
            return minimalEvents;
    }
};

/**
 * Filter events based on tracking level
 */
export const filterEventsByTrackingLevel = (
    events: AnalyticsEvent[],
    trackingLevel: AnalyticsSettings['trackingLevel']
): AnalyticsEvent[] => {
    const allowedEvents = getAllowedEvents(trackingLevel);
    return events.filter(event => allowedEvents.includes(event.event as AnalyticsEventType));
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function for frequent events
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

/**
 * Throttle function for performance-critical events
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export const analyticsUtils = {
    // Device & Environment
    detectDeviceType,
    getBrowserInfo,
    generateAnonymousUserId,

    // Session Management
    generateSessionId,
    calculateSessionDuration,
    isSessionActive,
    createUserSession,

    // Event Tracking
    createAnalyticsEvent,
    sanitizeEventProperties,
    sanitizeString,
    sanitizeSimpleObject,

    // User Metrics
    calculateEngagementScore,
    calculateAverageSessionDuration,
    getMostUsedFeatures,

    // Time & Date
    formatDuration,
    getTimePeriods,
    isWithinPeriod,

    // Data Aggregation
    groupEventsByPeriod,
    calculateEventFrequency,

    // Privacy & Compliance
    canTrackAnalytics,
    getAllowedEvents,
    filterEventsByTrackingLevel,

    // Performance
    debounce,
    throttle
};

export default analyticsUtils;