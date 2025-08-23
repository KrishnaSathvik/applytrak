// src/services/recoveryUtils.ts - PRODUCTION READY
import {Application} from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RecoveryOption {
    id: string;
    source: string;
    data: Application[];
    count: number;
    lastModified: string;
}

export interface RecoveryStats {
    totalOptions: number;
    totalApplications: number;
    sources: string[];
    latestBackup: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DATABASE_NAME = 'JobApplicationsDB';
const BACKUP_STORE_NAME = 'backups';
const LOCAL_BACKUP_KEY = 'jobTrackerBackup';
const LOCAL_BACKUP_META_KEY = 'jobTrackerBackup_meta';
const OPERATION_TIMEOUT_MS = 10000;
const MAX_BACKUP_AGE_DAYS = 30;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isValidApplication = (item: any): item is Application => {
    return (
        item &&
        typeof item === 'object' &&
        typeof item.company === 'string' &&
        typeof item.position === 'string' &&
        item.company.trim() !== '' &&
        item.position.trim() !== ''
    );
};

const isValidApplicationArray = (data: any): data is Application[] => {
    return Array.isArray(data) && data.length > 0 && data.every(isValidApplication);
};

const formatTimestamp = (timestamp: string | number | Date): string => {
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return 'Unknown';
        }
        return date.toLocaleString();
    } catch {
        return 'Unknown';
    }
};

const isBackupExpired = (timestamp: string | number | Date): boolean => {
    try {
        const backupDate = new Date(timestamp);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_BACKUP_AGE_DAYS);
        return backupDate < cutoffDate;
    } catch {
        return true;
    }
};

const createTimeoutPromise = <T>(timeoutMs: number): Promise<T> => {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([promise, createTimeoutPromise<T>(timeoutMs)]);
};

// ============================================================================
// RECOVERY UTILITIES CLASS
// ============================================================================

class RecoveryUtils {
    /**
     * Check if any recovery data is available
     */
    async checkForRecoveryData(): Promise<boolean> {
        try {
            console.log('Checking for recovery data...');

            const hasLocalBackup = this.checkLocalStorageBackup();
            if (hasLocalBackup) {
                console.log('Found localStorage backup');
                return true;
            }

            const hasIndexedDBBackup = await withTimeout(
                this.checkIndexedDBBackup(),
                OPERATION_TIMEOUT_MS
            );

            if (hasIndexedDBBackup) {
                console.log('Found IndexedDB backup');
                return true;
            }

            console.log('No recovery data found');
            return false;
        } catch (error) {
            console.error('Error checking recovery data:', error);
            return false;
        }
    }

    /**
     * Backward compatibility method
     */
    async checkForRecoveryNeeded(): Promise<boolean> {
        return this.checkForRecoveryData();
    }

    /**
     * Get all available recovery options
     */
    async getRecoveryOptions(): Promise<RecoveryOption[]> {
        const options: RecoveryOption[] = [];

        try {
            console.log('Gathering recovery options...');

            const localOption = this.getLocalStorageOption();
            if (localOption) {
                options.push(localOption);
            }

            const indexedDBOptions = await withTimeout(
                this.getIndexedDBBackups(),
                OPERATION_TIMEOUT_MS
            );

            for (const option of indexedDBOptions) {
                options.push(option);
            }

            options.sort((a, b) => {
                const dateA = new Date(a.lastModified === 'Unknown' ? 0 : a.lastModified);
                const dateB = new Date(b.lastModified === 'Unknown' ? 0 : b.lastModified);
                return dateB.getTime() - dateA.getTime();
            });

            console.log(`Found ${options.length} recovery options`);
            return options;
        } catch (error) {
            console.error('Error getting recovery options:', error);
            return [];
        }
    }

