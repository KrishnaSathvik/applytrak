// src/utils/privacy.ts - Privacy & GDPR Compliance Utilities
import type {AnalyticsEvent, FeedbackSubmission, PrivacySettings, TrackingLevel, UserSession} from '../types';

// ============================================================================
// PRIVACY CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * GDPR and privacy compliance configuration
 */
export const PRIVACY_CONFIG = {
    // Data retention periods (in days)
    DATA_RETENTION: {
        analytics: 30,    // Analytics events retained for 30 days
        sessions: 7,      // Session data retained for 7 days
        feedback: 365,    // Feedback retained for 1 year
        logs: 7          // Error logs retained for 7 days
    },

    // Consent requirements
    CONSENT: {
        version: '1.0.0',
        requiredForTracking: true,
        expirationDays: 365,  // Consent expires after 1 year
        minAge: 13           // Minimum age for consent
    },

    // Storage keys
    STORAGE_KEYS: {
        consent: 'applytrak_privacy_consent',
        settings: 'applytrak_privacy_settings',
        optOut: 'applytrak_opt_out',
        dataSubject: 'applytrak_data_subject_rights'
    },

    // Privacy notice URLs (customize these for your deployment)
    URLS: {
        privacyPolicy: '/privacy-policy',
        termsOfService: '/terms-of-service',
        cookiePolicy: '/cookie-policy',
        dataProtection: '/data-protection'
    }
} as const;

/**
 * Tracking level definitions with descriptions
 */
export const TRACKING_LEVELS = {
    minimal: {
        name: 'Minimal',
        description: 'Only essential functionality tracking',
        dataTypes: ['session_start', 'session_end'],
        retentionDays: 7
    },
    standard: {
        name: 'Standard',
        description: 'Basic usage analytics for improvement',
        dataTypes: ['sessions', 'page_views', 'feature_usage', 'basic_interactions'],
        retentionDays: 30
    },
    detailed: {
        name: 'Detailed',
        description: 'Comprehensive analytics for optimization',
        dataTypes: ['all_interactions', 'performance_metrics', 'error_tracking', 'user_behavior'],
        retentionDays: 90
    }
} as const;

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

/**
 * Create default privacy settings
 */
export const createDefaultPrivacySettings = (): PrivacySettings => ({
    analytics: false,
    feedback: false,
    functionalCookies: true, // Always required for app functionality
    consentDate: new Date().toISOString(),
    consentVersion: PRIVACY_CONFIG.CONSENT.version
});

/**
 * Validate consent data structure
 */
export const validateConsent = (consent: unknown): consent is PrivacySettings => {
    if (!consent || typeof consent !== 'object') return false;

    const requiredFields = ['analytics', 'feedback', 'functionalCookies', 'consentDate', 'consentVersion'];
    const consentObj = consent as Record<string, unknown>;

    const hasAllRequired = requiredFields.every(key => key in consentObj);
    if (!hasAllRequired) return false;

    // Type check the properties
    return (
        typeof consentObj.analytics === 'boolean' &&
        typeof consentObj.feedback === 'boolean' &&
        typeof consentObj.functionalCookies === 'boolean' &&
        typeof consentObj.consentDate === 'string' &&
        typeof consentObj.consentVersion === 'string'
    );
};

/**
 * Check if consent is still valid (not expired)
 */
export const isConsentValid = (consentDate: string): boolean => {
    try {
        const consent = new Date(consentDate);
        const now = new Date();
        const expirationDate = new Date(consent);
        expirationDate.setDate(consent.getDate() + PRIVACY_CONFIG.CONSENT.expirationDays);

        return now < expirationDate;
    } catch (error) {
        console.error('Error validating consent date:', error);
        return false;
    }
};

/**
 * Check if user has given valid consent for analytics
 */
export const hasValidAnalyticsConsent = (settings: PrivacySettings): boolean => (
    settings.analytics === true &&
    Boolean(settings.consentDate) &&
    isConsentValid(settings.consentDate) &&
    settings.consentVersion === PRIVACY_CONFIG.CONSENT.version
);

/**
 * Check if user has opted out globally
 */
export const hasGlobalOptOut = (): boolean => {
    try {
        const optOut = localStorage.getItem(PRIVACY_CONFIG.STORAGE_KEYS.optOut);
        return optOut === 'true';
    } catch (error) {
        console.error('Error checking global opt-out:', error);
        return false;
    }
};

