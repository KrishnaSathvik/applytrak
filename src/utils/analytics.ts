// src/utils/analytics.ts - Production Ready Analytics Utilities
import type {AnalyticsEvent, AnalyticsEventType, AnalyticsSettings, UserMetrics, UserSession} from '../types';

// Enhanced interfaces for better type safety
interface BrowserInfo {
    userAgent: string;
    language: string;
    timezone: string;
    screenResolution: string;
    deviceType: 'mobile' | 'desktop';
    platform: string;
    cookieEnabled: boolean;
    onlineStatus: boolean;
    viewport: string;
    colorDepth: number;
    touchSupport: boolean;
}

interface TimePeriods {
    today: { start: string; end: string };
    thisWeek: { start: string; end: string };
    thisMonth: { start: string; end: string };
    last30Days: { start: string; end: string };
    last7Days: { start: string; end: string };
    last90Days: { start: string; end: string };
}

interface EngagementWeights {
    sessions: number;
    timeSpent: number;
    applicationsCreated: number;
    featuresUsed: number;
    consistency: number;
}

// Constants
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 20;
// Removed unused FINGERPRINT_ENTROPY_THRESHOLD constant

// Enhanced PII patterns for better sanitization
const PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    phone: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    url: /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
    coordinates: /[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)/g
} as const;

// ============================================================================
// DEVICE AND ENVIRONMENT DETECTION
// ============================================================================

/**
 * Enhanced device type detection with better accuracy
 */
export const detectDeviceType = (): 'mobile' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';

    try {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
        const isTabletUA = /ipad|tablet|playbook|silk/i.test(userAgent);

        // Check screen size and touch capability
        const isMobileScreen = window.innerWidth <= 768;
        const isSmallScreen = window.innerWidth <= 480;
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // More sophisticated detection
        if (isSmallScreen || (isMobileUA && !isTabletUA)) return 'mobile';
        if (isMobileScreen && hasTouchSupport) return 'mobile';

        return 'desktop';
    } catch (error) {
        console.warn('Device detection failed:', error);
        return 'desktop';
    }
};

/**
 * Get comprehensive and secure browser information
 */
export const getBrowserInfo = (): BrowserInfo => {
    if (typeof window === 'undefined') {
        return {
            userAgent: 'server-side',
            language: 'en',
            timezone: 'UTC',
            screenResolution: 'unknown',
            deviceType: 'desktop',
            platform: 'unknown',
            cookieEnabled: false,
            onlineStatus: false,
            viewport: 'unknown',
            colorDepth: 24,
            touchSupport: false
        };
    }

    try {
        const screen = window.screen || {} as any;
        const navigator = window.navigator || {} as any;

        return {
            userAgent: sanitizeUserAgent(navigator.userAgent || 'unknown'),
            language: navigator.language || 'en',
            timezone: getTimezone(),
            screenResolution: `${screen.width || 0}x${screen.height || 0}`,
            deviceType: detectDeviceType(),
            platform: sanitizePlatform(navigator.platform || 'unknown'),
            cookieEnabled: navigator.cookieEnabled ?? false,
            onlineStatus: navigator.onLine ?? true,
            viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
            colorDepth: screen.colorDepth || 24,
            touchSupport: Boolean('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0))
        };
    } catch (error) {
        console.warn('Browser info collection failed:', error);
        return getBrowserInfo(); // Return default values
    }
};

/**
 * Safely get timezone with fallback
 */
const getTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
};

/**
 * Sanitize user agent to remove sensitive info
 */
const sanitizeUserAgent = (userAgent: string): string => {
    if (!userAgent || typeof userAgent !== 'string') return 'unknown';

    // Remove potentially identifying information while keeping browser/OS info
    return userAgent
        .replace(/\([^)]*\)/g, '()') // Remove detailed system info in parentheses
        .replace(/Version\/[\d.]+/g, 'Version/x.x')
        .substring(0, 200); // Limit length
};

/**
 * Sanitize platform information
 */
const sanitizePlatform = (platform: string): string => {
    if (!platform || typeof platform !== 'string') return 'unknown';

    // Generalize platform info
    const generalizedPlatforms: Record<string, string> = {
        'Win32': 'Windows',
        'Win64': 'Windows',
        'Windows': 'Windows',
        'MacIntel': 'macOS',
        'MacPPC': 'macOS',
        'Linux x86_64': 'Linux',
        'Linux i686': 'Linux'
    };

    return generalizedPlatforms[platform] || 'Other';
};

/**
 * Generate privacy-preserving anonymous user identifier
 */
