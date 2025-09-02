// src/utils/validation.ts - Production Ready Validation Utils
import * as yup from 'yup';
import {ApplicationFormData, ApplicationStatus, GoalFormData, JobType} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

export const JOB_TYPES: JobType[] = ['Onsite', 'Remote', 'Hybrid', 'Contract', 'Part-time', 'Internship'];
export const APPLICATION_STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const applicationFormSchema = yup.object({
    company: yup
        .string()
        .required('Company name is required')
        .min(1, 'Company name must be at least 1 character')
        .max(255, 'Company name must be less than 255 characters')
        .trim(),

    position: yup
        .string()
        .required('Position is required')
        .min(1, 'Position must be at least 1 character')
        .max(255, 'Position must be less than 255 characters')
        .trim(),

    dateApplied: yup
        .string()
        .required('Date applied is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .test('is-valid-date', 'Please enter a valid date', (value) => {
            if (!value) return false;
            const date = new Date(value);
            return date instanceof Date && !isNaN(date.getTime());
        })
        .test('not-future-date', 'Date cannot be in the future', (value) => {
            if (!value) return false;
            const date = new Date(value);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return date <= today;
        }),

    type: yup
        .string()
        .required('Job type is required')
        .oneOf(JOB_TYPES, 'Please select a valid job type'),

    location: yup
        .string()
        .notRequired()
        .max(255, 'Location must be less than 255 characters'),

    salary: yup
        .string()
        .notRequired()
        .max(255, 'Salary must be less than 255 characters'),

    jobSource: yup
        .string()
        .notRequired()
        .max(100, 'Job source must be less than 100 characters'),

    jobUrl: yup
        .string()
        .notRequired()
        .test('valid-url', 'Please enter a valid URL', (value) => {
            if (!value || value === '') return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }),

    notes: yup
        .string()
        .notRequired()
        .max(2000, 'Notes must be less than 2000 characters')
});

export const editApplicationFormSchema = applicationFormSchema.shape({
    status: yup
        .string()
        .required('Status is required')
        .oneOf(APPLICATION_STATUSES, 'Please select a valid status')
});

export const goalsFormSchema = yup.object({
    totalGoal: yup
        .number()
        .required('Total goal is required')
        .min(1, 'Total goal must be at least 1')
        .max(10000, 'Total goal must be less than 10,000')
        .integer('Total goal must be a whole number'),

    weeklyGoal: yup
        .number()
        .required('Weekly goal is required')
        .min(1, 'Weekly goal must be at least 1')
        .max(200, 'Weekly goal must be less than 200')
        .integer('Weekly goal must be a whole number'),

    monthlyGoal: yup
        .number()
        .required('Monthly goal is required')
        .min(1, 'Monthly goal must be at least 1')
        .max(1000, 'Monthly goal must be less than 1000')
        .integer('Monthly goal must be a whole number')
        .test('monthly-weekly-consistency', 'Monthly goal should be reasonable compared to weekly goal', function (value) {
            const weeklyGoal = this.parent.weeklyGoal;
            if (!value || !weeklyGoal) return true;
            const minMonthly = weeklyGoal * 3;
            const maxMonthly = weeklyGoal * 6;
            return value >= minMonthly && value <= maxMonthly;
        })
});

// ============================================================================
// DEFAULT FORM VALUES
// ============================================================================

export const defaultApplicationFormValues: ApplicationFormData = {
    company: '',
    position: '',
    dateApplied: new Date().toISOString().split('T')[0],
    type: 'Remote',
    location: '',
    salary: '',
    jobSource: '',
    jobUrl: '',
    notes: ''
};

export const defaultGoalsFormValues: GoalFormData = {
    totalGoal: 100,
    weeklyGoal: 5,
    monthlyGoal: 20
};

// ============================================================================
// FILE VALIDATION
// ============================================================================

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB (increased from 10MB)

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'File type not allowed. Please upload PDF, Word, text, or image files (JPEG, PNG, GIF, WebP).'
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'File size too large. Please upload files smaller than 50MB.'
        };
    }

    return {isValid: true};
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validationHelpers = {
    isValidDate: (dateString: string): boolean => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    },

    isFutureDate: (dateString: string): boolean => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date > today;
    },

    isPastDate: (dateString: string): boolean => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    },

    isValidURL: (url: string): boolean => {
        if (!url || url === '') return true;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    sanitizeString: (input: string): string => {
        return input.trim().replace(/\s+/g, ' ');
    },

    isValidEmailFormat: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhoneFormat: (phone: string): boolean => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
};

// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================

export const validateApplicationForm = async (data: ApplicationFormData): Promise<{
    isValid: boolean;
    errors: Record<string, string>
}> => {
    try {
        await applicationFormSchema.validate(data, {abortEarly: false});
        return {isValid: true, errors: {}};
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            const errors: Record<string, string> = {};
            error.inner.forEach((err) => {
                if (err.path) {
                    errors[err.path] = err.message;
                }
            });
            return {isValid: false, errors};
        }
        return {isValid: false, errors: {general: 'Validation failed'}};
    }
};

export const validateGoalsForm = async (data: GoalFormData): Promise<{
    isValid: boolean;
    errors: Record<string, string>
}> => {
    try {
        await goalsFormSchema.validate(data, {abortEarly: false});
        return {isValid: true, errors: {}};
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            const errors: Record<string, string> = {};
            error.inner.forEach((err) => {
                if (err.path) {
                    errors[err.path] = err.message;
                }
            });
            return {isValid: false, errors};
        }
        return {isValid: false, errors: {general: 'Validation failed'}};
    }
};

// ============================================================================
// BULK VALIDATION UTILITIES
// ============================================================================

export const validateBulkApplications = (applications: unknown[]): {
    validApplications: ApplicationFormData[];
    invalidApplications: Array<{ index: number; errors: Record<string, string>; data: unknown }>;
} => {
    const validApplications: ApplicationFormData[] = [];
    const invalidApplications: Array<{ index: number; errors: Record<string, string>; data: unknown }> = [];

    applications.forEach((app, index) => {
        try {
            const validatedApp = applicationFormSchema.validateSync(app, {abortEarly: false}) as ApplicationFormData;
            validApplications.push(validatedApp);
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                const errors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    if (err.path) {
                        errors[err.path] = err.message;
                    }
                });
                invalidApplications.push({index, errors, data: app});
            } else {
                invalidApplications.push({
                    index,
                    errors: {general: 'Validation failed'},
                    data: app
                });
            }
        }
    });

    return {validApplications, invalidApplications};
};