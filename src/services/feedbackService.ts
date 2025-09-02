// src/services/feedbackService.ts - User Feedback Management System (Production Optimized)
import type {FeedbackStats, FeedbackSubmission} from '../types';

/**
 * Production-ready feedback management service
 * Handles user feedback collection, storage, and analytics
 */
class FeedbackService {
    private readonly STORAGE_KEY = 'applytrak_feedback';
    private readonly MAX_STORED_FEEDBACK = 100;
    private readonly FEEDBACK_VERSION = '1.0.0';
    private readonly MESSAGE_MAX_LENGTH = 2000;
    private readonly MESSAGE_MIN_LENGTH = 3;

    // Cache for frequently accessed data
    private feedbackCache: FeedbackSubmission[] | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // ============================================================================
    // PUBLIC API - FEEDBACK SUBMISSION
    // ============================================================================

    /**
     * Submit new feedback with comprehensive validation and error handling
     */
    async submitFeedback(
        type: FeedbackSubmission['type'],
        rating: number,
        message: string,
        email?: string
    ): Promise<FeedbackSubmission> {
        // Input validation
        this.validateFeedbackInput(type, rating, message);

        const metadata = await this.gatherMetadata();
        const feedback: FeedbackSubmission = {
            id: this.generateFeedbackId(),
            type,
            rating: this.normalizeRating(rating),
            message: this.sanitizeMessage(message),
            ...(email && { email: this.sanitizeEmail(email) }),
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            userAgent: this.getSafeUserAgent(),
            url: this.getCurrentUrl(),
            ...(metadata && { metadata })
        };

        try {
            // Store feedback locally first
            await this.storeFeedback(feedback);

            // Track analytics
            this.trackFeedbackSubmission(feedback);

            // Attempt server submission (non-blocking)
            this.sendFeedbackToServer(feedback).catch(error =>
                console.warn('Server submission failed:', error)
            );

            this.log('Feedback submitted successfully:', feedback.id);
            return feedback;

        } catch (error) {
            this.logError('Failed to submit feedback:', error);
            throw new Error('Failed to submit feedback. Please try again.');
        }
    }

    // ============================================================================
    // PUBLIC API - FEEDBACK RETRIEVAL
    // ============================================================================

    /**
     * Get all stored feedback with caching
     */
    getAllFeedback(): FeedbackSubmission[] {
        // Return cached data if valid
        if (this.isCacheValid()) {
            return this.feedbackCache!;
        }

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                this.updateCache([]);
                return [];
            }

            const parsed = JSON.parse(stored);

            if (!Array.isArray(parsed)) {
                this.logError('Invalid feedback data structure, resetting');
                this.clearAllFeedback();
                this.updateCache([]);
                return [];
            }

