// src/types/achievements.ts - Achievement System Types

export type AchievementCategory = 
  | 'milestone'      // Application count milestones
  | 'streak'         // Daily streak achievements
  | 'goal'           // Goal completion achievements
  | 'time'           // Time-based achievements
  | 'quality'        // Quality-based achievements
  | 'special';       // Special/rare achievements

export type AchievementTier = 
  | 'bronze'         // 1-10 applications
  | 'silver'         // 11-50 applications
  | 'gold'           // 51-200 applications
  | 'platinum'       // 201-500 applications
  | 'diamond'         // 500+ applications
  | 'legendary';     // 1000+ applications

export type AchievementRarity = 
  | 'common'         // Easy to achieve
  | 'uncommon'       // Moderate difficulty
  | 'rare'           // Hard to achieve
  | 'epic'           // Very hard to achieve
  | 'legendary';     // Extremely rare

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  rarity: AchievementRarity;
  icon: string; // Lucide icon name
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date | undefined;
  progress?: number;
  maxProgress?: number;
  requirements: AchievementRequirement[];
  dependencies?: string[]; // Achievement IDs that must be unlocked first
}

export interface AchievementRequirement {
  type: 'applications' | 'streak' | 'goals' | 'profile' | 'time' | 'quality';
  value: number;
  description: string;
}

export interface AchievementProgress {
  achievementId: string;
  currentProgress: number;
  maxProgress: number;
  percentage: number;
  isComplete: boolean;
}

export interface UserAchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  achievementsByCategory: Record<AchievementCategory, number>;
  recentUnlocks: Achievement[];
  streak: number;
  longestStreak: number;
}

export interface AchievementFilter {
  category?: AchievementCategory;
  tier?: AchievementTier;
  rarity?: AchievementRarity;
  unlocked?: boolean | undefined;
  search?: string;
}

// XP and Level System
export interface UserLevel {
  level: number;
  xp: number;
  xpToNext: number;
  totalXP: number;
  title: string;
  color: string;
}

export const LEVEL_TITLES = [
  'Job Seeker',           // Level 1-5
  'Application Novice',    // Level 6-10
  'Career Explorer',      // Level 11-15
  'Job Hunter',           // Level 16-20
  'Application Expert',   // Level 21-25
  'Career Strategist',    // Level 26-30
  'Job Search Master',    // Level 31-35
  'Career Champion',      // Level 36-40
  'Application Legend',   // Level 41-45
  'Ultimate Job Seeker'   // Level 46-50
] as const;

export const LEVEL_COLORS = [
  '#6B7280', // gray-500
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#06B6D4', // cyan-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#F59E0B'  // amber-500
] as const;

// Achievement Categories Configuration
export const ACHIEVEMENT_CATEGORIES = {
  milestone: {
    name: 'Milestones',
    description: 'Application count achievements',
    icon: 'Target',
    color: 'from-blue-500 to-blue-600'
  },
  streak: {
    name: 'Streaks',
    description: 'Daily application streaks',
    icon: 'Flame',
    color: 'from-orange-500 to-orange-600'
  },
  goal: {
    name: 'Goals',
    description: 'Goal completion achievements',
    icon: 'Award',
    color: 'from-green-500 to-green-600'
  },
  time: {
    name: 'Time',
    description: 'Time-based achievements',
    icon: 'Clock',
    color: 'from-purple-500 to-purple-600'
  },
  quality: {
    name: 'Quality',
    description: 'Application quality achievements',
    icon: 'Star',
    color: 'from-yellow-500 to-yellow-600'
  },
  special: {
    name: 'Special',
    description: 'Rare and special achievements',
    icon: 'Crown',
    color: 'from-pink-500 to-pink-600'
  }
} as const;

// Achievement Tiers Configuration
export const ACHIEVEMENT_TIERS = {
  bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    bgColor: 'from-amber-600 to-amber-700',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  silver: {
    name: 'Silver',
    color: '#C0C0C0',
    bgColor: 'from-gray-400 to-gray-500',
    textColor: 'text-gray-600 dark:text-gray-400'
  },
  gold: {
    name: 'Gold',
    color: '#FFD700',
    bgColor: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-600 dark:text-yellow-400'
  },
  platinum: {
    name: 'Platinum',
    color: '#E5E4E2',
    bgColor: 'from-slate-300 to-slate-400',
    textColor: 'text-slate-600 dark:text-slate-400'
  },
  diamond: {
    name: 'Diamond',
    color: '#B9F2FF',
    bgColor: 'from-cyan-400 to-cyan-500',
    textColor: 'text-cyan-600 dark:text-cyan-400'
  },
  legendary: {
    name: 'Legendary',
    color: '#FF6B35',
    bgColor: 'from-orange-500 to-red-600',
    textColor: 'text-orange-600 dark:text-orange-400'
  }
} as const;

// Achievement Rarity Configuration
export const ACHIEVEMENT_RARITY = {
  common: {
    name: 'Common',
    color: '#6B7280',
    bgColor: 'from-gray-500 to-gray-600',
    textColor: 'text-gray-600 dark:text-gray-400',
    glowColor: 'shadow-gray-500/50'
  },
  uncommon: {
    name: 'Uncommon',
    color: '#22C55E',
    bgColor: 'from-green-500 to-green-600',
    textColor: 'text-green-600 dark:text-green-400',
    glowColor: 'shadow-green-500/50'
  },
  rare: {
    name: 'Rare',
    color: '#3B82F6',
    bgColor: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-600 dark:text-blue-400',
    glowColor: 'shadow-blue-500/50'
  },
  epic: {
    name: 'Epic',
    color: '#8B5CF6',
    bgColor: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-600 dark:text-purple-400',
    glowColor: 'shadow-purple-500/50'
  },
  legendary: {
    name: 'Legendary',
    color: '#F59E0B',
    bgColor: 'from-amber-500 to-amber-600',
    textColor: 'text-amber-600 dark:text-amber-400',
    glowColor: 'shadow-amber-500/50'
  }
} as const;
