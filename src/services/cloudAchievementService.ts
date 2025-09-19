// Cloud Achievement Service - Supabase Integration
import { supabase } from './databaseService';
import { Achievement, AchievementCategory, UserAchievementStats, UserLevel } from '../types/achievements';
import { Application } from '../types';

export interface CloudAchievement {
  achievement_id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: string;
  rarity: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string | null;
  is_unlocked: boolean;
}

export interface CloudUserStats {
  total_xp: number;
  current_level: number;
  achievements_unlocked: number;
}

class CloudAchievementService {
  private static instance: CloudAchievementService;
  private achievements: Achievement[] = [];
  private userStats: UserAchievementStats | null = null;
  private userLevel: UserLevel | null = null;

  private constructor() {}

  public static getInstance(): CloudAchievementService {
    if (!CloudAchievementService.instance) {
      CloudAchievementService.instance = new CloudAchievementService();
    }
    return CloudAchievementService.instance;
  }

  // Load achievements from Supabase
  public async loadAchievements(): Promise<Achievement[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('tier', { ascending: true });

      if (error) {
        console.error('Error loading achievements:', error);
        return [];
      }

      this.achievements = data.map(this.mapCloudAchievementToAchievement);
      return this.achievements;
    } catch (error) {
      console.error('Error loading achievements:', error);
      return [];
    }
  }

  // Load user achievements with unlock status
  public async loadUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .rpc('get_user_achievements', { user_uuid: userId });

      if (error) {
        console.error('Error loading user achievements:', error);
        throw new Error(`Failed to load achievements: ${error.message}`);
      }

      this.achievements = data.map(this.mapCloudAchievementToAchievement);
      return this.achievements;
    } catch (error) {
      console.error('Error loading user achievements:', error);
      throw new Error(`Failed to load achievements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Load user stats
  public async loadUserStats(userId: string): Promise<UserAchievementStats> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .rpc('get_user_stats', { user_uuid: userId });

      if (error) {
        console.error('Error loading user stats:', error);
        throw new Error(`Failed to load user stats: ${error.message}`);
      }

      if (data && data.length > 0) {
        const stats = data[0];
        this.userStats = {
          totalXP: stats.total_xp || 0,
          unlockedAchievements: stats.achievements_unlocked || 0,
          currentLevel: stats.current_level || 1,
          totalAchievements: this.achievements.length, // Use actual achievements count
          xpToNextLevel: 0, // Will be calculated
          achievementsByCategory: {} as Record<AchievementCategory, number>, // Will be calculated
          recentUnlocks: [], // Will be calculated
          streak: 0, // Will be calculated
          longestStreak: 0 // Will be calculated
        };
        this.userLevel = this.calculateUserLevel(this.userStats.totalXP);
        return this.userStats;
      }

      throw new Error('No user stats found');
    } catch (error) {
      console.error('Error loading user stats:', error);
      throw new Error(`Failed to load user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check and unlock achievements
  public async checkAchievements(
    userId: string,
    applications: Application[],
    dailyStreak: number,
    weeklyProgress: number,
    monthlyProgress: number
  ): Promise<Achievement[]> {
    console.log('🔍 CloudAchievementService.checkAchievements called with:', {
      userId,
      applicationsCount: applications.length,
      dailyStreak,
      weeklyProgress,
      monthlyProgress,
      currentAchievementsCount: this.achievements.length
    });

    const newlyUnlocked: Achievement[] = [];

    // Load current achievements if not already loaded
    if (this.achievements.length === 0) {
      console.log('📥 Loading achievements from cloud...');
      await this.loadUserAchievements(userId);
      console.log('📥 Loaded achievements:', this.achievements.length);
    }

    for (const achievement of this.achievements) {
      if (achievement.unlocked) {
        console.log(`✅ Achievement "${achievement.name}" already unlocked, skipping`);
        continue; // Already unlocked
      }

      let isUnlocked = false;

      try {
        switch (achievement.category) {
          case 'milestone':
            isUnlocked = this.checkMilestoneAchievement(achievement, applications);
            break;
          case 'streak':
            isUnlocked = this.checkStreakAchievement(achievement, dailyStreak);
            break;
          case 'goal':
            isUnlocked = this.checkGoalAchievement(achievement, weeklyProgress, monthlyProgress);
            break;
          case 'time':
            isUnlocked = this.checkTimeAchievement(achievement, applications);
            break;
          case 'quality':
            isUnlocked = this.checkQualityAchievement(achievement, applications);
            break;
          case 'special':
            isUnlocked = this.checkSpecialAchievement(achievement, applications);
            break;
          default:
            console.log(`⚠️ Unknown achievement category: ${achievement.category}`);
            continue;
        }
      } catch (error) {
        console.error(`❌ Error checking achievement "${achievement.name}":`, error);
        continue; // Skip this achievement if there's an error
      }

      console.log(`🔍 Checking "${achievement.name}" (${achievement.category}): ${isUnlocked ? 'UNLOCKED!' : 'locked'}`);

      if (isUnlocked) {
        console.log(`🎉 Unlocking achievement: ${achievement.name}`);
        // Unlock achievement in database
        const success = await this.unlockAchievement(userId, achievement.id);
        if (success) {
          achievement.unlocked = true;
          newlyUnlocked.push(achievement);
          console.log(`✅ Successfully unlocked: ${achievement.name}`);
        } else {
          console.error(`❌ Failed to unlock: ${achievement.name}`);
        }
      }
    }

    console.log(`🏆 Achievement check complete. Newly unlocked: ${newlyUnlocked.length}`);

    // Reload user stats after unlocking achievements
    if (newlyUnlocked.length > 0) {
      await this.loadUserStats(userId);
    }

    return newlyUnlocked;
  }

  // Unlock a specific achievement
  private async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { error } = await supabase
        .rpc('unlock_achievement', {
          user_uuid: userId,
          achievement_id_param: achievementId
        });

      if (error) {
        console.error('Error unlocking achievement:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }

  // Get all achievements
  public getAllAchievements(): Achievement[] {
    return this.achievements;
  }

  // Get achievements by category
  public getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.achievements.filter(achievement => achievement.category === category);
  }

  // Get unlocked achievements
  public getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(achievement => achievement.unlocked);
  }

  // Get user stats
  public getUserStats(): UserAchievementStats {
    return this.userStats || this.getDefaultStats();
  }

  // Get user level
  public getUserLevel(): UserLevel {
    return this.userLevel || this.calculateUserLevel(0);
  }

  // Private helper methods (same as original achievementService)
  private checkMilestoneAchievement(achievement: Achievement, applications: Application[]): boolean {
    const requirement = achievement.requirements?.[0];
    
    if (achievement.id === 'first_interview') {
      return applications.some(app => 
        app.status?.toLowerCase().includes('interview') || 
        app.status?.toLowerCase().includes('phone') ||
        app.status?.toLowerCase().includes('video') ||
        app.status?.toLowerCase().includes('onsite')
      );
    } else if (achievement.id === 'first_offer') {
      return applications.some(app => 
        app.status?.toLowerCase().includes('offer') || 
        app.status?.toLowerCase().includes('accepted')
      );
    } else if (achievement.id === 'first_application') {
      return applications.length >= 1;
    } else if (achievement.id === 'ten_applications') {
      return applications.length >= 10;
    } else if (achievement.id === 'fifty_applications') {
      return applications.length >= 50;
    } else if (achievement.id === 'hundred_applications') {
      return applications.length >= 100;
    } else if (achievement.id === 'five_hundred_applications') {
      return applications.length >= 500;
    } else if (achievement.id === 'thousand_applications') {
      return applications.length >= 1000;
    } else {
      // Fallback to requirement value, but only if it exists
      return requirement?.value ? applications.length >= requirement.value : false;
    }
  }

  private checkStreakAchievement(achievement: Achievement, dailyStreak: number): boolean {
    const requirement = achievement.requirements?.[0];
    
    if (achievement.id === 'three_day_streak') {
      return dailyStreak >= 3;
    } else if (achievement.id === 'week_streak') {
      return dailyStreak >= 7;
    } else if (achievement.id === 'month_streak') {
      return dailyStreak >= 30;
    } else {
      // Fallback to requirement value, but only if it exists
      return requirement?.value ? dailyStreak >= requirement.value : false;
    }
  }

  private checkGoalAchievement(achievement: Achievement, weeklyProgress: number, monthlyProgress: number): boolean {
    if (achievement.id === 'weekly_goal_achiever') {
      return weeklyProgress >= 100; // 100% weekly goal completion
    } else if (achievement.id === 'monthly_goal_achiever') {
      return monthlyProgress >= 100; // 100% monthly goal completion
    } else if (achievement.id === 'goal_overachiever') {
      return weeklyProgress >= 150; // 150% weekly goal completion
    }
    
    return false;
  }

  private checkTimeAchievement(achievement: Achievement, applications: Application[]): boolean {
    if (achievement.id === 'early_bird') {
      return applications.some(app => {
        const appliedHour = new Date(app.dateApplied).getHours();
        return appliedHour < 9;
      });
    } else if (achievement.id === 'night_owl') {
      return applications.some(app => {
        const appliedHour = new Date(app.dateApplied).getHours();
        return appliedHour >= 20;
      });
    }
    
    return false;
  }

  private checkQualityAchievement(achievement: Achievement, applications: Application[]): boolean {
    if (achievement.id === 'cover_letter_pro') {
      // Check for applications with cover letter attachments (by filename)
      const withCoverLetter = applications.filter(app => {
        if (!app.attachments || app.attachments.length === 0) return false;
        return app.attachments.some(attachment => {
          const fileName = attachment.name.toLowerCase();
          return fileName.includes('cover') || fileName.includes('letter') || fileName.includes('cl_');
        });
      }).length;
      return withCoverLetter >= 10;
    } else if (achievement.id === 'remote_seeker') {
      const remoteApps = applications.filter(app => app.type === 'Remote').length;
      return remoteApps >= 10;
    } else if (achievement.id === 'resume_optimizer') {
      // Check for applications with resume attachments (by filename)
      const withResume = applications.filter(app => {
        if (!app.attachments || app.attachments.length === 0) return false;
        return app.attachments.some(attachment => {
          const fileName = attachment.name.toLowerCase();
          return fileName.includes('resume') || fileName.includes('cv') || fileName.includes('resume_');
        });
      }).length;
      return withResume >= 10;
    } else if (achievement.id === 'note_taker') {
      const withNotes = applications.filter(app => app.notes && app.notes.trim().length > 0).length;
      return withNotes >= 10;
    }

    return false;
  }

  private checkSpecialAchievement(achievement: Achievement, applications: Application[]): boolean {
    if (achievement.id === 'faang_hunter') {
      const faangCompanies = [
        'facebook', 'meta', 'amazon', 'apple', 'netflix', 'google',
        'alphabet', 'microsoft'
      ];
      
      const faangApps = applications.filter(app => {
        const company = app.company?.toLowerCase() || '';
        return faangCompanies.some(faang => company.includes(faang));
      });
      
      return faangApps.length >= 5;
    } else if (achievement.id === 'achievement_collector') {
      const unlockedCount = this.achievements.filter(a => a.unlocked).length;
      return unlockedCount >= 5;
    }
    
    return false;
  }

  private mapCloudAchievementToAchievement(cloudAchievement: CloudAchievement): Achievement {
    return {
      id: cloudAchievement.achievement_id,
      name: cloudAchievement.name,
      description: cloudAchievement.description,
      category: cloudAchievement.category,
      tier: cloudAchievement.tier as any,
      rarity: cloudAchievement.rarity as any,
      icon: cloudAchievement.icon,
      xpReward: cloudAchievement.xp_reward,
      unlocked: cloudAchievement.is_unlocked,
      unlockedAt: cloudAchievement.unlocked_at ? new Date(cloudAchievement.unlocked_at) : undefined,
      requirements: [] // Will be loaded from database if needed
    };
  }

  private getDefaultStats(): UserAchievementStats {
    return {
      totalXP: 0,
      unlockedAchievements: 0,
      currentLevel: 1,
      totalAchievements: this.achievements.length,
      xpToNextLevel: 100,
      achievementsByCategory: {} as Record<AchievementCategory, number>,
      recentUnlocks: [],
      streak: 0,
      longestStreak: 0
    };
  }

  private calculateUserLevel(totalXP: number): UserLevel {
    // More reasonable level calculation: Level = sqrt(XP/50) + 1
    // This gives: Level 1 (0-49 XP), Level 2 (50-99 XP), Level 3 (100-149 XP), etc.
    const level = Math.floor(Math.sqrt(totalXP / 50)) + 1;
    const xpForCurrentLevel = totalXP % 50;
    const xpForNextLevel = 50 - xpForCurrentLevel;

    return {
      level,
      xp: xpForCurrentLevel,
      xpToNext: xpForNextLevel,
      totalXP,
      title: this.getLevelTitle(level),
      color: this.getLevelColor(level)
    };
  }

  private getLevelTitle(level: number): string {
    if (level <= 5) return 'Job Seeker';
    if (level <= 10) return 'Application Master';
    if (level <= 15) return 'Interview Expert';
    if (level <= 20) return 'Career Champion';
    return 'Legendary Hunter';
  }

  private getLevelColor(level: number): string {
    if (level <= 5) return '#3B82F6'; // Blue
    if (level <= 10) return '#10B981'; // Green
    if (level <= 15) return '#F59E0B'; // Yellow
    if (level <= 20) return '#8B5CF6'; // Purple
    return '#EF4444'; // Red
  }


}

export default CloudAchievementService;