            const validFeedback = parsed.filter(this.isValidFeedbackSubmission);
            this.updateCache(validFeedback);
            return validFeedback;

        } catch (error) {
            this.logError('Failed to load feedback:', error);
            this.updateCache([]);
            return [];
        }
    }

    /**
     * Get specific feedback by ID
     */
    getFeedbackById(id: string): FeedbackSubmission | null {
        if (!this.isValidString(id)) return null;
        return this.getAllFeedback().find(f => f.id === id) || null;
    }

    /**
     * Get feedback filtered by type
     */
    getFeedbackByType(type: FeedbackSubmission['type']): FeedbackSubmission[] {
        return this.getAllFeedback().filter(f => f.type === type);
    }

    /**
     * Get recent feedback with safe limit enforcement
     */
    getRecentFeedback(limit: number = 10): FeedbackSubmission[] {
        const safeLimit = this.clampNumber(limit, 1, 100);

        return this.getAllFeedback()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, safeLimit);
    }

    // ============================================================================
    // PUBLIC API - FEEDBACK ANALYTICS
    // ============================================================================

    /**
     * Calculate comprehensive feedback statistics
     */
    getFeedbackStats(): FeedbackStats {
        const allFeedback = this.getAllFeedback();

        if (allFeedback.length === 0) {
            return this.getEmptyStats();
        }

        const typeDistribution = this.calculateTypeDistribution(allFeedback);
        const ratingDistribution = this.calculateRatingDistribution(allFeedback);
        const averageRating = this.calculateAverageRating(allFeedback);

        return {
            totalSubmissions: allFeedback.length,
            averageRating,
            typeDistribution,
            ratingDistribution
        };
    }

    /**
     * Get feedback trends over specified time period
     */
    getFeedbackTrends(days: number = 30): Array<{
        date: string;
        total: number;
        averageRating: number;
        typeBreakdown: Record<FeedbackSubmission['type'], number>;
    }> {
        const safeDays = this.clampNumber(days, 1, 365);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - safeDays);

        const recentFeedback = this.getAllFeedback()
            .filter(f => new Date(f.timestamp) >= cutoffDate);

        const trendsByDay = this.groupFeedbackByDay(recentFeedback);

        return Object.entries(trendsByDay)
            .map(([date, stats]) => this.formatTrendData(date, stats))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    // ============================================================================
    // PUBLIC API - FEEDBACK MANAGEMENT
    // ============================================================================

    /**
     * Mark feedback as read with validation
     */
    markFeedbackAsRead(feedbackId: string): boolean {
        if (!this.isValidString(feedbackId)) return false;

        try {
            const allFeedback = this.getAllFeedback();
            const feedbackIndex = allFeedback.findIndex(f => f.id === feedbackId);

            if (feedbackIndex === -1) return false;

            allFeedback[feedbackIndex] = {
                ...allFeedback[feedbackIndex],
                metadata: {
                    ...allFeedback[feedbackIndex].metadata,
                    read: true,
                    readAt: new Date().toISOString()
                }
            };

            this.persistFeedback(allFeedback);
            this.invalidateCache();
            return true;

        } catch (error) {
            this.logError('Failed to mark feedback as read:', error);
            return false;
        }
    }

    /**
     * Delete specific feedback with validation
     */
    deleteFeedback(feedbackId: string): boolean {
        if (!this.isValidString(feedbackId)) return false;

        try {
            const allFeedback = this.getAllFeedback();
            const initialLength = allFeedback.length;
            const filtered = allFeedback.filter(f => f.id !== feedbackId);

            if (filtered.length === initialLength) return false;

            this.persistFeedback(filtered);
            this.invalidateCache();
            return true;

        } catch (error) {
            this.logError('Failed to delete feedback:', error);
            return false;
        }
    }

    /**
     * Export complete feedback dataset
     */
    exportFeedbackData() {
        return {
            feedback: this.getAllFeedback(),
            stats: this.getFeedbackStats(),
            trends: this.getFeedbackTrends(),
            exportDate: new Date().toISOString(),
            version: this.FEEDBACK_VERSION
        };
    }

    /**
     * Clear all feedback data
     */
    clearAllFeedback(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.invalidateCache();
            this.log('All feedback cleared');
        } catch (error) {
            this.logError('Failed to clear feedback:', error);
        }
    }

    // ============================================================================
    // PUBLIC API - USER EXPERIENCE HELPERS
    // ============================================================================

    /**
     * Check if user has submitted feedback recently
     */
    hasRecentFeedback(withinMinutes: number = 30): boolean {
        const safeMinutes = this.clampNumber(withinMinutes, 1, 1440);
        const cutoff = new Date();
        cutoff.setMinutes(cutoff.getMinutes() - safeMinutes);

        try {
            return this.getAllFeedback()
                .some(f => new Date(f.timestamp) >= cutoff);
        } catch (error) {
            this.logError('Failed to check recent feedback:', error);
            return false;
        }
    }

    /**
     * Get suggested feedback type based on user behavior
     */
    getSuggestedFeedbackType(): FeedbackSubmission['type'] {
        try {
            const analyticsService = this.getAnalyticsService();
            const userMetrics = analyticsService?.getUserMetrics();

            if (!userMetrics) return 'general';

            // Suggest based on user engagement
            if (userMetrics.applicationsCreated >= 20 || userMetrics.featuresUsed?.length >= 10) {
                return 'love';
            }

            if (userMetrics.applicationsCreated >= 5 || userMetrics.featuresUsed?.length >= 5) {
                return 'feature';
            }

            return 'general';

        } catch (error) {
            this.logError('Failed to get suggested feedback type:', error);
            return 'general';
        }
    }

    /**
     * Clean up old feedback data with safety limits
     */
    cleanupOldFeedback(olderThanDays: number = 90): number {
        const safeDays = this.clampNumber(olderThanDays, 1, 365);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - safeDays);

        try {
            const allFeedback = this.getAllFeedback();
            const recentFeedback = allFeedback.filter(f => new Date(f.timestamp) >= cutoffDate);
            const deletedCount = allFeedback.length - recentFeedback.length;

            if (deletedCount > 0) {
                this.persistFeedback(recentFeedback);
                this.invalidateCache();
                this.log(`Cleaned up ${deletedCount} feedback items older than ${safeDays} days`);
            }

            return deletedCount;

        } catch (error) {
            this.logError('Failed to cleanup old feedback:', error);
            return 0;
        }
    }

    /**
     * Get storage usage statistics
     */
    getStorageStats(): {
        totalFeedback: number;
        storageSize: number;
        oldestFeedback?: string;
        newestFeedback?: string;
    } {
        try {
            const allFeedback = this.getAllFeedback();
            const storageData = localStorage.getItem(this.STORAGE_KEY) || '[]';
            const timestamps = allFeedback.map(f => f.timestamp).sort();

            return {
                totalFeedback: allFeedback.length,
                storageSize: new Blob([storageData]).size,
                oldestFeedback: timestamps[0],
                newestFeedback: timestamps[timestamps.length - 1]
            };

        } catch (error) {
            this.logError('Failed to get storage stats:', error);
            return {
                totalFeedback: 0,
                storageSize: 0
            };
        }
    }

    // ============================================================================
    // PRIVATE METHODS - VALIDATION & SANITIZATION
    // ============================================================================

    private validateFeedbackInput(
        type: FeedbackSubmission['type'],
        rating: number,
        message: string
    ): void {
        const validTypes: FeedbackSubmission['type'][] = ['bug', 'feature', 'general', 'love'];

        if (!validTypes.includes(type)) {
            throw new Error(`Invalid feedback type: ${type}`);
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error(`Invalid rating: ${rating}. Must be integer between 1-5`);
        }

        if (!this.isValidString(message) || message.trim().length < this.MESSAGE_MIN_LENGTH) {
            throw new Error(`Message too short. Minimum ${this.MESSAGE_MIN_LENGTH} characters required`);
        }

        if (message.length > this.MESSAGE_MAX_LENGTH) {
            throw new Error(`Message too long. Maximum ${this.MESSAGE_MAX_LENGTH} characters allowed`);
        }
    }

    private sanitizeMessage(message: string): string {
        return message
            .trim()
            .substring(0, this.MESSAGE_MAX_LENGTH)
            .replace(/\s+/g, ' ')
            .replace(/[<>]/g, '');
    }

    private sanitizeEmail(email: string): string {
        const trimmed = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed) ? trimmed : '';
    }

    private normalizeRating(rating: number): number {
        return Math.max(1, Math.min(5, Math.round(rating)));
    }

    private isValidFeedbackSubmission = (item: any): item is FeedbackSubmission => {
        return (
            item &&
            typeof item === 'object' &&
            this.isValidString(item.id) &&
            this.isValidString(item.type) &&
            typeof item.rating === 'number' &&
            this.isValidString(item.message) &&
            this.isValidString(item.timestamp) &&
            ['bug', 'feature', 'general', 'love'].includes(item.type) &&
            item.rating >= 1 &&
            item.rating <= 5
        );
    };

    // ============================================================================
    // PRIVATE METHODS - STORAGE & CACHING
    // ============================================================================

    private async storeFeedback(feedback: FeedbackSubmission): Promise<void> {
        const allFeedback = this.getAllFeedback();
        allFeedback.push(feedback);

        const recentFeedback = allFeedback
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, this.MAX_STORED_FEEDBACK);

        this.persistFeedback(recentFeedback);
        this.invalidateCache();
    }

    private persistFeedback(feedback: FeedbackSubmission[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(feedback));
        } catch (error) {
            this.logError('Failed to persist feedback:', error);
            throw error;
        }
    }

    private updateCache(feedback: FeedbackSubmission[]): void {
        this.feedbackCache = feedback;
        this.cacheTimestamp = Date.now();
    }

    private invalidateCache(): void {
        this.feedbackCache = null;
        this.cacheTimestamp = 0;
    }

    private isCacheValid(): boolean {
        return (
            this.feedbackCache !== null &&
            Date.now() - this.cacheTimestamp < this.CACHE_TTL
        );
    }

    // ============================================================================
    // PRIVATE METHODS - SERVER COMMUNICATION
    // ============================================================================

    private async sendFeedbackToServer(feedback: FeedbackSubmission): Promise<void> {
        const serverFeedback = {
            id: feedback.id,
            type: feedback.type,
            rating: feedback.rating,
            message: feedback.message,
            email: feedback.email,
            timestamp: feedback.timestamp,
            url: feedback.url,
            metadata: {
                deviceType: feedback.metadata?.deviceType,
                timezone: feedback.metadata?.timezone,
                language: feedback.metadata?.language
            }
        };

        this.log('Would send feedback to server:', serverFeedback);

        // TODO: Implement actual server endpoint when available
        /*
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Feedback-Version': this.FEEDBACK_VERSION
          },
          body: JSON.stringify(serverFeedback)
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        */
    }

    // ============================================================================
    // PRIVATE METHODS - ANALYTICS & STATISTICS
    // ============================================================================

    private calculateTypeDistribution(feedback: FeedbackSubmission[]): Record<FeedbackSubmission['type'], number> {
        return feedback.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {bug: 0, feature: 0, general: 0, love: 0});
    }

    private calculateRatingDistribution(feedback: FeedbackSubmission[]): {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number
    } {
        return feedback.reduce((acc, item) => {
            const rating = item.rating as keyof typeof acc;
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
        }, {1: 0, 2: 0, 3: 0, 4: 0, 5: 0} as { 1: number; 2: number; 3: number; 4: number; 5: number });
    }

    private calculateAverageRating(feedback: FeedbackSubmission[]): number {
        const totalRating = feedback.reduce((sum, item) => sum + item.rating, 0);
        return Number((totalRating / feedback.length).toFixed(2));
    }

    private groupFeedbackByDay(feedback: FeedbackSubmission[]): Record<string, any> {
        return feedback.reduce((acc, item) => {
            const day = item.timestamp.split('T')[0];
            if (!acc[day]) {
                acc[day] = {
                    total: 0,
                    bug: 0,
                    feature: 0,
                    general: 0,
                    love: 0,
                    totalRating: 0
                };
            }
            acc[day].total++;
            acc[day][item.type]++;
            acc[day].totalRating += item.rating;
            return acc;
        }, {} as Record<string, any>);
    }

    private formatTrendData(date: string, stats: any) {
        return {
            date,
            total: stats.total,
            averageRating: Number((stats.totalRating / stats.total).toFixed(2)),
            typeBreakdown: {
                bug: stats.bug,
                feature: stats.feature,
                general: stats.general,
                love: stats.love
            }
        };
    }

    private getEmptyStats(): FeedbackStats {
        return {
            totalSubmissions: 0,
            averageRating: 0,
            typeDistribution: {bug: 0, feature: 0, general: 0, love: 0},
            ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        };
    }

    private trackFeedbackSubmission(feedback: FeedbackSubmission): void {
        try {
            const analyticsService = this.getAnalyticsService();
            if (analyticsService?.isEnabled()) {
                analyticsService.trackEvent('feedback_submitted', {
                    type: feedback.type,
                    rating: feedback.rating,
                    hasEmail: !!feedback.email,
                    messageLength: feedback.message.length
                });
            }
        } catch (error) {
            this.logError('Failed to track feedback submission:', error);
        }
    }

    // ============================================================================
    // PRIVATE METHODS - UTILITY & METADATA
    // ============================================================================

    private generateFeedbackId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 11);
        return `feedback_${timestamp}_${random}`;
    }

    private getSessionId(): string {
        try {
            const analyticsService = this.getAnalyticsService();
            if (analyticsService?.isEnabled()) {
                return analyticsService.getCurrentSessionId() || this.generateSessionId();
            }
            return this.generateSessionId();
        } catch {
            return this.generateSessionId();
        }
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private getSafeUserAgent(): string {
        try {
            return navigator.userAgent.substring(0, 200);
        } catch {
            return 'unknown';
        }
    }

    private getCurrentUrl(): string {
        try {
            return window.location.pathname + window.location.search;
        } catch {
            return '/';
        }
    }

    private async gatherMetadata(): Promise<FeedbackSubmission['metadata']> {
        try {
            return {
                applicationsCount: this.getApplicationsCount(),
                sessionDuration: this.getSessionDuration(),
                deviceType: this.getDeviceType(),
                screenResolution: this.getScreenResolution(),
                timezone: this.getTimezone(),
                language: this.getLanguage()
            };
        } catch (error) {
            this.logError('Failed to gather feedback metadata:', error);
            return {};
        }
    }

    private getApplicationsCount(): number {
        try {
            const storedData = localStorage.getItem('applytrak-store');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                return parsed.state?.applications?.length || 0;
            }
            return 0;
        } catch {
            return 0;
        }
    }

    private getSessionDuration(): number {
        try {
            if (typeof performance !== 'undefined' && performance.timing) {
                return Date.now() - performance.timing.navigationStart;
            }
            return 0;
        } catch {
            return 0;
        }
    }

    private getDeviceType(): 'mobile' | 'desktop' {
        try {
            return window.innerWidth <= 768 ? 'mobile' : 'desktop';
        } catch {
            return 'desktop';
        }
    }

    private getScreenResolution(): string {
        try {
            return `${window.screen.width}x${window.screen.height}`;
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

    private getAnalyticsService(): any {
        try {
            // Use dynamic import to avoid circular dependencies
            return require('./analyticsService').analyticsService;
        } catch {
            return null;
        }
    }

    // ============================================================================
    // PRIVATE METHODS - UTILITIES
    // ============================================================================

    private isValidString(value: any): value is string {
        return typeof value === 'string' && value.trim().length > 0;
    }

    private clampNumber(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private log(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔄 FeedbackService: ${message}`, ...args);
        }
    }

    private logError(message: string, error?: any): void {
        console.error(`❌ FeedbackService: ${message}`, error || '');
    }
}

// ============================================================================
// SINGLETON INSTANCE & EXPORTS
// ============================================================================

export const feedbackService = new FeedbackService();

// Convenience functions with proper error handling
export const submitFeedback = async (
    type: FeedbackSubmission['type'],
    rating: number,
    message: string,
    email?: string
): Promise<FeedbackSubmission> => {
    return await feedbackService.submitFeedback(type, rating, message, email);
};

export const getFeedbackStats = (): FeedbackStats => {
    return feedbackService.getFeedbackStats();
};

export const getAllFeedback = (): FeedbackSubmission[] => {
    return feedbackService.getAllFeedback();
};

export const hasRecentFeedback = (minutes?: number): boolean => {
    return feedbackService.hasRecentFeedback(minutes);
};

export const getSuggestedFeedbackType = (): FeedbackSubmission['type'] => {
    return feedbackService.getSuggestedFeedbackType();
};

export default feedbackService;