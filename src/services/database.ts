// src/services/database.ts
import Dexie, {Table} from 'dexie';
import {Application} from '../types/application.types';

export interface Goals {
    id: number;
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
}

export interface Backup {
    id?: number;
    timestamp: string;
    data: string;
}

export class JobTrackerDatabase extends Dexie {
    applications!: Table<Application>;
    goals!: Table<Goals>;
    backups!: Table<Backup>;

    constructor() {
        super('JobApplicationsDB');

        this.version(1).stores({
            applications: "++id,company,position,[dateApplied+status],type,location,jobSource,jobUrl,status,createdAt,updatedAt",
            backups: "++id,timestamp,data",
            goals: "id,totalGoal,weeklyGoal,monthlyGoal"
        });

        // Hook to automatically update timestamps
        this.applications.hook('creating', (primKey, obj, trans) => {
            const now = new Date().toISOString();
            obj.createdAt = now;
            obj.updatedAt = now;
        });

        this.applications.hook('updating', (modifications, primKey, obj, trans) => {
            (modifications as any).updatedAt = new Date().toISOString();
        });
    }
}

export const db = new JobTrackerDatabase();

export class DatabaseService {
    private db: JobTrackerDatabase;

    constructor() {
        this.db = db;
    }

    // Application methods
    async getApplications(): Promise<Application[]> {
        return await this.db.applications.orderBy('dateApplied').reverse().toArray();
    }

    async addApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
        const now = new Date().toISOString();
        const newApp = {
            ...application,
            createdAt: now,
            updatedAt: now
        };

        const id = await this.db.applications.add(newApp as Application);
        return {...newApp, id: String(id)} as Application;
    }

    async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
        await this.db.applications.update(id, {...updates, updatedAt: new Date().toISOString()});
        const updated = await this.db.applications.get(id);
        if (!updated) throw new Error('Application not found');
        return updated;
    }

    async deleteApplication(id: string): Promise<void> {
        await this.db.applications.delete(id);
    }

    async deleteApplications(ids: string[]): Promise<void> {
        await this.db.applications.bulkDelete(ids);
    }

    async bulkUpdateApplications(ids: string[], updates: Partial<Application>): Promise<void> {
        const updateData = {...updates, updatedAt: new Date().toISOString()};
        await Promise.all(ids.map(id => this.db.applications.update(id, updateData)));
    }

    async searchApplications(query: string): Promise<Application[]> {
        const allApplications = await this.getApplications();
        const searchTerm = query.toLowerCase();

        return allApplications.filter(app =>
            app.company?.toLowerCase().includes(searchTerm) ||
            app.position?.toLowerCase().includes(searchTerm) ||
            app.location?.toLowerCase().includes(searchTerm) ||
            app.notes?.toLowerCase().includes(searchTerm) ||
            app.jobSource?.toLowerCase().includes(searchTerm)
        );
    }

    // Goals methods
    async getGoals(): Promise<Goals> {
        let goals = await this.db.goals.get(1);
        if (!goals) {
            goals = {id: 1, totalGoal: 100, weeklyGoal: 5, monthlyGoal: 20};
            await this.db.goals.put(goals);
        }
        return goals;
    }

    async updateGoals(goals: Omit<Goals, 'id'>): Promise<Goals> {
        const updatedGoals = {id: 1, ...goals};
        await this.db.goals.put(updatedGoals);
        return updatedGoals;
    }

    // Backup methods
    async createBackup(): Promise<Backup> {
        const applications = await this.getApplications();
        const goals = await this.getGoals();

        const backupData = {
            applications,
            goals,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const backup: Backup = {
            timestamp: new Date().toISOString(),
            data: JSON.stringify(backupData)
        };

        const id = await this.db.backups.add(backup);
        return {...backup, id};
    }

    async getBackups(): Promise<Backup[]> {
        return await this.db.backups.orderBy('timestamp').reverse().toArray();
    }

    async restoreFromBackup(backupId: number): Promise<void> {
        const backup = await this.db.backups.get(backupId);
        if (!backup) throw new Error('Backup not found');

        const backupData = JSON.parse(backup.data);

        await this.db.transaction('rw', this.db.applications, this.db.goals, async () => {
            await this.db.applications.clear();
            if (backupData.applications) {
                await this.db.applications.bulkAdd(backupData.applications);
            }

            if (backupData.goals) {
                await this.db.goals.put(backupData.goals);
            }
        });
    }

    async importApplications(applications: Application[]): Promise<void> {
        await this.db.applications.clear();
        await this.db.applications.bulkAdd(applications);
    }

    async clearAllData(): Promise<void> {
        await this.db.transaction('rw', this.db.applications, this.db.goals, this.db.backups, async () => {
            await this.db.applications.clear();
            await this.db.goals.clear();
            await this.db.backups.clear();
        });
    }

    // Analytics helper methods
    async getApplicationsByDateRange(startDate: Date, endDate: Date): Promise<Application[]> {
        const applications = await this.getApplications();
        return applications.filter(app => {
            const appDate = new Date(app.dateApplied);
            return appDate >= startDate && appDate <= endDate;
        });
    }

    async getApplicationsByStatus(status: string): Promise<Application[]> {
        return await this.db.applications.where('status').equals(status).toArray();
    }

    async getApplicationCount(): Promise<number> {
        return await this.db.applications.count();
    }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export recovery utils
export {recoveryUtils} from './recoveryUtils';

// Auto-backup functionality
export const setupAutoBackup = () => {
    // Create backup every hour
    const backupInterval = setInterval(async () => {
        try {
            await databaseService.createBackup();
            console.log('Auto-backup created successfully');
        } catch (error) {
            console.error('Auto-backup failed:', error);
        }
    }, 3600000); // 1 hour

    // Create backup on page unload
    const handleBeforeUnload = async () => {
        try {
            await databaseService.createBackup();
        } catch (error) {
            console.error('Backup on unload failed:', error);
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Create initial backup
    databaseService.createBackup().catch(console.error);

    // Return cleanup function
    return () => {
        clearInterval(backupInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
};