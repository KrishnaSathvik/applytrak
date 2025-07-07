// src/types/index.ts - Updated with fixes
// Core Application Types
export interface Application {
    id: string; // Changed from number to string for consistency
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

// Goals and Progress
export interface Goals {
    id?: string; // Changed from number to string
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
    // FIXED: Added missing properties that components expect
    totalApplications: number;
    weeklyApplications: number;
    monthlyApplications: number;
}

// Legacy interface for backward compatibility
export interface ProgressMetrics extends GoalProgress {
}

// Backup System
export interface Backup {
    id?: string; // Changed from number to string
    timestamp: string;
    data: string; // JSON stringified applications
}

// Analytics & Charts
export interface AnalyticsData {
    statusDistribution: StatusDistribution;
    typeDistribution: TypeDistribution;
    sourceDistribution?: { [key: string]: number }; // FIXED: Added missing property
    sourceSuccessRates: SourceSuccessRate[];
    successRate: number;
    averageResponseTime: number; // FIXED: Removed | string for consistency
    totalApplications: number;
    monthlyTrend?: Array<{ month: string; count: number }>; // Added for completeness
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
    interviews: number; // Added missing property
    successRate: number;
    interviewRate: number; // Added missing property
}

// UI State Management
export interface UIState {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    currentPage: number;
    itemsPerPage: number;
    searchQuery: string;
    selectedTab: 'tracker' | 'analytics';
    selectedApplicationIds: string[]; // Added missing property
    isLoading: boolean; // FIXED: Changed from 'loading' to 'isLoading'
    error: string | null;
}

// Form Types
export interface ApplicationFormData {
    company: string;
    position: string;
    dateApplied: string;
    type: JobType;
    location: string;     // Remove the ? - required but can be empty
    salary: string;       // Remove the ? - required but can be empty
    jobSource: string;    // Remove the ? - required but can be empty
    jobUrl: string;       // Remove the ? - required but can be empty
    notes: string;        // Remove the ? - required but can be empty
}

export interface EditFormData {
    company: string;
    position: string;
    dateApplied: string;
    type: JobType;
    status: ApplicationStatus;
    location: string;     // FIXED: Required string (can be empty)
    salary: string;       // FIXED: Required string (can be empty)
    jobSource: string;    // FIXED: Required string (can be empty)
    jobUrl: string;       // FIXED: Required string (can be empty)
    notes: string;        // FIXED: Required string (can be empty)
}

export interface GoalFormData {
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
}

// Filter and Search
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

// Toast Notifications
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

// Modal States
export interface ModalState {
    editApplication: {
        isOpen: boolean;
        application?: Application; // Made optional and removed null
    };
    goalSetting: {
        isOpen: boolean;
    };
    milestone: {
        isOpen: boolean;
        message?: string; // Made optional
    };
    recovery: {
        isOpen: boolean;
        data?: Application[]; // Made optional and removed null
    };
}

// Chart Data Types
export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface TimeSeriesData {
    date: string;
    value: number;
}

// Database Operations
export interface DatabaseService {
    // Applications
    getApplications(): Promise<Application[]>;

    getApplicationCount(): Promise<number>; // Added missing method
    addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application>;

    updateApplication(id: string, updates: Partial<Application>): Promise<Application>; // Changed to string
    deleteApplication(id: string): Promise<void>; // Changed to string
    deleteApplications(ids: string[]): Promise<void>; // Added bulk delete
    bulkUpdateApplications(ids: string[], updates: Partial<Application>): Promise<void>; // Added bulk update
    importApplications(applications: Application[]): Promise<void>; // Added import
    clearAllData(): Promise<void>; // Added clear method

    // Goals
    getGoals(): Promise<Goals>;

    updateGoals(goals: Omit<Goals, 'id'>): Promise<Goals>;

    // Backups
    createBackup(): Promise<void>; // FIXED: Simplified signature (no parameters)
    getBackups(): Promise<Backup[]>;

    restoreFromBackup(backup: Backup): Promise<void>;
}

// Export/Import Types
export interface ExportData {
    applications: Application[];
    goals: Goals;
    exportDate: string;
    version: string;
}

export interface ImportResult {
    success: boolean;
    importedCount: number;
    errors: string[];
}

// Component Props Types
export interface ApplicationTableProps {
    applications: Application[];
    onEdit: (application: Application) => void;
    onDelete: (id: string) => void; // Changed to string
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

// Validation Types
export interface ValidationError {
    field: string;
    message: string;
}

export interface FormValidation {
    isValid: boolean;
    errors: ValidationError[];
}

// Recovery System
export interface RecoveryOption {
    id: string;
    name: string;
    description: string;
    data: Application[]; // Fixed type
    count: number; // Added for compatibility
    lastModified: string;
    source: 'localStorage' | 'database' | 'backup'; // Added source type
}

export interface RecoveryData {
    applications: Application[];
    source: string;
    timestamp: string;
}