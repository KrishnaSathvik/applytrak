// src/types/application.types.ts

export type JobType = 'Onsite' | 'Remote' | 'Hybrid';
export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Attachment {
    id?: string;
    name: string;
    type: string;
    size: number;
    data: string; // Base64 encoded data
    uploadedAt?: string;
}

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

export interface ApplicationFormData {
    company: string;
    position: string;
    dateApplied: string;
    type: JobType;
    location?: string;
    salary?: string;
    jobSource?: string;
    jobUrl?: string;
    notes?: string;
}

export interface GoalProgress {
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
    totalProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    weeklyStreak: number;
}

export interface SourceSuccessRate {
    source: string;
    total: number;
    offers: number;
    interviews: number;
    successRate: number;
    interviewRate: number;
}

export interface AnalyticsData {
    statusDistribution: { [key in ApplicationStatus]: number };
    typeDistribution: { [key in JobType]: number };
    sourceDistribution: { [key: string]: number };
    sourceSuccessRates: SourceSuccessRate[];
    successRate: number;
    averageResponseTime: number;
    totalApplications: number;
    monthlyTrend: Array<{ month: string; count: number }>;
}

export interface BulkOperationResult {
    success: boolean;
    message: string;
    affectedCount: number;
}