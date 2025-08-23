// src/utils/milestones.ts - Milestone tracking and celebration utilities

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MilestoneProgress {
    current: number;
    next: number | null;
    progress: number;
}

export interface MilestoneMessages {
    readonly [key: number]: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MILESTONE_THRESHOLDS = [
    10, 25, 50, 100, 150, 200, 250, 500, 1000
] as const;

export type MilestoneThreshold = typeof MILESTONE_THRESHOLDS[number];

/**
 * Storage key for celebrated milestones
 */
const STORAGE_KEY = 'celebratedMilestones';

/**
 * Encouragement messages for each milestone
 */
const MILESTONE_MESSAGES: MilestoneMessages = {
    10: "Great start! You're building momentum in your job search!",
    25: "You're getting into a good rhythm! Keep pushing forward!",
    50: "Halfway to your first major milestone! Your persistence is paying off!",
    100: "Outstanding achievement! You've reached triple digits!",
    150: "You're showing incredible dedication! Your hard work will pay off!",
    200: "Amazing persistence! You're setting a great example of determination!",
    250: "Quarter of a thousand applications! Your commitment is inspiring!",
    500: "Half a thousand applications! You're truly dedicated to your career goals!",
    1000: "One thousand applications! You're a job search champion!"
} as const;

// ============================================================================
// MILESTONE VISUAL HELPERS
// ============================================================================

/**
 * Get appropriate icon for milestone based on achievement level
 */
export const getMilestoneIcon = (message: string): string => {
    if (!message) return '🎯';

    const milestoneNumber = extractMilestoneNumber(message);

    if (milestoneNumber >= 1000) return '🏆';
    if (milestoneNumber >= 500) return '👑';
    if (milestoneNumber >= 250) return '🌟';
    if (milestoneNumber >= 100) return '🎉';
    if (milestoneNumber >= 50) return '🚀';
    if (milestoneNumber >= 25) return '⭐';
    if (milestoneNumber >= 10) return '🎯';

    return '🎊';
};

/**
 * Get gradient color classes for milestone based on achievement level
 */
export const getMilestoneColor = (message: string): string => {
    if (!message) return 'from-blue-500 to-purple-600';

    const milestoneNumber = extractMilestoneNumber(message);

    if (milestoneNumber >= 1000) return 'from-yellow-400 to-orange-500';
    if (milestoneNumber >= 500) return 'from-purple-500 to-pink-600';
    if (milestoneNumber >= 250) return 'from-green-500 to-teal-600';
    if (milestoneNumber >= 100) return 'from-blue-500 to-indigo-600';
    if (milestoneNumber >= 50) return 'from-red-500 to-pink-600';
    if (milestoneNumber >= 25) return 'from-yellow-500 to-orange-600';
    if (milestoneNumber >= 10) return 'from-green-400 to-blue-500';

    return 'from-blue-500 to-purple-600';
};

/**
 * Get personalized encouragement message for milestone
 */
export const getEncouragementMessage = (message: string): string => {
    if (!message) return 'Keep up the great work!';

    const milestoneNumber = extractMilestoneNumber(message);

    return MILESTONE_MESSAGES[milestoneNumber] || "Congratulations on reaching this milestone!";
};

// ============================================================================
// MILESTONE CALCULATION
// ============================================================================

/**
 * Extract milestone number from a message string
 */
export const extractMilestoneNumber = (message: string): number => {
    if (!message) return 0;

    const match = message.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

/**
 * Get the next milestone target for user
 */
export const getNextMilestone = (message: string): number | null => {
    if (!message) return MILESTONE_THRESHOLDS[0];

    const currentMilestone = extractMilestoneNumber(message);
    const nextMilestone = MILESTONE_THRESHOLDS.find(threshold => threshold > currentMilestone);

    return nextMilestone ?? null;
};

/**
 * Calculate milestone progress for progress bars and indicators
 */
export const getMilestoneProgress = (applicationCount: number): MilestoneProgress => {
    const nextMilestone = MILESTONE_THRESHOLDS.find(threshold => threshold > applicationCount);
    const currentMilestone = MILESTONE_THRESHOLDS
        .filter(threshold => threshold <= applicationCount)
        .pop() ?? 0;

    if (!nextMilestone) {
        return {
            current: currentMilestone,
            next: null,
            progress: 100
        };
    }

    const progress = ((applicationCount - currentMilestone) / (nextMilestone - currentMilestone)) * 100;

    return {
        current: currentMilestone,
        next: nextMilestone,
        progress: Math.min(Math.max(progress, 0), 100) // Clamp between 0-100
    };
};

// ============================================================================
// MILESTONE TRACKING & PERSISTENCE
// ============================================================================

/**
 * Check if user has reached a new milestone that hasn't been celebrated
 */
export const checkMilestoneReached = (applicationCount: number): number | null => {
    if (applicationCount < 0) return null;

    const celebratedMilestones = getCelebratedMilestones();

    // Find the highest milestone reached that hasn't been celebrated
    for (let i = MILESTONE_THRESHOLDS.length - 1; i >= 0; i--) {
        const milestone = MILESTONE_THRESHOLDS[i];
        if (applicationCount >= milestone && !celebratedMilestones.includes(milestone)) {
            return milestone;
        }
    }

    return null;
};

/**
 * Mark a milestone as celebrated to prevent duplicate celebrations
 */
export const markMilestoneAsCelebrated = (milestone: number): void => {
    try {
        const celebrated = getCelebratedMilestones();
        if (!celebrated.includes(milestone)) {
            celebrated.push(milestone);
            celebrated.sort((a, b) => a - b); // Keep sorted for better performance
            localStorage.setItem(STORAGE_KEY, JSON.stringify(celebrated));
        }
    } catch (error) {
        console.error('Error marking milestone as celebrated:', error);
    }
};

/**
 * Get list of milestones that have already been celebrated
 */
export const getCelebratedMilestones = (): number[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);

        // Validate that it's an array of numbers
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number')) {
            return parsed.sort((a, b) => a - b); // Ensure sorted
        }

