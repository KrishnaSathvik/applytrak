// src/types/index.ts - Complete Types with Analytics & Feedback Integration
// ============================================================================
// CORE APPLICATION TYPES (Existing - Enhanced)
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
}

export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';
export type JobType = 'Onsite' | 'Remote' | 'Hybrid';

export interface Attachment {
    id?: string;
    name: string;
    type: string;
    size: number;
    data: string; // Base64 data URL
    uploadedAt?: string;
}

// ============================================================================
// GOALS AND PROGRESS (Existing - Enhanced)
// ============================================================================

export interface Goals {
    id?: string;
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
    createdAt?: string;
    updatedAt?: string;
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
// BACKUP SYSTEM (Existing)
// ============================================================================

export interface Backup {
    id?: string;
    timestamp: string;
    data: string; // JSON stringified applications
}

// ============================================================================
// ANALYTICS & CHARTS (Existing - Enhanced)
// ============================================================================

export interface AnalyticsData {
    statusDistribution: StatusDistribution;
    typeDistribution: TypeDistribution;
    sourceDistribution?: { [key: string]: number };
    sourceSuccessRates: SourceSuccessRate[];
    successRate: number;
    averageResponseTime: number;
    totalApplications: number;
    monthlyTrend?: Array<{ month: string; count: number }>;
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

// ============================================================================
// NEW: ANALYTICS SYSTEM TYPES
// ============================================================================

export interface AnalyticsEvent {
    event: string;
    properties?: Record<string, any>;
    timestamp: string;
    sessionId: string;
    userId?: string; // Anonymous user identifier
}

export interface UserSession {
    id: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    events: AnalyticsEvent[];
    deviceType: 'mobile' | 'desktop';
    userAgent: string;
    timezone: string;
    language: string;
}

export interface UserMetrics {
    sessionsCount: number;
    totalTimeSpent: number; // in milliseconds
    applicationsCreated: number;
    featuresUsed: string[];
    lastActiveDate: string;
    deviceType: 'mobile' | 'desktop';
    firstVisit: string;
    totalEvents: number;
}

export interface AnalyticsSettings {
    enabled: boolean;
    consentGiven: boolean;
    consentDate?: string;
    trackingLevel: 'minimal' | 'standard' | 'detailed';
}

// 🔧 UPDATED: Complete AnalyticsEventType with all events used in the codebase
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

// ============================================================================
// NEW: FEEDBACK SYSTEM TYPES
// ============================================================================

export interface FeedbackSubmission {
    id: string;
    type: 'bug' | 'feature' | 'general' | 'love';
    rating: number; // 1-5 stars
    message: string;
    email?: string; // Optional for follow-up
    timestamp: string;
    sessionId: string;
    userAgent: string;
    url: string; // Current page when feedback was given
    metadata?: {
        applicationsCount?: number;
        lastFeatureUsed?: string;
        sessionDuration?: number;
        deviceType?: string;
        screenResolution?: string;
        timezone?: string;
        language?: string;
        read?: boolean;
        readAt?: string;
    };
}

export interface FeedbackStats {
    totalSubmissions: number;
    averageRating: number;
    typeDistribution: {
        bug: number;
        feature: number;
        general: number;
        love: number;
    };
    ratingDistribution: {
        [rating: number]: number;
    };
}

export type FeedbackType = FeedbackSubmission['type'];

// ============================================================================
// NEW: ADMIN DASHBOARD TYPES
// ============================================================================

export interface AdminSession {
    authenticated: boolean;
    lastLogin?: string;
    sessionTimeout: number;
}

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
        featuresUsage: {
            [feature: string]: number;
        };
    };

    deviceMetrics: {
        mobile: number;
        desktop: number;
    };

    engagementMetrics: {
        dailyActiveUsers: Array<{ date: string; count: number }>;
        featureAdoption: Array<{ feature: string; adoptionRate: number }>;
        userRetention: {
            day1: number;
            day7: number;
            day30: number;
        };
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
}

export type AdminSection = 'overview' | 'analytics' | 'feedback' | 'users' | 'settings';

// ============================================================================
// ENHANCED UI STATE MANAGEMENT
// ============================================================================

export interface UIState {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    currentPage: number;
    itemsPerPage: number;
    searchQuery: string;
    selectedApplicationIds: string[];
    isLoading: boolean;
    error: string | null;
    selectedTab: 'tracker' | 'analytics';

