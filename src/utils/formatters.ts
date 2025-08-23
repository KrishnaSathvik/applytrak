// src/utils/formatters.ts - Data formatting utilities for consistent display

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type DateInput = string | Date | number;
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type Locale = 'en-US' | 'en-GB' | 'en-CA' | 'en-AU' | 'de-DE' | 'fr-FR';

export interface StatusFormat {
    text: string;
    className: string;
}

export interface FormatDateOptions {
    locale?: Locale;
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
}

// ============================================================================
// DATE FORMATTERS
// ============================================================================

/**
 * Format date string to local date format
 */
export const formatDate = (
    dateInput: DateInput,
    options: FormatDateOptions = {}
): string => {
    try {
        const date = new Date(dateInput);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return typeof dateInput === 'string' ? dateInput : 'Invalid Date';
        }

        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };

        // Format as local date string
        return date.toLocaleDateString(options.locale || 'en-US', defaultOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return typeof dateInput === 'string' ? dateInput : 'Invalid Date';
    }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (dateInput: DateInput): string => {
    try {
        const date = new Date(dateInput);

        if (isNaN(date.getTime())) {
            return '';
        }

        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
    }
};

/**
 * Format relative time (e.g., "2 days ago", "1 week ago")
 */
export const formatRelativeTime = (dateInput: DateInput): string => {
    try {
        const date = new Date(dateInput);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();

        // Handle future dates
        if (diffInMs < 0) {
            const futureDiff = Math.abs(diffInMs);
            const diffInSeconds = Math.floor(futureDiff / 1000);

            if (diffInSeconds < 60) return 'In a few seconds';
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `In ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `In ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
            const diffInDays = Math.floor(diffInHours / 24);
            return `In ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
        }

        const diffInSeconds = Math.floor(diffInMs / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
        }

        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Unknown';
    }
};

/**
 * Format duration between two dates
 */
export const formatDuration = (
    startDate: DateInput,
    endDate?: DateInput
): string => {
    try {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 'Unknown';
        }

        const diffInMs = end.getTime() - start.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return '1 day';
        } else if (diffInDays < 7) {
            return `${diffInDays} days`;
        } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''}`;
        } else if (diffInDays < 365) {
            const months = Math.floor(diffInDays / 30);
            return `${months} month${months > 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(diffInDays / 365);
            return `${years} year${years > 1 ? 's' : ''}`;
        }
    } catch (error) {
        console.error('Error formatting duration:', error);
        return 'Unknown';
    }
};

// ============================================================================
// NUMERIC FORMATTERS
// ============================================================================

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 0) return 'Invalid Size';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    if (i >= sizes.length) {
        return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(2)} ${sizes[sizes.length - 1]}`;
    }

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format salary string consistently
 */
export const formatSalary = (salary?: string | number): string => {
    if (!salary) {
        return '-';
    }

    // Handle numeric input
    if (typeof salary === 'number') {
        return `$${salary.toLocaleString()}`;
    }

    const salaryStr = salary.trim();
    if (salaryStr === '') {
        return '-';
    }

    // If already formatted or contains special chars, return as-is
    if (salaryStr.includes('$') || salaryStr.includes('/') ||
        salaryStr.includes('hour') || salaryStr.includes('year') ||
        salaryStr.includes('k') || salaryStr.includes('K')) {
        return salaryStr;
    }

    // Try to parse as number and format
    const numericSalary = parseFloat(salaryStr.replace(/[^\d.]/g, ''));
    if (!isNaN(numericSalary) && numericSalary > 0) {
        return `$${numericSalary.toLocaleString()}`;
    }

    return salaryStr;
};

/**
 * Format percentage with precision
 */
export const formatPercentage = (
    value: number,
    precision = 1,
    showSign = false
): string => {
    const formatted = value.toFixed(precision);
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${formatted}%`;
};

/**
 * Format currency amount
 */
export const formatCurrency = (
    amount: number,
    currency: Currency = 'USD',
    locale: Locale = 'en-US'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
};

/**
 * Format large numbers with abbreviations (1K, 1M, etc.)
 */
export const formatCompactNumber = (num: number): string => {
    const abbreviations = [
        {value: 1e9, symbol: 'B'},
        {value: 1e6, symbol: 'M'},
        {value: 1e3, symbol: 'K'}
    ];

    for (const {value, symbol} of abbreviations) {
        if (Math.abs(num) >= value) {
            return `${(num / value).toFixed(1)}${symbol}`;
        }
    }

    return num.toString();
};

// ============================================================================
// STRING FORMATTERS
// ============================================================================

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format US phone numbers
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Format international numbers (basic)
    if (cleaned.length > 10) {
        const countryCode = cleaned.slice(0, -10);
        const areaCode = cleaned.slice(-10, -7);
        const firstPart = cleaned.slice(-7, -4);
        const lastPart = cleaned.slice(-4);
        return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
    }

    // Return as-is if can't format but clean up spacing
    return phone.replace(/\s+/g, ' ').trim();
};

/**
 * Capitalize first letter of each word
 */
export const formatTitle = (text: string): string => {
    if (!text) return '';

    return text
        .toLowerCase()
        .split(' ')
        .map(word => {
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return `${text.substring(0, maxLength - 3)}...`;
};

/**
 * Generate initials from name
 */
export const generateInitials = (name: string, maxInitials = 2): string => {
    if (!name) return '';

    return name
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, maxInitials)
        .join('');
};

/**
 * Format text for URL slugs
 */
export const formatSlug = (text: string): string => {
    if (!text) return '';

    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Mask sensitive information
 */
export const maskText = (
    text: string,
    visibleStart = 3,
    visibleEnd = 3,
    maskChar = '*'
): string => {
    if (!text || text.length <= visibleStart + visibleEnd) {
        return text;
    }

    const start = text.substring(0, visibleStart);
    const end = text.substring(text.length - visibleEnd);
    const middle = maskChar.repeat(text.length - visibleStart - visibleEnd);

    return start + middle + end;
};

// ============================================================================
// APPLICATION-SPECIFIC FORMATTERS
// ============================================================================

/**
 * Format application status with color info
 */
export const formatStatus = (status: string): StatusFormat => {
    const statusMap: Record<string, StatusFormat> = {
        'applied': {text: 'Applied', className: 'status-applied'},
        'interview': {text: 'Interview', className: 'status-interview'},
        'interviewing': {text: 'Interviewing', className: 'status-interview'},
        'offer': {text: 'Offer', className: 'status-offer'},
        'rejected': {text: 'Rejected', className: 'status-rejected'},
        'withdrawn': {text: 'Withdrawn', className: 'status-withdrawn'},
        'pending': {text: 'Pending', className: 'status-pending'}
    };

    const normalizedStatus = status.toLowerCase().trim();
    return statusMap[normalizedStatus] || {
        text: formatTitle(status),
        className: 'status-default'
    };
};

/**
 * Format job type for display
 */
export const formatJobType = (type: string): string => {
    if (!type) return '';

    const typeMap: Record<string, string> = {
        'remote': 'Remote',
        'onsite': 'On-site',
        'on-site': 'On-site',
        'hybrid': 'Hybrid',
        'contract': 'Contract',
        'fulltime': 'Full-time',
        'full-time': 'Full-time',
        'parttime': 'Part-time',
        'part-time': 'Part-time',
        'temporary': 'Temporary',
        'internship': 'Internship'
    };

    const normalizedType = type.toLowerCase().trim();
    return typeMap[normalizedType] || formatTitle(type);
};

/**
 * Format priority level
 */
export const formatPriority = (priority: string | number): StatusFormat => {
    const priorityMap: Record<string, StatusFormat> = {
        'high': {text: 'High', className: 'priority-high'},
        '3': {text: 'High', className: 'priority-high'},
        'medium': {text: 'Medium', className: 'priority-medium'},
        '2': {text: 'Medium', className: 'priority-medium'},
        'low': {text: 'Low', className: 'priority-low'},
        '1': {text: 'Low', className: 'priority-low'}
    };

    const normalizedPriority = String(priority).toLowerCase().trim();
    return priorityMap[normalizedPriority] || {
        text: 'Medium',
        className: 'priority-medium'
    };
};

/**
 * Format experience level
 */
export const formatExperience = (experience: string): string => {
    const expMap: Record<string, string> = {
        'entry': 'Entry Level',
        'junior': 'Junior',
        'mid': 'Mid Level',
        'senior': 'Senior',
        'lead': 'Lead',
        'principal': 'Principal',
        'staff': 'Staff',
        'director': 'Director',
        'vp': 'VP',
        'c-level': 'C-Level'
    };

    const normalizedExp = experience.toLowerCase().trim();
    return expMap[normalizedExp] || formatTitle(experience);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safe formatter that handles null/undefined values
 */
export const safeFormat = <T>(
    value: T,
    formatter: (val: NonNullable<T>) => string,
    fallback = '-'
): string => {
    if (value === null || value === undefined) {
        return fallback;
    }

    try {
        return formatter(value as NonNullable<T>);
    } catch (error) {
        console.error('Formatting error:', error);
        return fallback;
    }
};

/**
 * Batch format multiple values
 */
export const batchFormat = <T>(
    values: T[],
    formatter: (val: T) => string
): string[] => {
    return values.map(value => {
        try {
            return formatter(value);
        } catch (error) {
            console.error('Batch formatting error:', error);
            return String(value);
        }
    });
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const formatters = {
    // Date formatters
    formatDate,
    formatDateForInput,
    formatRelativeTime,
    formatDuration,

    // Numeric formatters
    formatFileSize,
    formatSalary,
    formatPercentage,
    formatCurrency,
    formatCompactNumber,

    // String formatters
    formatPhoneNumber,
    formatTitle,
    truncateText,
    generateInitials,
    formatSlug,
    maskText,

    // Application-specific formatters
    formatStatus,
    formatJobType,
    formatPriority,
    formatExperience,

    // Utility functions
    safeFormat,
    batchFormat
} as const;

export default formatters;