// src/types/index.ts - COMPLETE FIXED VERSION WITH ALL TYPES
import * as React from 'react';
import { User, Session } from '@supabase/supabase-js';

// ============================================================================
// CORE APPLICATION TYPES
// ============================================================================

export interface Application {
    id: string;
    company: string;
    position: string;
    dateApplied: string;
    status: ApplicationStatus;
    type: JobType;
    location?: string;
    salary?: string;
    jobSource?: string;
    jobUrl?: string;
    notes?: string;
    attachments?: Attachment[];
    createdAt: string;
    updatedAt: string;
    // NEW: Cloud sync metadata
    syncedAt?: string;
    cloudId?: string;
    syncStatus?: 'synced' | 'pending' | 'error';
}

export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';
export type JobType = 'Onsite' | 'Remote' | 'Hybrid' | 'Contract' | 'Part-time' | 'Internship';

export interface Attachment {
    id?: string;
    name: string;
    type: string;
    size: number;

    /**
     * NEW: where the file actually lives in Supabase Storage,
     * e.g. "12345/2025-08-23T18-09-12-abc123/resume.pdf"
     */
    storagePath?: string;

    /**
     * Legacy: keep optional so older drafts/records with base64 still compile.
     * New uploads won’t set this.
     */
    data?: string; // Base64 data URL (legacy)

    uploadedAt?: string;
    
    /**
     * NEW: track which application this attachment belongs to
     * Allows organizing files by application and handling same filenames
     */
    applicationId?: string | null;
}

export interface AppUser {
    id: number | string;            // bigint in DB, but TS can be string if you cast
    external_id?: string;
    email: string;
    display_name?: string | null;
}

// ============================================================================
// AUTHENTICATION TYPE MAPPING
// ============================================================================

/**
 * Convert Supabase User to AppUser
 * This ensures type safety when working with Supabase auth
 */
export const mapSupabaseUserToAppUser = (user: User | null): AppUser | null => {
    if (!user || !user.email) return null;
    
    return {
        id: user.id,
        external_id: user.id, // Supabase user ID becomes external_id
        email: user.email,
        display_name: user.user_metadata?.display_name || user.email
    };
};

/**
 * Convert Supabase Session to our session format
 */
export const mapSupabaseSession = (session: Session | null): any | null => {
    if (!session) return null;
    return session;
};

// ============================================================================
// FORM DATA TYPES (MISSING - ADDED)
// ============================================================================

export interface ApplicationFormData {
    company: string;
    position: string;
    dateApplied: string;
    status?: ApplicationStatus; // Made optional
    type: JobType;
    location?: string;
    salary?: string;
    jobSource?: string;
    jobUrl?: string;
    notes?: string;
}

export interface EditFormData extends ApplicationFormData {
}

export interface GoalFormData {
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
}

// ============================================================================
// GOALS AND PROGRESS
// ============================================================================

export interface Goals {
    id?: string;
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
    createdAt?: string;
    updatedAt?: string;
    // NEW: Cloud sync metadata
    syncedAt?: string;
    cloudId?: string;
}

export interface GoalProgress {
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
    totalProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    weeklyStreak: number;
    totalApplications: number;
    weeklyApplications: number;
    monthlyApplications: number;
}

// Legacy interface for backward compatibility
export interface ProgressMetrics extends GoalProgress {
}

// ============================================================================
// BACKUP SYSTEM
// ============================================================================

export interface Backup {
    id?: string;
    timestamp: string;
    data: string; // JSON stringified applications
}

// ============================================================================
// ANALYTICS & CHARTS
// ============================================================================

export interface AnalyticsData {
    statusDistribution: StatusDistribution;
    typeDistribution: TypeDistribution;
    sourceDistribution?: { [key: string]: number };
    sourceSuccessRates: SourceSuccessRate[];
    successRate: number;
    averageResponseTime: number;
    totalApplications: number;
    monthlyTrend: MonthlyTrendData[];
    weeklyGoalProgress?: number;
    monthlyGoalProgress?: number;
}

export interface StatusDistribution {
    Applied: number;
    Interview: number;
    Offer: number;
    Rejected: number;
}

export interface TypeDistribution {
    Onsite: number;
    Remote: number;
    Hybrid: number;
}

export interface SourceSuccessRate {
    source: string;
    total: number;
    offers: number;
    interviews: number;
    successRate: number;
    interviewRate: number;
}

