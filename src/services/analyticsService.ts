// src/services/analyticsService.ts - Privacy-First Analytics System
import {AnalyticsEvent, AnalyticsEventType, AnalyticsSettings, UserMetrics, UserSession} from '../types';

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
            // Load existing user metrics
            await this.loadUserMetrics();

            // Track session start
            this.trackEvent('session_start', {
                deviceType: this.getDeviceType(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
                sessionId: this.sessionId
            });

            // Set up session end tracking
            this.setupSessionEndTracking();

            this.isInitialized = true;
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
    // EVENT TRACKING
    // ============================================================================

    trackEvent(event: AnalyticsEventType, properties?: Record<string, any>): void {
        if (!this.isEnabled()) return;

        const analyticsEvent: AnalyticsEvent = {
            event,
            properties: this.sanitizeProperties(properties),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: this.getAnonymousUserId()
        };

        this.events.push(analyticsEvent);
        this.updateUserMetrics(event, properties);

        // Store events locally (respecting privacy)
        this.storeEvent(analyticsEvent);

        // Send to your analytics endpoint if you have one
        this.sendEventToServer(analyticsEvent);

        console.log('📊 Event tracked:', event, properties);
    }

    // Track page/component views
    trackPageView(page: string): void {
        this.trackEvent('page_view', {page});
    }

    // Track feature usage
    trackFeatureUsage(feature: string, context?: Record<string, any>): void {
        this.trackEvent('feature_used', {feature, ...context});
    }

    // Track application-specific events
    trackApplicationCreated(): void {
        this.trackEvent('application_created');
    }

    trackApplicationUpdated(): void {
        this.trackEvent('application_updated');
    }

    trackApplicationDeleted(): void {
        this.trackEvent('application_deleted');
    }

    trackGoalSet(goalType: string): void {
        this.trackEvent('goal_set', {goalType});
    }

    trackAttachmentAdded(): void {
        this.trackEvent('attachment_added');
    }

    trackExportData(format: string): void {
        this.trackEvent('export_data', {format});
    }

    trackImportData(itemCount: number): void {
        this.trackEvent('import_data', {itemCount});
    }

    trackSearchPerformed(query: string): void {
        // Don't store the actual query for privacy
        this.trackEvent('search_performed', {
            queryLength: query.length,
            hasResults: query.length > 0
        });
    }

    // ============================================================================
    // USER METRICS & SESSION MANAGEMENT
    // ============================================================================

    getUserMetrics(): UserMetrics | null {
        return this.userMetrics;
    }

    getAllEvents(): AnalyticsEvent[] {
        return this.getStoredEvents();
    }

    getAllSessions(): UserSession[] {
        return this.getStoredSessions();
    }

    getAnalyticsSummary() {
        const metrics = this.getUserMetrics();
        const events = this.getAllEvents();
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
    // SESSION MANAGEMENT
    // ============================================================================

    // Export all analytics data (for admin)
    exportAnalyticsData() {
        return {
            settings: this.settings,
            userMetrics: this.userMetrics,
            events: this.getAllEvents(),
            sessions: this.getAllSessions(),
            exportDate: new Date().toISOString()
        };
    }

    private async loadUserMetrics(): Promise<void> {
        try {
            const stored = localStorage.getItem('applytrak_user_metrics');
            if (stored) {
                this.userMetrics = JSON.parse(stored);
            } else {
                this.userMetrics = {
                    sessionsCount: 1,
                    totalTimeSpent: 0,
                    applicationsCreated: 0,
                    featuresUsed: [],
                    lastActiveDate: new Date().toISOString(),
                    deviceType: this.getDeviceType(),
                    firstVisit: new Date().toISOString(),
                    totalEvents: 0
                };
            }
        } catch (error) {
            console.warn('Failed to load user metrics:', error);
            this.userMetrics = null;
        }
    }

    private updateUserMetrics(event: AnalyticsEventType, properties?: Record<string, any>): void {
        if (!this.userMetrics) return;

        this.userMetrics.totalEvents++;
        this.userMetrics.lastActiveDate = new Date().toISOString();

        // Update specific metrics based on event type
        switch (event) {
            case 'application_created':
                this.userMetrics.applicationsCreated++;
                break;
            case 'feature_used':
                if (properties?.feature && !this.userMetrics.featuresUsed.includes(properties.feature)) {
                    this.userMetrics.featuresUsed.push(properties.feature);
                }
                break;
            case 'session_start':
                this.userMetrics.sessionsCount++;
                break;
        }

        this.saveUserMetrics();
    }

    // ============================================================================
    // DATA MANAGEMENT & PRIVACY
    // ============================================================================

    private saveUserMetrics(): void {
        if (this.userMetrics && this.isEnabled()) {
            localStorage.setItem('applytrak_user_metrics', JSON.stringify(this.userMetrics));
        }
    }

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

    private trackSessionEnd(): void {
        const sessionDuration = Date.now() - this.sessionStart;

        this.trackEvent('session_end', {
            duration: sessionDuration,
            eventsCount: this.events.length
        });

        // Update total time spent
        if (this.userMetrics) {
            this.userMetrics.totalTimeSpent += sessionDuration;
            this.saveUserMetrics();
        }

        // Save session data
        this.saveSession(sessionDuration);
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    private saveSession(duration: number): void {
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

        // Store session locally
        const sessions = this.getStoredSessions();
        sessions.push(session);

        // Keep only last 10 sessions for storage efficiency
        const recentSessions = sessions.slice(-10);
        localStorage.setItem('applytrak_sessions', JSON.stringify(recentSessions));
    }

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

    private storeEvent(event: AnalyticsEvent): void {
        if (!this.isEnabled()) return;

        try {
            const events = this.getStoredEvents();
            events.push(event);

            // Keep only last 100 events for storage efficiency
            const recentEvents = events.slice(-100);
            localStorage.setItem('applytrak_events', JSON.stringify(recentEvents));
        } catch (error) {
            console.warn('Failed to store analytics event:', error);
        }
    }

    private async sendEventToServer(event: AnalyticsEvent): Promise<void> {
        // Only send if user consents to detailed tracking
        if (this.settings.trackingLevel !== 'detailed') return;

        try {
            // You can implement your own analytics endpoint here
            // await fetch('/api/analytics/events', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(event)
            // });
        } catch (error) {
            console.warn('Failed to send analytics event to server:', error);
        }
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getAnonymousUserId(): string {
        let userId = localStorage.getItem('applytrak_anonymous_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('applytrak_anonymous_id', userId);
        }
        return userId;
    }

    private getDeviceType(): 'mobile' | 'desktop' {
        return window.innerWidth <= 768 ? 'mobile' : 'desktop';
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

    // ============================================================================
    // PUBLIC DATA ACCESS (For Admin Dashboard)
    // ============================================================================

    private saveSettings(): void {
        localStorage.setItem('applytrak_analytics_settings', JSON.stringify(this.settings));
    }

    private getStoredEvents(): AnalyticsEvent[] {
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

// Convenience functions for easy tracking
export const trackEvent = (event: AnalyticsEventType, properties?: Record<string, any>) => {
    analyticsService.trackEvent(event, properties);
};

export const trackPageView = (page: string) => analyticsService.trackPageView(page);
export const trackFeatureUsage = (feature: string) => analyticsService.trackFeatureUsage(feature);
export const trackApplicationCreated = () => analyticsService.trackApplicationCreated();
export const trackApplicationUpdated = () => analyticsService.trackApplicationUpdated();
export const trackApplicationDeleted = () => analyticsService.trackApplicationDeleted();
export const trackGoalSet = (goalType: string) => analyticsService.trackGoalSet(goalType);
export const trackAttachmentAdded = () => analyticsService.trackAttachmentAdded();
export const trackExportData = (format: string) => analyticsService.trackExportData(format);
export const trackImportData = (itemCount: number) => analyticsService.trackImportData(itemCount);
export const trackSearchPerformed = (query: string) => analyticsService.trackSearchPerformed(query);

export default analyticsService;