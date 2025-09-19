// src/components/achievements/AchievementProgress.tsx - Achievement Progress Component
import React from 'react';
import { Achievement } from '../../types/achievements';
import { ACHIEVEMENT_TIERS } from '../../types/achievements';

interface AchievementProgressProps {
  achievement: Achievement;
  progress: number;
  className?: string;
}

const AchievementProgress: React.FC<AchievementProgressProps> = ({
  achievement,
  progress,
  className = ''
}) => {
  const tierConfig = ACHIEVEMENT_TIERS[achievement.tier];
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${tierConfig.bgColor} shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Progress Details */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {achievement.requirements[0]?.description || 'Complete requirements'}
        </span>
        <span>
          {achievement.xpReward} XP
        </span>
      </div>
    </div>
  );
};

export default AchievementProgress;