    /**
     * Get recovery statistics
     */
    async getRecoveryStats(): Promise<RecoveryStats> {
        try {
            const options = await this.getRecoveryOptions();

            const totalApplications = options.reduce((sum, option) => sum + option.count, 0);
            const sourceSet = new Set<string>();
            for (const option of options) {
                sourceSet.add(option.source);
            }
            const sources = Array.from(sourceSet);
            const latestBackup = options.length > 0 ? options[0].lastModified : null;

            return {
                totalOptions: options.length,
                totalApplications,
                sources,
                latestBackup
            };
        } catch (error) {
            console.error('Error getting recovery stats:', error);
            return {
                totalOptions: 0,
                totalApplications: 0,
                sources: [],
                latestBackup: null
            };
        }
    }

    /**
     * Perform recovery from selected option
     */
    async performRecovery(option: RecoveryOption): Promise<void> {
        try {
            console.log(`Starting recovery from ${option.source}...`);

            const validation = this.validateRecoveryOption(option);
            if (!validation.isValid) {
                throw new Error(`Invalid recovery data: ${validation.errors.join(', ')}`);
            }

            const {databaseService} = await import('./databaseService');

            console.log('Clearing existing data...');
            await databaseService.clearAllData();

            console.log(`Importing ${option.count} applications...`);

            let successCount = 0;
            const errors: string[] = [];

            for (const application of option.data) {
                try {
                    await databaseService.addApplication(application);
                    successCount++;
                } catch (error) {
                    const errorMsg = `Failed to import: ${application.company} - ${application.position}`;
                    errors.push(errorMsg);
                    console.error('Import error:', error);
                }
            }

            if (successCount === 0) {
                throw new Error('Failed to import any applications');
            }

            if (errors.length > 0) {
                console.warn(`Recovery completed with ${errors.length} errors:`, errors);
            }

            console.log(`Successfully recovered ${successCount}/${option.count} applications`);

            await this.cleanupAfterRecovery(option);
        } catch (error) {
            console.error('Recovery failed:', error);
            throw new Error(`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate recovery option before performing recovery
     */
    validateRecoveryOption(option: RecoveryOption): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!option.id) {
            errors.push('Missing recovery option ID');
        }

        if (!option.source) {
            errors.push('Missing recovery source');
        }

        if (!isValidApplicationArray(option.data)) {
            errors.push('Invalid application data format');
        }

        if (option.count !== option.data.length) {
            errors.push('Count mismatch with actual data length');
        }

        if (option.count === 0) {
            errors.push('No applications to recover');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check localStorage for backup data
     */
    private checkLocalStorageBackup(): boolean {
        try {
            const backup = localStorage.getItem(LOCAL_BACKUP_KEY);
            if (!backup) {
                return false;
            }

            const data = JSON.parse(backup);
            return isValidApplicationArray(data);
        } catch (error) {
            console.error('Error checking localStorage backup:', error);
            return false;
        }
    }

    /**
     * Get localStorage recovery option
     */
    private getLocalStorageOption(): RecoveryOption | null {
        try {
            const backup = localStorage.getItem(LOCAL_BACKUP_KEY);
            if (!backup) {
                return null;
            }

            const data = JSON.parse(backup);
            if (!isValidApplicationArray(data)) {
                return null;
            }

            let lastModified = 'Unknown';
            const metadata = localStorage.getItem(LOCAL_BACKUP_META_KEY);

            if (metadata) {
                try {
                    const meta = JSON.parse(metadata);
                    lastModified = formatTimestamp(meta.timestamp || meta.lastModified || Date.now());
                } catch {
                    lastModified = formatTimestamp(Date.now());
                }
            }

            return {
                id: 'localStorage',
                source: 'Local Storage Backup',
                data,
                count: data.length,
                lastModified
            };
        } catch (error) {
            console.error('Error getting localStorage option:', error);
            return null;
        }
    }

    /**
     * Check IndexedDB for backup data
     */
    private async checkIndexedDBBackup(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            try {
                const request = indexedDB.open(DATABASE_NAME);

                request.onsuccess = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;

                    try {
                        if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
                            db.close();
                            resolve(false);
                            return;
                        }

                        const transaction = db.transaction([BACKUP_STORE_NAME], 'readonly');
                        const store = transaction.objectStore(BACKUP_STORE_NAME);
                        const countRequest = store.count();

                        countRequest.onsuccess = () => {
                            db.close();
                            resolve(countRequest.result > 0);
                        };

                        countRequest.onerror = () => {
                            db.close();
                            resolve(false);
                        };

                        transaction.onerror = () => {
                            db.close();
                            resolve(false);
                        };
                    } catch (error) {
                        console.error('Error in IndexedDB transaction:', error);
                        db.close();
                        resolve(false);
                    }
                };

                request.onerror = () => {
                    resolve(false);
                };

                request.onblocked = () => {
                    resolve(false);
                };
            } catch (error) {
                console.error('Error checking IndexedDB backup:', error);
                resolve(false);
            }
        });
    }

    /**
     * Get all IndexedDB backup options
     */
    private async getIndexedDBBackups(): Promise<RecoveryOption[]> {
        return new Promise<RecoveryOption[]>((resolve) => {
            try {
                const request = indexedDB.open(DATABASE_NAME);

                request.onsuccess = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    const options: RecoveryOption[] = [];

                    try {
                        if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
                            db.close();
                            resolve([]);
                            return;
                        }

                        const transaction = db.transaction([BACKUP_STORE_NAME], 'readonly');
                        const store = transaction.objectStore(BACKUP_STORE_NAME);
                        const getAllRequest = store.getAll();

                        getAllRequest.onsuccess = () => {
                            try {
                                const backups = getAllRequest.result;

                                for (let index = 0; index < backups.length; index++) {
                                    const backup = backups[index];

                                    try {
                                        let backupData: any;

                                        if (typeof backup.data === 'string') {
                                            backupData = JSON.parse(backup.data);
                                        } else {
                                            backupData = backup.data;
                                        }

                                        const applications = backupData.applications || backupData || [];

                                        if (isValidApplicationArray(applications)) {
                                            if (backup.timestamp && isBackupExpired(backup.timestamp)) {
                                                console.log(`Skipping expired backup: ${backup.id}`);
                                                continue;
                                            }

                                            options.push({
                                                id: `indexeddb-${backup.id || index}`,
                                                source: `Database Backup ${index + 1}`,
                                                data: applications,
                                                count: applications.length,
                                                lastModified: formatTimestamp(backup.timestamp || Date.now())
                                            });
                                        }
                                    } catch (error) {
                                        console.error(`Error processing backup ${index}:`, error);
                                    }
                                }

                                db.close();
                                resolve(options);
                            } catch (error) {
                                console.error('Error processing backups:', error);
                                db.close();
                                resolve([]);
                            }
                        };

                        getAllRequest.onerror = () => {
                            console.error('Failed to get backups from IndexedDB');
                            db.close();
                            resolve([]);
                        };

                        transaction.onerror = () => {
                            console.error('IndexedDB transaction failed');
                            db.close();
                            resolve([]);
                        };
                    } catch (error) {
                        console.error('Error in IndexedDB backup retrieval:', error);
                        db.close();
                        resolve([]);
                    }
                };

                request.onerror = () => {
                    resolve([]);
                };

                request.onblocked = () => {
                    resolve([]);
                };
            } catch (error) {
                console.error('Error getting IndexedDB backups:', error);
                resolve([]);
            }
        });
    }

    /**
     * Clean up recovery data after successful recovery
     */
    private async cleanupAfterRecovery(option: RecoveryOption): Promise<void> {
        try {
            console.log('Cleaning up after recovery...');

            if (option.id === 'localStorage') {
                localStorage.removeItem(LOCAL_BACKUP_KEY);
                localStorage.removeItem(LOCAL_BACKUP_META_KEY);
                console.log('Removed localStorage backup');
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const recoveryUtils = new RecoveryUtils();
export default recoveryUtils;