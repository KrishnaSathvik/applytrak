// src/utils/milestones.ts
export const MILESTONE_THRESHOLDS = [10, 25, 50, 100, 150, 200, 250, 500, 1000];

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

export const getEncouragementMessage = (message: string): string => {
    if (!message) return 'Keep up the great work!';

    const milestoneNumber = extractMilestoneNumber(message);

    const messages = {
        10: "Great start! You're building momentum in your job search!",
        25: "You're getting into a good rhythm! Keep pushing forward!",
        50: "Halfway to your first major milestone! Your persistence is paying off!",
        100: "Outstanding achievement! You've reached triple digits!",
        150: "You're showing incredible dedication! Your hard work will pay off!",
        200: "Amazing persistence! You're setting a great example of determination!",
        250: "Quarter of a thousand applications! Your commitment is inspiring!",
        500: "Half a thousand applications! You're truly dedicated to your career goals!",
        1000: "One thousand applications! You're a job search champion!"
    };

    return messages[milestoneNumber as keyof typeof messages] || "Congratulations on reaching this milestone!";
};

export const getNextMilestone = (message: string): number | null => {
    if (!message) return MILESTONE_THRESHOLDS[0];

    const currentMilestone = extractMilestoneNumber(message);
    const nextMilestone = MILESTONE_THRESHOLDS.find(threshold => threshold > currentMilestone);

    return nextMilestone || null;
};

export const extractMilestoneNumber = (message: string): number => {
    if (!message) return 0;

    const match = message.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

export const checkMilestoneReached = (applicationCount: number): number | null => {
    const celebratedMilestones = getCelebratedMilestones();

    for (const milestone of MILESTONE_THRESHOLDS) {
        if (applicationCount >= milestone && !celebratedMilestones.includes(milestone)) {
            return milestone;
        }
    }

    return null;
};

export const markMilestoneAsCelebrated = (milestone: number): void => {
    const celebrated = getCelebratedMilestones();
    if (!celebrated.includes(milestone)) {
        celebrated.push(milestone);
        localStorage.setItem('celebratedMilestones', JSON.stringify(celebrated));
    }
};

export const getCelebratedMilestones = (): number[] => {
    try {
        const stored = localStorage.getItem('celebratedMilestones');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading celebrated milestones:', error);
        return [];
    }
};

export const resetCelebratedMilestones = (): void => {
    localStorage.removeItem('celebratedMilestones');
};

export const getMilestoneProgress = (applicationCount: number): {
    current: number;
    next: number | null;
    progress: number
} => {
    const nextMilestone = MILESTONE_THRESHOLDS.find(threshold => threshold > applicationCount);
    const currentMilestone = MILESTONE_THRESHOLDS.filter(threshold => threshold <= applicationCount).pop() || 0;

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
        progress: Math.min(progress, 100)
    };
};

export default {
    MILESTONE_THRESHOLDS,
    getMilestoneIcon,
    getMilestoneColor,
    getEncouragementMessage,
    getNextMilestone,
    extractMilestoneNumber,
    checkMilestoneReached,
    markMilestoneAsCelebrated,
    getCelebratedMilestones,
    resetCelebratedMilestones,
    getMilestoneProgress
};