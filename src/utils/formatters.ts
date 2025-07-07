// src/utils/formatters.ts

/**
 * Format date string to local date format
 */
export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }

        // Format as local date string
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
    try {
        const date = new Date(dateString);

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
export const formatRelativeTime = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format salary string consistently
 */
export const formatSalary = (salary?: string): string => {
    if (!salary || salary.trim() === '') {
        return '-';
    }

    // If already formatted or contains special chars, return as-is
    if (salary.includes('$') || salary.includes('/') || salary.includes('hour') || salary.includes('year')) {
        return salary;
    }

    // Try to parse as number and format
    const numericSalary = parseFloat(salary.replace(/[^\d.]/g, ''));
    if (!isNaN(numericSalary)) {
        return `$${numericSalary.toLocaleString()}`;
    }

    return salary;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format US phone numbers
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Format international numbers (basic)
    if (cleaned.length > 10) {
        return `+${cleaned.slice(0, -10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }

    return phone; // Return as-is if can't format
};

/**
 * Format percentage with precision
 */
export const formatPercentage = (value: number, precision = 1): string => {
    return `${value.toFixed(precision)}%`;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Capitalize first letter of each word
 */
export const formatTitle = (text: string): string => {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
};

/**
 * Format duration in days
 */
export const formatDuration = (startDate: string, endDate?: string): string => {
    try {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();

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

/**
 * Format application status with color info
 */
export const formatStatus = (status: string): { text: string; className: string } => {
    const statusMap = {
        'Applied': {text: 'Applied', className: 'status-applied'},
        'Interview': {text: 'Interview', className: 'status-interview'},
        'Offer': {text: 'Offer', className: 'status-offer'},
        'Rejected': {text: 'Rejected', className: 'status-rejected'}
    };

    return statusMap[status as keyof typeof statusMap] || {text: status, className: 'status-applied'};
};

/**
 * Format job type for display
 */
export const formatJobType = (type: string): string => {
    const typeMap = {
        'remote': 'Remote',
        'onsite': 'On-site',
        'hybrid': 'Hybrid'
    };

    return typeMap[type.toLowerCase() as keyof typeof typeMap] || type;
};

/**
 * Generate initials from name
 */
export const generateInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
};

export default {
    formatDate,
    formatDateForInput,
    formatRelativeTime,
    formatFileSize,
    formatSalary,
    formatPhoneNumber,
    formatPercentage,
    formatCurrency,
    formatTitle,
    truncateText,
    formatDuration,
    formatStatus,
    formatJobType,
    generateInitials
};