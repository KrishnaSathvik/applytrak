// src/types/patches.ts - Quick fixes for compilation errors
import * as React from 'react';

// Fix for React Hook Form types
export interface FieldError {
    type: string;
    message?: string;
}

export interface FieldErrors {
    [key: string]: FieldError | undefined;
}

// Fix for analytics service
export interface BrowserInfo {
    browserVersion?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    screenResolution?: string;
    timezone?: string;
    language?: string;
}

// Fix missing React types
export type ReactNode = React.ReactNode;
export type SetStateAction<T> = React.SetStateAction<T>;

// Export common utilities
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number' && !isNaN(value);
export const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

// Default empty handlers to prevent undefined errors
export const noop = () => {
};
export const noopAsync = async () => {
};

// Type guards for safety
export const hasProperty = <T extends object, K extends string | number | symbol>(
    obj: T,
    prop: K
): obj is T & Record<K, unknown> => {
    return prop in obj;
};

// Utility for safe property access
export const safeGet = <T>(obj: any, path: string, defaultValue?: T): T | undefined => {
    try {
        return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
        return defaultValue;
    }
};

// Fix for state action types
export type StateUpdater<T> = (prevState: T) => T;
export type StateSetter<T> = (value: T | StateUpdater<T>) => void;