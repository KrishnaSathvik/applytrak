// src/services/achievementService.ts - Achievement System Service
import { 
  Achievement, 
  AchievementCategory, 
  UserAchievementStats,
  UserLevel,
  LEVEL_TITLES,
  LEVEL_COLORS,
 
} from '../types/achievements';
import { Application } from '../types';

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Milestone Achievements
  {
    id: 'first_application',
    name: 'First Steps',
    description: 'Submit your first job application',
    category: 'milestone',
    tier: 'bronze',
    rarity: 'common',
    icon: 'Target',
    xpReward: 10,
    unlocked: false,
    requirements: [{ type: 'applications', value: 1, description: 'Submit 1 application' }]
  },
  {
    id: 'ten_applications',
    name: 'Getting Started',
    description: 'Submit 10 job applications',
    category: 'milestone',
    tier: 'bronze',
    rarity: 'common',
    icon: 'Target',
    xpReward: 25,
    unlocked: false,
    requirements: [{ type: 'applications', value: 10, description: 'Submit 10 applications' }]
  },
  {
    id: 'first_interview',
    name: 'First Interview',
    description: 'Get your first job interview',
    category: 'milestone',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'Video',
    xpReward: 75,
    unlocked: false,
    requirements: [{ type: 'applications', value: 1, description: 'Get 1 interview' }]
  },
  {
    id: 'first_offer',
    name: 'First Offer',
    description: 'Receive your first job offer',
    category: 'milestone',
    tier: 'gold',
    rarity: 'rare',
    icon: 'Award',
    xpReward: 150,
    unlocked: false,
    requirements: [{ type: 'applications', value: 1, description: 'Receive 1 job offer' }]
  },
  {
    id: 'twenty_five_applications',
    name: 'Building Momentum',
    description: 'Submit 25 job applications',
    category: 'milestone',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'TrendingUp',
    xpReward: 50,
    unlocked: false,
    requirements: [{ type: 'applications', value: 25, description: 'Submit 25 applications' }]
  },
  {
    id: 'fifty_applications',
    name: 'Half Century',
    description: 'Submit 50 job applications',
    category: 'milestone',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'Target',
    xpReward: 100,
    unlocked: false,
    requirements: [{ type: 'applications', value: 50, description: 'Submit 50 applications' }]
  },
  {
    id: 'hundred_applications',
    name: 'Century Club',
    description: 'Submit 100 job applications',
    category: 'milestone',
    tier: 'gold',
    rarity: 'rare',
    icon: 'Award',
    xpReward: 250,
    unlocked: false,
    requirements: [{ type: 'applications', value: 100, description: 'Submit 100 applications' }]
  },
  {
    id: 'thousand_applications',
    name: 'Legendary Job Seeker',
    description: 'Submit 1000 job applications - The ultimate achievement!',
    category: 'milestone',
    tier: 'legendary',
    rarity: 'legendary',
    icon: 'Crown',
    xpReward: 1000,
    unlocked: false,
    requirements: [{ type: 'applications', value: 1000, description: 'Submit 1000 applications' }]
  },
  {
    id: 'two_hundred_applications',
    name: 'Application Master',
    description: 'Submit 200 job applications',
    category: 'milestone',
    tier: 'platinum',
    rarity: 'epic',
    icon: 'Crown',
    xpReward: 500,
    unlocked: false,
    requirements: [{ type: 'applications', value: 200, description: 'Submit 200 applications' }]
  },
  {
    id: 'five_hundred_applications',
    name: 'Ultimate Job Seeker',
    description: 'Submit 500 job applications',
    category: 'milestone',
    tier: 'diamond',
    rarity: 'legendary',
    icon: 'Star',
    xpReward: 1000,
    unlocked: false,
    requirements: [{ type: 'applications', value: 500, description: 'Submit 500 applications' }]
  },

  // Streak Achievements
  {
    id: 'three_day_streak',
    name: 'Getting Started',
    description: 'Apply for 3 days in a row',
    category: 'streak',
    tier: 'bronze',
    rarity: 'common',
    icon: 'Flame',
    xpReward: 15,
    unlocked: false,
    requirements: [{ type: 'streak', value: 3, description: 'Apply for 3 consecutive days' }]
  },
  {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: 'Apply for 7 days in a row',
    category: 'streak',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'Flame',
    xpReward: 35,
    unlocked: false,
    requirements: [{ type: 'streak', value: 7, description: 'Apply for 7 consecutive days' }]
  },
  {
    id: 'thirty_day_streak',
    name: 'Consistency Master',
    description: 'Apply for 30 days in a row',
    category: 'streak',
    tier: 'gold',
    rarity: 'rare',
    icon: 'Flame',
    xpReward: 100,
    unlocked: false,
    requirements: [{ type: 'streak', value: 30, description: 'Apply for 30 consecutive days' }]
  },
  {
    id: 'hundred_day_streak',
    name: 'Streak Legend',
    description: 'Apply for 100 days in a row',
    category: 'streak',
    tier: 'diamond',
    rarity: 'legendary',
    icon: 'Flame',
    xpReward: 500,
    unlocked: false,
    requirements: [{ type: 'streak', value: 100, description: 'Apply for 100 consecutive days' }]
  },

  // Goal Achievements
  {
    id: 'weekly_goal_achiever',
    name: 'Weekly Achiever',
    description: 'Complete your weekly goal',
    category: 'goal',
    tier: 'bronze',
    rarity: 'common',
    icon: 'Award',
    xpReward: 20,
    unlocked: false,
    requirements: [{ type: 'goals', value: 1, description: 'Complete 1 weekly goal' }]
  },
  {
    id: 'monthly_goal_achiever',
    name: 'Monthly Crusher',
    description: 'Complete your monthly goal',
    category: 'goal',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'Award',
    xpReward: 50,
    unlocked: false,
    requirements: [{ type: 'goals', value: 1, description: 'Complete 1 monthly goal' }]
  },
  {
    id: 'goal_overachiever',
    name: 'Overachiever',
    description: 'Exceed your weekly goal by 50%',
    category: 'goal',
    tier: 'gold',
    rarity: 'rare',
    icon: 'TrendingUp',
    xpReward: 75,
    unlocked: false,
    requirements: [{ type: 'goals', value: 1, description: 'Exceed weekly goal by 50%' }]
  },

  // Time-based Achievements
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Submit an application before 9 AM',
    category: 'time',
    tier: 'bronze',
    rarity: 'common',
    icon: 'Sunrise',
    xpReward: 10,
    unlocked: false,
    requirements: [{ type: 'time', value: 1, description: 'Apply before 9 AM' }]
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Submit an application after 8 PM',
    category: 'time',
    tier: 'bronze',
    rarity: 'common',
    icon: 'Moon',
    xpReward: 10,
    unlocked: false,
    requirements: [{ type: 'time', value: 1, description: 'Apply after 8 PM' }]
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Submit an application on the weekend',
    category: 'time',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'Calendar',
    xpReward: 15,
    unlocked: false,
    requirements: [{ type: 'time', value: 1, description: 'Apply on weekend' }]
  },

  // Quality Achievements
  {
    id: 'cover_letter_pro',
    name: 'Cover Letter Pro',
    description: 'Add cover letters to 5 applications',
    category: 'quality',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'FileText',
    xpReward: 30,
    unlocked: false,
    requirements: [{ type: 'quality', value: 5, description: 'Add cover letters to 5 applications' }]
  },
  {
    id: 'resume_optimizer',
    name: 'Resume Optimizer',
    description: 'Update your resume 3 times',
    category: 'quality',
    tier: 'gold',
    rarity: 'rare',
    icon: 'FileEdit',
    xpReward: 40,
    unlocked: false,
    requirements: [{ type: 'quality', value: 3, description: 'Update resume 3 times' }]
  },
  {
    id: 'remote_seeker',
    name: 'Remote Seeker',
    description: 'Apply to 5 remote positions',
    category: 'quality',
    tier: 'silver',
    rarity: 'uncommon',
    icon: 'Home',
    xpReward: 25,
    unlocked: false,
    requirements: [{ type: 'quality', value: 5, description: 'Apply to 5 remote positions' }]
  },


  // Special Achievements
  {
    id: 'faang_hunter',
    name: 'FAANG Hunter',
    description: 'Apply to 5 FAANG companies (Facebook/Meta, Amazon, Apple, Netflix, Google)',
    category: 'special',
    tier: 'gold',
    rarity: 'rare',
    icon: 'Building2',
    xpReward: 200,
    unlocked: false,
    requirements: [{ type: 'applications', value: 5, description: 'Apply to 5 FAANG companies' }]
  },
  {
    id: 'achievement_collector',
    name: 'Achievement Collector',
    description: 'Unlock 5 achievements',
    category: 'special',
    tier: 'gold',
    rarity: 'rare',
    icon: 'Trophy',
    xpReward: 150,
    unlocked: false,
    requirements: [{ type: 'applications', value: 5, description: 'Unlock 5 achievements' }]
  },
  {
    id: 'note_taker',
    name: 'Note Taker',
    description: 'Add notes to 3 applications',
    category: 'quality',
    tier: 'bronze',
    rarity: 'common',
    icon: 'FileText',
    xpReward: 30,
    unlocked: false,
    requirements: [{ type: 'quality', value: 3, description: 'Add notes to 3 applications' }]
  }
];

