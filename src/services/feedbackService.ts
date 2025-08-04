// src/services/feedbackService.ts - User Feedback Management System (FIXED & ENHANCED)
import type {FeedbackStats, FeedbackSubmission} from '../types';

class FeedbackService {
    private readonly STORAGE_KEY = 'applytrak_feedback';
    private readonly MAX_STORED_FEEDBACK = 100; // Increased limit for better data retention
    private readonly FEEDBACK_VERSION = '1.0.0';

    // ============================================================================
    // FEEDBACK SUBMISSION
    // ============================================================================

    async submitFeedback(
        type: FeedbackSubmission['type'],
        rating: number,
        message: string,
        email?: string
    ): Promise<FeedbackSubmission> {
        // Validate input parameters
        if (!this.validateFeedbackInput(type, rating, message)) {
            throw new Error('Invalid feedback parameters');
        }

        // Create feedback object
        const feedback: FeedbackSubmission = {
            id: this.generateFeedbackId(),
            type,
            rating: Math.max(1, Math.min(5, Math.round(rating))), // Ensure rating is 1-5
            message: this.sanitizeMessage(message),
            email: email ? this.sanitizeEmail(email) : undefined,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            userAgent: this.getSafeUserAgent(),
            url: this.getCurrentUrl(),
            metadata: await this.gatherMetadata()
        };

        try {
            // Store feedback locally
            await this.storeFeedback(feedback);

            // Track feedback submission in analytics (with safe check)
            this.trackFeedbackSubmission(feedback);

            // Send to server if endpoint is available
            await this.sendFeedbackToServer(feedback);

            console.log('✅ Feedback submitted successfully:', feedback.id);
            return feedback;

        } catch (error) {
            console.error('❌ Failed to submit feedback:', error);
            throw new Error('Failed to submit feedback. Please try again.');
        }
    }

    // ============================================================================
    // FEEDBACK VALIDATION
    // ============================================================================

    getAllFeedback(): FeedbackSubmission[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) return [];

            const parsed = JSON.parse(stored);

            // Validate stored data structure
            if (!Array.isArray(parsed)) {
                console.warn('Invalid feedback data structure, resetting');
                this.clearAllFeedback();
                return [];
            }