export interface MonthlyTrendData {
    month: string;
    count: number;
    // Optional properties for enhanced analytics
    applications?: number;
    interviews?: number;
    offers?: number;
    successRate?: number;
}

// ============================================================================
// USER ANALYTICS SYSTEM
// ============================================================================

export type AnalyticsEventType =
    | 'page_view'
    | 'application_created'
    | 'application_updated'
    | 'application_deleted'
    | 'applications_bulk_deleted'
    | 'applications_status_updated'
    | 'applications_bulk_updated'
    | 'applications_bulk_imported'
    | 'feature_used'
    | 'search_performed'
    | 'export_data'
    | 'import_data'
    | 'goal_set'
    | 'goals_updated'
    | 'attachment_added'
    | 'session_start'
    | 'session_end'
    | 'feedback_submitted'
    | 'feedback_modal_opened'
    | 'theme_changed'
    | 'analytics_enabled'
    | 'analytics_disabled';

export interface AnalyticsEvent {
    id?: number;
    event: AnalyticsEventType | string;
    properties?: Record<string, any>;
    timestamp: string;
    sessionId: string;
    userId?: string;
    // NEW: Cloud sync metadata
    syncedAt?: string;
    cloudId?: string;
}

export interface UserSession {
    id?: number | string;
    sessionId?: string; // Made optional since some services don't provide it
    startTime: string;
    endTime?: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    userAgent?: string;
    referrer?: string;
    // Additional properties for analytics service compatibility
    duration?: number | string; // Allow both number and string
    events?: AnalyticsEvent[]; // Added for analytics service
    timezone?: string;
    language?: string;
}

export interface UserMetrics {
    sessionsCount: number;
    totalTimeSpent: number; // in minutes
    applicationsCreated: number;
    applicationsUpdated?: number;
    applicationsDeleted?: number;
    goalsSet?: number;
    attachmentsAdded?: number;
    exportsPerformed?: number;
    importsPerformed?: number;
    searchesPerformed?: number;
    featuresUsed?: string[]; // Made optional - some services expect undefined
    lastActiveDate: string;
    // Additional properties for store compatibility
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    // Properties expected by analytics
    totalEvents?: number;
    browserVersion?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    applicationsCount?: number;
    sessionDuration?: number;
    firstVisit?: string;
}

export interface AnalyticsSettings {
    enabled: boolean;
    consentGiven: boolean;
    trackingLevel: 'minimal' | 'standard' | 'detailed';
    // Additional properties for store compatibility
    consentDate?: string;
    // NEW: Cloud sync preferences
    cloudSyncEnabled?: boolean;
    dataSharingConsent?: boolean;
}

// ============================================================================
// FEEDBACK SYSTEM
// ============================================================================

export interface FeedbackSubmission {
    id?: string;
    type: 'bug' | 'feature' | 'general' | 'love';
    rating: number; // 1-5 stars
    message: string;
    email?: string;
    timestamp: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    metadata?: {
        browserVersion?: string;
        deviceType?: string;
        screenResolution?: string;
        timezone?: string;
        language?: string;
        read?: boolean;
        readAt?: string;
        flagged?: boolean;
        response?: string;
        respondedAt?: string;
        applicationsCount?: number;
        lastFeatureUsed?: string;
        sessionDuration?: number;
    };
    // NEW: Cloud sync metadata
    syncedAt?: string;
    cloudId?: string;
}

export interface FeedbackStats {
    totalSubmissions: number;
    averageRating: number;
    typeDistribution: {
        bug: number;
        feature: number;
        general: number;
        love: number;
        // Allow any additional string keys for backward compatibility
        [key: string]: number;
    };
    ratingDistribution?: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
        [rating: number]: number;
    };
    recentFeedback?: FeedbackSubmission[];
}

// ============================================================================
// ADMIN ANALYTICS
// ============================================================================

export interface AdminAnalytics {
    userMetrics: {
        totalUsers: number;
        activeUsers: {
            daily: number;
            weekly: number;
            monthly: number;
        };
        newUsers: {
            today: number;
            thisWeek: number;
            thisMonth: number;
        };
    };
    usageMetrics: {
        totalSessions: number;
        averageSessionDuration: number;
        totalApplicationsCreated: number;
        featuresUsage: { [key: string]: number };
    };
    deviceMetrics: {
        mobile: number;
        desktop: number;
        tablet?: number;
    };
    engagementMetrics: {
        dailyActiveUsers: Array<{ date: string; count: number }>;
        featureAdoption: Array<{ feature: string; usage: number }>;
        userRetention: {
            day1: number;
            day7: number;
            day30: number;
        };
    };
    // NEW: Cloud analytics
    cloudSyncStats?: {
        totalSynced: number;
        pendingSync: number;
        syncErrors: number;
        lastSyncTime: string;
    };
}

