// src/utils/helpers.ts
import {type ClassValue, clsx} from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

// Generate unique ID
export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
    if (typeof obj === 'object') {
        const clonedObj = {} as { [key: string]: any };
        Object.keys(obj).forEach(key => {
            clonedObj[key] = deepClone((obj as any)[key]);
        });
        return clonedObj as T;
    }
    return obj;
};

// Local storage utilities
export const storage = {
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }
};

// Array utilities
export const arrayUtils = {
    groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
        return array.reduce((groups, item) => {
            const group = String(item[key]);
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {} as Record<string, T[]>);
    },

    sortBy: <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },

    unique: <T>(array: T[]): T[] => {
        return Array.from(new Set(array));
    },

    chunk: <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

// Date utilities
export const dateUtils = {
    isToday: (date: string | Date): boolean => {
        const today = new Date();
        const compareDate = new Date(date);
        return today.toDateString() === compareDate.toDateString();
    },

    isThisWeek: (date: string | Date): boolean => {
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

    isThisMonth: (date: string | Date): boolean => {
        const now = new Date();
        const compareDate = new Date(date);
        return now.getMonth() === compareDate.getMonth() &&
            now.getFullYear() === compareDate.getFullYear();
    },

    getStartOfWeek: (date: Date = new Date()): Date => {
        const result = new Date(date);
        result.setDate(date.getDate() - date.getDay());
        result.setHours(0, 0, 0, 0);
        return result;
    },

    getStartOfMonth: (date: Date = new Date()): Date => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
};

// Validation utilities
export const validation = {
    email: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    url: (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    required: (value: any): boolean => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
    }
};

// File utilities
export const fileUtils = {
    formatSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    getFileExtension: (filename: string): string => {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    isImageFile: (filename: string): boolean => {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const extension = fileUtils.getFileExtension(filename).toLowerCase();
        return imageExtensions.includes(extension);
    },

    isPdfFile: (filename: string): boolean => {
        return fileUtils.getFileExtension(filename).toLowerCase() === 'pdf';
    }
};

// String utilities
export const stringUtils = {
    capitalize: (str: string): string => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    truncate: (str: string, maxLength: number): string => {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    },

    slugify: (str: string): string => {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    removeAccents: (str: string): string => {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
};

// Number utilities
export const numberUtils = {
    formatCurrency: (amount: number, currency = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    formatPercentage: (value: number, total: number): string => {
        if (total === 0) return '0%';
        return `${Math.round((value / total) * 100)}%`;
    },

    clamp: (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
    }
};