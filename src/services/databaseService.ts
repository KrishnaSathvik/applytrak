// src/services/databaseService.ts - FIXED VERSION
import Dexie, {Table} from 'dexie';
import {Application, Backup, DatabaseService, Goals} from '../types';

// Database schema
export class JobTrackerDatabase extends Dexie {
    applications!: Table<Application, string>;
    goals!: Table<Goals, string>;
    backups!: Table<Backup, string>;

    constructor() {
        super('JobTrackerDatabase');

        this.version(1).stores({
            applications: 'id, company, position, dateApplied, status, type, location, jobSource, createdAt, updatedAt',
            goals: 'id, totalGoal, weeklyGoal, monthlyGoal, createdAt, updatedAt',
            backups: 'id, timestamp'
        });
    }
}

// Database instance
const db = new JobTrackerDatabase();

// Generate unique ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Database service implementation
export const databaseService: DatabaseService = {
    // Applications
    async getApplications(): Promise<Application[]> {
        try {
            const applications = await db.applications.orderBy('dateApplied').reverse().toArray();
            return applications;
        } catch (error) {
            console.error('Failed to get applications:', error);
            throw new Error('Failed to load applications');
        }
    },

    async getApplicationCount(): Promise<number> {
        try {
            return await db.applications.count();
        } catch (error) {
            console.error('Failed to get application count:', error);
            return 0;
        }
    },

    async addApplication(applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
        try {
            const now = new Date().toISOString();
            const application: Application = {
                ...applicationData,
                id: generateId(),
                createdAt: now,
                updatedAt: now
            };

            await db.applications.add(application);
            return application;
        } catch (error) {
            console.error('Failed to add application:', error);
            throw new Error('Failed to add application');
        }
    },

    async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
        try {
            const existingApp = await db.applications.get(id);
            if (!existingApp) {
                throw new Error('Application not found');
            }

            const updatedApp: Application = {
                ...existingApp,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await db.applications.update(id, updatedApp);
            return updatedApp;
        } catch (error) {
            console.error('Failed to update application:', error);
            throw new Error('Failed to update application');
        }
    },

    // FIXED: Delete method now properly handles the return value
    async deleteApplication(id: string): Promise<void> {
        try {
            const existingApp = await db.applications.get(id);
            if (!existingApp) {
                throw new Error('Application not found');
            }

            await db.applications.delete(id);
        } catch (error) {
            console.error('Failed to delete application:', error);
            throw new Error('Failed to delete application');
        }
    },

    async deleteApplications(ids: string[]): Promise<void> {
        try {
            await db.applications.bulkDelete(ids);
        } catch (error) {
            console.error('Failed to delete applications:', error);
            throw new Error('Failed to delete applications');
        }
    },

    async bulkUpdateApplications(ids: string[], updates: Partial<Application>): Promise<void> {
        try {
            const now = new Date().toISOString();
            const updateData = {...updates, updatedAt: now};

            await db.transaction('rw', db.applications, async () => {
                for (const id of ids) {
                    await db.applications.update(id, updateData);
                }
            });
        } catch (error) {
            console.error('Failed to bulk update applications:', error);
            throw new Error('Failed to update applications');
        }
    },

    async importApplications(applications: Application[]): Promise<void> {
        try {
            await db.transaction('rw', db.applications, async () => {
                for (const app of applications) {
                    const appWithId = {
                        ...app,
                        id: app.id || generateId(),
                        createdAt: app.createdAt || new Date().toISOString(),
                        updatedAt: app.updatedAt || new Date().toISOString()
                    };
                    await db.applications.put(appWithId);
                }
            });
        } catch (error) {
            console.error('Failed to import applications:', error);
            throw new Error('Failed to import applications');
        }
    },

    async clearAllData(): Promise<void> {
        try {
            await db.transaction('rw', [db.applications, db.goals, db.backups], async () => {
                await db.applications.clear();
                await db.goals.clear();
                await db.backups.clear();
            });
        } catch (error) {
            console.error('Failed to clear all data:', error);
            throw new Error('Failed to clear data');
        }
    },

    // Goals
    async getGoals(): Promise<Goals> {
        try {
            const goals = await db.goals.get('default');
            return goals || {
                id: 'default',
                totalGoal: 100,
                weeklyGoal: 5,
                monthlyGoal: 20,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get goals:', error);
            return {
                id: 'default',
                totalGoal: 100,
                weeklyGoal: 5,
                monthlyGoal: 20,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
    },

    async updateGoals(goalsData: Omit<Goals, 'id'>): Promise<Goals> {
        try {
            const now = new Date().toISOString();
            const goals: Goals = {
                ...goalsData,
                id: 'default',
                updatedAt: now,
                createdAt: goalsData.createdAt || now
            };

            await db.goals.put(goals);
            return goals;
        } catch (error) {
            console.error('Failed to update goals:', error);
            throw new Error('Failed to update goals');
        }
    },

    // Backups - FIXED: createBackup now takes no parameters
    async createBackup(): Promise<void> {
        try {
            const applications = await this.getApplications();
            const goals = await this.getGoals();

            const backupData = {
                applications,
                goals,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const backup: Backup = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                data: JSON.stringify(backupData)
            };

            await db.backups.add(backup);

            // Keep only the last 10 backups
            const allBackups = await db.backups.orderBy('timestamp').reverse().toArray();
            if (allBackups.length > 10) {
                const toDelete = allBackups.slice(10);
                await db.backups.bulkDelete(toDelete.map(b => b.id!));
            }
        } catch (error) {
            console.error('Failed to create backup:', error);
            throw new Error('Failed to create backup');
        }
    },

    async getBackups(): Promise<Backup[]> {
        try {
            return await db.backups.orderBy('timestamp').reverse().toArray();
        } catch (error) {
            console.error('Failed to get backups:', error);
            return [];
        }
    },

    async restoreFromBackup(backup: Backup): Promise<void> {
        try {
            const backupData = JSON.parse(backup.data);

            await db.transaction('rw', [db.applications, db.goals], async () => {
                // Clear existing data
                await db.applications.clear();
                await db.goals.clear();

                // Restore applications
                if (backupData.applications && Array.isArray(backupData.applications)) {
                    await db.applications.bulkAdd(backupData.applications);
                }

                // Restore goals
                if (backupData.goals) {
                    await db.goals.put(backupData.goals);
                }
            });
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error('Failed to restore from backup');
        }
    }
};

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
    try {
        await db.open();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw new Error('Failed to initialize database');
    }
};

export default databaseService;