export const generateAnonymousUserId = (): string => {
    try {
        const browserInfo = getBrowserInfo();

        // Create fingerprint with privacy considerations
        const fingerprintData = [
            browserInfo.screenResolution,
            browserInfo.timezone,
            browserInfo.language,
            browserInfo.platform,
            browserInfo.colorDepth.toString(),
            browserInfo.touchSupport.toString()
        ].join('|');

        // Add some randomness to prevent exact tracking
        const randomSalt = Math.random().toString(36).substring(2, 8);
        const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily rotation

        const combinedData = `${fingerprintData}|${randomSalt}|${timestamp}`;

        // Create hash-like identifier
        let hash = 0;
        for (let i = 0; i < combinedData.length; i++) {
            const char = combinedData.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        const anonymousId = `anon_${Math.abs(hash).toString(36)}_${Date.now().toString(36).slice(-6)}`;

        // Ensure minimum entropy
        if (anonymousId.length < 16) {
            return `${anonymousId}_${Math.random().toString(36).substring(2, 8)}`;
        }

        return anonymousId;
    } catch (error) {
        console.warn('Anonymous ID generation failed:', error);
        return `anon_fallback_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
    }
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Generate cryptographically random session ID
 */
export const generateSessionId = (): string => {
    try {
        // Use crypto.getRandomValues if available for better randomness
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            const randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
            return `session_${Date.now().toString(36)}_${randomHex.substring(0, 12)}`;
        }
    } catch (error) {
        console.warn('Crypto random failed, using fallback:', error);
    }

    // Fallback to Math.random
    const randomPart = Math.random().toString(36).substring(2, 12);
    const timePart = Date.now().toString(36);
    return `session_${timePart}_${randomPart}`;
};

/**
 * Calculate session duration with validation
 */
export const calculateSessionDuration = (startTime: string, endTime?: string): number => {
    try {
        const start = new Date(startTime).getTime();
        const end = endTime ? new Date(endTime).getTime() : Date.now();

        if (isNaN(start) || isNaN(end)) {
            console.warn('Invalid date provided for session duration calculation');
            return 0;
        }

        const duration = Math.max(0, end - start);

        // Sanity check: sessions longer than 24 hours are likely invalid
        const maxDuration = 24 * 60 * 60 * 1000; // 24 hours
        return Math.min(duration, maxDuration);
    } catch (error) {
        console.warn('Session duration calculation failed:', error);
        return 0;
    }
};

/**
 * Check if session is still active with configurable timeout
 */
export const isSessionActive = (lastActivity: string, timeout: number = SESSION_TIMEOUT): boolean => {
    try {
        const now = Date.now();
        const lastActivityTime = new Date(lastActivity).getTime();

        if (isNaN(lastActivityTime)) {
            console.warn('Invalid last activity time provided');
            return false;
        }

        return (now - lastActivityTime) < timeout;
    } catch (error) {
        console.warn('Session activity check failed:', error);
        return false;
    }
};

/**
 * Create comprehensive user session
 */
export const createUserSession = (): UserSession => {
    try {
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
    } catch (error) {
        console.error('Session creation failed:', error);

        // Return minimal fallback session
        return {
            id: `fallback_${Date.now()}`,
            startTime: new Date().toISOString(),
            events: [],
            deviceType: 'desktop',
            userAgent: 'unknown',
            timezone: 'UTC',
            language: 'en'
        };
    }
};

// ============================================================================
// EVENT TRACKING UTILITIES
// ============================================================================

/**
 * Create analytics event with enhanced validation
 */
export const createAnalyticsEvent = (
    eventType: AnalyticsEventType,
    properties: Record<string, any> = {},
    sessionId: string,
    userId?: string
): AnalyticsEvent => {
    try {
        // Validate required parameters
        if (!eventType || typeof eventType !== 'string') {
            throw new Error('Invalid event type provided');
        }

        if (!sessionId || typeof sessionId !== 'string') {
            throw new Error('Invalid session ID provided');
        }

        const sanitizedProperties = sanitizeEventProperties(properties);

        return {
            event: eventType,
            properties: sanitizedProperties,
            timestamp: new Date().toISOString(),
            sessionId,
            ...(userId && { userId })
        };
    } catch (error) {
        console.error('Event creation failed:', error);

        // Return minimal event
        return {
            event: eventType,
            properties: {},
            timestamp: new Date().toISOString(),
            sessionId: sessionId || 'unknown',
            ...(userId && { userId })
        };
    }
};

/**
 * Enhanced event properties sanitization with better security
 */
export const sanitizeEventProperties = (properties: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};

    try {
        for (const [key, value] of Object.entries(properties)) {
            // Skip invalid keys
            if (!key || typeof key !== 'string' || key.length > 100) {
                continue;
            }

            // Sanitize key name
            const sanitizedKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 50);

            // Skip functions, undefined, and symbols
            if (typeof value === 'function' || value === undefined || typeof value === 'symbol') {
                continue;
            }

            // Handle different data types
            if (value === null) {
                sanitized[sanitizedKey] = null;
            } else if (typeof value === 'string') {
                sanitized[sanitizedKey] = sanitizeString(value);
            } else if (typeof value === 'number') {
                // Check for valid numbers
                if (isFinite(value)) {
                    sanitized[sanitizedKey] = value;
                }
            } else if (typeof value === 'boolean') {
                sanitized[sanitizedKey] = value;
            } else if (Array.isArray(value)) {
                sanitized[sanitizedKey] = sanitizeArray(value);
            } else if (typeof value === 'object') {
                sanitized[sanitizedKey] = sanitizeSimpleObject(value);
            }
        }
    } catch (error) {
        console.warn('Property sanitization error:', error);
    }

    return sanitized;
};

/**
 * Enhanced string sanitization with comprehensive PII removal
 */
export const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return '';

    try {
        // Truncate long strings
        let sanitized = str.length > MAX_STRING_LENGTH
            ? str.substring(0, MAX_STRING_LENGTH) + '...'
            : str;

        // Remove PII patterns
        Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
            sanitized = sanitized.replace(pattern, `[${type}]`);
        });

        // Remove potential file paths
        sanitized = sanitized.replace(/[a-zA-Z]:\\[^<>:"|?*\n\r]+/g, '[filepath]');
        sanitized = sanitized.replace(/\/[^\s<>"{}|\\^`[\]\n\r]+/g, '[path]');

        // Remove potential tokens/keys (long alphanumeric strings)
        sanitized = sanitized.replace(/\b[a-zA-Z0-9]{32,}\b/g, '[token]');

        return sanitized.trim();
    } catch (error) {
        console.warn('String sanitization failed:', error);
        return '[sanitization_error]';
    }
};