    // NEW: Analytics & Feedback UI State
    analytics: {
        consentModalOpen: boolean;
        settingsOpen: boolean;
    };

    feedback: {
        buttonVisible: boolean;
        modalOpen: boolean;
        lastSubmissionDate?: string;
    };

    admin: {
        authenticated: boolean;
        dashboardOpen: boolean;
        currentSection: AdminSection;
    };
}

// ============================================================================
// ENHANCED MODAL STATES
// ============================================================================

export interface ModalState {
    editApplication: {
        isOpen: boolean;
        application?: Application;
    };
    goalSetting: {
        isOpen: boolean;
    };
    milestone: {
        isOpen: boolean;
        message?: string;
    };
    recovery: {
        isOpen: boolean;
        data?: Application[];
    };

    // NEW: Analytics & Feedback Modals
    analyticsConsent: {
        isOpen: boolean;
        type?: 'first-visit' | 'settings-change' | 'update-required';
    };

    feedback: {
        isOpen: boolean;
        initialType?: FeedbackType;
    };

    adminLogin: {
        isOpen: boolean;
        returnPath?: string;
    };
}

// ============================================================================
// FORM TYPES (Existing - Enhanced)
// ============================================================================

export interface ApplicationFormData {
    company: string;
    position: string;
    dateApplied: string;
    type: JobType;
    location: string;
    salary: string;
    jobSource: string;
    jobUrl: string;
    notes: string;
}

export interface EditFormData {
    company: string;
    position: string;
    dateApplied: string;
    type: JobType;
    status: ApplicationStatus;
    location: string;
    salary: string;
    jobSource: string;
    jobUrl: string;
    notes: string;
}

export interface GoalFormData {
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
}

// NEW: Feedback Form Data
export interface FeedbackFormData {
    type: FeedbackType;
    rating: number;
    message: string;
    email?: string;
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
}

export interface ConsentBanner {
    visible: boolean;
    type: 'first-visit' | 'update-required' | 'settings-changed';
    message: string;
}

export type TrackingLevel = AnalyticsSettings['trackingLevel'];

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

    clearAllData(): Promise<void>;

    // Existing Goals methods
    getGoals(): Promise<Goals>;

    updateGoals(goals: Omit<Goals, 'id'>): Promise<Goals>;

    // Existing Backup methods
    createBackup(): Promise<void>;

    getBackups(): Promise<Backup[]>;

    restoreFromBackup(backup: Backup): Promise<void>;

    // NEW: Analytics methods
    saveAnalyticsEvent(event: AnalyticsEvent): Promise<void>;

    getAnalyticsEvents(sessionId?: string): Promise<AnalyticsEvent[]>;

    getUserSession(sessionId: string): Promise<UserSession | null>;

    saveUserSession(session: UserSession): Promise<void>;

    getUserMetrics(): Promise<UserMetrics>;

    updateUserMetrics(metrics: Partial<UserMetrics>): Promise<void>;

    // NEW: Feedback methods
    saveFeedback(feedback: FeedbackSubmission): Promise<void>;

    getAllFeedback(): Promise<FeedbackSubmission[]>;

    getFeedbackStats(): Promise<FeedbackStats>;

    markFeedbackAsRead(feedbackId: string): Promise<void>;

    // NEW: Privacy methods
    savePrivacySettings(settings: PrivacySettings): Promise<void>;

    getPrivacySettings(): Promise<PrivacySettings | null>;

    // NEW: Admin methods (for aggregated data)
    getAdminAnalytics(): Promise<AdminAnalytics>;

    getAdminFeedbackSummary(): Promise<AdminFeedbackSummary>;

    cleanupOldData(olderThanDays: number): Promise<void>;
}

// ============================================================================
// FILTER AND SEARCH (Existing)
// ============================================================================

export interface FilterOptions {
    status?: ApplicationStatus[];
    type?: JobType[];
    dateRange?: {
        start: string;
        end: string;
    };
    searchQuery?: string;
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
}

// ============================================================================
// ENHANCED TOAST NOTIFICATIONS
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
}

// ============================================================================
// CHART DATA TYPES (Existing)
// ============================================================================

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface TimeSeriesData {
    date: string;
    value: number;
}

// ============================================================================
// EXPORT/IMPORT TYPES (Existing - Enhanced)
// ============================================================================