// XP and Level System
export const XP_PER_LEVEL = 100; // Base XP needed per level
export const XP_MULTIPLIER = 1.2; // XP multiplier per level

export class AchievementService {
  private static instance: AchievementService;
  private achievements: Achievement[] = [...ACHIEVEMENTS];
  private unlockedAchievements: Set<string> = new Set();
  private userXP: number = 0;

  private constructor() {
    this.loadUserData();
  }

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  // Load user data from localStorage
  private loadUserData(): void {
    try {
      const savedAchievements = localStorage.getItem('unlocked_achievements');
      const savedXP = localStorage.getItem('user_xp');
      
      if (savedAchievements) {
        this.unlockedAchievements = new Set(JSON.parse(savedAchievements));
      }
      
      if (savedXP) {
        this.userXP = parseInt(savedXP, 10);
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
    }
  }

  // Save user data to localStorage
  private saveUserData(): void {
    try {
      localStorage.setItem('unlocked_achievements', JSON.stringify(Array.from(this.unlockedAchievements)));
      localStorage.setItem('user_xp', this.userXP.toString());
    } catch (error) {
      console.error('Failed to save achievement data:', error);
    }
  }

  // Check and unlock achievements
  public checkAchievements(
    applications: Application[],
    dailyStreak: number,
    weeklyProgress: number,
    monthlyProgress: number
  ): Achievement[] {
    const newlyUnlocked: Achievement[] = [];
    const currentTime = new Date();

    for (const achievement of this.achievements) {
      if (this.unlockedAchievements.has(achievement.id)) {
        continue; // Already unlocked
      }

      let isUnlocked = false;

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
      }

      if (isUnlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = currentTime;
        this.unlockedAchievements.add(achievement.id);
        this.userXP += achievement.xpReward;
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      this.saveUserData();
    }

    return newlyUnlocked;
  }

  // Check milestone achievements
  private checkMilestoneAchievement(achievement: Achievement, applications: Application[]): boolean {
    const requirement = achievement.requirements[0];
    
    if (achievement.id === 'first_interview') {
      // Check if any application has interview status
      return applications.some(app => 
        app.status?.toLowerCase().includes('interview') || 
        app.status?.toLowerCase().includes('phone') ||
        app.status?.toLowerCase().includes('video') ||
        app.status?.toLowerCase().includes('onsite')
      );
    } else if (achievement.id === 'first_offer') {
      // Check if any application has offer status
      return applications.some(app => 
        app.status?.toLowerCase().includes('offer') || 
        app.status?.toLowerCase().includes('accepted')
      );
    } else {
      // For other milestone achievements, use application count
      return applications.length >= requirement.value;
    }
  }

  // Check streak achievements
  private checkStreakAchievement(achievement: Achievement, streak: number): boolean {
    const requirement = achievement.requirements[0];
    return streak >= requirement.value;
  }

  // Check goal achievements
  private checkGoalAchievement(achievement: Achievement, weeklyProgress: number, monthlyProgress: number): boolean {
    if (achievement.id === 'weekly_goal_achiever') {
      return weeklyProgress >= 100;
    } else if (achievement.id === 'monthly_goal_achiever') {
      return monthlyProgress >= 100;
    } else if (achievement.id === 'goal_overachiever') {
      return weeklyProgress >= 150;
    }
    
    return false;
  }

  // Check time-based achievements
  private checkTimeAchievement(achievement: Achievement, applications: Application[]): boolean {
    for (const app of applications) {
      const appDate = new Date(app.dateApplied);
      const appHour = appDate.getHours();
      const appDay = appDate.getDay();

      if (achievement.id === 'early_bird' && appHour < 9) {
        return true;
      } else if (achievement.id === 'night_owl' && appHour >= 20) {
        return true;
      } else if (achievement.id === 'weekend_warrior' && (appDay === 0 || appDay === 6)) {
        return true;
      }
    }

    return false;
  }

  // Check quality achievements
  private checkQualityAchievement(achievement: Achievement, applications: Application[]): boolean {
    if (achievement.id === 'cover_letter_pro') {
      const withCoverLetter = applications.filter(app => app.notes && app.notes.length > 50).length;
      return withCoverLetter >= 5;
    } else if (achievement.id === 'remote_seeker') {
      const remoteApps = applications.filter(app => 
        app.location && app.location.toLowerCase().includes('remote')
      ).length;
      return remoteApps >= 5;
    } else if (achievement.id === 'note_taker') {
      const withNotes = applications.filter(app => app.notes && app.notes.trim().length > 0).length;
      return withNotes >= 3;
    }

    return false;
  }


  // Check special achievements
  private checkSpecialAchievement(achievement: Achievement, applications: Application[]): boolean {
    if (achievement.id === 'faang_hunter') {
      const faangCompanies = [
        'facebook', 'meta', 'amazon', 'apple', 'netflix', 'google',
        'alphabet', 'microsoft' // Adding Microsoft as it's often grouped with FAANG
      ];
      
      const faangApps = applications.filter(app => {
        const company = app.company?.toLowerCase() || '';
        return faangCompanies.some(faang => company.includes(faang));
      });
      
      return faangApps.length >= 5;
    } else if (achievement.id === 'achievement_collector') {
      return this.unlockedAchievements.size >= 5;
    }
    
    return false;
  }

  // Get all achievements
  public getAllAchievements(): Achievement[] {
    // Apply unlocked state from localStorage
    return this.achievements.map(achievement => ({
      ...achievement,
      unlocked: this.unlockedAchievements.has(achievement.id)
    }));
  }

  // Get achievements by category
  public getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.achievements
      .filter(achievement => achievement.category === category)
      .map(achievement => ({
        ...achievement,
        unlocked: this.unlockedAchievements.has(achievement.id)
      }));
  }