/**
 * Sanitize array values
 */
const sanitizeArray = (arr: any[]): any[] => {
    try {
        return arr
            .slice(0, MAX_ARRAY_LENGTH)
            .map(item => {
                if (typeof item === 'string') {
                    return sanitizeString(item);
                } else if (typeof item === 'number' && isFinite(item)) {
                    return item;
                } else if (typeof item === 'boolean') {
                    return item;
                } else if (item === null) {
                    return null;
                }
                return '[filtered]';
            })
            .filter(item => item !== '[filtered]');
    } catch (error) {
        console.warn('Array sanitization failed:', error);
        return [];
    }
};

/**
 * Enhanced simple object sanitization
 */
export const sanitizeSimpleObject = (obj: any): Record<string, any> => {
    const sanitized: Record<string, any> = {};

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return sanitized;
    }

    try {
        let propertyCount = 0;
        const maxProperties = 20;

        for (const [key, value] of Object.entries(obj)) {
            if (propertyCount >= maxProperties) break;

            const sanitizedKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 50);

            if (typeof value === 'string') {
                sanitized[sanitizedKey] = sanitizeString(value);
            } else if (typeof value === 'number' && isFinite(value)) {
                sanitized[sanitizedKey] = value;
            } else if (typeof value === 'boolean' || value === null) {
                sanitized[sanitizedKey] = value;
            }

            propertyCount++;
        }
    } catch (error) {
        console.warn('Object sanitization failed:', error);
    }

    return sanitized;
};

// ============================================================================
// USER METRICS CALCULATIONS
// ============================================================================

/**
 * Enhanced engagement score calculation
 */
