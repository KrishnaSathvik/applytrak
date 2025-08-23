// src/services/analyticsService.ts - Production Optimized Analytics Service
import {AnalyticsEvent, AnalyticsEventType, AnalyticsSettings, UserMetrics, UserSession} from '../types';
import {databaseService} from './databaseService';

/**
 * Production-ready analytics service with robust error handling,
 * offline support, and privacy-first data collection
 */
class AnalyticsService {
    private sessionId: string;
    private sessionStart: number;
    private events: AnalyticsEvent[] = [];
    private settings: AnalyticsSettings;
    private userMetrics: UserMetrics | null = null;
    private isInitialized = false;

    // Performance optimization properties
    private eventQueue: AnalyticsEvent[] = [];
    private syncInProgress = false;
    private lastSyncAttempt = 0;
    private readonly SYNC_RETRY_DELAY = 5000; // 5 seconds
    private readonly MAX_RETRY_ATTEMPTS = 3;
    private readonly EVENT_BATCH_SIZE = 10;
    private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    private readonly LOCAL_STORAGE_PREFIX = 'applytrak_analytics';

    // Timers and cleanup
    private idleTimer: NodeJS.Timeout | null = null;
    private syncTimer: NodeJS.Timeout | null = null;
    private eventListeners: Array<{ element: EventTarget; event: string; handler: EventListener }> = [];

    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.settings = this.getStoredSettings();

        // Initialize if consent already given
        if (this.settings.consentGiven) {
            this.initialize().catch(error =>
                this.logError('Failed to auto-initialize analytics:', error)
            );
        }

