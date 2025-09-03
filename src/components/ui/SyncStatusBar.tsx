// src/components/ui/SyncStatusBar.tsx
import React from 'react';
import { RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useSyncStatus } from '../../hooks/useSyncStatus';

interface SyncStatusBarProps {
  className?: string;
  showFullDetails?: boolean;
}

const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ 
  className = '', 
  showFullDetails = false 
}) => {
  const {
    isOnline,
    isSyncing,
    pendingChanges,
    syncError,
    connectionType,
    triggerSync,
    clearSyncError
  } = useSyncStatus();

  const getStatusColor = (): string => {
    if (!isOnline) return 'bg-red-500';
    if (syncError) return 'bg-orange-500';
    if (pendingChanges > 0) return 'bg-yellow-500';
    if (isSyncing) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    if (syncError) return <AlertCircle className="h-3 w-3" />;
    if (pendingChanges > 0) return <Clock className="h-3 w-3" />;
    if (isSyncing) return <RefreshCw className="h-3 w-3 animate-spin" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  const getStatusText = (): string => {
    if (!isOnline) return 'Offline';
    if (syncError) return 'Sync Error';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    if (isSyncing) return 'Syncing...';
    return 'Synced';
  };

  const handleSyncClick = () => {
    if (syncError) {
      clearSyncError();
    } else if (isOnline && !isSyncing) {
      triggerSync();
    }
  };

  // Don't show the bar if everything is synced and online
  if (isOnline && !syncError && pendingChanges === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div 
        className={`
          flex items-center justify-between px-4 py-2 text-sm font-medium
          transition-all duration-200 cursor-pointer hover:opacity-90
          ${getStatusColor()} text-white
        `}
        onClick={handleSyncClick}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
          
          {showFullDetails && (
            <>
              <span className="opacity-75">•</span>
              <span className="opacity-75">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 inline mr-1" />
                    {connectionType === 'slow' ? 'Slow connection' : 'Online'}
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 inline mr-1" />
                    Offline
                  </>
                )}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {syncError && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSyncError();
              }}
              className="opacity-75 hover:opacity-100 transition-opacity"
              title="Dismiss error"
            >
              ×
            </button>
          )}
          
          {isOnline && !isSyncing && (pendingChanges > 0 || syncError) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerSync();
              }}
              className="opacity-75 hover:opacity-100 transition-opacity"
              title="Sync now"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncStatusBar;
