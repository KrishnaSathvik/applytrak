// src/utils/backup.ts - Production Ready Version
import {Application} from '../types';

// Enhanced interfaces with better type safety
export interface BackupData {
    applications: Application[];
    timestamp: string;
    version: string;
    metadata: {
        totalApplications: number;
        backupSize: number;
        checksum?: string;
    };
}

export interface CompressedBackupData {
    apps: Partial<Application>[];
    ts: string;
    v: string;
    count: number;
    metadata: {
        compressionRatio: number;
        originalSize: number;
        compressedSize: number;
    };
}

export interface StorageUsage {
    used: number; // KB
    usedMB: number; // MB
    estimatedLimit: number; // KB
    available: number; // KB
    percentage: number;
    canBackup: boolean;
    status: 'healthy' | 'warning' | 'critical';
}

export interface BackupConfig {
    autoBackupInterval: number; // minutes
    maxBackupCount: number;
    compressionLevel: 'minimal' | 'standard' | 'aggressive';
    enableRotation: boolean;
}

// Constants
const DEFAULT_CONFIG: BackupConfig = {
    autoBackupInterval: 30,
    maxBackupCount: 3,
    compressionLevel: 'standard',
    enableRotation: true
};

const STORAGE_LIMITS = {
    conservative: 5 * 1024, // 5MB in KB
    buffer: 500, // 500KB buffer
    minimal: 1024, // 1MB minimum free space
    emergency: 200 // 200KB emergency buffer
};

const BACKUP_KEYS = {
    current: 'jobTrackerBackup',
    history: 'jobTrackerBackups',
    minimal: 'jobTrackerBackupMinimal',
    config: 'jobTrackerBackupConfig'
} as const;

// Utility Functions
const calculateChecksum = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
};

const getStorageInfo = (): StorageUsage => {
    let used = 0;

    try {
        // More accurate storage calculation
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const value = localStorage.getItem(key);
                if (value) {
                    used += key.length + value.length;
                }
            }
        }
    } catch (error) {
        console.warn('Error calculating storage usage:', error);
    }

    const usedKB = Math.round(used / 1024);
    const usedMB = Math.round(used / (1024 * 1024) * 100) / 100;
    const limitKB = STORAGE_LIMITS.conservative;
    const availableKB = Math.max(0, limitKB - usedKB);
    const percentage = Math.round((usedKB / limitKB) * 100);

    // Determine storage health status
    let status: StorageUsage['status'] = 'healthy';
    if (percentage > 80) status = 'critical';
    else if (percentage > 60) status = 'warning';

    return {
        used: usedKB,
        usedMB,
        estimatedLimit: limitKB,
        available: availableKB,
        percentage: Math.min(100, Math.max(0, percentage)),
        canBackup: availableKB > STORAGE_LIMITS.minimal,
        status
    };
};

const createCompressedBackup = (
    applications: Application[],
    compressionLevel: BackupConfig['compressionLevel'] = 'standard'
): CompressedBackupData => {
    const originalSize = JSON.stringify(applications).length;

    const compressedApps = applications.map(app => {
        const baseApp = {
            id: app.id,
            company: app.company,
            position: app.position,
            dateApplied: app.dateApplied,
            status: app.status,
            type: app.type,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
        };

        switch (compressionLevel) {
            case 'minimal':
                return baseApp;

            case 'aggressive':
                return {
                    ...baseApp,
                    location: app.location?.substring(0, 50) || '',
                    salary: app.salary?.substring(0, 20) || '',
                    jobSource: app.jobSource?.substring(0, 30) || '',
                    jobUrl: app.jobUrl?.substring(0, 100) || '',
                    notes: app.notes?.substring(0, 200) || '',
                    attachmentCount: app.attachments?.length || 0
                };

            default: // standard
                return {
                    ...baseApp,
                    location: app.location || '',
                    salary: app.salary || '',
                    jobSource: app.jobSource || '',
                    jobUrl: app.jobUrl || '',
                    notes: app.notes?.substring(0, 500) || '',
                    attachmentCount: app.attachments?.length || 0
                };
        }
    });

    const compressedSize = JSON.stringify(compressedApps).length;
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

    return {
        apps: compressedApps,
        ts: new Date().toISOString(),
        v: '1.1.0',
        count: applications.length,
        metadata: {
            compressionRatio,
            originalSize,
            compressedSize
        }
    };
};