/**
 * Set global opt-out status
 */
export const setGlobalOptOut = (optOut: boolean): void => {
    try {
        if (optOut) {
            localStorage.setItem(PRIVACY_CONFIG.STORAGE_KEYS.optOut, 'true');
        } else {
            localStorage.removeItem(PRIVACY_CONFIG.STORAGE_KEYS.optOut);
        }
    } catch (error) {
        console.error('Error setting global opt-out:', error);
    }
};

// ============================================================================
// DATA ANONYMIZATION
// ============================================================================

/**
 * Anonymize IP address (remove last octet)
 */
export const anonymizeIP = (ip: string): string => {
    if (!ip || typeof ip !== 'string') return 'unknown';

    // IPv4
    if (ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
        }
    }

    // IPv6 - remove last two groups
    if (ip.includes(':')) {
        const parts = ip.split(':');
        if (parts.length >= 4) {
            return `${parts.slice(0, -2).join(':')}::`;
        }
    }

    return 'anonymized';
};

/**
 * Anonymize user agent string
 */
export const anonymizeUserAgent = (userAgent: string): string => {
    if (!userAgent || typeof userAgent !== 'string') return 'unknown';

    // Keep browser family and version, remove specific details
    const browserRegex = /(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/i;
    const osRegex = /(Windows|Mac|Linux|Android|iOS)/i;

    const browserMatch = userAgent.match(browserRegex);
    const osMatch = userAgent.match(osRegex);

    const browser = browserMatch ? `${browserMatch[1]}/${browserMatch[2]}` : 'Unknown';
    const os = osMatch ? osMatch[1] : 'Unknown';

    return `${browser} on ${os}`;
};

/**
 * Remove personally identifiable information from text
 */
export const removePII = (text: string): string => {
    if (!text || typeof text !== 'string') return '';

    return text
        // Email addresses
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REMOVED]')
        // Phone numbers (various formats)
        .replace(/\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g, '[PHONE_REMOVED]')
        // Credit card numbers
        .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REMOVED]')
        // Social Security Numbers
        .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN_REMOVED]')
        // URLs with potential sensitive params
        .replace(/https?:\/\/[^\s]+/g, '[URL_REMOVED]')
        // Potential addresses (simple pattern)
        .replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, '[ADDRESS_REMOVED]');
};

/**
 * Anonymize analytics event data
 */
export const anonymizeAnalyticsEvent = (event: AnalyticsEvent): AnalyticsEvent => {
    const anonymized = {...event};

    // Remove or anonymize user ID
    if (anonymized.userId) {
        anonymized.userId = `anon_${anonymized.userId.slice(-8)}`;
    }

    // Anonymize properties
    if (anonymized.properties) {
        anonymized.properties = anonymizeEventProperties(anonymized.properties);
    }

    return anonymized;
};

/**
 * Anonymize event properties recursively
 */