  // Get unlocked achievements
  public getUnlockedAchievements(): Achievement[] {
    return this.achievements
      .filter(achievement => this.unlockedAchievements.has(achievement.id))
      .map(achievement => ({
        ...achievement,
        unlocked: true
      }));
  }

  // Get achievement progress
  public getAchievementProgress(achievement: Achievement, applications: Application[], dailyStreak: number): number {
    if (achievement.unlocked) return 100;

    const requirement = achievement.requirements[0];
    
    switch (achievement.category) {
      case 'milestone':
        return Math.min(100, (applications.length / requirement.value) * 100);
      case 'streak':
        return Math.min(100, (dailyStreak / requirement.value) * 100);
      default:
        return 0;
    }
  }

  // Get user level
  public getUserLevel(): UserLevel {
    const level = Math.floor(this.userXP / XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = this.userXP % XP_PER_LEVEL;
    const xpToNext = XP_PER_LEVEL - xpInCurrentLevel;
    const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
    const colorIndex = Math.min(level - 1, LEVEL_COLORS.length - 1);

    return {
      level,
      xp: xpInCurrentLevel,
      xpToNext,
      totalXP: this.userXP,
      title: LEVEL_TITLES[titleIndex],
      color: LEVEL_COLORS[colorIndex]
    };
  }

  // Get user achievement stats
  public getUserStats(): UserAchievementStats {
    const unlocked = this.getUnlockedAchievements();
    const userLevel = this.getUserLevel();
    
    const achievementsByCategory = this.achievements.reduce((acc, achievement) => {
      if (this.unlockedAchievements.has(achievement.id)) {
        acc[achievement.category] = (acc[achievement.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<AchievementCategory, number>);

    return {
      totalAchievements: this.achievements.length,
      unlockedAchievements: unlocked.length,
      totalXP: this.userXP,
      currentLevel: userLevel.level,
      xpToNextLevel: userLevel.xpToNext,
      achievementsByCategory,
      recentUnlocks: unlocked
        .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
        .slice(0, 5),
      streak: 0, // This would come from the app store
      longestStreak: 0 // This would come from the app store
    };
  }

  // Reset all achievements (for testing)
  public resetAchievements(): void {
    this.unlockedAchievements.clear();
    this.userXP = 0;
    this.achievements.forEach(achievement => {
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
    });
    this.saveUserData();
  }
}

export default AchievementService;
