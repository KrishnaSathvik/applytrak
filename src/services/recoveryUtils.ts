// src/services/recoveryUtils.ts - FIXED VERSION
import {Application} from '../types';

export interface RecoveryOption {
    id: string;
    source: string;
    data: Application[];
    count: number;
    lastModified: string;
}

export const recoveryUtils = {
    // FIXED: Method name to match your RecoveryAlert component
    async checkForRecoveryData(): Promise<boolean> {
        try {
            // Check localStorage backup
            const localBackup = localStorage.getItem('jobTrackerBackup');
            if (localBackup) {
                const data = JSON.parse(localBackup);
                return Array.isArray(data) && data.length > 0;
            }

            // Check for other recovery sources
            const indexedDBBackup = await this.checkIndexedDBBackup();
            return indexedDBBackup;
        } catch (error) {
            console.error('Error checking recovery options:', error);
            return false;
        }
    },

    // Keep the old method name for backward compatibility
    async checkForRecoveryNeeded(): Promise<boolean> {
        return this.checkForRecoveryData();
    },

    async getRecoveryOptions(): Promise<RecoveryOption[]> {
        const options: RecoveryOption[] = [];

        try {
            // Check localStorage backup
            const localBackup = localStorage.getItem('jobTrackerBackup');
            if (localBackup) {
                try {
                    const data = JSON.parse(localBackup);
                    if (Array.isArray(data) && data.length > 0) {
                        options.push({
                            id: 'localStorage',
                            source: 'localStorage',
                            data: data,
                            count: data.length,
                            lastModified: 'Unknown'
                        });
                    }
                } catch (error) {
                    console.error('Error parsing localStorage backup:', error);
                }
            }

            // Check for IndexedDB backups
            const indexedDBOptions = await this.getIndexedDBBackups();
            options.push(...indexedDBOptions);

        } catch (error) {
            console.error('Error getting recovery options:', error);
        }

        return options;
    },

    async checkIndexedDBBackup(): Promise<boolean> {
        try {
            // Try to open the database and check for backup data
            return new Promise((resolve) => {
                const request = indexedDB.open('JobApplicationsDB'); // FIXED: Use correct database name

                request.onsuccess = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;

                    if (db.objectStoreNames.contains('backups')) {
                        const transaction = db.transaction(['backups'], 'readonly');
                        const store = transaction.objectStore('backups');
                        const countRequest = store.count();

                        countRequest.onsuccess = () => {
                            resolve(countRequest.result > 0);
                        };

                        countRequest.onerror = () => {
                            resolve(false);
                        };
                    } else {
                        resolve(false);
                    }

                    db.close();
                };

                request.onerror = () => {
                    resolve(false);
                };
            });
        } catch (error) {
            console.error('Error checking IndexedDB backup:', error);
            return false;
        }
    },

    async getIndexedDBBackups(): Promise<RecoveryOption[]> {
        try {
            return new Promise((resolve) => {
                const request = indexedDB.open('JobApplicationsDB'); // FIXED: Use correct database name

                request.onsuccess = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    const options: RecoveryOption[] = [];

                    if (db.objectStoreNames.contains('backups')) {
                        const transaction = db.transaction(['backups'], 'readonly');
                        const store = transaction.objectStore('backups');
                        const getAllRequest = store.getAll();

                        getAllRequest.onsuccess = () => {
                            const backups = getAllRequest.result;

                            backups.forEach((backup, index) => {
                                try {
                                    const backupData = JSON.parse(backup.data);
                                    const applications = backupData.applications || [];

                                    if (Array.isArray(applications) && applications.length > 0) {
                                        options.push({
                                            id: `backup-${backup.id}`,
                                            source: `database-backup-${index + 1}`,
                                            data: applications,
                                            count: applications.length,
                                            lastModified: backup.timestamp || 'Unknown'
                                        });
                                    }
                                } catch (error) {
                                    console.error('Error parsing backup data:', error);
                                }
                            });

                            resolve(options);
                        };

                        getAllRequest.onerror = () => {
                            resolve([]);
                        };
                    } else {
                        resolve([]);
                    }

                    db.close();
                };

                request.onerror = () => {
                    resolve([]);
                };
            });
        } catch (error) {
            console.error('Error getting IndexedDB backups:', error);
            return [];
        }
    },

    async performRecovery(option: RecoveryOption): Promise<void> {
        try {
            // FIXED: Import from the correct database service file
            const {databaseService} = await import('./database');

            // Clear existing data
            await databaseService.clearAllData();

            // Import recovery data
            await databaseService.importApplications(option.data);

            console.log(`Successfully recovered ${option.count} applications from ${option.source}`);
        } catch (error) {
            console.error('Error performing recovery:', error);
            throw new Error(`Recovery failed: ${error}`);
        }
    }
};

export default recoveryUtils;