export interface AdminFeedbackSummary {
    totalFeedback: number;
    unreadFeedback: number;
    averageRating: number;
    recentFeedback: FeedbackSubmission[];
    feedbackTrends: {
        bugs: number;
        features: number;
        general: number;
        love: number;
    };
    topIssues: Array<{
        issue: string;
        count: number;
        severity: 'low' | 'medium' | 'high';
    }>;
    // NEW: Cloud feedback analytics
    cloudSyncedCount?: number;
    pendingSyncCount?: number;
}

// ============================================================================
// ADMIN SESSION (FIXED - ALL PROPERTIES)
// ============================================================================

export interface AdminSession {
    // Required properties
    authenticated: boolean;

    // Optional properties that services might expect
    id?: string;
    userId?: string;
    createdAt?: string;
    expiresAt?: string;
    isActive?: boolean;
    lastLogin?: string;
    sessionTimeout?: number;
}

// ============================================================================
// PRIVACY & CONSENT TYPES
// ============================================================================

export interface PrivacySettings {
    analytics: boolean;
    feedback: boolean;
    functionalCookies: boolean;
    consentDate: string;
    consentVersion: string;
    // NEW: Cloud privacy settings
    cloudSyncConsent?: boolean;
    dataRetentionPeriod?: number; // days
    anonymizeAfter?: number; // days
}

export interface ConsentBanner {
    visible: boolean;
    type: 'first-visit' | 'update-required' | 'settings-changed';
    message: string;
}

export type TrackingLevel = AnalyticsSettings['trackingLevel'];

// ============================================================================
// CLOUD SYNC TYPES
// ============================================================================

export interface SyncStatus {
    isOnline: boolean;
    isSupabaseConnected: boolean;
    lastSyncTime?: string;
    pendingOperations: number;
    syncErrors: SyncError[];
}

export interface SyncError {
    id: string;
    operation: 'create' | 'update' | 'delete';
    table: string;
    recordId: string;
    error: string;
    timestamp: string;
    retryCount: number;
}

export interface CloudSyncSettings {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number; // minutes
    retryAttempts: number;
    batchSize: number;
    compression: boolean;
}

// ============================================================================
// SUPABASE DATABASE TYPES
// ============================================================================

export interface SupabaseApplication {
    id: string;
    userid: string;
    company: string;
    position: string;
    date_applied: string;
    status: ApplicationStatus;
    type: JobType;
    location?: string;
    salary?: string;
    job_source?: string;
    job_url?: string;
    notes?: string;
    attachments?: Attachment[];
    created_at: string;
    updated_at: string;
    synced_at: string;
}

export interface SupabaseGoals {
    id: string;
    userid: string;
    total_goal: number;
    weekly_goal: number;
    monthly_goal: number;
    created_at: string;
    updated_at: string;
    synced_at: string;
}

export interface SupabaseAnalyticsEvent {
    id: number;
    userid: string;
    event_name: string;
    properties?: Record<string, any>;
    timestamp: string;
    session_id: string;
    created_at: string;
}

export interface SupabaseFeedback {
    id: number;
    userid: string;
    type: FeedbackSubmission['type'];
    rating: number;
    message: string;
    email?: string;
    timestamp: string;
    session_id?: string;
    user_agent?: string;
    url?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

export interface SupabasePrivacySettings {
    id: string;
    userid: string;
    analytics: boolean;
    feedback: boolean;
    functional_cookies: boolean;
    consent_date: string;
    consent_version: string;
    cloud_sync_consent: boolean;
    data_retention_period: number;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// ENHANCED DATABASE SERVICE
// ============================================================================

export interface DatabaseService {
    // Existing Application methods
    getApplications(): Promise<Application[]>;

    getApplicationCount(): Promise<number>;

    addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application>;

    updateApplication(id: string, updates: Partial<Application>): Promise<Application>;

    deleteApplication(id: string): Promise<void>;

    deleteApplications(ids: string[]): Promise<void>;

    bulkUpdateApplications(ids: string[], updates: Partial<Application>): Promise<void>;