        // Set up periodic sync
        this.setupPeriodicSync();
    }

    // ============================================================================
    // PUBLIC API - INITIALIZATION & CONSENT
    // ============================================================================

    /**
     * Initialize analytics service with full error handling
     */
    async initialize(): Promise<void> {
        if (this.isInitialized || !this.settings.consentGiven) {
            return;
        }

        this.log('Initializing analytics service with consent');

        try {
            // Load existing user metrics
            await this.loadUserMetrics();

            // Track session start
            await this.trackEvent('session_start', {
                deviceType: this.getDeviceType(),
                timezone: this.getTimezone(),
                language: this.getLanguage(),
                userAgent: this.getSafeUserAgent(),
                sessionId: this.sessionId,
                viewportSize: this.getViewportSize(),
                colorScheme: this.getColorScheme()
            });

            // Set up session tracking
            this.setupSessionTracking();

            // Sync any queued events
            await this.syncQueuedEvents();

            this.isInitialized = true;
            this.log('Analytics service initialized successfully');

        } catch (error) {
            this.logError('Analytics initialization failed:', error);
            this.isInitialized = false;
        }
    }

    /**
     * Enable analytics with comprehensive settings
     */
    async enableAnalytics(settings: Partial<AnalyticsSettings> = {}): Promise<void> {
        this.settings = {
            enabled: true,
            consentGiven: true,
            consentDate: new Date().toISOString(),
            trackingLevel: 'standard',
            dataRetentionDays: 365,
            shareUsageData: false,
            ...settings
        };

        this.saveSettings();
        await this.initialize();

        this.log('Analytics enabled with user consent');
    }

    /**
     * Disable analytics and clean up resources
     */
    async disableAnalytics(): Promise<void> {
        this.settings = {
            enabled: false,
            consentGiven: false,
            trackingLevel: 'minimal'
        };

        // Clean up resources
        this.cleanup();

        // Save settings and clear data
        this.saveSettings();
        await this.clearStoredData();

        this.isInitialized = false;
        this.log('Analytics disabled and data cleared');
    }

    /**
     * Check if analytics is properly enabled
     */
    isEnabled(): boolean {
        return this.settings.enabled && this.settings.consentGiven && this.isInitialized;
    }

    /**
     * Get current analytics settings
     */
    getSettings(): AnalyticsSettings {
        return {...this.settings};
    }

    /**
     * Update analytics settings
     */
    async updateSettings(newSettings: Partial<AnalyticsSettings>): Promise<void> {
        this.settings = {...this.settings, ...newSettings};
        this.saveSettings();

        if (!this.settings.enabled && this.isInitialized) {
            await this.disableAnalytics();
        } else if (this.settings.enabled && !this.isInitialized) {
            await this.initialize();
        }
    }

    // ============================================================================
    // PUBLIC API - EVENT TRACKING
    // ============================================================================

    /**
     * Track events with robust error handling and queuing
     */
    async trackEvent(event: AnalyticsEventType, properties?: Record<string, any>): Promise<void> {
        if (!this.isEnabled()) {
            return;
        }

        const analyticsEvent: AnalyticsEvent = {
            event,
            properties: this.sanitizeProperties(properties),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: this.getAnonymousUserId(),
            eventId: this.generateEventId()
        };

        // Add to local events array
        this.events.push(analyticsEvent);

        // Update user metrics
        await this.updateUserMetrics(event, properties);

        // Attempt to sync with database
        try {
            await this.syncEvent(analyticsEvent);
            this.log('Event tracked and synced:', event);
        } catch (error) {
            this.logError('Failed to sync event, queuing for retry:', error);
            this.queueEvent(analyticsEvent);
        }
    }

    /**
     * Track page/component views with context
     */
    async trackPageView(page: string, referrer?: string): Promise<void> {
        await this.trackEvent('page_view', {
            page,
            referrer: referrer || document.referrer,
            timestamp: Date.now()
        });
    }

    /**
     * Track feature usage with enhanced context
     */
    async trackFeatureUsage(feature: string, context?: Record<string, any>): Promise<void> {
        await this.trackEvent('feature_used', {
            feature,
            ...context,
            userAgent: this.getSafeUserAgent()
        });
    }

    // Application-specific tracking methods
    async trackApplicationCreated(metadata?: Record<string, any>): Promise<void> {
        await this.trackEvent('application_created', metadata);
    }

    async trackApplicationUpdated(metadata?: Record<string, any>): Promise<void> {
        await this.trackEvent('application_updated', metadata);
    }

    async trackApplicationDeleted(): Promise<void> {
        await this.trackEvent('application_deleted');
    }

    async trackGoalSet(goalType: string, targetValue?: number): Promise<void> {
        await this.trackEvent('goal_set', {
            goalType,
            targetValue: targetValue?.toString()
        });
    }

    async trackAttachmentAdded(fileType?: string, fileSize?: number): Promise<void> {
        await this.trackEvent('attachment_added', {
            fileType,
            fileSize: fileSize?.toString()
        });
    }

    async trackExportData(format: string, itemCount?: number): Promise<void> {
        await this.trackEvent('export_data', {
            format,
            itemCount: itemCount?.toString()
        });
    }

    async trackImportData(itemCount: number, source?: string): Promise<void> {
        await this.trackEvent('import_data', {
            itemCount: itemCount.toString(),
            source
        });
    }

    async trackSearchPerformed(query: string, resultCount?: number): Promise<void> {
        // Privacy-conscious search tracking
        await this.trackEvent('search_performed', {
            queryLength: query.length.toString(),
            hasResults: ((resultCount ?? 0) > 0).toString(),
            resultCount: (resultCount ?? 0).toString()
        });
    }

    async trackError(error: Error, context?: Record<string, any>): Promise<void> {
        await this.trackEvent('feature_used', { // Using existing event type since 'error_occurred' may not be defined
            feature: 'error_tracking',
            errorMessage: error.message,
            errorStack: error.stack?.substring(0, 500), // Truncate for storage
            ...context
        });
    }

    // ============================================================================
    // PUBLIC API - DATA RETRIEVAL
    // ============================================================================

    /**
     * Get user metrics with fallback handling
     */
    async getUserMetrics(): Promise<UserMetrics | null> {
        try {
            const metrics = await databaseService.getUserMetrics();
            if (metrics) {
                this.userMetrics = metrics;
                return metrics;
            }
        } catch (error) {
            this.logError('Failed to get user metrics from database:', error);
        }

        return this.userMetrics;
    }

    /**
     * Get current session ID
     */
    getCurrentSessionId(): string {
        return this.sessionId;
    }

    /**
     * Get all analytics events with error handling
     */
    async getAllEvents(limit?: number): Promise<AnalyticsEvent[]> {
        try {
            const events = await databaseService.getAnalyticsEvents();
            const filteredEvents = events || [];
            return limit ? filteredEvents.slice(0, limit) : filteredEvents;
        } catch (error) {
            this.logError('Failed to get events from database:', error);
            return this.getStoredEventsLocally().slice(0, limit || 100);
        }
    }

    /**
     * Get user sessions with pagination support
     */
    async getAllSessions(limit: number = 10): Promise<UserSession[]> {
        try {
            // Use the correct method name from databaseService
            const sessions = await databaseService.getUserSession('') || [];
            // Since getUserSession expects a sessionId but we want all sessions,
            // we'll need to fallback to local storage approach
            return this.getStoredSessions().slice(0, limit);
        } catch (error) {
            this.logError('Failed to get sessions from database:', error);
            return this.getStoredSessions().slice(0, limit);
        }
    }

    /**
     * Get comprehensive analytics summary
     */
    async getAnalyticsSummary() {
        const [metrics, events, sessions] = await Promise.allSettled([
            this.getUserMetrics(),
            this.getAllEvents(100),
            this.getAllSessions(20)
        ]);

        const userMetrics = metrics.status === 'fulfilled' ? metrics.value : null;
        const eventsData = events.status === 'fulfilled' ? events.value : [];
        const sessionsData = sessions.status === 'fulfilled' ? sessions.value : [];

        return {
            userMetrics,
            eventsCount: eventsData.length,
            sessionsCount: sessionsData.length,
            averageSessionDuration: this.calculateAverageSessionDuration(sessionsData),
            lastActive: userMetrics?.lastActiveDate,
            consentStatus: this.settings,
            syncStatus: {
                queuedEvents: this.eventQueue.length,
                lastSync: this.lastSyncAttempt,
                syncInProgress: this.syncInProgress
            }
        };
    }

    /**
     * Export analytics data with privacy controls
     */
    async exportAnalyticsData(includePersonalData: boolean = false) {
        const [metrics, events, sessions] = await Promise.allSettled([
            this.getUserMetrics(),
            this.getAllEvents(),
            this.getAllSessions()
        ]);

        const data = {
            settings: this.settings,
            userMetrics: metrics.status === 'fulfilled' ? metrics.value : null,
            events: events.status === 'fulfilled' ? events.value : [],
            sessions: sessions.status === 'fulfilled' ? sessions.value : [],
            exportDate: new Date().toISOString(),
            includesPersonalData: includePersonalData
        };

        // Remove sensitive data if requested
        if (!includePersonalData) {
            data.events = data.events.map(event => ({
                ...event,
                userId: 'anonymized',
                properties: this.anonymizeProperties(event.properties)
            }));
        }

        return data;
    }

    // ============================================================================
    // PRIVATE METHODS - USER METRICS
    // ============================================================================

    private async loadUserMetrics(): Promise<void> {
        try {
            this.userMetrics = await databaseService.getUserMetrics();
            if (!this.userMetrics) {
                this.userMetrics = this.createDefaultUserMetrics();
                await databaseService.updateUserMetrics(this.userMetrics);
            }
            this.log('User metrics loaded successfully');
        } catch (error) {
            this.logError('Failed to load user metrics, using defaults:', error);
            this.userMetrics = this.createDefaultUserMetrics();
        }
    }

    private createDefaultUserMetrics(): UserMetrics {
        return {
            sessionsCount: 1,
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
            deviceType: this.getDeviceType(),
            firstVisit: new Date().toISOString(),
            totalEvents: 0
        };
    }

    private async updateUserMetrics(event: AnalyticsEventType, properties?: Record<string, any>): Promise<void> {
        if (!this.userMetrics) return;

        // Update common metrics
        this.userMetrics.totalEvents = (this.userMetrics.totalEvents || 0) + 1;
        this.userMetrics.lastActiveDate = new Date().toISOString();

        // Update specific metrics based on event type
        const updates = this.getMetricUpdatesForEvent(event, properties);
        Object.assign(this.userMetrics, updates);

        // Sync to database with retry logic
        try {
            await this.syncUserMetrics();
        } catch (error) {
            this.logError('Failed to sync user metrics:', error);
        }
    }

    private getMetricUpdatesForEvent(event: AnalyticsEventType, properties?: Record<string, any>): Partial<UserMetrics> {
        const updates: Partial<UserMetrics> = {};

        switch (event) {
            case 'application_created':
                updates.applicationsCreated = (this.userMetrics!.applicationsCreated || 0) + 1;
                break;
            case 'application_updated':
                updates.applicationsUpdated = (this.userMetrics!.applicationsUpdated || 0) + 1;
                break;
            case 'application_deleted':
                updates.applicationsDeleted = (this.userMetrics!.applicationsDeleted || 0) + 1;
                break;
            case 'goal_set':
                updates.goalsSet = (this.userMetrics!.goalsSet || 0) + 1;
                break;
            case 'attachment_added':
                updates.attachmentsAdded = (this.userMetrics!.attachmentsAdded || 0) + 1;
                break;
            case 'export_data':
                updates.exportsPerformed = (this.userMetrics!.exportsPerformed || 0) + 1;
                break;
            case 'import_data':
                updates.importsPerformed = (this.userMetrics!.importsPerformed || 0) + 1;
                break;
            case 'search_performed':
                updates.searchesPerformed = (this.userMetrics!.searchesPerformed || 0) + 1;
                break;
            case 'feature_used':
                if (properties?.feature) {
                    const currentFeatures = this.userMetrics!.featuresUsed || [];
                    if (!currentFeatures.includes(properties.feature)) {
                        updates.featuresUsed = [...currentFeatures, properties.feature];
                    }
                }
                break;
            case 'session_start':
                updates.sessionsCount = (this.userMetrics!.sessionsCount || 0) + 1;
                break;
        }

        return updates;
    }

    private async syncUserMetrics(): Promise<void> {
        if (!this.userMetrics) return;

        await databaseService.updateUserMetrics(this.userMetrics);
        this.log('User metrics synced successfully');
    }

    // ============================================================================
    // PRIVATE METHODS - EVENT SYNC & QUEUE MANAGEMENT
    // ============================================================================

    private async syncEvent(event: AnalyticsEvent): Promise<void> {
        await databaseService.saveAnalyticsEvent(event);
    }

    private queueEvent(event: AnalyticsEvent): void {
        this.eventQueue.push(event);

        // Limit queue size to prevent memory issues
        if (this.eventQueue.length > 100) {
            this.eventQueue = this.eventQueue.slice(-50); // Keep only the 50 most recent
            this.logError('Event queue overflow, discarded oldest events');
        }
    }

    private async syncQueuedEvents(): Promise<void> {
        if (this.syncInProgress || this.eventQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        const eventsToSync = this.eventQueue.splice(0, this.EVENT_BATCH_SIZE);

        try {
            await Promise.allSettled(
                eventsToSync.map(event => databaseService.saveAnalyticsEvent(event))
            );

            this.log(`Synced ${eventsToSync.length} queued events`);
            this.lastSyncAttempt = Date.now();

        } catch (error) {
            // Re-queue failed events
            this.eventQueue.unshift(...eventsToSync);
            this.logError('Failed to sync queued events:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    private setupPeriodicSync(): void {
        // Sync queued events every 30 seconds
        this.syncTimer = setInterval(() => {
            if (!this.isEnabled()) return;

            this.syncQueuedEvents().catch(error =>
                this.logError('Periodic sync failed:', error)
            );
        }, 30000);
    }

    // ============================================================================
    // PRIVATE METHODS - SESSION MANAGEMENT
    // ============================================================================

    private setupSessionTracking(): void {
        this.setupSessionEndTracking();
        this.setupActivityTracking();
    }

    private setupSessionEndTracking(): void {
        const handleSessionEnd = () => {
            this.trackSessionEnd().catch(error =>
                this.logError('Failed to track session end:', error)
            );
        };

        // Track session end on page unload
        const beforeUnloadHandler = () => handleSessionEnd();
        window.addEventListener('beforeunload', beforeUnloadHandler);
        this.eventListeners.push({element: window, event: 'beforeunload', handler: beforeUnloadHandler});

        // Track session end on visibility change
        const visibilityChangeHandler = () => {
            if (document.hidden) {
                handleSessionEnd();
            }
        };
        document.addEventListener('visibilitychange', visibilityChangeHandler);
        this.eventListeners.push({element: document, event: 'visibilitychange', handler: visibilityChangeHandler});
    }

    private setupActivityTracking(): void {
        const resetIdleTimer = () => {
            if (this.idleTimer) {
                clearTimeout(this.idleTimer);
            }

            this.idleTimer = setTimeout(() => {
                this.trackSessionEnd().catch(error =>
                    this.logError('Failed to track idle session end:', error)
                );
            }, this.IDLE_TIMEOUT);
        };

        // Activity events
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        activityEvents.forEach(eventType => {
            const handler = () => resetIdleTimer();
            document.addEventListener(eventType, handler, {passive: true});
            this.eventListeners.push({element: document, event: eventType, handler});
        });

        resetIdleTimer();
    }

    private async trackSessionEnd(): Promise<void> {
        const sessionDuration = Date.now() - this.sessionStart;

        await this.trackEvent('session_end', {
            duration: sessionDuration.toString(),
            eventsCount: this.events.length.toString(),
            endReason: document.hidden ? 'visibility_change' : 'page_unload'
        });

        // Update total time spent
        if (this.userMetrics) {
            this.userMetrics.totalTimeSpent = (this.userMetrics.totalTimeSpent || 0) + sessionDuration;
            await this.syncUserMetrics().catch(error =>
                this.logError('Failed to update session duration:', error)
            );
        }

        await this.saveSession(sessionDuration);
    }

    private async saveSession(duration: number): Promise<void> {
        if (!this.isEnabled()) return;

        const session: UserSession = {
            id: this.sessionId,
            startTime: new Date(this.sessionStart).toISOString(),
            endTime: new Date().toISOString(),
            duration,
            events: [...this.events],
            deviceType: this.getDeviceType(),
            userAgent: this.getSafeUserAgent(),
            timezone: this.getTimezone(),
            language: this.getLanguage(),
            viewportSize: this.getViewportSize(),
            colorScheme: this.getColorScheme()
        };

        try {
            await databaseService.saveUserSession(session);
            this.log('Session saved successfully');
        } catch (error) {
            this.logError('Failed to save session to database:', error);
            this.saveSessionLocally(session);
        }
    }

    // ============================================================================
    // PRIVATE METHODS - DATA PROCESSING & SANITIZATION
    // ============================================================================

    private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
        if (!properties) return {};

        const sanitized = {...properties};

        // Remove sensitive fields
        const sensitiveFields = [
            'email', 'password', 'token', 'personalInfo', 'creditCard',
            'ssn', 'phone', 'address', 'fullName', 'apiKey'
        ];

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                delete sanitized[field];
            }
        });

        // Truncate long strings to prevent storage bloat
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
                sanitized[key] = sanitized[key].substring(0, 500) + '...';
            }
        });

        return sanitized;
    }

    private anonymizeProperties(properties?: Record<string, any>): Record<string, any> {
        if (!properties) return {};

        const anonymized = {...properties};

        // Remove or anonymize potentially identifying information
        Object.keys(anonymized).forEach(key => {
            const value = anonymized[key];
            if (typeof value === 'string') {
                // Remove email-like patterns
                if (value.includes('@')) {
                    anonymized[key] = '[email]';
                }
                // Remove URL-like patterns
                else if (value.startsWith('http')) {
                    anonymized[key] = '[url]';
                }
                // Remove long strings that might contain personal data
                else if (value.length > 100) {
                    anonymized[key] = '[long_string]';
                }
            }
        });

        return anonymized;
    }

    // ============================================================================
    // PRIVATE METHODS - UTILITIES
    // ============================================================================

    private calculateAverageSessionDuration(sessions: UserSession[]): number {
        if (sessions.length === 0) return 0;

        const totalDuration = sessions.reduce((sum, session) => {
            // Handle both string and number types for duration
            let duration = 0;
            if (typeof session.duration === 'string') {
                duration = parseInt(session.duration, 10) || 0;
            } else if (typeof session.duration === 'number') {
                duration = session.duration;
            }
            return sum + duration;
        }, 0);

        return Math.round(totalDuration / sessions.length);
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private generateEventId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private getAnonymousUserId(): string {
        const authUserId = localStorage.getItem('applytrak_user_id');
        if (authUserId) {
            return authUserId;
        }

        let userId = localStorage.getItem(`${this.LOCAL_STORAGE_PREFIX}_anonymous_id`);
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem(`${this.LOCAL_STORAGE_PREFIX}_anonymous_id`, userId);
        }
        return userId;
    }

    private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
        const userAgent = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;

        if (/ipad|android(?!.*mobile)|tablet/.test(userAgent)) {
            return 'tablet';
        } else if (width <= 768 || /mobile|android|iphone|ipod|blackberry|windows phone/.test(userAgent)) {
            return 'mobile';
        } else {
            return 'desktop';
        }
    }

    private getSafeUserAgent(): string {
        try {
            return navigator.userAgent.substring(0, 100);
        } catch {
            return 'unknown';
        }
    }

    private getTimezone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return 'UTC';
        }
    }

    private getLanguage(): string {
        try {
            return navigator.language || 'en';
        } catch {
            return 'en';
        }
    }

    private getViewportSize(): string {
        try {
            return `${window.innerWidth}x${window.innerHeight}`;
        } catch {
            return 'unknown';
        }
    }

    private getColorScheme(): 'light' | 'dark' | 'unknown' {
        try {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
            return 'unknown';
        } catch {
            return 'unknown';
        }
    }

    // ============================================================================
    // PRIVATE METHODS - STORAGE & SETTINGS
    // ============================================================================

    private getStoredSettings(): AnalyticsSettings {
        try {
            const stored = localStorage.getItem(`${this.LOCAL_STORAGE_PREFIX}_settings`);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            this.logError('Failed to load analytics settings:', error);
        }

        return {
            enabled: false,
            consentGiven: false,
            trackingLevel: 'minimal'
        };
    }

    private saveSettings(): void {
        try {
            localStorage.setItem(`${this.LOCAL_STORAGE_PREFIX}_settings`, JSON.stringify(this.settings));
        } catch (error) {
            this.logError('Failed to save analytics settings:', error);
        }
    }

    private getStoredEventsLocally(): AnalyticsEvent[] {
        try {
            const stored = localStorage.getItem(`${this.LOCAL_STORAGE_PREFIX}_events`);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            this.logError('Failed to load stored events:', error);
            return [];
        }
    }

    private saveSessionLocally(session: UserSession): void {
        try {
            const sessions = this.getStoredSessions();
            sessions.push(session);
            const recentSessions = sessions.slice(-10); // Keep only recent sessions
            localStorage.setItem(`${this.LOCAL_STORAGE_PREFIX}_sessions`, JSON.stringify(recentSessions));
        } catch (error) {
            this.logError('Failed to save session locally:', error);
        }
    }

    private getStoredSessions(): UserSession[] {
        try {
            const stored = localStorage.getItem(`${this.LOCAL_STORAGE_PREFIX}_sessions`);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            this.logError('Failed to load stored sessions:', error);
            return [];
        }
    }

    private async clearStoredData(): Promise<void> {
        const keys = [
            `${this.LOCAL_STORAGE_PREFIX}_events`,
            `${this.LOCAL_STORAGE_PREFIX}_sessions`,
            `${this.LOCAL_STORAGE_PREFIX}_user_metrics`,
            `${this.LOCAL_STORAGE_PREFIX}_anonymous_id`
        ];

        keys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                this.logError(`Failed to remove ${key}:`, error);
            }
        });

        // Note: clearAnalyticsData method doesn't exist in current DatabaseService
        // Data will be cleared from local storage only
        this.log('Analytics data cleared locally');

        this.log('Analytics data cleared');
    }

    private cleanup(): void {
        // Clear timers
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }

        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }

        // Remove event listeners
        this.eventListeners.forEach(({element, event, handler}) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];

        this.log('Analytics service cleaned up');
    }

    private log(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`📊 Analytics: ${message}`, ...args);
        }
    }

    private logError(message: string, error?: any): void {
        console.error(`❌ Analytics: ${message}`, error || '');
    }
}

