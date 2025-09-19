// src/store/useAchievementStore.ts - Achievement Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Achievement, 
  AchievementCategory, 
  AchievementFilter,
  UserAchievementStats,
  UserLevel
} from '../types/achievements';
import { Application } from '../types';
import AchievementService from '../services/achievementService';

interface AchievementState {
  // Data
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  userStats: UserAchievementStats | null;
  userLevel: UserLevel | null;
  
  // UI State
  selectedCategory: AchievementCategory | 'all';
  filter: AchievementFilter;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAchievements: () => void;
  checkExistingApplications: (applications: Application[], dailyStreak: number, weeklyProgress: number, monthlyProgress: number) => Achievement[];
  checkAchievements: (applications: Application[], dailyStreak: number, weeklyProgress: number, monthlyProgress: number) => Achievement[];
  setSelectedCategory: (category: AchievementCategory | 'all') => void;
  setFilter: (filter: AchievementFilter) => void;
  getFilteredAchievements: () => Achievement[];
  resetAchievements: () => void;
  refreshStats: () => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      // Initial state
      achievements: [],
      unlockedAchievements: new Set(),
      userStats: null,
      userLevel: null,
      selectedCategory: 'all',
      filter: {},
      isLoading: false,
      error: null,

      // Load achievements
      loadAchievements: () => {
        set({ isLoading: true, error: null });
        
        try {
          const achievementService = AchievementService.getInstance();
          const achievements = achievementService.getAllAchievements();
          const userStats = achievementService.getUserStats();
          const userLevel = achievementService.getUserLevel();
          
          // Create unlocked achievements set from loaded achievements
          const unlockedSet = new Set<string>();
          achievements.forEach(achievement => {
            if (achievement.unlocked) {
              unlockedSet.add(achievement.id);
            }
          });
          
          set({
            achievements,
            unlockedAchievements: unlockedSet,
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

      // Check all existing applications for achievements
      checkExistingApplications: (applications, dailyStreak, weeklyProgress, monthlyProgress) => {
        try {
          const achievementService = AchievementService.getInstance();
          
          // First, load all achievements with their current unlocked state
          const allAchievements = achievementService.getAllAchievements();
          
          // Then check for newly unlocked achievements
          const newlyUnlocked = achievementService.checkAchievements(
            applications,
            dailyStreak,
            weeklyProgress,
            monthlyProgress
          );

          // Update unlocked achievements set with both existing and newly unlocked
          const newUnlockedSet = new Set<string>();
          allAchievements.forEach(achievement => {
            if (achievement.unlocked) {
              newUnlockedSet.add(achievement.id);
            }
          });
          newlyUnlocked.forEach(achievement => {
            newUnlockedSet.add(achievement.id);
          });

          // Update stats and level
          const userStats = achievementService.getUserStats();
          const userLevel = achievementService.getUserLevel();

          set({
            achievements: allAchievements,
            unlockedAchievements: newUnlockedSet,
            userStats,
            userLevel
          });

          return newlyUnlocked;
        } catch (error) {
          console.error('Failed to check existing applications:', error);
          return [];
        }
      },

      // Check achievements
      checkAchievements: (applications, dailyStreak, weeklyProgress, monthlyProgress) => {
        try {
          const achievementService = AchievementService.getInstance();
          
          // First, load all achievements with their current unlocked state
          const allAchievements = achievementService.getAllAchievements();
          
          // Then check for newly unlocked achievements
          const newlyUnlocked = achievementService.checkAchievements(
            applications,
            dailyStreak,
            weeklyProgress,
            monthlyProgress
          );

          // Update unlocked achievements set with both existing and newly unlocked
          const newUnlockedSet = new Set<string>();
          allAchievements.forEach(achievement => {
            if (achievement.unlocked) {
              newUnlockedSet.add(achievement.id);
            }
          });
          newlyUnlocked.forEach(achievement => {
            newUnlockedSet.add(achievement.id);
          });

          const userStats = achievementService.getUserStats();
          const userLevel = achievementService.getUserLevel();

          set({
            achievements: allAchievements,
            unlockedAchievements: newUnlockedSet,
            userStats,
            userLevel
          });

          return newlyUnlocked;
        } catch (error) {
          console.error('Failed to check achievements:', error);
          return [];
        }
      },

      // Set selected category
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      // Set filter
      setFilter: (filter) => {
        set({ filter });
      },

      // Get filtered achievements
      getFilteredAchievements: () => {
        const { achievements, selectedCategory, filter } = get();
        
        let filtered = achievements;

        // Filter by category
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(achievement => achievement.category === selectedCategory);
        }

        // Filter by tier
        if (filter.tier) {
          filtered = filtered.filter(achievement => achievement.tier === filter.tier);
        }

        // Filter by rarity
        if (filter.rarity) {
          filtered = filtered.filter(achievement => achievement.rarity === filter.rarity);
        }

        // Filter by unlocked status
        if (filter.unlocked !== undefined) {
          filtered = filtered.filter(achievement => achievement.unlocked === filter.unlocked);
        }

        // Filter by search
        if (filter.search) {
          const searchTerm = filter.search.toLowerCase();
          filtered = filtered.filter(achievement => 
            achievement.name.toLowerCase().includes(searchTerm) ||
            achievement.description.toLowerCase().includes(searchTerm)
          );
        }

        return filtered;
      },

      // Reset achievements
      resetAchievements: () => {
        try {
          const achievementService = AchievementService.getInstance();
          achievementService.resetAchievements();
          
          set({
            achievements: achievementService.getAllAchievements(),
            userStats: achievementService.getUserStats(),
            userLevel: achievementService.getUserLevel(),
            unlockedAchievements: new Set()
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to reset achievements'
          });
        }
      },

      // Refresh stats
      refreshStats: () => {
        try {
          const achievementService = AchievementService.getInstance();
          const userStats = achievementService.getUserStats();
          const userLevel = achievementService.getUserLevel();
          
          set({ userStats, userLevel });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh stats'
          });
        }
      }
    }),
    {
      name: 'achievement-store',
      partialize: (state) => ({
        selectedCategory: state.selectedCategory,
        filter: state.filter
      })
    }
  )
);
