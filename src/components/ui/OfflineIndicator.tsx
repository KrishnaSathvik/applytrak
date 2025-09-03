// src/components/ui/OfflineIndicator.tsx
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  syncError: string | null;
}

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    syncError: null
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true, syncError: null }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Listen for service worker messages
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
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Check initial sync status
    checkSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const checkSyncStatus = async () => {
    try {
      // Check if there are pending changes in IndexedDB
      const pendingCount = await getPendingChangesCount();
      setSyncStatus(prev => ({ ...prev, pendingChanges: pendingCount }));
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  };

  const getPendingChangesCount = async (): Promise<number> => {
    // This would check IndexedDB for pending sync items
    // For now, return 0 as placeholder
    return 0;
  };

  const triggerSync = async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) return;

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));
      
      // Send message to service worker to trigger sync
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRIGGER_SYNC'
        });
      }
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncError: 'Failed to trigger sync'
      }));
    }
  };

  const formatLastSyncTime = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (): string => {
    if (!syncStatus.isOnline) return 'text-red-500';
    if (syncStatus.syncError) return 'text-orange-500';
    if (syncStatus.pendingChanges > 0) return 'text-yellow-500';
    if (syncStatus.isSyncing) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="h-4 w-4" />;
    if (syncStatus.syncError) return <AlertCircle className="h-4 w-4" />;
    if (syncStatus.pendingChanges > 0) return <Clock className="h-4 w-4" />;
    if (syncStatus.isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = (): string => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.syncError) return 'Sync Error';
    if (syncStatus.pendingChanges > 0) return `${syncStatus.pendingChanges} pending`;
    if (syncStatus.isSyncing) return 'Syncing...';
    return 'Synced';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main indicator */}
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
          transition-all duration-200 hover:scale-105
          ${syncStatus.isOnline 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
          }
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>

        {syncStatus.isOnline && syncStatus.pendingChanges > 0 && (
          <div className="bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
            {syncStatus.pendingChanges}
          </div>
        )}

        {showDetails && (
          <div className="ml-auto">
            {syncStatus.isOnline ? (
              <Cloud className="h-4 w-4 text-green-500" />
            ) : (
              <CloudOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Sync Status
              </h3>
              {syncStatus.isOnline && !syncStatus.isSyncing && (
                <button
                  onClick={triggerSync}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Sync Now
                </button>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Connection:</span>
                <div className="flex items-center gap-2">
                  {syncStatus.isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Offline</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatLastSyncTime(syncStatus.lastSyncTime)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending Changes:</span>
                <span className={`font-medium ${syncStatus.pendingChanges > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                  {syncStatus.pendingChanges}
                </span>
              </div>

              {syncStatus.syncError && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Error:</span>
                  <span className="text-red-600 dark:text-red-400 text-xs">
                    {syncStatus.syncError}
                  </span>
                </div>
              )}
            </div>

            {!syncStatus.isOnline && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    Working offline. Changes will sync when connection is restored.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
