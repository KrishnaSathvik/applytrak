// src/components/tabs/AchievementsTab.tsx - Desktop Achievements Tab
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Target, 
  Flame, 
  Clock, 
  Star, 
  User, 
  Crown,
  Filter,
  Search,
  TrendingUp,
  Zap,
  Medal,
  ChevronDown
} from 'lucide-react';
import { useCloudAchievementStore, useFilteredAchievements } from '../../store/useCloudAchievementStore';
import { useAppStore } from '../../store/useAppStore';
import AchievementCard from '../achievements/AchievementCard';
import { AchievementCategory, ACHIEVEMENT_CATEGORIES } from '../../types/achievements';

const AchievementsTab: React.FC = () => {
  const {
    userStats,
    userLevel,
    selectedCategory,
    filter,
    isLoading,
    loadAchievements,
    checkExistingApplications,
    setSelectedCategory,
    setFilter
  } = useCloudAchievementStore();

  const { applications, goalProgress, auth } = useAppStore();
  
  // Use helper hooks for filtered data
  const filteredAchievements = useFilteredAchievements();
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load achievements on mount and check existing applications
  useEffect(() => {
    if (auth.user?.id) {
      const userId = String(auth.user.id);
      loadAchievements(userId);
      // Check existing applications for achievements
      if (applications.length > 0) {
        checkExistingApplications(
          userId,
          applications,
          goalProgress.dailyStreak,
          goalProgress.weeklyProgress,
          goalProgress.monthlyProgress
        );
      }
    }
  }, [loadAchievements, checkExistingApplications, applications.length, auth.user?.id]);

  // Check achievements when applications change
  useEffect(() => {
    if (auth.user?.id && applications.length > 0) {
      const userId = String(auth.user.id);
      checkExistingApplications(
        userId,
        applications,
        goalProgress.dailyStreak,
        goalProgress.weeklyProgress,
        goalProgress.monthlyProgress
      );
    }
  }, [applications.length, checkExistingApplications, auth.user?.id]);

  // Apply search filter to filtered achievements
  const searchFilteredAchievements = useMemo(() => {
    if (!searchQuery) return filteredAchievements;
    
    const query = searchQuery.toLowerCase();
    return filteredAchievements.filter(achievement => 
      achievement.name.toLowerCase().includes(query) ||
      achievement.description.toLowerCase().includes(query)
    );
  }, [filteredAchievements, searchQuery]);

  // Get achievements by category
  const achievementsByCategory = useMemo(() => {
    const categories: Record<AchievementCategory, number> = {
      milestone: 0,
      streak: 0,
      goal: 0,
      time: 0,
      quality: 0,
      special: 0
    };

    filteredAchievements.forEach(achievement => {
      categories[achievement.category]++;
    });

    return categories;
  }, [filteredAchievements]);

  // Get unlocked achievements by category
  const unlockedByCategory = useMemo(() => {
    const categories: Record<AchievementCategory, number> = {
      milestone: 0,
      streak: 0,
      goal: 0,
      time: 0,
      quality: 0,
      special: 0
    };

    filteredAchievements.forEach(achievement => {
      if (achievement.unlocked) {
        categories[achievement.category]++;
      }
    });

    return categories;
  }, [filteredAchievements]);

  const handleCategorySelect = (category: AchievementCategory | 'all') => {
    setSelectedCategory(category);
  };

  const handleFilterChange = (newFilter: Partial<typeof filter>) => {
    setFilter({ ...filter, ...newFilter });
  };

  const getCategoryIcon = (category: AchievementCategory) => {
    const iconMap = {
      milestone: Target,
      streak: Flame,
      goal: Award,
      time: Clock,
      quality: Star,
      profile: User,
      special: Crown
    };
    return iconMap[category];
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Loading Achievements
            </h1>
            <p className="text-gray-600 text-lg">
              Preparing your achievement collection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Achievements
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Track your progress and unlock rewards
          </p>
          
          {/* User Level Display */}
          {userLevel && (
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <Medal className="h-6 w-6" style={{ color: userLevel.color }} />
                <span className="text-lg font-semibold" style={{ color: userLevel.color }}>
                  Level {userLevel.level}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {userLevel.totalXP} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card">
            <div className="flex items-center mb-4">
              <Trophy className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Total Achievements</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {userStats.unlockedAchievements}/{userStats.totalAchievements}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(userStats.unlockedAchievements / userStats.totalAchievements) * 100}%` }}
              />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center mb-4">
              <Zap className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Total XP</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {userStats.totalXP.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {userLevel?.title || 'Job Seeker'}
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Completion Rate</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {Math.round((userStats.unlockedAchievements / userStats.totalAchievements) * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Achievements unlocked
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({filteredAchievements.length})
          </button>
          
          {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, config]) => {
            const category = key as AchievementCategory;
            const IconComponent = getCategoryIcon(category);
            const total = achievementsByCategory[category];
            const unlocked = unlockedByCategory[category];
            
            return (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  selectedCategory === category
                    ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{config.name}</span>
                <span className="text-xs opacity-75">({unlocked}/{total})</span>
              </button>
            );
          })}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tier Filter */}
              <select
                value={filter.tier || ''}
                onChange={(e) => handleFilterChange({ tier: e.target.value as any || undefined })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>

              {/* Status Filter */}
              <select
                value={filter.unlocked === undefined ? '' : filter.unlocked.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({ 
                    unlocked: value === '' ? undefined : value === 'true'
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Unlocked</option>
                <option value="false">Locked</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Achievements Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {selectedCategory === 'all' ? 'All Achievements' : ACHIEVEMENT_CATEGORIES[selectedCategory as AchievementCategory]?.name}
        </h2>
        
        {searchFilteredAchievements.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Achievements Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {searchFilteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                progress={achievement.progress || 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsTab;
