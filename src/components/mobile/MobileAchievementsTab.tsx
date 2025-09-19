// src/components/mobile/MobileAchievementsTab.tsx - Mobile Achievements Tab
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
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useCloudAchievementStore, useFilteredAchievements } from '../../store/useCloudAchievementStore';
import { useAppStore } from '../../store/useAppStore';
import AchievementCard from '../achievements/AchievementCard';
import { AchievementCategory, ACHIEVEMENT_CATEGORIES } from '../../types/achievements';

const MobileAchievementsTab: React.FC = () => {
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
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

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
    setShowCategoryMenu(false);
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
      <div className="mobile-content">
        <div className="card">
          <div className="mobile-text-center mobile-py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="mobile-text-2xl mobile-font-bold text-gray-900 dark:text-gray-100 mb-2">
              Loading Achievements
            </h1>
            <p className="mobile-text-gray-600 dark:text-gray-400">
              Preparing your achievement collection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content">
      {/* Header */}
      <div className="card">
        <div className="mobile-text-center mobile-py-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="mobile-text-2xl mobile-font-bold text-gray-900 dark:text-gray-100 mb-2">
            Achievements
          </h1>
          <p className="mobile-text-gray-600 dark:text-gray-400 mobile-text-sm mb-4">
            Track your progress and unlock rewards
          </p>
          
          {/* User Level Display */}
          {userLevel && (
            <div className="mobile-flex mobile-items-center mobile-justify-center mobile-gap-4">
              <div className="mobile-flex mobile-items-center mobile-gap-2">
                <Medal className="h-5 w-5" style={{ color: userLevel.color }} />
                <span className="mobile-text-sm mobile-font-semibold" style={{ color: userLevel.color }}>
                  Level {userLevel.level}
                </span>
              </div>
              <div className="mobile-flex mobile-items-center mobile-gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="mobile-text-sm mobile-font-medium text-gray-700 dark:text-gray-300">
                  {userLevel.totalXP} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {userStats && (
        <div className="mobile-space-y-3">
          <div className="card">
            <div className="mobile-flex mobile-items-center mobile-mb-3">
              <Trophy className="h-5 w-5 text-orange-600 mobile-mr-2" />
              <h3 className="mobile-text-sm mobile-font-semibold text-gray-900 dark:text-gray-100">Total Achievements</h3>
            </div>
            <div className="mobile-text-2xl mobile-font-bold text-gray-900 dark:text-gray-100 mobile-mb-2">
              {userStats.unlockedAchievements}/{userStats.totalAchievements}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(userStats.unlockedAchievements / userStats.totalAchievements) * 100}%` }}
              />
            </div>
          </div>

          <div className="card">
            <div className="mobile-flex mobile-items-center mobile-mb-3">
              <Zap className="h-5 w-5 text-yellow-600 mobile-mr-2" />
              <h3 className="mobile-text-sm mobile-font-semibold text-gray-900 dark:text-gray-100">Total XP</h3>
            </div>
            <div className="mobile-text-2xl mobile-font-bold text-gray-900 dark:text-gray-100 mobile-mb-2">
              {userStats.totalXP.toLocaleString()}
            </div>
            <div className="mobile-text-xs mobile-text-gray-600 dark:text-gray-400">
              {userLevel?.title || 'Job Seeker'}
            </div>
          </div>

          <div className="card">
            <div className="mobile-flex mobile-items-center mobile-mb-3">
              <TrendingUp className="h-5 w-5 text-green-600 mobile-mr-2" />
              <h3 className="mobile-text-sm mobile-font-semibold text-gray-900 dark:text-gray-100">Completion Rate</h3>
            </div>
            <div className="mobile-text-2xl mobile-font-bold text-gray-900 dark:text-gray-100 mobile-mb-2">
              {Math.round((userStats.unlockedAchievements / userStats.totalAchievements) * 100)}%
            </div>
            <div className="mobile-text-xs mobile-text-gray-600 dark:text-gray-400">
              Achievements unlocked
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="card">
        <div className="mobile-flex mobile-items-center mobile-justify-between mobile-mb-4">
          <h2 className="mobile-text-lg mobile-font-semibold text-gray-900 dark:text-gray-100">Categories</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mobile-flex mobile-items-center mobile-gap-2 mobile-text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span className="mobile-text-sm">Filters</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="relative mobile-mb-4">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="w-full mobile-flex mobile-items-center mobile-justify-between mobile-p-3 mobile-bg-gray-50 dark:mobile-bg-gray-800 mobile-rounded-lg mobile-border mobile-border-gray-200 dark:mobile-border-gray-700"
          >
            <span className="mobile-text-sm mobile-font-medium text-gray-900 dark:text-gray-100">
              {selectedCategory === 'all' 
                ? 'All Categories' 
                : ACHIEVEMENT_CATEGORIES[selectedCategory as AchievementCategory]?.name
              }
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showCategoryMenu ? 'rotate-90' : ''}`} />
          </button>

          {showCategoryMenu && (
            <div className="absolute top-full left-0 right-0 mobile-mt-1 mobile-bg-white dark:mobile-bg-gray-800 mobile-border mobile-border-gray-200 dark:mobile-border-gray-700 mobile-rounded-lg mobile-shadow-lg mobile-z-10">
              <button
                onClick={() => handleCategorySelect('all')}
                className="w-full mobile-text-left mobile-p-3 mobile-text-sm mobile-font-medium text-gray-900 dark:text-gray-100 hover:mobile-bg-gray-50 dark:hover:mobile-bg-gray-700 mobile-border-b mobile-border-gray-200 dark:mobile-border-gray-700"
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
                    className="w-full mobile-text-left mobile-p-3 mobile-text-sm mobile-font-medium text-gray-900 dark:text-gray-100 hover:mobile-bg-gray-50 dark:hover:mobile-bg-gray-700 mobile-flex mobile-items-center mobile-gap-2 mobile-border-b mobile-border-gray-200 dark:mobile-border-gray-700 last:mobile-border-b-0"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{config.name}</span>
                    <span className="mobile-text-xs mobile-opacity-75">({unlocked}/{total})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mobile-border-t mobile-border-gray-200 dark:mobile-border-gray-700 mobile-pt-4">
            <div className="mobile-space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full mobile-pl-10 mobile-pr-4 mobile-py-2 mobile-border mobile-border-gray-300 dark:mobile-border-gray-600 mobile-rounded-lg mobile-bg-white dark:mobile-bg-gray-800 mobile-text-gray-900 dark:mobile-text-gray-100 focus:mobile-ring-2 focus:mobile-ring-blue-500 focus:mobile-border-transparent mobile-text-sm"
                />
              </div>

              {/* Tier Filter */}
              <select
                value={filter.tier || ''}
                onChange={(e) => handleFilterChange({ tier: e.target.value as any || undefined })}
                className="w-full mobile-px-3 mobile-py-2 mobile-border mobile-border-gray-300 dark:mobile-border-gray-600 mobile-rounded-lg mobile-bg-white dark:mobile-bg-gray-800 mobile-text-gray-900 dark:mobile-text-gray-100 focus:mobile-ring-2 focus:mobile-ring-blue-500 focus:mobile-border-transparent mobile-text-sm"
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
                className="w-full mobile-px-3 mobile-py-2 mobile-border mobile-border-gray-300 dark:mobile-border-gray-600 mobile-rounded-lg mobile-bg-white dark:mobile-bg-gray-800 mobile-text-gray-900 dark:mobile-text-gray-100 focus:mobile-ring-2 focus:mobile-ring-blue-500 focus:mobile-border-transparent mobile-text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Unlocked</option>
                <option value="false">Locked</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Achievements List */}
      <div className="mobile-space-y-3">
        <h2 className="mobile-text-lg mobile-font-semibold text-gray-900 dark:text-gray-100">
          {selectedCategory === 'all' ? 'All Achievements' : ACHIEVEMENT_CATEGORIES[selectedCategory as AchievementCategory]?.name}
        </h2>
        
        {searchFilteredAchievements.length === 0 ? (
          <div className="card mobile-text-center mobile-py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="mobile-text-sm mobile-font-semibold text-gray-900 dark:text-gray-100 mb-2">No Achievements Found</h3>
            <p className="mobile-text-xs mobile-text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <div className="mobile-space-y-3">
            {searchFilteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                progress={achievement.progress || 0}
                className="mobile-scale-100"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAchievementsTab;
