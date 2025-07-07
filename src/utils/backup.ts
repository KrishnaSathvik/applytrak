// src/utils/backup.ts
import {Application} from '../types';

export interface BackupData {
    applications: Application[];
    timestamp: string;
    version: string;
}

// Auto backup functionality
export const setupAutoBackup = (getApplicationsData: () => Promise<Application[]>) => {
    let intervalId: NodeJS.Timeout | null = null;

    const createBackup = async (): Promise<void> => {
        try {
            const applications = await getApplicationsData();
            const backupData: BackupData = {
                applications,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            // Store in localStorage as emergency backup
            localStorage.setItem('jobTrackerBackup', JSON.stringify(backupData));

            // Also store in a rotating backup system (keep last 3 backups)
            const existingBackups = JSON.parse(localStorage.getItem('jobTrackerBackups') || '[]');
            existingBackups.unshift(backupData);

            // Keep only the last 3 backups
            if (existingBackups.length > 3) {
                existingBackups.splice(3);
            }

            localStorage.setItem('jobTrackerBackups', JSON.stringify(existingBackups));

            console.log('Auto backup created successfully');
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

// Manual backup creation
export const createManualBackup = async (applications: Application[]): Promise<void> => {
    try {
        const backupData: BackupData = {
            applications,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `job-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
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
                const backupData: BackupData = JSON.parse(content);

                if (!backupData.applications || !Array.isArray(backupData.applications)) {
                    throw new Error('Invalid backup format: applications data not found');
                }

                resolve(backupData.applications);
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
export const getLocalBackups = (): BackupData[] => {
    try {
        const backups = localStorage.getItem('jobTrackerBackups');
        return backups ? JSON.parse(backups) : [];
    } catch (error) {
        console.error('Failed to get local backups:', error);
        return [];
    }
};

// Clear old backups
export const clearOldBackups = (): void => {
    try {
        localStorage.removeItem('jobTrackerBackups');
        localStorage.removeItem('jobTrackerBackup');
    } catch (error) {
        console.error('Failed to clear old backups:', error);
    }
};