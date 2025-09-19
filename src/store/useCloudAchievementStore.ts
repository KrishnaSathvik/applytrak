// src/store/useCloudAchievementStore.ts - Cloud Achievement Store
import { create } from 'zustand';
import { 
  Achievement, 
  AchievementCategory, 
  AchievementFilter,
  UserAchievementStats,
  UserLevel
} from '../types/achievements';
import { Application } from '../types';
import CloudAchievementService from '../services/cloudAchievementService';

interface CloudAchievementState {
  // Data
  achievements: Achievement[];
  userStats: UserAchievementStats | null;
  userLevel: UserLevel | null;
  
  // UI State
  selectedCategory: AchievementCategory | 'all';
  filter: AchievementFilter;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAchievements: (userId: string) => Promise<void>;
  checkExistingApplications: (userId: string, applications: Application[], dailyStreak: number, weeklyProgress: number, monthlyProgress: number) => Promise<Achievement[]>;
  checkAchievements: (userId: string, applications: Application[], dailyStreak: number, weeklyProgress: number, monthlyProgress: number) => Promise<Achievement[]>;
  setSelectedCategory: (category: AchievementCategory | 'all') => void;
  setFilter: (filter: AchievementFilter) => void;
  clearError: () => void;
}

export const useCloudAchievementStore = create<CloudAchievementState>()((set, get) => ({
  // Initial state
  achievements: [],
  userStats: null,
  userLevel: null,
  selectedCategory: 'all' as AchievementCategory | 'all',
  filter: {},
  isLoading: false,
  error: null,

  // Load achievements from cloud
  loadAchievements: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const cloudService = CloudAchievementService.getInstance();
      
      // Load achievements with user's unlock status
      const achievements = await cloudService.loadUserAchievements(userId);
      
      // Load user stats
      const userStats = await cloudService.loadUserStats(userId);
      const userLevel = cloudService.getUserLevel();

      set({
        achievements,
        userStats,
        userLevel,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load achievements',
        isLoading: false
      });
    }
  },

  // Check existing applications for achievements
  checkExistingApplications: async (userId: string, applications: Application[], dailyStreak: number, weeklyProgress: number, monthlyProgress: number) => {
    try {
      console.log('🏆 Checking existing applications for achievements...', {
        userId,
        applicationsCount: applications.length,
        dailyStreak,
        weeklyProgress,
        monthlyProgress
      });
      
      const cloudService = CloudAchievementService.getInstance();
      
      // Check for newly unlocked achievements
      const newlyUnlocked = await cloudService.checkAchievements(
        userId,
        applications,
        dailyStreak,
        weeklyProgress,
        monthlyProgress
      );

      console.log('🏆 Achievement check completed:', {
        newlyUnlocked: newlyUnlocked.length,
        achievements: newlyUnlocked.map(a => a.name)
      });

      // Reload achievements and stats
      await get().loadAchievements(userId);

      return newlyUnlocked;
    } catch (error) {
      console.error('Failed to check existing applications:', error);
      return [];
    }
  },

  // Check achievements for new data
  checkAchievements: async (userId: string, applications: Application[], dailyStreak: number, weeklyProgress: number, monthlyProgress: number) => {
    try {
      const cloudService = CloudAchievementService.getInstance();
      
      // Check for newly unlocked achievements
      const newlyUnlocked = await cloudService.checkAchievements(
        userId,
        applications,
        dailyStreak,
        weeklyProgress,
        monthlyProgress
      );

      // Reload achievements and stats
      await get().loadAchievements(userId);

      return newlyUnlocked;
    } catch (error) {
      console.error('Failed to check achievements:', error);
      return [];
    }
  },

  // UI Actions
  setSelectedCategory: (category: AchievementCategory | 'all') => {
    set({ selectedCategory: category });
  },

  setFilter: (filter: AchievementFilter) => {
    set({ filter });
  },

  clearError: () => {
    set({ error: null });
  }
}));

// Helper hook to get filtered achievements
export const useFilteredAchievements = () => {
  const { achievements, selectedCategory, filter } = useCloudAchievementStore();
  
  return achievements.filter(achievement => {
    // Category filter
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    
    // Tier filter
    if (filter.tier && achievement.tier !== filter.tier) {
      return false;
    }
    
    // Rarity filter
    if (filter.rarity && achievement.rarity !== filter.rarity) {
      return false;
    }
    
    // Unlocked filter
    if (filter.unlocked !== undefined && achievement.unlocked !== filter.unlocked) {
      return false;
    }
    
    return true;
  });
};

// Helper hook to get category counts
export const useAchievementCategoryCounts = () => {
  const { achievements } = useCloudAchievementStore();
  
  const categories: Record<AchievementCategory, number> = {
    milestone: 0,
    streak: 0,
    goal: 0,
    time: 0,
    quality: 0,
    special: 0
  };
  
  achievements.forEach(achievement => {
    categories[achievement.category]++;
  });
  
  return categories;
};