        return [];
    } catch (error) {
        console.error('Error reading celebrated milestones:', error);
        return [];
    }
};

/**
 * Reset all celebrated milestones (useful for testing or data reset)
 */
export const resetCelebratedMilestones = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error resetting celebrated milestones:', error);
    }
};

/**
 * Check if a specific milestone has been celebrated
 */
export const isMilestoneCelebrated = (milestone: number): boolean => {
    const celebrated = getCelebratedMilestones();
    return celebrated.includes(milestone);
};

/**
 * Get all milestones that should be celebrated for current application count
 */
export const getAllReachedMilestones = (applicationCount: number): number[] => {
    if (applicationCount < 0) return [];

    return MILESTONE_THRESHOLDS.filter(milestone => applicationCount >= milestone);
};

/**
 * Get uncelebrated milestones for current application count
 */
export const getUncelebratedMilestones = (applicationCount: number): number[] => {
    const reachedMilestones = getAllReachedMilestones(applicationCount);
    const celebratedMilestones = getCelebratedMilestones();

    return reachedMilestones.filter(milestone => !celebratedMilestones.includes(milestone));
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get milestone statistics for analytics or display
 */
export const getMilestoneStats = (applicationCount: number) => {
    const celebratedMilestones = getCelebratedMilestones();
    const reachedMilestones = getAllReachedMilestones(applicationCount);
    const progress = getMilestoneProgress(applicationCount);

    return {
        totalMilestones: MILESTONE_THRESHOLDS.length,
        milestonesReached: reachedMilestones.length,
        milestonesCelebrated: celebratedMilestones.length,
        uncelebratedCount: reachedMilestones.length - celebratedMilestones.length,
        progressToNext: progress.progress,
        nextMilestone: progress.next,
        completionPercentage: (reachedMilestones.length / MILESTONE_THRESHOLDS.length) * 100
    };
};

/**
 * Validate milestone number is in valid thresholds
 */
export const isValidMilestone = (milestone: number): milestone is MilestoneThreshold => {
    return MILESTONE_THRESHOLDS.includes(milestone as MilestoneThreshold);
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const milestoneUtils = {
    // Constants
    MILESTONE_THRESHOLDS,

    // Visual helpers
    getMilestoneIcon,
    getMilestoneColor,
    getEncouragementMessage,

    // Calculation
    extractMilestoneNumber,
    getNextMilestone,
    getMilestoneProgress,

    // Tracking & persistence
    checkMilestoneReached,
    markMilestoneAsCelebrated,
    getCelebratedMilestones,
    resetCelebratedMilestones,
    isMilestoneCelebrated,
    getAllReachedMilestones,
    getUncelebratedMilestones,

    // Utilities
    getMilestoneStats,
    isValidMilestone
} as const;

export default milestoneUtils;