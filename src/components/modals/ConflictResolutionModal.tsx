// src/components/modals/ConflictResolutionModal.tsx
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X, RefreshCw, User } from 'lucide-react';
import { DataConflict, ConflictResolutionStrategy } from '../../services/conflictResolutionService';
import { Application } from '../../types';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: DataConflict[];
  onResolve: (conflicts: DataConflict[], strategy: ConflictResolutionStrategy) => void;
  onResolveAll: (strategy: ConflictResolutionStrategy) => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolve,
  onResolveAll
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy['strategy']>('local-wins');
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleResolveConflict = (conflict: DataConflict, strategy: ConflictResolutionStrategy['strategy']) => {
    const resolutionStrategy: ConflictResolutionStrategy = {
      strategy,
      timestamp: Date.now()
    };
    
    onResolve([conflict], resolutionStrategy);
    setResolvedConflicts(prev => new Set(Array.from(prev).concat(conflict.id)));
  };

  const handleResolveAll = () => {
    const unresolvedConflicts = conflicts.filter(conflict => !resolvedConflicts.has(conflict.id));
    
    if (unresolvedConflicts.length === 0) return;
    
    const resolutionStrategy: ConflictResolutionStrategy = {
      strategy: selectedStrategy,
      timestamp: Date.now()
    };
    
    onResolveAll(resolutionStrategy);
    setResolvedConflicts(new Set(conflicts.map(c => c.id)));
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      company: 'Company',
      position: 'Position',
      dateApplied: 'Date Applied',
      status: 'Status',
      type: 'Job Type',
      location: 'Location',
      salary: 'Salary',
      jobSource: 'Job Source',
      jobUrl: 'Job URL',
      notes: 'Notes',
      updatedAt: 'Last Updated',
      syncedAt: 'Last Synced'
    };
    
    return fieldNames[field] || field;
  };

  const renderConflictField = (field: string, localValue: any, remoteValue: any) => {
    const isResolved = resolvedConflicts.has(conflicts.find(c => c.localData.id === conflicts[0]?.localData?.id)?.id || '');
    
    return (
      <div key={field} className={`p-3 rounded-lg border ${isResolved ? 'bg-gray-50 dark:bg-gray-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {getFieldDisplayName(field)}
          </h4>
          {isResolved && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <User className="h-3 w-3" />
              Local Version
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border">
              {field === 'updatedAt' || field === 'syncedAt' ? formatTimestamp(localValue) : String(localValue || 'N/A')}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <RefreshCw className="h-3 w-3" />
              Cloud Version
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-2 rounded border">
              {field === 'updatedAt' || field === 'syncedAt' ? formatTimestamp(remoteValue) : String(remoteValue || 'N/A')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderApplicationConflict = (conflict: DataConflict) => {
    const application = conflict.localData as Application;
    const isResolved = resolvedConflicts.has(conflict.id);
    
    return (
      <div key={conflict.id} className={`border rounded-lg p-4 ${isResolved ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {application.company} - {application.position}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {conflict.conflictFields.length} field(s) in conflict
            </p>
          </div>
          
          {isResolved ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          )}
        </div>
        
        <div className="space-y-3">
          {conflict.conflictFields.map(field => 
            renderConflictField(field, conflict.localData[field], conflict.remoteData[field])
          )}
        </div>
        
        {!isResolved && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleResolveConflict(conflict, 'local-wins')}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              Keep Local
            </button>
            <button
              onClick={() => handleResolveConflict(conflict, 'remote-wins')}
              className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            >
              Use Cloud
            </button>
            <button
              onClick={() => handleResolveConflict(conflict, 'merge')}
              className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
            >
              Merge
            </button>
          </div>
        )}
      </div>
    );
  };

  const unresolvedCount = conflicts.length - resolvedConflicts.size;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Data Conflicts Detected
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unresolvedCount} unresolved conflict(s) found
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {conflicts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Conflicts Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All your data is in sync!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bulk Actions */}
              {unresolvedCount > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Resolve All Conflicts
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {unresolvedCount} remaining
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value as ConflictResolutionStrategy['strategy'])}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="local-wins">Keep Local Changes</option>
                      <option value="remote-wins">Use Cloud Data</option>
                      <option value="merge">Merge Intelligently</option>
                    </select>
                    
                    <button
                      onClick={handleResolveAll}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Apply to All
                    </button>
                  </div>
                </div>
              )}

              {/* Individual Conflicts */}
              <div className="space-y-4">
                {conflicts.map(conflict => renderApplicationConflict(conflict))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {resolvedConflicts.size} of {conflicts.length} conflicts resolved
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {unresolvedCount === 0 ? 'Close' : 'Resolve Later'}
            </button>
            
            {unresolvedCount === 0 && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;
