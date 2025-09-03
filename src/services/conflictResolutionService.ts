// src/services/conflictResolutionService.ts


export interface ConflictResolutionStrategy {
  strategy: 'local-wins' | 'remote-wins' | 'merge' | 'manual';
  timestamp: number;
  userId?: string;
}

export interface DataConflict {
  id: string;
  type: 'application' | 'goal' | 'settings';
  localData: any;
  remoteData: any;
  conflictFields: string[];
  timestamp: number;
  resolution?: ConflictResolutionStrategy;
}

export interface ConflictResolutionResult {
  resolvedData: any;
  strategy: ConflictResolutionStrategy;
  conflictsResolved: number;
  conflictsRemaining: number;
}

class ConflictResolutionService {
  private conflicts: Map<string, DataConflict> = new Map();
  private defaultStrategy: ConflictResolutionStrategy = {
    strategy: 'local-wins',
    timestamp: Date.now()
  };

  /**
   * Detect conflicts between local and remote data
   */
  detectConflicts(localData: any[], remoteData: any[], type: 'application' | 'goal' | 'settings'): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    // Create maps for efficient lookup
    const localMap = new Map(localData.map(item => [item.id, item]));
    const remoteMap = new Map(remoteData.map(item => [item.id, item]));

    // Check for conflicts in existing items
    for (const [id, localItem] of Array.from(localMap.entries())) {
      const remoteItem = remoteMap.get(id);
      
      if (remoteItem) {
        const conflictFields = this.findConflictFields(localItem, remoteItem);
        
        if (conflictFields.length > 0) {
          conflicts.push({
            id,
            type,
            localData: localItem,
            remoteData: remoteItem,
            conflictFields,
            timestamp: Date.now()
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Find fields that have conflicts between local and remote data
   */
  private findConflictFields(localItem: any, remoteItem: any): string[] {
    const conflictFields: string[] = [];
    
    // Fields to check for conflicts
    const fieldsToCheck = [
      'company', 'position', 'dateApplied', 'status', 'type', 
      'location', 'salary', 'jobSource', 'jobUrl', 'notes',
      'updatedAt', 'syncedAt'
    ];

    for (const field of fieldsToCheck) {
      if (localItem[field] !== remoteItem[field]) {
        // Special handling for timestamps
        if (field === 'updatedAt' || field === 'syncedAt') {
          const localTime = new Date(localItem[field]).getTime();
          const remoteTime = new Date(remoteItem[field]).getTime();
          
          // Only consider it a conflict if the difference is significant (> 1 second)
          if (Math.abs(localTime - remoteTime) > 1000) {
            conflictFields.push(field);
          }
        } else {
          conflictFields.push(field);
        }
      }
    }

    return conflictFields;
  }

  /**
   * Resolve conflicts using the specified strategy
   */
  resolveConflicts(
    conflicts: DataConflict[], 
    strategy: ConflictResolutionStrategy
  ): ConflictResolutionResult {
    let conflictsResolved = 0;
    let conflictsRemaining = 0;
    const resolvedData: any[] = [];

    for (const conflict of conflicts) {
      try {
        const resolved = this.resolveConflict(conflict, strategy);
        resolvedData.push(resolved);
        conflictsResolved++;
        
        // Mark conflict as resolved
        conflict.resolution = strategy;
        this.conflicts.set(conflict.id, conflict);
        
      } catch (error) {
        console.error(`Failed to resolve conflict for ${conflict.id}:`, error);
        conflictsRemaining++;
      }
    }

    return {
      resolvedData,
      strategy,
      conflictsResolved,
      conflictsRemaining
    };
  }

  /**
   * Resolve a single conflict using the specified strategy
   */
  private resolveConflict(conflict: DataConflict, strategy: ConflictResolutionStrategy): any {
    const { localData, remoteData, conflictFields } = conflict;
    
    switch (strategy.strategy) {
      case 'local-wins':
        return this.resolveLocalWins(localData, remoteData, conflictFields);
        
      case 'remote-wins':
        return this.resolveRemoteWins(localData, remoteData, conflictFields);
        
      case 'merge':
        return this.resolveMerge(localData, remoteData, conflictFields);
        
      case 'manual':
        // For manual resolution, return the conflict for user intervention
        throw new Error('Manual resolution required');
        
      default:
        throw new Error(`Unknown resolution strategy: ${strategy.strategy}`);
    }
  }

  /**
   * Local data takes precedence
   */
  private resolveLocalWins(localData: any, remoteData: any, conflictFields: string[]): any {
    const resolved = { ...remoteData };
    
    // Override conflicting fields with local values
    for (const field of conflictFields) {
      resolved[field] = localData[field];
    }
    
    // Update metadata
    resolved.updatedAt = new Date().toISOString();
    resolved.syncedAt = new Date().toISOString();
    resolved.syncStatus = 'synced';
    
    return resolved;
  }

  /**
   * Remote data takes precedence
   */
  private resolveRemoteWins(localData: any, remoteData: any, conflictFields: string[]): any {
    const resolved = { ...localData };
    
    // Override conflicting fields with remote values
    for (const field of conflictFields) {
      resolved[field] = remoteData[field];
    }
    
    // Update metadata
    resolved.updatedAt = new Date().toISOString();
    resolved.syncedAt = new Date().toISOString();
    resolved.syncStatus = 'synced';
    
    return resolved;
  }

  /**
   * Merge data intelligently
   */
  private resolveMerge(localData: any, remoteData: any, conflictFields: string[]): any {
    const resolved = { ...localData };
    
    for (const field of conflictFields) {
      // Special handling for different field types
      switch (field) {
        case 'notes':
          // Merge notes by combining them
          resolved[field] = this.mergeNotes(localData[field], remoteData[field]);
          break;
          
        case 'attachments':
          // Merge attachments by combining arrays
          resolved[field] = this.mergeAttachments(localData[field], remoteData[field]);
          break;
          
        case 'updatedAt':
        case 'syncedAt':
          // Use the more recent timestamp
          const localTime = new Date(localData[field]).getTime();
          const remoteTime = new Date(remoteData[field]).getTime();
          resolved[field] = localTime > remoteTime ? localData[field] : remoteData[field];
          break;
          
        default:
          // For other fields, use the more recent value based on updatedAt
          const localUpdated = new Date(localData.updatedAt).getTime();
          const remoteUpdated = new Date(remoteData.updatedAt).getTime();
          resolved[field] = localUpdated > remoteUpdated ? localData[field] : remoteData[field];
          break;
      }
    }
    
    // Update metadata
    resolved.updatedAt = new Date().toISOString();
    resolved.syncedAt = new Date().toISOString();
    resolved.syncStatus = 'synced';
    
    return resolved;
  }

  /**
   * Merge notes from local and remote data
   */
  private mergeNotes(localNotes: string, remoteNotes: string): string {
    if (!localNotes && !remoteNotes) return '';
    if (!localNotes) return remoteNotes;
    if (!remoteNotes) return localNotes;
    
    // Combine notes with a separator
    const separator = '\n\n--- Merged from different sources ---\n\n';
    return `${localNotes}${separator}${remoteNotes}`;
  }

  /**
   * Merge attachments from local and remote data
   */
  private mergeAttachments(localAttachments: any[], remoteAttachments: any[]): any[] {
    const merged = [...(localAttachments || [])];
    const localIds = new Set(localAttachments?.map(att => att.id) || []);
    
    // Add remote attachments that don't exist locally
    for (const remoteAtt of remoteAttachments || []) {
      if (!localIds.has(remoteAtt.id)) {
        merged.push(remoteAtt);
      }
    }
    
    return merged;
  }

  /**
   * Get all unresolved conflicts
   */
  getUnresolvedConflicts(): DataConflict[] {
    return Array.from(this.conflicts.values()).filter(conflict => !conflict.resolution);
  }

  /**
   * Get conflicts for a specific type
   */
  getConflictsByType(type: 'application' | 'goal' | 'settings'): DataConflict[] {
    return Array.from(this.conflicts.values()).filter(conflict => conflict.type === type);
  }

  /**
   * Clear resolved conflicts
   */
  clearResolvedConflicts(): void {
    for (const [id, conflict] of Array.from(this.conflicts.entries())) {
      if (conflict.resolution) {
        this.conflicts.delete(id);
      }
    }
  }

  /**
   * Set default conflict resolution strategy
   */
  setDefaultStrategy(strategy: ConflictResolutionStrategy): void {
    this.defaultStrategy = strategy;
  }

  /**
   * Get default conflict resolution strategy
   */
  getDefaultStrategy(): ConflictResolutionStrategy {
    return this.defaultStrategy;
  }

  /**
   * Auto-resolve conflicts using default strategy
   */
  autoResolveConflicts(conflicts: DataConflict[]): ConflictResolutionResult {
    return this.resolveConflicts(conflicts, this.defaultStrategy);
  }
}

// Export singleton instance
export const conflictResolutionService = new ConflictResolutionService();