export interface ExportData {
    applications: Application[];
    goals: Goals;
    exportDate: string;
    version: string;

    // NEW: Analytics export data (optional)
    analytics?: {
        userMetrics: UserMetrics;
        sessions: UserSession[];
        events: AnalyticsEvent[];
    };

    // NEW: Feedback export data (optional)
    feedback?: {
        submissions: FeedbackSubmission[];
        stats: FeedbackStats;
    };
}

export interface ImportResult {
    success: boolean;
    importedCount: number;
    errors: string[];
}

// NEW: Admin Export Types
export interface ExportedAnalytics {
    exportDate: string;
    version: string;
    data: {
        userMetrics: UserMetrics[];
        sessions: UserSession[];
        events: AnalyticsEvent[];
        feedback: FeedbackSubmission[];
    };
    summary: AdminAnalytics;
}

// ============================================================================
// COMPONENT PROPS TYPES (Existing - Enhanced)
// ============================================================================

export interface ApplicationTableProps {
    applications: Application[];
    onEdit: (application: Application) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
}

export interface ApplicationFormProps {
    onSubmit: (data: ApplicationFormData, attachments: Attachment[]) => void;
    initialData?: Partial<ApplicationFormData>;
    loading?: boolean;
}

export interface ExportImportActionsProps {
    applications: Application[];
    onImport: (applications: Application[]) => void;
}

export interface ChartProps {
    data: ChartDataPoint[];
    title?: string;
    height?: number;
    showLegend?: boolean;
}

export interface ProgressBarProps {
    current: number;
    goal: number;
    label: string;
    color?: string;
    showPercentage?: boolean;
}

// NEW: Analytics & Feedback Component Props
export interface FeedbackButtonProps {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'minimal';
}

export interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: Omit<FeedbackSubmission, 'id' | 'timestamp' | 'sessionId'>) => void;
    initialType?: FeedbackSubmission['type'];
}

export interface AdminDashboardProps {
    onLogout: () => void;
    analytics: AdminAnalytics;
    feedback: AdminFeedbackSummary;
}

export interface AnalyticsConsentProps {
    isOpen: boolean;
    onAccept: (settings: PrivacySettings) => void;
    onDecline: () => void;
    onCustomize: () => void;
}

export interface UserAnalyticsProps {
    userMetrics: UserMetrics;
    sessions: UserSession[];
    showDetails?: boolean;
}

// ============================================================================
// VALIDATION TYPES (Existing)
// ============================================================================

export interface ValidationError {
    field: string;
    message: string;
}

export interface FormValidation {
    isValid: boolean;
    errors: ValidationError[];
}

// NEW: Analytics & Feedback Validation
export interface FeedbackValidation extends FormValidation {
    ratingValid: boolean;
    messageValid: boolean;
    emailValid?: boolean;
}

// ============================================================================
// RECOVERY SYSTEM (Existing)
// ============================================================================

export interface RecoveryOption {
    id: string;
    name: string;
    description: string;
    data: Application[];
    count: number;
    lastModified: string;
    source: 'localStorage' | 'database' | 'backup';
}

export interface RecoveryData {
    applications: Application[];
    source: string;
    timestamp: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AnalyticsError {
    code: string;
    message: string;
    timestamp: string;
    context?: Record<string, any>;
}

export interface FeedbackError {
    type: 'validation' | 'network' | 'storage';
    message: string;
    field?: string;
}

// ============================================================================
// UTILITY & HELPER TYPES
// ============================================================================

export interface AppConfig {
    version: string;
    buildDate: string;
    features: {
        analytics: boolean;
        feedback: boolean;
        adminDashboard: boolean;
    };
    privacy: {
        consentRequired: boolean;
        dataRetentionDays: number;
        allowAnonymousUsage: boolean;
    };
}

export interface FeatureFlag {
    name: string;
    enabled: boolean;
    description: string;
    rolloutPercentage?: number;
}

// ============================================================================
// ADMIN-SPECIFIC TYPES
// ============================================================================

export interface AdminUser {
    id: string;
    username: string;
    lastLogin: string;
    permissions: string[];
}

export interface AdminLog {
    id: string;
    action: string;
    userId: string;
    timestamp: string;
    details: Record<string, any>;
}

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down';
    checks: {
        database: boolean;
        localStorage: boolean;
        analytics: boolean;
        feedback: boolean;
    };
    lastChecked: string;
}