export const calculateEngagementScore = (metrics: UserMetrics): number => {
    if (!metrics) return 0;

    try {
        const weights: EngagementWeights = {
            sessions: 0.25,
            timeSpent: 0.25,
            applicationsCreated: 0.25,
            featuresUsed: 0.15,
            consistency: 0.10
        };

        // Normalize metrics with improved scaling
        const normalizedSessions = Math.min(Math.log10(metrics.sessionsCount + 1) / Math.log10(51), 1) * 100;
        const normalizedTime = Math.min(metrics.totalTimeSpent / (1000 * 60 * 60 * 20), 1) * 100; // 20 hours
        const normalizedApps = Math.min(Math.log10(metrics.applicationsCreated + 1) / Math.log10(101), 1) * 100;
        const normalizedFeatures = Math.min((metrics.featuresUsed?.length || 0) / 25, 1) * 100;

        // Calculate consistency score based on usage patterns
        const consistencyScore = calculateConsistencyScore(metrics);

        const score = (
            normalizedSessions * weights.sessions +
            normalizedTime * weights.timeSpent +
            normalizedApps * weights.applicationsCreated +
            normalizedFeatures * weights.featuresUsed +
            consistencyScore * weights.consistency
        );

        return Math.round(Math.max(0, Math.min(100, score)));
    } catch (error) {
        console.warn('Engagement score calculation failed:', error);
        return 0;
    }
};

/**
 * Calculate consistency score based on usage patterns
 */
const calculateConsistencyScore = (metrics: UserMetrics): number => {
    try {
        // Type guard to check if the properties exist
        const hasDateProperties = 'lastActiveDate' in metrics && 'firstActiveDate' in metrics;
        if (!hasDateProperties) return 0;

        const lastActiveDate = (metrics as any).lastActiveDate;
        const firstActiveDate = (metrics as any).firstActiveDate;

        if (!lastActiveDate || !firstActiveDate) return 0;

        const firstActive = new Date(String(firstActiveDate)).getTime();
        const lastActive = new Date(String(lastActiveDate)).getTime();

        if (isNaN(firstActive) || isNaN(lastActive)) return 0;

        const totalDays = Math.max(1, (lastActive - firstActive) / (1000 * 60 * 60 * 24));

        // Calculate average sessions per day
        const sessionsPerDay = metrics.sessionsCount / totalDays;

        // Score based on regular usage (optimal: 1-3 sessions per day)
        const consistency = Math.min(sessionsPerDay / 2, 1) * 100;

        return Math.max(0, Math.min(100, consistency));
    } catch (error) {
        console.warn('Consistency score calculation failed:', error);
        return 0;
    }
};

/**
 * Calculate average session duration with error handling
 */
export const calculateAverageSessionDuration = (sessions: UserSession[]): number => {
    if (!sessions?.length) return 0;

    try {
        let totalDuration = 0;
        let validSessions = 0;

        for (const session of sessions) {
            const duration = Number(session.duration) || 0;
            if (duration > 0 && duration < (24 * 60 * 60 * 1000)) { // Valid duration check
                totalDuration += duration;
                validSessions++;
            }
        }

        return validSessions > 0 ? Math.round(totalDuration / validSessions) : 0;
    } catch (error) {
        console.warn('Average session duration calculation failed:', error);
        return 0;
    }
};

/**
 * Enhanced most used features analysis
 */
export const getMostUsedFeatures = (
    events: AnalyticsEvent[],
    limit: number = 10
): Array<{ feature: string; count: number; percentage: number }> => {
    try {
        const featureUsage: Record<string, number> = {};
        let totalFeatureEvents = 0;

        events.forEach(event => {
            if (event.event === 'feature_used' && event.properties?.feature) {
                const feature = String(event.properties.feature).trim();
                if (feature) {
                    featureUsage[feature] = (featureUsage[feature] || 0) + 1;
                    totalFeatureEvents++;
                }
            }
        });

        return Object.entries(featureUsage)
            .map(([feature, count]) => ({
                feature,
                count,
                percentage: totalFeatureEvents > 0 ? Math.round((count / totalFeatureEvents) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    } catch (error) {
        console.warn('Feature usage analysis failed:', error);
        return [];
    }
};

// ============================================================================
// TIME AND DATE UTILITIES
// ============================================================================

/**
 * Enhanced duration formatting
 */
export const formatDuration = (milliseconds: number): string => {
    if (!milliseconds || milliseconds < 0) return '0s';
    if (milliseconds < 1000) return '< 1s';

    try {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            const remainingHours = hours % 24;
            return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
        }
        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
        }
        if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        }
        return `${seconds}s`;
    } catch (error) {
        console.warn('Duration formatting failed:', error);
        return '0s';
    }
};

/**
 * Enhanced time periods with additional ranges
 */
export const getTimePeriods = (): TimePeriods => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return {
            today: {
                start: startOfToday.toISOString(),
                end: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000).toISOString()
            },
            thisWeek: {
                start: startOfWeek.toISOString(),
                end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            thisMonth: {
                start: startOfMonth.toISOString(),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
            },
            last7Days: {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end: now.toISOString()
            },
            last30Days: {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: now.toISOString()
            },
            last90Days: {
                start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                end: now.toISOString()
            }
        };
    } catch (error) {
        console.warn('Time periods calculation failed:', error);
        const fallbackTime = new Date().toISOString();
        return {
            today: {start: fallbackTime, end: fallbackTime},
            thisWeek: {start: fallbackTime, end: fallbackTime},
            thisMonth: {start: fallbackTime, end: fallbackTime},
            last7Days: {start: fallbackTime, end: fallbackTime},
            last30Days: {start: fallbackTime, end: fallbackTime},
            last90Days: {start: fallbackTime, end: fallbackTime}
        };
    }
};