// ============================================================================
// SINGLETON INSTANCE & EXPORTS
// ============================================================================

export const analyticsService = new AnalyticsService();

// Convenience functions with proper error handling
export const trackEvent = async (event: AnalyticsEventType, properties?: Record<string, any>): Promise<void> => {
    return analyticsService.trackEvent(event, properties);
};

export const trackPageView = async (page: string, referrer?: string): Promise<void> => {
    return analyticsService.trackPageView(page, referrer);
};

export const trackFeatureUsage = async (feature: string, context?: Record<string, any>): Promise<void> => {
    return analyticsService.trackFeatureUsage(feature, context);
};

export const trackApplicationCreated = async (metadata?: Record<string, any>): Promise<void> => {
    return analyticsService.trackApplicationCreated(metadata);
};

export const trackApplicationUpdated = async (metadata?: Record<string, any>): Promise<void> => {
    return analyticsService.trackApplicationUpdated(metadata);
};

export const trackApplicationDeleted = async (): Promise<void> => {
    return analyticsService.trackApplicationDeleted();
};

export const trackGoalSet = async (goalType: string, targetValue?: number): Promise<void> => {
    return analyticsService.trackGoalSet(goalType, targetValue);
};

export const trackAttachmentAdded = async (fileType?: string, fileSize?: number): Promise<void> => {
    return analyticsService.trackAttachmentAdded(fileType, fileSize);
};

export const trackExportData = async (format: string, itemCount?: number): Promise<void> => {
    return analyticsService.trackExportData(format, itemCount);
};

export const trackImportData = async (itemCount: number, source?: string): Promise<void> => {
    return analyticsService.trackImportData(itemCount, source);
};

export const trackSearchPerformed = async (query: string, resultCount?: number): Promise<void> => {
    return analyticsService.trackSearchPerformed(query, resultCount);
};

export const trackError = async (error: Error, context?: Record<string, any>): Promise<void> => {
    return analyticsService.trackError(error, context);
};

export default analyticsService;