    importApplications(applications: Application[]): Promise<void>;

    // Enhanced import with progress tracking
    importApplicationsWithProgress(
        applications: Application[],
        onProgress?: (progress: {
            stage: 'local-import' | 'cloud-sync' | 'complete';
            current: number;
            total: number;
            percentage: number;
            message: string;
        }) => void
    ): Promise<void>;

    getApplicationsByDateRange(startDate: Date, endDate: Date): Promise<Application[]>;

    getApplicationsByStatus(status: string): Promise<Application[]>;

    clearAllData(): Promise<void>;

    // Cache management
    forceRefreshApplications(): Promise<Application[]>;
    getCacheStatus(): { [key: string]: boolean };
    clearCache(): void;
    invalidateCache(key: string): void;

    // Memory management for large imports
    cleanupAfterLargeImport(): Promise<void>;

    // Existing Goals methods
    getGoals(): Promise<Goals>;

    updateGoals(goals: Omit<Goals, 'id'>): Promise<Goals>;

    // Existing Backup methods
    createBackup(): Promise<void>;

    getBackups(): Promise<Backup[]>;

    restoreFromBackup(backup: Backup): Promise<void>;

    // Analytics methods
    saveAnalyticsEvent(event: AnalyticsEvent): Promise<void>;

    getAnalyticsEvents(sessionId?: string): Promise<AnalyticsEvent[]>;

    getUserSession(sessionId: string): Promise<UserSession | null>;

    saveUserSession(session: UserSession): Promise<void>;

    getUserMetrics(): Promise<UserMetrics>;

    updateUserMetrics(metrics: Partial<UserMetrics>): Promise<void>;

    // Feedback methods
    saveFeedback(feedback: FeedbackSubmission): Promise<void>;

    getAllFeedback(): Promise<FeedbackSubmission[]>;

    getFeedbackStats(): Promise<FeedbackStats>;

    markFeedbackAsRead(feedbackId: string): Promise<void>;

    // Privacy methods
    savePrivacySettings(settings: PrivacySettings): Promise<void>;

    getPrivacySettings(): Promise<PrivacySettings | null>;

    // Admin methods
    getAdminAnalytics(): Promise<AdminAnalytics>;

    getAdminFeedbackSummary(): Promise<AdminFeedbackSummary>;

    cleanupOldData(olderThanDays: number): Promise<void>;

    // Cloud sync methods (optional)
    getSyncStatus?(): Promise<SyncStatus>;

    forceSyncToCloud?(): Promise<void>;

    forceSyncFromCloud?(): Promise<void>;

    resolveSyncConflicts?(): Promise<void>;

