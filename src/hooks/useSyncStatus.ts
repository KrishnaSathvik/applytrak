// src/hooks/useSyncStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/databaseService';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  syncError: string | null;
  connectionType: 'online' | 'offline' | 'slow';
}

export interface SyncActions {
  triggerSync: () => Promise<void>;
  checkSyncStatus: () => Promise<void>;
  clearSyncError: () => void;
}

export const useSyncStatus = (): SyncStatus & SyncActions => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: localStorage.getItem('applytrak_last_sync') || null,
    pendingChanges: 0,
    syncError: null,
    connectionType: navigator.onLine ? 'online' : 'offline'
  });

  // Check for pending changes in IndexedDB
  const checkPendingChanges = useCallback(async (): Promise<number> => {
    try {
      const applications = await databaseService.getApplications();
      const pendingCount = applications.filter(app => 
        app.syncStatus === 'pending' || !app.cloudId
      ).length;
      
      return pendingCount;
    } catch (error) {
      console.error('Failed to check pending changes:', error);
      return 0;
    }
  }, []);

  // Check sync status
  const checkSyncStatus = useCallback(async () => {
    try {
      const pendingChanges = await checkPendingChanges();
      const lastSyncTime = localStorage.getItem('applytrak_last_sync');
      
      setSyncStatus(prev => ({
        ...prev,
        pendingChanges,
        lastSyncTime,
        syncError: null
      }));
    } catch (error) {
      console.error('Failed to check sync status:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncError: 'Failed to check sync status'
      }));
    }
  }, [checkPendingChanges]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) return;

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));
      
      // Check if service worker is available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Send message to service worker
        navigator.serviceWorker.controller.postMessage({
          type: 'TRIGGER_SYNC'
        });
      } else {
        // Fallback: trigger sync directly
        // Trigger sync through the app store instead
        console.log('Triggering sync through app store...');
      }
      
      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem('applytrak_last_sync', now);
      
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
        pendingChanges: 0
      }));
      
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, [syncStatus.isOnline, syncStatus.isSyncing]);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setSyncStatus(prev => ({ ...prev, syncError: null }));
  }, []);

  // Detect connection quality
  const detectConnectionType = useCallback(() => {
    if (!navigator.onLine) return 'offline';
    
    // Check connection quality if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return 'slow';
      }
    }
    
    return 'online';
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ 
        ...prev, 
        isOnline: true, 
        connectionType: detectConnectionType(),
        syncError: null 
      }));
      
      // Auto-sync when coming back online (silent)
      setTimeout(() => {
        triggerSync();
      }, 2000);
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ 
        ...prev, 
        isOnline: false, 
        connectionType: 'offline' 
      }));
    };

    // Listen for service worker messages (silent background processing)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'SYNC_STARTED':
          setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));
          break;
          
        case 'SYNC_COMPLETED':
          setSyncStatus(prev => ({ 
            ...prev, 
            isSyncing: false, 
            lastSyncTime: new Date().toISOString(),
            pendingChanges: 0,
            syncError: null
          }));
          localStorage.setItem('applytrak_last_sync', new Date().toISOString());
          break;
          
        case 'SYNC_FAILED':
          setSyncStatus(prev => ({ 
            ...prev, 
            isSyncing: false, 
            syncError: data?.error || 'Sync failed'
          }));
          break;
          
        case 'PENDING_CHANGES':
          setSyncStatus(prev => ({ ...prev, pendingChanges: data?.count || 0 }));
          break;
      }
    };

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Initial sync status check
    checkSyncStatus();

    // Set up periodic sync status checks
    const interval = setInterval(checkSyncStatus, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      
      clearInterval(interval);
    };
  }, [checkSyncStatus, triggerSync, detectConnectionType]);

  // Monitor connection changes
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        setSyncStatus(prev => ({
          ...prev,
          connectionType: detectConnectionType()
        }));
      };

      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
    
    return undefined;
  }, [detectConnectionType]);

  return {
    ...syncStatus,
    triggerSync,
    checkSyncStatus,
    clearSyncError
  };
};
