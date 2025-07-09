// src/utils/backup.ts
import {Application} from '../types';

export interface BackupData {
    applications: Application[];
    timestamp: string;
    version: string;
}

export interface CompressedBackupData {
    apps: Partial<Application>[]; // Compressed applications without attachments
    ts: string; // timestamp
    v: string; // version
    count: number; // application count for verification
}

interface StorageUsage {
    used: number; // KB
    usedMB: number; // MB
    estimated_limit: number; // KB
    available: number; // KB
    percentage: number;
    canBackup: boolean;
}

// Utility to check localStorage available space
const getStorageInfo = (): StorageUsage => {
    let used = 0;
    try {
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage.getItem(key)?.length || 0;
            }
        }
    } catch (error) {
        console.warn('Error calculating storage usage:', error);
    }

    const usedKB = Math.round(used / 1024);
    const usedMB = Math.round(used / (1024 * 1024) * 100) / 100;
    const limitKB = 5 * 1024; // 5MB in KB (conservative estimate)
    const availableKB = limitKB - usedKB;
    const percentage = Math.round((usedKB / limitKB) * 100);

    return {
        used: usedKB,
        usedMB,
        estimated_limit: limitKB,
        available: Math.max(0, availableKB),
        percentage: Math.min(100, Math.max(0, percentage)),
        canBackup: availableKB > 1000 // Need at least 1MB free
    };
};

// Create compressed backup data (exclude large attachments for localStorage)
const createCompressedBackup = (applications: Application[]): CompressedBackupData => {
    const compressedApps = applications.map(app => ({
        id: app.id,
        company: app.company,
        position: app.position,
        dateApplied: app.dateApplied,
        status: app.status,
        type: app.type,
        location: app.location,
        salary: app.salary,
        jobSource: app.jobSource,
        jobUrl: app.jobUrl,
        notes: app.notes?.substring(0, 500), // Limit notes to 500 chars
        // Exclude attachments from localStorage backup
        attachmentCount: app.attachments?.length || 0
    }));

    return {
        apps: compressedApps,
        ts: new Date().toISOString(),
        v: '1.0.0',
        count: applications.length
    };
};

// Safely store in localStorage with size checking
const safeLocalStorageSet = (key: string, data: any): boolean => {
    try {
        const jsonString = JSON.stringify(data);
        const sizeKB = Math.round(jsonString.length / 1024);
        const storageInfo = getStorageInfo();

        console.log(`Attempting to store ${sizeKB}KB. Available: ${storageInfo.available}KB`);

        // Check if we have enough space (with 500KB buffer)
        if (sizeKB > storageInfo.available - 500) {
            console.warn(`Not enough localStorage space. Need: ${sizeKB}KB, Available: ${storageInfo.available}KB`);

            // Try to free up space by removing old backups
            const oldBackups = localStorage.getItem('jobTrackerBackups');
            if (oldBackups) {
                localStorage.removeItem('jobTrackerBackups');
                console.log('Removed old backups to free space');
            }

            // Try again after cleanup
            const newStorageInfo = getStorageInfo();
            if (sizeKB > newStorageInfo.available - 200) {
                throw new Error(`QuotaExceededError: Backup too large (${sizeKB}KB). Available: ${newStorageInfo.available}KB`);
            }
        }

        localStorage.setItem(key, jsonString);
        console.log(`Successfully stored ${sizeKB}KB in localStorage`);
        return true;

    } catch (error) {
        if (error instanceof Error && (error.name === 'QuotaExceededError' || error.message.includes('quota'))) {
            console.error('localStorage quota exceeded:', error.message);
        } else {
            console.error('Failed to store in localStorage:', error);
        }
        return false;
    }
};