const safeLocalStorageSet = (key: string, data: any): { success: boolean; error?: string } => {
    try {
        const jsonString = JSON.stringify(data);
        const sizeKB = Math.round(jsonString.length / 1024);
        const storageInfo = getStorageInfo();

        console.log(`Attempting to store ${sizeKB}KB in ${key}. Available: ${storageInfo.available}KB`);

        // Check storage capacity
        if (sizeKB > storageInfo.available - STORAGE_LIMITS.buffer) {
            console.warn(`Insufficient localStorage space. Need: ${sizeKB}KB, Available: ${storageInfo.available}KB`);

            // Attempt cleanup
            const cleaned = performStorageCleanup();
            if (!cleaned) {
                return {
                    success: false,
                    error: `Storage quota exceeded. Need ${sizeKB}KB, available ${storageInfo.available}KB`
                };
            }

            // Recheck after cleanup
            const newStorageInfo = getStorageInfo();
            if (sizeKB > newStorageInfo.available - STORAGE_LIMITS.emergency) {
                return {
                    success: false,
                    error: `Storage still insufficient after cleanup. Need ${sizeKB}KB, available ${newStorageInfo.available}KB`
                };
            }
        }

        localStorage.setItem(key, jsonString);
        console.log(`Successfully stored ${sizeKB}KB in localStorage`);
        return {success: true};

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';

        if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
            console.error('localStorage quota exceeded:', errorMessage);
            return {success: false, error: 'Storage quota exceeded'};
        }

        console.error('Failed to store in localStorage:', error);
        return {success: false, error: errorMessage};
    }
};

const performStorageCleanup = (): boolean => {
    try {
        let cleaned = false;

        // Remove old backup history first
        if (localStorage.getItem(BACKUP_KEYS.history)) {
            localStorage.removeItem(BACKUP_KEYS.history);
            cleaned = true;
            console.log('Removed backup history to free space');
        }

        // Remove minimal backup if exists
        if (localStorage.getItem(BACKUP_KEYS.minimal)) {
            localStorage.removeItem(BACKUP_KEYS.minimal);
            cleaned = true;
            console.log('Removed minimal backup to free space');
        }

        // Clean up any orphaned backup keys
        const orphanedKeys = Object.keys(localStorage).filter(key =>
            key.startsWith('jobTracker') && !Object.values(BACKUP_KEYS).includes(key as any)
        );

        orphanedKeys.forEach(key => {
            localStorage.removeItem(key);
            cleaned = true;
            console.log(`Removed orphaned backup key: ${key}`);
        });

        return cleaned;
    } catch (error) {
        console.error('Storage cleanup failed:', error);
        return false;
    }
};

const getBackupConfig = (): BackupConfig => {
    try {
        const configData = localStorage.getItem(BACKUP_KEYS.config);
        if (configData) {
            const config = JSON.parse(configData);
            return {...DEFAULT_CONFIG, ...config};
        }
    } catch (error) {
        console.warn('Failed to load backup config, using defaults:', error);
    }
    return DEFAULT_CONFIG;
};

const saveBackupConfig = (config: Partial<BackupConfig>): void => {
    try {
        const currentConfig = getBackupConfig();
        const newConfig = {...currentConfig, ...config};
        localStorage.setItem(BACKUP_KEYS.config, JSON.stringify(newConfig));
    } catch (error) {
        console.error('Failed to save backup config:', error);
    }
};