            return parsed.filter(this.isValidFeedbackSubmission);
        } catch (error) {
            console.warn('Failed to load feedback:', error);
            return [];
        }
    }

    getFeedbackById(id: string): FeedbackSubmission | null {
        if (!id || typeof id !== 'string') return null;

        const allFeedback = this.getAllFeedback();
        return allFeedback.find(f => f.id === id) || null;
    }

    getFeedbackByType(type: FeedbackSubmission['type']): FeedbackSubmission[] {
        return this.getAllFeedback().filter(f => f.type === type);
    }

    // ============================================================================
    // FEEDBACK RETRIEVAL (For Admin Dashboard)
    // ============================================================================

    getRecentFeedback(limit: number = 10): FeedbackSubmission[] {
        const safeLimit = Math.max(1, Math.min(100, limit)); // Limit between 1-100

        return this.getAllFeedback()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, safeLimit);
    }

    getFeedbackStats(): FeedbackStats {
        const allFeedback = this.getAllFeedback();

        if (allFeedback.length === 0) {
            return {
                totalSubmissions: 0,
                averageRating: 0,
                typeDistribution: {bug: 0, feature: 0, general: 0, love: 0},
                ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            };
        }

        // Calculate type distribution
        const typeDistribution = allFeedback.reduce((acc, feedback) => {
            acc[feedback.type] = (acc[feedback.type] || 0) + 1;
            return acc;
        }, {bug: 0, feature: 0, general: 0, love: 0});

        // Calculate rating distribution
        const ratingDistribution = allFeedback.reduce((acc, feedback) => {
            const rating = feedback.rating as keyof typeof acc;
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
        }, {1: 0, 2: 0, 3: 0, 4: 0, 5: 0});

        // Calculate average rating
        const totalRating = allFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
        const averageRating = Number((totalRating / allFeedback.length).toFixed(2));

        return {
            totalSubmissions: allFeedback.length,
            averageRating,
            typeDistribution,
            ratingDistribution
        };
    }

    // Get feedback trends over time
    getFeedbackTrends(days: number = 30): Array<{
        date: string;
        total: number;
        averageRating: number;
        typeBreakdown: Record<FeedbackSubmission['type'], number>;
    }> {
        const safeDays = Math.max(1, Math.min(365, days)); // Limit between 1-365 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - safeDays);

        const recentFeedback = this.getAllFeedback()
            .filter(f => new Date(f.timestamp) >= cutoffDate);

        // Group by day
        const trendsByDay = recentFeedback.reduce((acc, feedback) => {
            const day = feedback.timestamp.split('T')[0];
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
            acc[day][feedback.type]++;
            acc[day].totalRating += feedback.rating;
            return acc;
        }, {} as Record<string, any>);

        return Object.entries(trendsByDay).map(([date, stats]) => ({
            date,
            total: stats.total,
            averageRating: Number((stats.totalRating / stats.total).toFixed(2)),
            typeBreakdown: {
                bug: stats.bug,
                feature: stats.feature,
                general: stats.general,
                love: stats.love
            }
        })).sort((a, b) => a.date.localeCompare(b.date));
    }

    markFeedbackAsRead(feedbackId: string): boolean {
        try {
            if (!feedbackId || typeof feedbackId !== 'string') return false;

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

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allFeedback));
            return true;
        } catch (error) {
            console.error('Failed to mark feedback as read:', error);
            return false;
        }
    }

    // ============================================================================
    // FEEDBACK STATISTICS (For Admin Dashboard)
    // ============================================================================

    deleteFeedback(feedbackId: string): boolean {
        try {
            if (!feedbackId || typeof feedbackId !== 'string') return false;

            const allFeedback = this.getAllFeedback();
            const filtered = allFeedback.filter(f => f.id !== feedbackId);

            if (filtered.length === allFeedback.length) return false; // Nothing was deleted

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Failed to delete feedback:', error);
            return false;
        }
    }

    // Export feedback data (for admin)
    exportFeedbackData() {
        return {
            feedback: this.getAllFeedback(),
            stats: this.getFeedbackStats(),
            trends: this.getFeedbackTrends(),
            exportDate: new Date().toISOString(),
            version: this.FEEDBACK_VERSION
        };
    }

    // ============================================================================
    // FEEDBACK MANAGEMENT (For Admin)
    // ============================================================================

    // Clear all feedback (admin action)
    clearAllFeedback(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('🧹 All feedback cleared');
        } catch (error) {
            console.error('Failed to clear feedback:', error);
        }
    }

    // Check if user has recently submitted feedback (to avoid spam)
    hasRecentFeedback(withinMinutes: number = 30): boolean {
        try {
            const safeMinutes = Math.max(1, Math.min(1440, withinMinutes)); // 1 minute to 24 hours
            const cutoff = new Date();
            cutoff.setMinutes(cutoff.getMinutes() - safeMinutes);

            const recentFeedback = this.getAllFeedback()
                .filter(f => new Date(f.timestamp) >= cutoff);

            return recentFeedback.length > 0;
        } catch (error) {
            console.warn('Failed to check recent feedback:', error);
            return false;
        }
    }

    // Get suggested feedback type based on user behavior
    getSuggestedFeedbackType(): FeedbackSubmission['type'] {
        try {
            const analyticsService = this.getAnalyticsService();
            const userMetrics = analyticsService?.getUserMetrics();

            if (!userMetrics) return 'general';

            // Suggest 'love' for highly engaged users
            if (userMetrics.applicationsCreated >= 20 || userMetrics.featuresUsed.length >= 10) {
                return 'love';
            }

            // Suggest 'feature' for moderately active users
            if (userMetrics.applicationsCreated >= 5 || userMetrics.featuresUsed.length >= 5) {
                return 'feature';
            }

            // Default to general for new users
            return 'general';
        } catch (error) {
            console.warn('Failed to get suggested feedback type:', error);
            return 'general';
        }
    }

    // Clean up old feedback data
    cleanupOldFeedback(olderThanDays: number = 90): number {
        try {
            const safeDays = Math.max(1, Math.min(365, olderThanDays));
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - safeDays);

            const allFeedback = this.getAllFeedback();
            const recentFeedback = allFeedback.filter(f => new Date(f.timestamp) >= cutoffDate);
            const deletedCount = allFeedback.length - recentFeedback.length;

            if (deletedCount > 0) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentFeedback));
                console.log(`🧹 Cleaned up ${deletedCount} feedback items older than ${safeDays} days`);
            }

            return deletedCount;
        } catch (error) {
            console.error('Failed to cleanup old feedback:', error);
            return 0;
        }
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    // Get storage usage statistics
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
            console.error('Failed to get storage stats:', error);
            return {
                totalFeedback: 0,
                storageSize: 0
            };
        }
    }

    private validateFeedbackInput(
        type: FeedbackSubmission['type'],
        rating: number,
        message: string
    ): boolean {
        // Validate type
        const validTypes: FeedbackSubmission['type'][] = ['bug', 'feature', 'general', 'love'];
        if (!validTypes.includes(type)) {
            console.error('Invalid feedback type:', type);
            return false;
        }

        // Validate rating
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            console.error('Invalid rating:', rating);
            return false;
        }

        // Validate message
        if (typeof message !== 'string' || message.trim().length < 3) {
            console.error('Invalid message: too short');
            return false;
        }

        if (message.length > 2000) {
            console.error('Invalid message: too long');
            return false;
        }

        return true;
    }

    private sanitizeMessage(message: string): string {
        return message
            .trim()
            .substring(0, 2000) // Limit length
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[<>]/g, ''); // Remove potential HTML tags
    }

    private sanitizeEmail(email: string): string {
        const trimmed = email.trim().toLowerCase();
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed) ? trimmed : '';
    }

    private async storeFeedback(feedback: FeedbackSubmission): Promise<void> {
        try {
            const allFeedback = this.getAllFeedback();
            allFeedback.push(feedback);

            // Keep only the most recent feedback to prevent storage bloat
            const recentFeedback = allFeedback
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, this.MAX_STORED_FEEDBACK);

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentFeedback));
        } catch (error) {
            console.warn('Failed to store feedback locally:', error);
            throw error;
        }
    }

    private async sendFeedbackToServer(feedback: FeedbackSubmission): Promise<void> {
        try {
            // Prepare sanitized feedback for server
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

            console.log('📤 Would send feedback to server:', serverFeedback);

            // Example implementation for when you have a server endpoint:
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

        } catch (error) {
            console.warn('Failed to send feedback to server:', error);
            // Don't throw error - local storage is sufficient for now
        }
    }

    private generateFeedbackId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 11);
        return `feedback_${timestamp}_${random}`;
    }

    private getSessionId(): string {
        try {
            // Try to get session ID from analytics service if available
            const analyticsModule = this.getAnalyticsService();
            if (analyticsModule?.isEnabled()) {
                return analyticsModule.getCurrentSessionId() || this.generateSessionId();
            }
            return this.generateSessionId();
        } catch (error) {
            return this.generateSessionId();
        }
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private getSafeUserAgent(): string {
        try {
            return navigator.userAgent.substring(0, 200); // Limit length for storage
        } catch (error) {
            return 'unknown';
        }
    }

    private getCurrentUrl(): string {
        try {
            return window.location.pathname + window.location.search;
        } catch (error) {
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
            console.warn('Failed to gather feedback metadata:', error);
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

    // ============================================================================
    // USER EXPERIENCE HELPERS
    // ============================================================================

    private getLanguage(): string {
        try {
            return navigator.language || 'en';
        } catch {
            return 'en';
        }
    }

    private getAnalyticsService(): any {
        try {
            // Dynamic import to avoid circular dependencies
            return require('./analyticsService').analyticsService;
        } catch {
            return null;
        }
    }

    // ============================================================================
    // CLEANUP & MAINTENANCE
    // ============================================================================

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
            console.warn('Failed to track feedback submission:', error);
        }
    }

    private isValidFeedbackSubmission(item: any): item is FeedbackSubmission {
        return (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.type === 'string' &&
            typeof item.rating === 'number' &&
            typeof item.message === 'string' &&
            typeof item.timestamp === 'string' &&
            ['bug', 'feature', 'general', 'love'].includes(item.type) &&
            item.rating >= 1 &&
            item.rating <= 5
        );
    }
}

// Singleton instance
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