// Auto backup functionality with quota protection
export const setupAutoBackup = (getApplicationsData: () => Promise<Application[]>) => {
    let intervalId: NodeJS.Timeout | null = null;

    const createBackup = async (): Promise<void> => {
        try {
            const applications = await getApplicationsData();

            // Create compressed backup for localStorage (without attachments)
            const compressedBackup = createCompressedBackup(applications);

            // Try to store compressed backup in localStorage
            const stored = safeLocalStorageSet('jobTrackerBackup', compressedBackup);

            if (stored) {
                // Also try to maintain rotating backups (compressed)
                try {
                    const existingBackups = JSON.parse(localStorage.getItem('jobTrackerBackups') || '[]');
                    existingBackups.unshift(compressedBackup);

                    // Keep only the last 2 backups to save space
                    if (existingBackups.length > 2) {
                        existingBackups.splice(2);
                    }

                    safeLocalStorageSet('jobTrackerBackups', existingBackups);
                } catch (backupRotationError) {
                    console.warn('Failed to maintain backup rotation:', backupRotationError);
                    // Continue with single backup even if rotation fails
                }

                console.log(`Auto backup created successfully (${applications.length} applications, compressed)`);
            } else {
                console.warn('Auto backup failed due to storage constraints');

                // Fallback: Store only essential data
                const essentialBackup = {
                    apps: applications.map(app => ({
                        id: app.id,
                        company: app.company,
                        position: app.position,
                        dateApplied: app.dateApplied,
                        status: app.status
                    })),
                    ts: new Date().toISOString(),
                    v: '1.0.0-minimal',
                    count: applications.length
                };

                safeLocalStorageSet('jobTrackerBackupMinimal', essentialBackup);
                console.log('Created minimal backup as fallback');
            }

        } catch (error) {
            console.error('Auto backup failed:', error);
        }
    };

    const startAutoBackup = () => {
        // Create initial backup
        createBackup();

        // Set up periodic backups every 30 minutes
        intervalId = setInterval(createBackup, 30 * 60 * 1000);

        // Backup on page unload
        const handleBeforeUnload = () => {
            createBackup();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Return cleanup function
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    };

    return startAutoBackup();
};

// Manual backup creation (full backup with attachments)
export const createManualBackup = async (applications: Application[]): Promise<void> => {
    try {
        const backupData: BackupData = {
            applications, // Full data including attachments for download
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `applytrak-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log(`Manual backup created successfully (${Math.round(jsonString.length / 1024)}KB)`);
    } catch (error) {
        console.error('Manual backup failed:', error);
        throw new Error('Failed to create backup: ' + (error as Error).message);
    }
};

// Restore from backup
export const restoreFromBackup = async (backupFile: File): Promise<Application[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;

                // Try to parse as full backup first
                try {
                    const backupData: BackupData = JSON.parse(content);
                    if (backupData.applications && Array.isArray(backupData.applications)) {
                        resolve(backupData.applications);
                        return;
                    }
                } catch {
                    // If that fails, try compressed format
                }

                // Try to parse as compressed backup
                const compressedBackup: CompressedBackupData = JSON.parse(content);
                if (compressedBackup.apps && Array.isArray(compressedBackup.apps)) {
                    // Convert compressed format back to full format
                    const applications: Application[] = compressedBackup.apps.map((app: any) => ({
                        ...app,
                        attachments: [], // Attachments lost in compressed backup
                        notes: app.notes || ''
                    })) as Application[];
                    resolve(applications);
                    return;
                }

                throw new Error('Invalid backup format: applications data not found');

            } catch (error) {
                reject(new Error('Failed to parse backup file: ' + (error as Error).message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read backup file'));
        };

        reader.readAsText(backupFile);
    });
};

// Get available backups from localStorage
export const getLocalBackups = (): (BackupData | CompressedBackupData)[] => {
    try {
        const backups = localStorage.getItem('jobTrackerBackups');
        const parsed = backups ? JSON.parse(backups) : [];

        // Also check for single backup
        const singleBackup = localStorage.getItem('jobTrackerBackup');
        if (singleBackup && !parsed.length) {
            return [JSON.parse(singleBackup)];
        }

        return parsed;
    } catch (error) {
        console.error('Failed to get local backups:', error);
        return [];
    }
};

// Get storage usage info
export const getStorageUsage = (): StorageUsage => {
    return getStorageInfo();
};

// Clear old backups
export const clearOldBackups = (): void => {
    try {
        localStorage.removeItem('jobTrackerBackups');
        localStorage.removeItem('jobTrackerBackup');
        localStorage.removeItem('jobTrackerBackupMinimal');
        console.log('Cleared all local backups');
    } catch (error) {
        console.error('Failed to clear old backups:', error);
    }
};

// Emergency recovery from any available backup
export const emergencyRecover = (): Application[] | null => {
    const sources = [
        'jobTrackerBackup',
        'jobTrackerBackups',
        'jobTrackerBackupMinimal'
    ];

    for (const source of sources) {
        try {
            const data = localStorage.getItem(source);
            if (!data) continue;

            const parsed = JSON.parse(data);

            // Handle different backup formats
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Array of backups
                const backup = parsed[0];
                if (backup.apps) {
                    return backup.apps.map((app: any) => ({
                        ...app,
                        attachments: [],
                        notes: app.notes || ''
                    })) as Application[];
                }
            } else if (parsed.apps) {
                // Single compressed backup
                return parsed.apps.map((app: any) => ({
                    ...app,
                    attachments: [],
                    notes: app.notes || ''
                })) as Application[];
            } else if (parsed.applications) {
                // Full backup
                return parsed.applications;
            }
        } catch (error) {
            console.warn(`Failed to recover from ${source}:`, error);
            continue;
        }
    }

    return null;
};