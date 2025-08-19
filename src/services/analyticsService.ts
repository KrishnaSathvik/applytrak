// src/services/analyticsService.ts - FIXED TO USE DATABASE SERVICE
import {AnalyticsEvent, AnalyticsEventType, AnalyticsSettings, UserMetrics, UserSession} from '../types';
import {databaseService} from './databaseService'; // ADDED: Import database service

class AnalyticsService {
    private sessionId: string;
    private sessionStart: number;
    private events: AnalyticsEvent[] = [];
    private settings: AnalyticsSettings;
    private userMetrics: UserMetrics | null = null;
    private isInitialized = false;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.settings = this.getStoredSettings();

        // Initialize if consent already given
        if (this.settings.consentGiven) {
            this.initialize();
        }
    }

    // ============================================================================
    // INITIALIZATION & CONSENT MANAGEMENT
    // ============================================================================

    async initialize(): Promise<void> {
        if (this.isInitialized || !this.settings.consentGiven) return;

        console.log('🔍 Analytics Service initialized with consent');

        try {
            // FIXED: Load existing user metrics from databaseService
            await this.loadUserMetrics();

            // FIXED: Track session start using databaseService
            await this.trackEvent('session_start', {
                deviceType: this.getDeviceType(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
                sessionId: this.sessionId
            });

            // Set up session end tracking
            this.setupSessionEndTracking();

            this.isInitialized = true;
            console.log('✅ Analytics initialized with databaseService integration');
        } catch (error) {
            console.warn('Analytics initialization failed:', error);
        }
    }

    // Enable analytics with user consent
    async enableAnalytics(settings: Partial<AnalyticsSettings> = {}): Promise<void> {
        this.settings = {
            enabled: true,
            consentGiven: true,
            consentDate: new Date().toISOString(),
            trackingLevel: 'standard',
            ...settings
        };

        this.saveSettings();
        await this.initialize();

        console.log('✅ Analytics enabled with user consent');
    }

    // Disable analytics and clear data
    disableAnalytics(): void {
        this.settings = {
            enabled: false,
            consentGiven: false,
            trackingLevel: 'minimal'
        };

        this.saveSettings();
        this.clearStoredData();
        this.isInitialized = false;

        console.log('🔒 Analytics disabled and data cleared');
    }

    // Check if analytics is enabled
    isEnabled(): boolean {
        return this.settings.enabled && this.settings.consentGiven && this.isInitialized;
    }

    // ============================================================================
    // EVENT TRACKING - FIXED TO USE DATABASE SERVICE
    // ============================================================================

    async trackEvent(event: AnalyticsEventType, properties?: Record<string, any>): Promise<void> {
        if (!this.isEnabled()) return;

        const analyticsEvent: AnalyticsEvent = {
            event,
            properties: this.sanitizeProperties(properties),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: this.getAnonymousUserId()
        };

        this.events.push(analyticsEvent);
        await this.updateUserMetrics(event, properties);

        // ENHANCED: Store events using databaseService with retry
        try {
            await databaseService.saveAnalyticsEvent(analyticsEvent);
            console.log('📊 Event tracked and synced:', event, properties);
        } catch (error) {
            console.warn('Failed to save analytics event:', error);

            // Try one more time after a short delay
            setTimeout(async () => {
                try {
                    await databaseService.saveAnalyticsEvent(analyticsEvent);
                    console.log('📊 Event tracked on retry:', event);
                } catch (retryError) {
                    console.warn('Event save failed on retry, storing locally:', retryError);
                    this.storeEventLocally(analyticsEvent);
                }
            }, 1000);
        }
    }

    // Track page/component views
    async trackPageView(page: string): Promise<void> {
        await this.trackEvent('page_view', {page});
    }

    // Track feature usage
    async trackFeatureUsage(feature: string, context?: Record<string, any>): Promise<void> {
        await this.trackEvent('feature_used', {feature, ...context});
    }

    // Track application-specific events
    async trackApplicationCreated(): Promise<void> {
        await this.trackEvent('application_created');
    }

    async trackApplicationUpdated(): Promise<void> {
        await this.trackEvent('application_updated');
    }

    async trackApplicationDeleted(): Promise<void> {
        await this.trackEvent('application_deleted');
    }

    async trackGoalSet(goalType: string): Promise<void> {
        await this.trackEvent('goal_set', {goalType});
    }

    async trackAttachmentAdded(): Promise<void> {
        await this.trackEvent('attachment_added');
    }

    async trackExportData(format: string): Promise<void> {
        await this.trackEvent('export_data', {format});
    }

    async trackImportData(itemCount: number): Promise<void> {
        await this.trackEvent('import_data', {itemCount});
    }

    async trackSearchPerformed(query: string): Promise<void> {
        // Don't store the actual query for privacy
        await this.trackEvent('search_performed', {
            queryLength: query.length,
            hasResults: query.length > 0
        });
    }

    // ============================================================================
    // USER METRICS & SESSION MANAGEMENT - FIXED TO USE DATABASE SERVICE
    // ============================================================================

    async getUserMetrics(): Promise<UserMetrics | null> {
        try {
            // FIXED: Get metrics from databaseService
            return await databaseService.getUserMetrics();
        } catch (error) {
            console.warn('Failed to get user metrics from database:', error);
            return this.userMetrics;
        }
    }

    async getAllEvents(): Promise<AnalyticsEvent[]> {
        try {
            // FIXED: Get events from databaseService
            return await databaseService.getAnalyticsEvents();
        } catch (error) {
            console.warn('Failed to get events from database:', error);
            return this.getStoredEventsLocally();
        }
    }

    getAllSessions(): UserSession[] {
        // Keep this as localStorage for now since it's more complex
        return this.getStoredSessions();
    }

    async getAnalyticsSummary() {
        const metrics = await this.getUserMetrics();
        const events = await this.getAllEvents();
        const sessions = this.getAllSessions();

        return {
            userMetrics: metrics,
            eventsCount: events.length,
            sessionsCount: sessions.length,
            averageSessionDuration: sessions.length > 0
                ? sessions.reduce((sum, s) => sum + Number(s.duration || 0), 0) / sessions.length
                : 0,
            lastActive: metrics?.lastActiveDate,
            consentStatus: this.settings
        };
    }

    // ============================================================================
    // SESSION MANAGEMENT - ENHANCED WITH DATABASE SERVICE
    // ============================================================================

    // Export all analytics data (for admin)
    async exportAnalyticsData() {
        const metrics = await this.getUserMetrics();
        const events = await this.getAllEvents();
        const sessions = this.getAllSessions();

        return {
            settings: this.settings,
            userMetrics: metrics,
            events: events,
            sessions: sessions,
            exportDate: new Date().toISOString()
        };
    }

    // FIXED: Load user metrics from databaseService
    private async loadUserMetrics(): Promise<void> {
        try {
            this.userMetrics = await databaseService.getUserMetrics();
            console.log('✅ User metrics loaded from databaseService');
        } catch (error) {
            console.warn('Failed to load user metrics from database, creating default:', error);
            this.userMetrics = {
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
    }

    // FIXED: Update user metrics using databaseService
    private async updateUserMetrics(event: AnalyticsEventType, properties?: Record<string, any>): Promise<void> {
        if (!this.userMetrics) return;

        // Update local copy
        this.userMetrics.totalEvents = (this.userMetrics.totalEvents || 0) + 1;
        this.userMetrics.lastActiveDate = new Date().toISOString();

        // Update specific metrics based on event type
        const updates: Partial<UserMetrics> = {};

        switch (event) {
            case 'application_created':
                updates.applicationsCreated = (this.userMetrics.applicationsCreated || 0) + 1;
                break;
            case 'application_updated':
                updates.applicationsUpdated = (this.userMetrics.applicationsUpdated || 0) + 1;
                break;
            case 'application_deleted':
                updates.applicationsDeleted = (this.userMetrics.applicationsDeleted || 0) + 1;
                break;
            case 'goal_set':
                updates.goalsSet = (this.userMetrics.goalsSet || 0) + 1;
                break;
            case 'attachment_added':
                updates.attachmentsAdded = (this.userMetrics.attachmentsAdded || 0) + 1;
                break;
            case 'export_data':
                updates.exportsPerformed = (this.userMetrics.exportsPerformed || 0) + 1;
                break;
            case 'import_data':
                updates.importsPerformed = (this.userMetrics.importsPerformed || 0) + 1;
                break;
            case 'search_performed':
                updates.searchesPerformed = (this.userMetrics.searchesPerformed || 0) + 1;
                break;
            case 'feature_used':
                if (properties?.feature) {
                    const currentFeatures = this.userMetrics.featuresUsed || [];
                    if (!currentFeatures.includes(properties.feature)) {
                        updates.featuresUsed = [...currentFeatures, properties.feature];
                    }
                }
                break;
            case 'session_start':
                updates.sessionsCount = (this.userMetrics.sessionsCount || 0) + 1;
                break;
        }

        // Apply updates to local copy
        Object.assign(this.userMetrics, updates, {
            totalEvents: this.userMetrics.totalEvents,
            lastActiveDate: this.userMetrics.lastActiveDate
        });

        // FIXED: Save to databaseService (which syncs to Supabase)
        try {
            await databaseService.updateUserMetrics(this.userMetrics);
            console.log('✅ User metrics updated and synced');
        } catch (error) {
            console.warn('Failed to update user metrics in database:', error);
        }
    }

    // ============================================================================
    // SESSION END TRACKING - ENHANCED WITH DATABASE SERVICE
    // ============================================================================

    private setupSessionEndTracking(): void {
        // Track session end on page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track session end on visibility change (mobile app switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackSessionEnd();
            }
        });

        // Track session end on idle timeout (30 minutes)
        let idleTimer: NodeJS.Timeout;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                this.trackSessionEnd();
            }, 30 * 60 * 1000); // 30 minutes
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetIdleTimer);
        });

        resetIdleTimer();
    }

    private async trackSessionEnd(): Promise<void> {
        const sessionDuration = Date.now() - this.sessionStart;

        await this.trackEvent('session_end', {
            duration: sessionDuration,
            eventsCount: this.events.length
        });

        // Update total time spent
        if (this.userMetrics) {
            this.userMetrics.totalTimeSpent = (this.userMetrics.totalTimeSpent || 0) + sessionDuration;

            try {
                await databaseService.updateUserMetrics(this.userMetrics);
            } catch (error) {
                console.warn('Failed to update session duration:', error);
            }
        }

        // FIXED: Save session using databaseService
        await this.saveSession(sessionDuration);
    }

    // FIXED: Save session using databaseService
    private async saveSession(duration: number): Promise<void> {
        if (!this.isEnabled()) return;

        const session: UserSession = {
            id: this.sessionId,
            startTime: new Date(this.sessionStart).toISOString(),
            endTime: new Date().toISOString(),
            duration,
            events: [...this.events],
            deviceType: this.getDeviceType(),
            userAgent: navigator.userAgent.substring(0, 100),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
        };

        try {
            // FIXED: Save session using databaseService (syncs to Supabase)
            await databaseService.saveUserSession(session);
            console.log('✅ Session saved and synced');
        } catch (error) {
            console.warn('Failed to save session to database:', error);
            // Fallback to localStorage
            this.saveSessionLocally(session);
        }
    }

    // ============================================================================
    // FALLBACK METHODS (localStorage) - Keep for backup
    // ============================================================================

    private storeEventLocally(event: AnalyticsEvent): void {
        try {
            const events = this.getStoredEventsLocally();
            events.push(event);
            const recentEvents = events.slice(-100);
            localStorage.setItem('applytrak_events', JSON.stringify(recentEvents));
        } catch (error) {
            console.warn('Failed to store analytics event locally:', error);
        }
    }

    private saveSessionLocally(session: UserSession): void {
        try {
            const sessions = this.getStoredSessions();
            sessions.push(session);
            const recentSessions = sessions.slice(-10);
            localStorage.setItem('applytrak_sessions', JSON.stringify(recentSessions));
        } catch (error) {
            console.warn('Failed to save session locally:', error);
        }
    }

    // ============================================================================
    // UTILITY METHODS - UNCHANGED
    // ============================================================================

    private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
        if (!properties) return {};

        const sanitized = {...properties};

        // Remove sensitive fields
        const sensitiveFields = ['email', 'password', 'token', 'personalInfo'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                delete sanitized[field];
            }
        });

        return sanitized;
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getAnonymousUserId(): string {
        // Try to get authenticated user ID first
        const authUserId = localStorage.getItem('applytrak_user_id');
        if (authUserId) {
            return authUserId; // Use authenticated user ID for consistency
        }

        // Fallback to anonymous ID
        let userId = localStorage.getItem('applytrak_anonymous_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('applytrak_anonymous_id', userId);
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

    private getStoredSettings(): AnalyticsSettings {
        try {
            const stored = localStorage.getItem('applytrak_analytics_settings');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load analytics settings:', error);
        }

        return {
            enabled: false,
            consentGiven: false,
            trackingLevel: 'minimal'
        };
    }

    private saveSettings(): void {
        localStorage.setItem('applytrak_analytics_settings', JSON.stringify(this.settings));
    }

    private getStoredEventsLocally(): AnalyticsEvent[] {
        try {
            const stored = localStorage.getItem('applytrak_events');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load stored events:', error);
            return [];
        }
    }

    private getStoredSessions(): UserSession[] {
        try {
            const stored = localStorage.getItem('applytrak_sessions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load stored sessions:', error);
            return [];
        }
    }

    private clearStoredData(): void {
        localStorage.removeItem('applytrak_events');
        localStorage.removeItem('applytrak_sessions');
        localStorage.removeItem('applytrak_user_metrics');
        localStorage.removeItem('applytrak_anonymous_id');
        console.log('🗑️ Analytics data cleared');
    }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// FIXED: Updated convenience functions to be async
export const trackEvent = async (event: AnalyticsEventType, properties?: Record<string, any>) => {
    await analyticsService.trackEvent(event, properties);
};

export const trackPageView = async (page: string) => await analyticsService.trackPageView(page);
export const trackFeatureUsage = async (feature: string) => await analyticsService.trackFeatureUsage(feature);
export const trackApplicationCreated = async () => await analyticsService.trackApplicationCreated();
export const trackApplicationUpdated = async () => await analyticsService.trackApplicationUpdated();
export const trackApplicationDeleted = async () => await analyticsService.trackApplicationDeleted();
export const trackGoalSet = async (goalType: string) => await analyticsService.trackGoalSet(goalType);
export const trackAttachmentAdded = async () => await analyticsService.trackAttachmentAdded();
export const trackExportData = async (format: string) => await analyticsService.trackExportData(format);
export const trackImportData = async (itemCount: number) => await analyticsService.trackImportData(itemCount);
export const trackSearchPerformed = async (query: string) => await analyticsService.trackSearchPerformed(query);

export default analyticsService;