// src/services/backgroundSyncService.ts
import { databaseService } from './databaseService';
import { conflictResolutionService, ConflictResolutionStrategy } from './conflictResolutionService';

export interface SyncQueueItem {
  id: string;
  type: 'application' | 'goal' | 'settings';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: string | null;
  pendingItems: number;
  failedItems: number;
  totalSynced: number;
  errors: string[];
}

class BackgroundSyncService {
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: string | null = null;
  private totalSynced = 0;
  private errors: string[] = [];

  // Configuration
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  constructor() {
    this.initializeServiceWorker();
    this.startPeriodicSync();
  }

  /**
   * Initialize service worker communication
   */
  private initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETED':
        this.handleSyncCompleted(data);
        break;
      case 'SYNC_FAILED':
        this.handleSyncFailed(data);
        break;
      case 'PENDING_CHANGES':
        this.updatePendingCount(data.count);
        break;
    }
  }

  /**
   * Start periodic background sync
   */
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isRunning) {
        this.performBackgroundSync();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop periodic sync
   */
  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add item to sync queue
   */
  public addToSyncQueue(
    type: SyncQueueItem['type'],
    operation: SyncQueueItem['operation'],
    data: any
  ): void {
    const id = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const queueItem: SyncQueueItem = {
      id,
      type,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.syncQueue.set(id, queueItem);
    // Silent queue addition

    // Trigger immediate sync if online
    if (navigator.onLine && !this.isRunning) {
      setTimeout(() => this.performBackgroundSync(), 1000);
    }
  }

  /**
   * Remove item from sync queue
   */
  public removeFromSyncQueue(id: string): void {
    this.syncQueue.delete(id);
  }

  /**
   * Perform background sync
   */
  public async performBackgroundSync(): Promise<void> {
    if (this.isRunning || !navigator.onLine) {
      return;
    }

    this.isRunning = true;
    // Silent background sync start

    try {
      // Get pending items from queue
      const pendingItems = Array.from(this.syncQueue.values());
      
      if (pendingItems.length === 0) {
        return;
      }

      // Silent sync processing

      // Process items by type
      const applications = pendingItems.filter(item => item.type === 'application');
      const goals = pendingItems.filter(item => item.type === 'goal');
      const settings = pendingItems.filter(item => item.type === 'settings');

      // Sync applications
      if (applications.length > 0) {
        await this.syncApplications(applications);
      }

      // Sync goals
      if (goals.length > 0) {
        await this.syncGoals(goals);
      }

      // Sync settings
      if (settings.length > 0) {
        await this.syncSettings(settings);
      }

      // Update sync status
      this.lastSyncTime = new Date().toISOString();
      this.totalSynced += pendingItems.length;

      // Clear successfully synced items
      this.clearSyncedItems(pendingItems);

      // Silent sync completion

    } catch (error) {
      console.error('❌ Background sync failed:', error);
      this.errors.push(`Background sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync application items
   */
  private async syncApplications(items: SyncQueueItem[]): Promise<void> {
    try {
      for (const item of items) {
        switch (item.operation) {
          case 'create':
            await databaseService.addApplication(item.data);
            break;
          case 'update':
            await databaseService.updateApplication(item.data.id, item.data);
            break;
          case 'delete':
            await databaseService.deleteApplication(item.data.id);
            break;
        }
        
        // Mark as synced
        this.removeFromSyncQueue(item.id);
      }
    } catch (error) {
      console.error('Failed to sync applications:', error);
      this.handleSyncItemError(items, error);
    }
  }

  /**
   * Sync goal items
   */
  private async syncGoals(items: SyncQueueItem[]): Promise<void> {
    try {
      for (const item of items) {
        switch (item.operation) {
          case 'create':
          case 'update':
            await databaseService.updateGoals(item.data);
            break;
          case 'delete':
            // Goals are typically not deleted, just reset
            await databaseService.updateGoals({ totalGoal: 50, weeklyGoal: 5, monthlyGoal: 20 });
            break;
        }
        
        // Mark as synced
        this.removeFromSyncQueue(item.id);
      }
    } catch (error) {
      console.error('Failed to sync goals:', error);
      this.handleSyncItemError(items, error);
    }
  }

  /**
   * Sync settings items
   */
  private async syncSettings(items: SyncQueueItem[]): Promise<void> {
    try {
      for (const item of items) {
        // Settings sync would go here
        // For now, just mark as synced
        this.removeFromSyncQueue(item.id);
      }
    } catch (error) {
      console.error('Failed to sync settings:', error);
      this.handleSyncItemError(items, error);
    }
  }

  /**
   * Handle sync item errors
   */
  private handleSyncItemError(items: SyncQueueItem[], error: any): void {
    for (const item of items) {
      item.retryCount++;
      
      if (item.retryCount >= item.maxRetries) {
        console.error(`Max retries reached for ${item.id}, removing from queue`);
        this.removeFromSyncQueue(item.id);
        this.errors.push(`Failed to sync ${item.type} ${item.operation}: ${error.message}`);
      } else {
        // Schedule retry
        setTimeout(() => {
          this.addToSyncQueue(item.type, item.operation, item.data);
        }, this.RETRY_DELAY * item.retryCount);
      }
    }
  }

  /**
   * Clear successfully synced items
   */
  private clearSyncedItems(items: SyncQueueItem[]): void {
    for (const item of items) {
      this.removeFromSyncQueue(item.id);
    }
  }

  /**
   * Handle sync completed from service worker
   */
  private handleSyncCompleted(data: any): void {
    this.lastSyncTime = new Date().toISOString();
    this.totalSynced += data?.syncedCount || 0;
    console.log('✅ Service worker sync completed');
  }

  /**
   * Handle sync failed from service worker
   */
  private handleSyncFailed(data: any): void {
    this.errors.push(`Service worker sync failed: ${data?.error || 'Unknown error'}`);
    console.error('❌ Service worker sync failed:', data);
  }

  /**
   * Update pending count
   */
  private updatePendingCount(count: number): void {
    // This would update the UI with pending count
    console.log(`📊 Pending sync items: ${count}`);
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      pendingItems: this.syncQueue.size,
      failedItems: this.errors.length,
      totalSynced: this.totalSynced,
      errors: [...this.errors]
    };
  }

  /**
   * Clear sync errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Force sync now
   */
  public async forceSyncNow(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Sync already in progress');
      return;
    }

    await this.performBackgroundSync();
  }

  /**
   * Set conflict resolution strategy
   */
  public setConflictResolutionStrategy(strategy: ConflictResolutionStrategy): void {
    conflictResolutionService.setDefaultStrategy(strategy);
  }

  /**
   * Get pending sync items
   */
  public getPendingItems(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values());
  }

  /**
   * Clear all pending items
   */
  public clearPendingItems(): void {
    this.syncQueue.clear();
    console.log('🗑️ Cleared all pending sync items');
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncService();