/**
 * Enhanced period checking with validation
 */
export const isWithinPeriod = (timestamp: string, period: { start: string; end: string }): boolean => {
    try {
        const time = new Date(timestamp).getTime();
        const start = new Date(period.start).getTime();
        const end = new Date(period.end).getTime();

        if (isNaN(time) || isNaN(start) || isNaN(end)) {
            console.warn('Invalid timestamps provided for period check');
            return false;
        }

        return time >= start && time < end;
    } catch (error) {
        console.warn('Period check failed:', error);
        return false;
    }
};

// ============================================================================
// DATA AGGREGATION UTILITIES
// ============================================================================

/**
 * Enhanced event grouping with better performance
 */
export const groupEventsByPeriod = (
    events: AnalyticsEvent[],
    period: 'hour' | 'day' | 'week' | 'month'
): Record<string, AnalyticsEvent[]> => {
    const grouped: Record<string, AnalyticsEvent[]> = {};

    try {
        events.forEach(event => {
            const date = new Date(event.timestamp);

            if (isNaN(date.getTime())) {
                console.warn('Invalid timestamp in event:', event.timestamp);
                return;
            }

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
                    const weekNumber = Math.ceil(weekStart.getDate() / 7);
                    key = `${weekStart.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
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
    } catch (error) {
        console.warn('Event grouping failed:', error);
    }

    return grouped;
};

/**
 * Enhanced event frequency calculation
 */
export const calculateEventFrequency = (events: AnalyticsEvent[]): Record<string, number> => {
    const frequency: Record<string, number> = {};

    try {
        events.forEach(event => {
            if (event.event && typeof event.event === 'string') {
                frequency[event.event] = (frequency[event.event] || 0) + 1;
            }
        });
    } catch (error) {
        console.warn('Event frequency calculation failed:', error);
    }

    return frequency;
};

// ============================================================================
// PRIVACY AND COMPLIANCE UTILITIES
// ============================================================================

/**
 * Enhanced analytics consent checking
 */
export const canTrackAnalytics = (settings: AnalyticsSettings): boolean => {
    try {
        return Boolean(settings?.enabled && settings?.consentGiven);
    } catch (error) {
        console.warn('Analytics consent check failed:', error);
        return false;
    }
};

/**
 * Get allowed tracking level events with enhanced security
 */
export const getAllowedEvents = (trackingLevel: AnalyticsSettings['trackingLevel']): AnalyticsEventType[] => {
    const eventTiers = {
        minimal: [
            'session_start',
            'session_end'
        ] as AnalyticsEventType[],

        standard: [
            'session_start',
            'session_end',
            'page_view',
            'application_created',
            'application_updated',
            'feature_used'
        ] as AnalyticsEventType[],

        detailed: [
            'session_start',
            'session_end',
            'page_view',
            'application_created',
            'application_updated',
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
            'analytics_disabled',
            'feature_used'
        ] as AnalyticsEventType[]
    };

    return eventTiers[trackingLevel] || eventTiers.minimal;
};

/**
 * Enhanced event filtering with validation
 */
export const filterEventsByTrackingLevel = (
    events: AnalyticsEvent[],
    trackingLevel: AnalyticsSettings['trackingLevel']
): AnalyticsEvent[] => {
    try {
        const allowedEvents = new Set(getAllowedEvents(trackingLevel));
        return events.filter(event =>
            event?.event && allowedEvents.has(event.event as AnalyticsEventType)
        );
    } catch (error) {
        console.warn('Event filtering failed:', error);
        return [];
    }
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Enhanced debounce with better type safety
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            func(...args);
        }, delay);
    };
};

/**
 * Enhanced throttle with leading edge option
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number,
    options: { leading?: boolean; trailing?: boolean } = {leading: true, trailing: false}
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            if (options.leading !== false) {
                func(...args);
            }
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (options.trailing !== false && lastArgs) {
                    func(...lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args;
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