    updateCloudSyncSettings?(settings: CloudSyncSettings): Promise<void>;
}

// ============================================================================
// FILTER AND SEARCH
// ============================================================================

export interface FilterOptions {
    status?: ApplicationStatus[];
    type?: JobType[];
    dateRange?: {
        start: string;
        end: string;
    };
    source?: string[];
    hasAttachments?: boolean;
    hasNotes?: boolean;
    company?: string;
    position?: string;
}

export interface SearchOptions {
    query: string;
    fields?: ('company' | 'position' | 'location' | 'notes' | 'jobSource')[];
    caseSensitive?: boolean;
    exactMatch?: boolean;
}

export interface SortOptions {
    field: keyof Application;
    direction: 'asc' | 'desc';
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export interface ExportData {
    applications: Application[];
    goals: Goals;
    analytics?: AnalyticsData;
    exportDate: string;
    version: string;
}

export type ExportFormat = 'json' | 'csv' | 'pdf';

// ============================================================================
// UI STATE INTERFACES
// ============================================================================

export interface PaginationState {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

export interface TableState {
    pagination: PaginationState;
    sorting: SortOptions;
    filters: FilterOptions;
    search: SearchOptions;
    selectedIds: string[];
}

// ============================================================================
// MODAL & COMPONENT STATES
// ============================================================================



export interface GoalModalProps {
    isOpen: boolean;
    currentGoals?: Goals;
    onClose: () => void;
    onSave: (goals: Omit<Goals, 'id'>) => void;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface AppError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    // NEW: Cloud sync error details
    syncRelated?: boolean;
    retryable?: boolean;
    operation?: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// RECOVERY SYSTEM
// ============================================================================

export interface RecoveryOption {
    id: string;
    source: 'localStorage' | 'indexedDB' | 'backup';
    data: Application[];
    count: number;
    lastModified: string;
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
    // NEW: Cloud sync related toasts
    syncRelated?: boolean;
    persistUntilSync?: boolean;
}

// ============================================================================
// THEME & ACCESSIBILITY
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface AccessibilitySettings {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
    focusIndicators: boolean;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    syncTime?: number;
    errorRate: number;
    memoryUsage?: number;
    cacheHitRate?: number;
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
    cloudSync: boolean;
    advancedAnalytics: boolean;
    realTimeSync: boolean;
    bulkOperations: boolean;
    exportEnhancements: boolean;
    aiInsights: boolean;
}

// ============================================================================
// VERSION CONTROL
// ============================================================================

export interface DataVersion {
    version: string;
    timestamp: string;
    changes: string[];
    migrationRequired: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isApplication = (obj: any): obj is Application => {
    return obj && typeof obj.id === 'string' && typeof obj.company === 'string';
};

export const isGoals = (obj: any): obj is Goals => {
    return obj && typeof obj.totalGoal === 'number';
};

export const isFeedbackSubmission = (obj: any): obj is FeedbackSubmission => {
    return obj && typeof obj.type === 'string' && typeof obj.rating === 'number';
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const APPLICATION_STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];
export const JOB_TYPES: JobType[] = ['Onsite', 'Remote', 'Hybrid'];
export const FEEDBACK_TYPES: FeedbackSubmission['type'][] = ['bug', 'feature', 'general', 'love'];
export const TRACKING_LEVELS: TrackingLevel[] = ['minimal', 'standard', 'detailed'];

// Default values
export const DEFAULT_GOALS: Omit<Goals, 'id'> = {
    totalGoal: 100,
    weeklyGoal: 5,
    monthlyGoal: 20
};

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
    enabled: false,
    consentGiven: false,
    trackingLevel: 'minimal',
    cloudSyncEnabled: false,
    dataSharingConsent: false
};

export const DEFAULT_CLOUD_SYNC_SETTINGS: CloudSyncSettings = {
    enabled: false,
    autoSync: true,
    syncInterval: 15, // 15 minutes
    retryAttempts: 3,
    batchSize: 50,
    compression: true
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
    analytics: false,
    feedback: false,
    functionalCookies: true,
    consentDate: new Date().toISOString(),
    consentVersion: '1.0',
    cloudSyncConsent: false,
    dataRetentionPeriod: 365,
    anonymizeAfter: 730
};

// ============================================================================
// VALIDATION TYPES (MISSING - ADDED)
// ============================================================================

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}

export interface FormValidation {
    company: string;
    position: string;
    dateApplied: string;
    type: JobType;
    status?: ApplicationStatus; // Made optional for form validation
    location?: string;
    salary?: string;
    jobSource?: string;
    jobUrl?: string;
    notes?: string;
}

// More flexible validation interface for different form states
export interface FlexibleFormValidation {
    company?: string;
    position?: string;
    dateApplied?: string;
    type?: JobType | string;
    status?: ApplicationStatus | string;
    location?: string;
    salary?: string;
    jobSource?: string;
    jobUrl?: string;
    notes?: string;
}

// ============================================================================
// REACT TYPES (MISSING - ADDED)
// ============================================================================

export type ReactNode = React.ReactNode;
export type SetStateAction<T> = React.SetStateAction<T>;

// ============================================================================
// UTILITY TYPES & HELPERS (ENHANCED FOR OPERATORS)
// ============================================================================

export type StateUpdater<T> = (prevState: T) => T;
export type StateSetter<T> = (value: T | StateUpdater<T>) => void;

// Type for making all properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Type for making all properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Utility for safe number conversion (fixes string/number issues)
export const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
};

// Utility for safe string conversion
export const toString = (value: any): string => {
    return String(value || '');
};

// Duration type that accepts both string and number
export type Duration = string | number;

// Safe duration converter
export const toDuration = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

// Safe addition for mixed types
export const safeAdd = (a: string | number, b: string | number): number => {
    return toNumber(a) + toNumber(b);
};

// Safe comparison
export const safeEquals = (a: string | number, b: string | number): boolean => {
    return toNumber(a) === toNumber(b);
};

// Type-safe numeric operations
export type NumericValue = string | number;

// ============================================================================
// BROWSER INFO (MISSING - ADDED)
// ============================================================================

export interface BrowserInfo {
    browserVersion?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    screenResolution?: string;
    timezone?: string;
    language?: string;
}