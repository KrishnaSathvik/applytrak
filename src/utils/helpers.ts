// src/utils/helpers.ts - General utility functions and helpers
import {type ClassValue, clsx} from 'clsx';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SortDirection = 'asc' | 'desc';
export type DateInput = string | Date;

export interface GroupedData<T> {
    [key: string]: T[];
}

export interface ValidationMethods {
    email: (email: string) => boolean;
    url: (url: string) => boolean;
    required: (value: unknown) => boolean;
}

// ============================================================================
// CORE UTILITIES
// ============================================================================

/**
 * Combine class names using clsx
 */
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}

/**
 * Generate unique ID using timestamp and random string
 */
export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function to limit function calls
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | undefined;

    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Throttle function to limit function execution frequency
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
};

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clone utility with proper type handling
 */
export const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as T;
    }

    if (obj instanceof Array) {
        return obj.map(item => deepClone(item)) as T;
    }

    if (obj instanceof RegExp) {
        return new RegExp(obj.source, obj.flags) as T;
    }

    if (typeof obj === 'object') {
        const clonedObj: Record<string, unknown> = {};

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }

        return clonedObj as T;
    }

    return obj;
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export const storage = {
    /**
     * Get item from localStorage with fallback
     */
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Failed to parse localStorage item "${key}":`, error);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage with error handling
     */
    set: <T>(key: string, value: T): boolean => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Failed to save to localStorage (key: "${key}"):`, error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     */
    remove: (key: string): boolean => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Failed to remove from localStorage (key: "${key}"):`, error);
            return false;
        }
    },

    /**
     * Check if localStorage is available
     */
    isAvailable: (): boolean => {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }
} as const;

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

export const arrayUtils = {
    /**
     * Group array items by specified key
     */
    groupBy: <T, K extends keyof T>(
        array: T[],
        key: K
    ): GroupedData<T> => {
        return array.reduce((groups, item) => {
            const group = String(item[key]);
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {} as GroupedData<T>);
    },

    /**
     * Sort array by specified key and direction
     */
    sortBy: <T, K extends keyof T>(
        array: T[],
        key: K,
        direction: SortDirection = 'asc'
    ): T[] => {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * Get unique values from array
     */
    unique: <T>(array: T[]): T[] => {
        return Array.from(new Set(array));
    },

    /**
     * Split array into chunks of specified size
     */
    chunk: <T>(array: T[], size: number): T[][] => {
        if (size <= 0) throw new Error('Chunk size must be greater than 0');

        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },

    /**
     * Shuffle array elements randomly
     */
    shuffle: <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Remove duplicates based on a key
     */
    uniqueBy: <T, K extends keyof T>(array: T[], key: K): T[] => {
        const seen = new Set();
        return array.filter(item => {
            const keyValue = item[key];
            if (seen.has(keyValue)) {
                return false;
            }
            seen.add(keyValue);
            return true;
        });
    }
} as const;

// ============================================================================
// DATE UTILITIES
// ============================================================================

export const dateUtils = {
    /**
     * Check if date is today
     */
    isToday: (date: DateInput): boolean => {
        const today = new Date();
        const compareDate = new Date(date);
        return today.toDateString() === compareDate.toDateString();
    },

    /**
     * Check if date is within current week
     */
    isThisWeek: (date: DateInput): boolean => {
        const now = new Date();
        const compareDate = new Date(date);
        const weekStart = new Date(now);

        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return compareDate >= weekStart && compareDate <= weekEnd;
    },

    /**
     * Check if date is within current month
     */
    isThisMonth: (date: DateInput): boolean => {
        const now = new Date();
        const compareDate = new Date(date);
        return (
            now.getMonth() === compareDate.getMonth() &&
            now.getFullYear() === compareDate.getFullYear()
        );
    },

    /**
     * Get start of week for given date
     */
    getStartOfWeek: (date: Date = new Date()): Date => {
        const result = new Date(date);
        result.setDate(date.getDate() - date.getDay());
        result.setHours(0, 0, 0, 0);
        return result;
    },

    /**
     * Get start of month for given date
     */
    getStartOfMonth: (date: Date = new Date()): Date => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },

    /**
     * Format date for display
     */
    formatRelative: (date: DateInput): string => {
        const now = new Date();
        const compareDate = new Date(date);
        const diffInMs = now.getTime() - compareDate.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    }
} as const;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validation: ValidationMethods = {
    /**
     * Validate email format
     */
    email: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    },

    /**
     * Validate URL format
     */
    url: (url: string): boolean => {
        try {
            new URL(url.trim());
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Check if value is required (not empty)
     */
    required: (value: unknown): boolean => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'number') return !isNaN(value);
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
    }
} as const;

// ============================================================================
// FILE UTILITIES
// ============================================================================

export const fileUtils = {
    /**
     * Format file size in human readable format
     */
    formatSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },

    /**
     * Get file extension from filename
     */
    getFileExtension: (filename: string): string => {
        if (!filename || typeof filename !== 'string') return '';

        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1).toLowerCase() : '';
    },

    /**
     * Check if file is an image
     */
    isImageFile: (filename: string): boolean => {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const extension = fileUtils.getFileExtension(filename);
        return imageExtensions.includes(extension);
    },

    /**
     * Check if file is a PDF
     */
    isPdfFile: (filename: string): boolean => {
        return fileUtils.getFileExtension(filename) === 'pdf';
    },

    /**
     * Check if file is a document
     */
    isDocumentFile: (filename: string): boolean => {
        const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
        const extension = fileUtils.getFileExtension(filename);
        return documentExtensions.includes(extension);
    },

    /**
     * Get MIME type from file extension
     */
    getMimeType: (filename: string): string => {
        const extension = fileUtils.getFileExtension(filename);
        const mimeTypes: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp'
        };

        return mimeTypes[extension] || 'application/octet-stream';
    }
} as const;

// ============================================================================
// STRING UTILITIES
// ============================================================================

export const stringUtils = {
    /**
     * Capitalize first letter of string
     */
    capitalize: (str: string): string => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Capitalize first letter of each word
     */
    titleCase: (str: string): string => {
        if (!str) return str;
        return str
            .toLowerCase()
            .split(' ')
            .map(word => stringUtils.capitalize(word))
            .join(' ');
    },

    /**
     * Truncate string with ellipsis
     */
    truncate: (str: string, maxLength: number): string => {
        if (!str || str.length <= maxLength) return str;
        return `${str.substring(0, maxLength)}...`;
    },

    /**
     * Convert string to URL-friendly slug
     */
    slugify: (str: string): string => {
        if (!str) return '';

        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Remove accents from string
     */
    removeAccents: (str: string): string => {
        if (!str) return str;
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * Extract initials from name
     */
    getInitials: (name: string, maxLength = 2): string => {
        if (!name) return '';

        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, maxLength)
            .join('');
    },

    /**
     * Mask sensitive information
     */
    mask: (str: string, visibleStart = 3, visibleEnd = 3, maskChar = '*'): string => {
        if (!str || str.length <= visibleStart + visibleEnd) return str;

        const start = str.substring(0, visibleStart);
        const end = str.substring(str.length - visibleEnd);
        const middle = maskChar.repeat(str.length - visibleStart - visibleEnd);

        return start + middle + end;
    }
} as const;

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

export const numberUtils = {
    /**
     * Format number as currency
     */
    formatCurrency: (
        amount: number,
        currency = 'USD',
        locale = 'en-US'
    ): string => {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Format number as percentage
     */
    formatPercentage: (value: number, total: number, decimals = 0): string => {
        if (total === 0) return '0%';
        const percentage = (value / total) * 100;
        return `${percentage.toFixed(decimals)}%`;
    },

    /**
     * Clamp number between min and max values
     */
    clamp: (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Format large numbers with abbreviations
     */
    formatCompact: (num: number, decimals = 1): string => {
        const abbreviations = [
            {value: 1e9, symbol: 'B'},
            {value: 1e6, symbol: 'M'},
            {value: 1e3, symbol: 'K'}
        ];

        for (const {value, symbol} of abbreviations) {
            if (num >= value) {
                return `${(num / value).toFixed(decimals)}${symbol}`;
            }
        }

        return num.toString();
    },

    /**
     * Generate random number between min and max
     */
    random: (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Round to specified decimal places
     */
    roundTo: (num: number, decimals: number): number => {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
} as const;

// ============================================================================
// UTILITY AGGREGATION
// ============================================================================

export const utils = {
    cn,
    generateId,
    debounce,
    throttle,
    deepClone,
    storage,
    arrayUtils,
    dateUtils,
    validation,
    fileUtils,
    stringUtils,
    numberUtils
} as const;

export default utils;