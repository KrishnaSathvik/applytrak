// src/services/offlineStorageService.ts

export interface StorageError {
  code: string;
  message: string;
  timestamp: number;
  operation: string;
  data?: any;
}

export interface StorageHealth {
  isHealthy: boolean;
  lastError: StorageError | null;
  totalErrors: number;
  storageUsed: number;
  storageAvailable: number;
  lastCleanup: string | null;
}

export interface StorageMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageOperationTime: number;
  lastOperationTime: number;
}

class OfflineStorageService {
  private errors: StorageError[] = [];
  private metrics: StorageMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageOperationTime: 0,
    lastOperationTime: 0
  };
  private operationTimes: number[] = [];

  // Error codes
  private readonly ERROR_CODES = {
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
    DATA_CORRUPTION: 'DATA_CORRUPTION',
    OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  };

  // Maximum number of errors to keep
  private readonly MAX_ERRORS = 100;
  private readonly OPERATION_TIMEOUT = 10000; // 10 seconds

  /**
   * Safely execute a storage operation with error handling
   */
  public async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    data?: any
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalOperations++;

    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise()
      ]);

      const endTime = Date.now();
      const operationTime = endTime - startTime;
      
      this.updateMetrics(true, operationTime);
      this.metrics.lastOperationTime = endTime;

      return result;
    } catch (error) {
      const endTime = Date.now();
      const operationTime = endTime - startTime;
      
      this.updateMetrics(false, operationTime);
      this.handleStorageError(error, operationName, data);
      
      throw error;
    }
  }

  /**
   * Create a timeout promise for operations
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timeout'));
      }, this.OPERATION_TIMEOUT);
    });
  }

  /**
   * Handle storage errors
   */
  private handleStorageError(error: any, operation: string, data?: any): void {
    const storageError: StorageError = {
      code: this.getErrorCode(error),
      message: error.message || 'Unknown error',
      timestamp: Date.now(),
      operation,
      data: data ? this.sanitizeData(data) : undefined
    };

    this.errors.push(storageError);
    this.metrics.failedOperations++;

    // Keep only the most recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }

    console.error(`Storage error in ${operation}:`, storageError);
  }

  /**
   * Get error code from error object
   */
  private getErrorCode(error: any): string {
    if (error.name === 'QuotaExceededError') {
      return this.ERROR_CODES.QUOTA_EXCEEDED;
    }
    
    if (error.name === 'SecurityError') {
      return this.ERROR_CODES.PERMISSION_DENIED;
    }
    
    if (error.message?.includes('timeout')) {
      return this.ERROR_CODES.OPERATION_TIMEOUT;
    }
    
    if (error.message?.includes('corrupt') || error.message?.includes('invalid')) {
      return this.ERROR_CODES.DATA_CORRUPTION;
    }
    
    return this.ERROR_CODES.UNKNOWN_ERROR;
  }

  /**
   * Sanitize data for error logging
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;
      
      // Truncate large strings
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
          sanitized[key] = sanitized[key].substring(0, 100) + '...';
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Update operation metrics
   */
  private updateMetrics(success: boolean, operationTime: number): void {
    if (success) {
      this.metrics.successfulOperations++;
    } else {
      this.metrics.failedOperations++;
    }

    this.operationTimes.push(operationTime);
    
    // Keep only the last 100 operation times
    if (this.operationTimes.length > 100) {
      this.operationTimes = this.operationTimes.slice(-100);
    }

    // Calculate average operation time
    this.metrics.averageOperationTime = this.operationTimes.reduce((a, b) => a + b, 0) / this.operationTimes.length;
  }

  /**
   * Get storage health status
   */
  public async getStorageHealth(): Promise<StorageHealth> {
    try {
      const storageUsed = await this.getStorageUsed();
      const storageAvailable = await this.getStorageAvailable();
      const lastError = this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;

      return {
        isHealthy: this.errors.length === 0 || this.getRecentErrorCount() < 5,
        lastError,
        totalErrors: this.errors.length,
        storageUsed,
        storageAvailable,
        lastCleanup: localStorage.getItem('applytrak_last_cleanup')
      };
    } catch (error) {
      console.error('Failed to get storage health:', error);
      return {
        isHealthy: false,
        lastError: {
          code: this.ERROR_CODES.UNKNOWN_ERROR,
          message: 'Failed to check storage health',
          timestamp: Date.now(),
          operation: 'getStorageHealth'
        },
        totalErrors: this.errors.length,
        storageUsed: 0,
        storageAvailable: 0,
        lastCleanup: null
      };
    }
  }

  /**
   * Get storage usage
   */
  private async getStorageUsed(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return 0;
    }
  }

  /**
   * Get available storage
   */
  private async getStorageAvailable(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.quota || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get available storage:', error);
      return 0;
    }
  }

  /**
   * Get recent error count (last 24 hours)
   */
  private getRecentErrorCount(): number {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return this.errors.filter(error => error.timestamp > oneDayAgo).length;
  }

  /**
   * Get storage metrics
   */
  public getStorageMetrics(): StorageMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(hours: number = 24): StorageError[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.errors.filter(error => error.timestamp > cutoffTime);
  }

  /**
   * Clear old errors
   */
  public clearOldErrors(olderThanHours: number = 168): void { // Default: 1 week
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.errors = this.errors.filter(error => error.timestamp > cutoffTime);
  }

  /**
   * Clear all errors
   */
  public clearAllErrors(): void {
    this.errors = [];
  }

  /**
   * Perform storage cleanup
   */
  public async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Starting storage cleanup...');

      // Clear old errors
      this.clearOldErrors();

      // Clear old localStorage items
      this.clearOldLocalStorageItems();

      // Clear old IndexedDB data (if needed)
      await this.clearOldIndexedDBData();

      // Update last cleanup time
      localStorage.setItem('applytrak_last_cleanup', new Date().toISOString());

      console.log('✅ Storage cleanup completed');
    } catch (error) {
      console.error('❌ Storage cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Clear old localStorage items
   */
  private clearOldLocalStorageItems(): void {
    const keysToCheck = [
      'applytrak_draft_application',
      'applytrak_draft_attachments',
      'applytrak_temp_'
    ];

    for (const key of keysToCheck) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data._savedAt) {
            const savedTime = new Date(data._savedAt).getTime();
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            if (savedTime < oneWeekAgo) {
              localStorage.removeItem(key);
              console.log(`🗑️ Removed old localStorage item: ${key}`);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to check localStorage item ${key}:`, error);
      }
    }
  }

  /**
   * Clear old IndexedDB data
   */
  private async clearOldIndexedDBData(): Promise<void> {
    // This would clear old IndexedDB data if needed
    // For now, just log that cleanup was attempted
    console.log('📊 IndexedDB cleanup not implemented yet');
  }

  /**
   * Check if storage is available
   */
  public async isStorageAvailable(): Promise<boolean> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        await navigator.storage.estimate();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Storage not available:', error);
      return false;
    }
  }

  /**
   * Get storage quota information
   */
  public async getStorageQuota(): Promise<{ used: number; quota: number; percentage: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        return { used, quota, percentage };
      }
      return { used: 0, quota: 0, percentage: 0 };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  /**
   * Request persistent storage
   */
  public async requestPersistentStorage(): Promise<boolean> {
    try {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersistent = await navigator.storage.persist();
        console.log(`Persistent storage: ${isPersistent ? 'granted' : 'denied'}`);
        return isPersistent;
      }
      return false;
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();