// Enhanced Auto Backup System
export const setupAutoBackup = (getApplicationsData: () => Promise<Application[]>) => {
    let intervalId: NodeJS.Timeout | null = null;
    let isBackupInProgress = false;

    const createBackup = async (): Promise<void> => {
        if (isBackupInProgress) {
            console.log('Backup already in progress, skipping...');
            return;
        }

        isBackupInProgress = true;

        try {
            const applications = await getApplicationsData();
            const config = getBackupConfig();
            const storageInfo = getStorageInfo();

            if (!storageInfo.canBackup) {
                console.warn('Insufficient storage for backup, attempting cleanup...');
                if (!performStorageCleanup()) {
                    throw new Error('Cannot create backup: insufficient storage space');
                }
            }

            // Determine compression level based on storage
            let compressionLevel: BackupConfig['compressionLevel'] = config.compressionLevel;
            if (storageInfo.status === 'critical') {
                compressionLevel = 'aggressive';
            } else if (storageInfo.status === 'warning') {
                compressionLevel = 'standard';
            }

            // Create compressed backup
            const compressedBackup = createCompressedBackup(applications, compressionLevel);
            const result = safeLocalStorageSet(BACKUP_KEYS.current, compressedBackup);

            if (!result.success) {
                console.warn(`Primary backup failed: ${result.error}`);

                // Fallback to minimal backup
                const minimalBackup = createCompressedBackup(applications, 'minimal');
                const fallbackResult = safeLocalStorageSet(BACKUP_KEYS.minimal, minimalBackup);

                if (fallbackResult.success) {
                    console.log('Created minimal backup as fallback');
                } else {
                    throw new Error(`All backup attempts failed: ${fallbackResult.error}`);
                }
            } else {
                // Manage backup rotation if enabled
                if (config.enableRotation) {
                    await manageBackupRotation(compressedBackup, config);
                }

                console.log(`Auto backup created successfully (${applications.length} applications, ${compressionLevel} compression)`);
            }

        } catch (error) {
            console.error('Auto backup failed:', error);

            // Attempt emergency backup with minimal data
            try {
                const applications = await getApplicationsData();
                const emergencyBackup = {
                    apps: applications.map(app => ({
                        id: app.id,
                        company: app.company,
                        position: app.position,
                        status: app.status
                    })),
                    ts: new Date().toISOString(),
                    v: '1.1.0-emergency',
                    count: applications.length
                };

                safeLocalStorageSet(BACKUP_KEYS.minimal, emergencyBackup);
                console.log('Created emergency backup with essential data only');
            } catch (emergencyError) {
                console.error('Emergency backup also failed:', emergencyError);
            }
        } finally {
            isBackupInProgress = false;
        }
    };

    const manageBackupRotation = async (
        newBackup: CompressedBackupData,
        config: BackupConfig
    ): Promise<void> => {
        try {
            const existingBackups = getLocalBackups() as CompressedBackupData[];
            const updatedBackups = [newBackup, ...existingBackups].slice(0, config.maxBackupCount);

            const result = safeLocalStorageSet(BACKUP_KEYS.history, updatedBackups);
            if (!result.success) {
                console.warn('Backup rotation failed, keeping single backup only');
            }
        } catch (error) {
            console.warn('Backup rotation failed:', error);
        }
    };

    const startAutoBackup = () => {
        const config = getBackupConfig();

        // Create initial backup
        createBackup();

        // Set up periodic backups
        intervalId = setInterval(createBackup, config.autoBackupInterval * 60 * 1000);

        // Enhanced page unload handler
        const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
            // Only create backup if not already in progress
            if (!isBackupInProgress) {
                createBackup();
            }
        };

        // Backup on visibility change (tab switching)
        const handleVisibilityChange = () => {
            if (document.hidden && !isBackupInProgress) {
                createBackup();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Return cleanup function
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    };

    return startAutoBackup();
};

// Enhanced Manual Backup
export const createManualBackup = async (applications: Application[]): Promise<void> => {
    if (!applications.length) {
        throw new Error('No applications to backup');
    }

    try {
        const jsonString = JSON.stringify(applications);
        const checksum = calculateChecksum(jsonString);

        const backupData: BackupData = {
            applications,
            timestamp: new Date().toISOString(),
            version: '1.1.0',
            metadata: {
                totalApplications: applications.length,
                backupSize: Math.round(jsonString.length / 1024), // KB
                checksum
            }
        };

        const fullJsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([fullJsonString], {type: 'application/json;charset=utf-8'});
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `applytrak-backup-${timestamp}.json`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup with delay
        setTimeout(() => URL.revokeObjectURL(url), 100);

        const sizeKB = Math.round(fullJsonString.length / 1024);
        console.log(`Manual backup created: ${filename} (${sizeKB}KB)`);
    } catch (error) {
        console.error('Manual backup failed:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to create backup: ${message}`);
    }
};

// Enhanced Restore Functionality
export const restoreFromBackup = async (backupFile: File): Promise<Application[]> => {
    if (!backupFile) {
        throw new Error('No backup file provided');
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (backupFile.size > maxSize) {
        throw new Error(`Backup file too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;

                if (!content?.trim()) {
                    throw new Error('Backup file is empty');
                }

                let parsedData: any;
                try {
                    parsedData = JSON.parse(content);
                } catch {
                    throw new Error('Invalid JSON format in backup file');
                }

                // Try different backup formats
                let applications: Application[] = [];

                // Full backup format
                if (parsedData.applications && Array.isArray(parsedData.applications)) {
                    applications = parsedData.applications;

                    // Verify checksum if present
                    if (parsedData.metadata?.checksum) {
                        const calculatedChecksum = calculateChecksum(JSON.stringify(parsedData.applications));
                        if (calculatedChecksum !== parsedData.metadata.checksum) {
                            console.warn('Backup checksum mismatch - file may be corrupted');
                        }
                    }
                }
                // Compressed backup format
                else if (parsedData.apps && Array.isArray(parsedData.apps)) {
                    applications = parsedData.apps.map((app: any) => ({
                        ...app,
                        attachments: app.attachments || [],
                        notes: app.notes || '',
                        location: app.location || '',
                        salary: app.salary || '',
                        jobSource: app.jobSource || '',
                        jobUrl: app.jobUrl || ''
                    })) as Application[];
                }
                // Direct array format
                else if (Array.isArray(parsedData)) {
                    applications = parsedData;
                } else {
                    throw new Error('Invalid backup format: no applications data found');
                }

                // Validate applications
                if (!applications.length) {
                    throw new Error('No applications found in backup file');
                }

                // Basic validation of application structure
                const validApplications = applications.filter(app =>
                    app &&
                    typeof app === 'object' &&
                    app.id &&
                    app.company &&
                    app.position
                );

                if (validApplications.length !== applications.length) {
                    console.warn(`${applications.length - validApplications.length} invalid applications filtered out`);
                }

                if (!validApplications.length) {
                    throw new Error('No valid applications found in backup file');
                }

                console.log(`Successfully restored ${validApplications.length} applications from backup`);
                resolve(validApplications);

            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                reject(new Error(`Failed to restore backup: ${message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read backup file'));
        };

        reader.readAsText(backupFile);
    });
};

// Enhanced Local Backup Management
export const getLocalBackups = (): (BackupData | CompressedBackupData)[] => {
    try {
        const backups: (BackupData | CompressedBackupData)[] = [];

        // Get backup history
        const historyData = localStorage.getItem(BACKUP_KEYS.history);
        if (historyData) {
            const parsedHistory = JSON.parse(historyData);
            if (Array.isArray(parsedHistory)) {
                backups.push(...parsedHistory);
            }
        }

        // Get current backup if not in history
        const currentData = localStorage.getItem(BACKUP_KEYS.current);
        if (currentData && !backups.length) {
            backups.push(JSON.parse(currentData));
        }

        // Get minimal backup if others don't exist
        const minimalData = localStorage.getItem(BACKUP_KEYS.minimal);
        if (minimalData && !backups.length) {
            backups.push(JSON.parse(minimalData));
        }

        return backups.sort((a, b) => {
            const aTime = 'ts' in a ? a.ts : a.timestamp;
            const bTime = 'ts' in b ? b.ts : b.timestamp;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
    } catch (error) {
        console.error('Failed to retrieve local backups:', error);
        return [];
    }
};

// Enhanced Emergency Recovery
export const emergencyRecover = (): Application[] | null => {
    const backupSources = [
        BACKUP_KEYS.current,
        BACKUP_KEYS.history,
        BACKUP_KEYS.minimal
    ];

    for (const source of backupSources) {
        try {
            const data = localStorage.getItem(source);
            if (!data) continue;

            const parsed = JSON.parse(data);

            // Handle array of backups
            if (Array.isArray(parsed)) {
                if (parsed.length > 0) {
                    const backup = parsed[0];
                    if (backup.apps && Array.isArray(backup.apps)) {
                        console.log(`Emergency recovery successful from ${source} (${backup.apps.length} applications)`);
                        return backup.apps.map((app: any) => ({
                            ...app,
                            attachments: app.attachments || [],
                            notes: app.notes || ''
                        })) as Application[];
                    }
                }
            }
            // Handle single backup
            else if (parsed.apps && Array.isArray(parsed.apps)) {
                console.log(`Emergency recovery successful from ${source} (${parsed.apps.length} applications)`);
                return parsed.apps.map((app: any) => ({
                    ...app,
                    attachments: app.attachments || [],
                    notes: app.notes || ''
                })) as Application[];
            }
            // Handle full backup format
            else if (parsed.applications && Array.isArray(parsed.applications)) {
                console.log(`Emergency recovery successful from ${source} (${parsed.applications.length} applications)`);
                return parsed.applications;
            }

        } catch (error) {
            console.warn(`Emergency recovery failed from ${source}:`, error);
            continue;
        }
    }

    console.error('Emergency recovery failed: no valid backups found');
    return null;
};

// Storage Management Functions
export const getStorageUsage = (): StorageUsage => {
    return getStorageInfo();
};

export const clearOldBackups = (): { success: boolean; cleared: string[] } => {
    const cleared: string[] = [];

    try {
        Object.values(BACKUP_KEYS).forEach(key => {
            if (key !== BACKUP_KEYS.config && localStorage.getItem(key)) {
                localStorage.removeItem(key);
                cleared.push(key);
            }
        });

        // Clean up any orphaned backup keys
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('jobTracker') && !Object.values(BACKUP_KEYS).includes(key as any)) {
                localStorage.removeItem(key);
                cleared.push(key);
            }
        });

        console.log(`Cleared ${cleared.length} backup items:`, cleared);
        return {success: true, cleared};
    } catch (error) {
        console.error('Failed to clear backups:', error);
        return {success: false, cleared};
    }
};

// Configuration Management
export const updateBackupConfig = (config: Partial<BackupConfig>): void => {
    saveBackupConfig(config);
    console.log('Backup configuration updated:', config);
};

export const getBackupConfiguration = (): BackupConfig => {
    return getBackupConfig();
};

// Backup Health Check
export const performBackupHealthCheck = (): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
} => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const storageInfo = getStorageInfo();
    const backups = getLocalBackups();

    // Check storage health
    if (storageInfo.status === 'critical') {
        issues.push('Storage usage is critical (>80%)');
        recommendations.push('Clear old backups or reduce backup frequency');
    } else if (storageInfo.status === 'warning') {
        issues.push('Storage usage is high (>60%)');
        recommendations.push('Monitor storage usage closely');
    }

    // Check backup availability
    if (backups.length === 0) {
        issues.push('No local backups available');
        recommendations.push('Create a manual backup immediately');
    }

    // Check backup age
    if (backups.length > 0) {
        const latestBackup = backups[0];
        const backupTime = 'ts' in latestBackup ? latestBackup.ts : latestBackup.timestamp;
        const backupAge = Date.now() - new Date(backupTime).getTime();
        const hoursOld = backupAge / (1000 * 60 * 60);

        if (hoursOld > 24) {
            issues.push('Latest backup is over 24 hours old');
            recommendations.push('Check if auto-backup is functioning properly');
        }
    }

    const status = issues.length === 0 ? 'healthy' :
        issues.some(issue => issue.includes('critical')) ? 'critical' : 'warning';

    return {status, issues, recommendations};
};