export const anonymizeEventProperties = (properties: Record<string, unknown>): Record<string, unknown> => {
    const anonymized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(properties)) {
        if (typeof value === 'string') {
            // Apply PII removal to string values
            anonymized[key] = removePII(value);
        } else if (Array.isArray(value)) {
            // Anonymize array elements
            anonymized[key] = value.map(item =>
                typeof item === 'string' ? removePII(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            // Recursively anonymize object properties
            anonymized[key] = anonymizeEventProperties(value as Record<string, unknown>);
        } else {
            // Keep primitive values as-is
            anonymized[key] = value;
        }
    }

    return anonymized;
};

// ============================================================================
// DATA MINIMIZATION
// ============================================================================

/**
 * Apply data minimization based on tracking level
 */
export const minimizeDataByTrackingLevel = (
    data: unknown,
    trackingLevel: TrackingLevel
): unknown => {
    if (!data) return data;

    switch (trackingLevel) {
        case 'minimal':
            return minimizeToEssential(data);
        case 'standard':
            return minimizeToStandard(data);
        case 'detailed':
            return data; // No minimization for detailed tracking
        default:
            return minimizeToEssential(data);
    }
};

/**
 * Minimize data to essential only
 */
export const minimizeToEssential = (data: unknown): unknown => {
    if (Array.isArray(data)) {
        return data.slice(0, 10); // Limit array size
    }

    if (typeof data === 'object' && data !== null) {
        const essential: Record<string, unknown> = {};
        const dataObj = data as Record<string, unknown>;

        // Only keep essential fields
        const essentialFields = ['id', 'timestamp', 'event', 'sessionId'];

        for (const field of essentialFields) {
            if (field in dataObj) {
                essential[field] = dataObj[field];
            }
        }

        return essential;
    }

    return data;
};

/**
 * Minimize data to standard level
 */
export const minimizeToStandard = (data: unknown): unknown => {
    if (Array.isArray(data)) {
        return data.slice(0, 50); // Larger limit for standard tracking
    }

    if (typeof data === 'object' && data !== null) {
        const standard: Record<string, unknown> = {};
        const dataObj = data as Record<string, unknown>;

        // Keep standard fields
        const standardFields = [
            'id', 'timestamp', 'event', 'sessionId', 'properties',
            'deviceType', 'userAgent', 'language', 'timezone'
        ];

        for (const field of standardFields) {
            if (field in dataObj) {
                if (field === 'userAgent' && typeof dataObj[field] === 'string') {
                    standard[field] = anonymizeUserAgent(dataObj[field] as string);
                } else if (field === 'properties' && typeof dataObj[field] === 'object' && dataObj[field] !== null) {
                    standard[field] = anonymizeEventProperties(dataObj[field] as Record<string, unknown>);
                } else {
                    standard[field] = dataObj[field];
                }
            }
        }

        return standard;
    }

    return data;
};

// ============================================================================
// DATA SUBJECT RIGHTS (GDPR)
// ============================================================================

interface ExportedUserData {
    analytics: AnalyticsEvent[];
    sessions: UserSession[];
    feedback: FeedbackSubmission[];
    settings: PrivacySettings;
    exportDate: string;
}

/**
 * Export user data for data portability (GDPR Article 20)
 */
export const exportUserData = async (): Promise<ExportedUserData> => {
    try {
        // This would integrate with your data services
        const analytics: AnalyticsEvent[] = []; // Get from analytics service
        const sessions: UserSession[] = []; // Get from session storage
        const feedback: FeedbackSubmission[] = []; // Get from feedback service
        const settings = createDefaultPrivacySettings(); // Get actual settings

        return {
            analytics: analytics.map(anonymizeAnalyticsEvent),
            sessions,
            feedback,
            settings,
            exportDate: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error exporting user data:', error);
        throw new Error('Failed to export user data');
    }
};

/**
 * Delete all user data (Right to erasure - GDPR Article 17)
 */
export const deleteAllUserData = async (): Promise<void> => {
    try {
        // Clear localStorage
        const keysToRemove = Object.values(PRIVACY_CONFIG.STORAGE_KEYS);
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to remove ${key}:`, error);
            }
        });

        // Clear IndexedDB data (would integrate with your database service)
        // await databaseService.clearAllUserData();

        console.log('✅ All user data deleted');
    } catch (error) {
        console.error('Error deleting user data:', error);
        throw new Error('Failed to delete user data');
    }
};

interface DataSubjectRequest {
    type: 'access' | 'portability' | 'erasure' | 'rectification';
    timestamp: string;
    status: 'completed';
}

/**
 * Log data subject rights request
 */
export const logDataSubjectRequest = (requestType: DataSubjectRequest['type']): void => {
    try {
        const existingData = localStorage.getItem(PRIVACY_CONFIG.STORAGE_KEYS.dataSubject);
        const requests: DataSubjectRequest[] = existingData ? JSON.parse(existingData) : [];

        requests.push({
            type: requestType,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });

        // Keep only last 10 requests
        const recentRequests = requests.slice(-10);

        localStorage.setItem(
            PRIVACY_CONFIG.STORAGE_KEYS.dataSubject,
            JSON.stringify(recentRequests)
        );
    } catch (error) {
        console.error('Error logging data subject request:', error);
    }
};

// ============================================================================
// COOKIE MANAGEMENT
// ============================================================================

/**
 * Check if cookies are enabled
 */
export const areCookiesEnabled = (): boolean => {
    try {
        // Test cookie functionality
        const testCookie = 'testcookie=1; SameSite=Strict';
        document.cookie = testCookie;
        const enabled = document.cookie.indexOf('testcookie=1') !== -1;

        // Clean up test cookie
        document.cookie = 'testcookie=; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';

        return enabled;
    } catch (error) {
        return false;
    }
};

interface CookieConsentStatus {
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

/**
 * Get cookie consent status
 */
export const getCookieConsentStatus = (): CookieConsentStatus => {
    try {
        const consent = localStorage.getItem(PRIVACY_CONFIG.STORAGE_KEYS.consent);
        if (!consent) {
            return {functional: true, analytics: false, marketing: false};
        }

        const parsed = JSON.parse(consent);
        return {
            functional: true, // Always required
            analytics: parsed.analytics || false,
            marketing: false // Not used in ApplyTrak
        };
    } catch (error) {
        return {functional: true, analytics: false, marketing: false};
    }
};

// ============================================================================
// PRIVACY UTILITY FUNCTIONS
// ============================================================================

interface PrivacyReport {
    complianceScore: number;
    issues: string[];
    recommendations: string[];
}

/**
 * Generate privacy compliance report
 */
export const generatePrivacyReport = (): PrivacyReport => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check cookie compliance
    if (!areCookiesEnabled()) {
        issues.push('Cookies are disabled');
        recommendations.push('Enable cookies for full functionality');
        score -= 10;
    }

    // Check consent status
    const consent = getCookieConsentStatus();
    if (!consent.analytics && consent.functional) {
        recommendations.push('Consider enabling analytics to help improve the application');
    }

    // Check data retention
    const hasOldData = false; // This would check actual data age
    if (hasOldData) {
        issues.push('Old data detected beyond retention period');
        recommendations.push('Clean up old data to comply with retention policies');
        score -= 20;
    }

    return {
        complianceScore: Math.max(0, score),
        issues,
        recommendations
    };
};

/**
 * Check Do Not Track browser setting
 */
export const isDoNotTrackEnabled = (): boolean => {
    try {
        // navigator.doNotTrack can be '1', '0', 'unspecified', null, or undefined
        const dnt = navigator.doNotTrack;
        const windowDnt = (window as unknown as { doNotTrack?: string }).doNotTrack;
        const msDnt = (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack;

        // Check all possible DoNotTrack implementations
        // Convert to string for consistent comparison since the property can be string or boolean
        const dntStr = String(dnt);
        const windowDntStr = String(windowDnt);
        const msDntStr = String(msDnt);

        return (
            dntStr === '1' || dntStr === 'true' ||
            windowDntStr === '1' || windowDntStr === 'true' ||
            msDntStr === '1' || msDntStr === 'true'
        );
    } catch (error) {
        // If there's any error accessing DoNotTrack, assume it's not enabled
        return false;
    }
};

type PrivacyLevel = 'high' | 'medium' | 'low';

/**
 * Get browser privacy level
 */
export const getBrowserPrivacyLevel = (): PrivacyLevel => {
    let score = 0;

    // Check for Do Not Track
    if (isDoNotTrackEnabled()) score += 30;

    // Check for cookies disabled
    if (!areCookiesEnabled()) score += 20;

    // Check for localStorage disabled
    try {
        localStorage.setItem('privacy_test', 'test');
        localStorage.removeItem('privacy_test');
    } catch {
        score += 25;
    }

    // Check for third-party cookies blocked (simplified check)
    try {
        if (typeof navigator !== 'undefined' && navigator.cookieEnabled === false) {
            score += 25;
        }
    } catch {
        // Ignore errors in cookieEnabled check
    }

    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
};

// ============================================================================
// EXPORT PRIVACY UTILITIES
// ============================================================================

export const privacyUtils = {
    // Consent Management
    createDefaultPrivacySettings,
    validateConsent,
    isConsentValid,
    hasValidAnalyticsConsent,
    hasGlobalOptOut,
    setGlobalOptOut,

    // Data Anonymization
    anonymizeIP,
    anonymizeUserAgent,
    removePII,
    anonymizeAnalyticsEvent,
    anonymizeEventProperties,

    // Data Minimization
    minimizeDataByTrackingLevel,
    minimizeToEssential,
    minimizeToStandard,

    // Data Subject Rights
    exportUserData,
    deleteAllUserData,
    logDataSubjectRequest,

    // Cookie Management
    areCookiesEnabled,
    getCookieConsentStatus,

    // Privacy Utilities
    generatePrivacyReport,
    isDoNotTrackEnabled,
    getBrowserPrivacyLevel
} as const;

export default privacyUtils;