// src/components/achievements/AchievementCard.tsx - Achievement Card Component
import React from 'react';
import { 
  Lock,
  Unlock,
  Star
} from 'lucide-react';
import { Achievement } from '../../types/achievements';
import { ACHIEVEMENT_TIERS, ACHIEVEMENT_RARITY } from '../../types/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  progress?: number;
  onClick?: () => void;
  className?: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress = 0,
  onClick,
  className = ''
}) => {

  const tierConfig = ACHIEVEMENT_TIERS[achievement.tier];
  const rarityConfig = ACHIEVEMENT_RARITY[achievement.rarity];

  return (
    <div 
      className={`glass-card cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
        achievement.unlocked 
          ? 'border-2 border-green-300 dark:border-green-600 bg-green-100/80 dark:bg-green-900/30' 
          : 'border-2 border-gray-200 dark:border-gray-700'
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between p-4">
        {/* Left side - Icon and Info */}
        <div className="flex items-center space-x-4">
          {/* Achievement Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            achievement.unlocked 
              ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <div className={`${achievement.unlocked ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {achievement.unlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
          </div>

          {/* Achievement Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`font-semibold ${
                achievement.unlocked 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {achievement.name}
              </h3>
              
              {/* Tier Badge */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                achievement.unlocked 
                  ? `${tierConfig.textColor} bg-opacity-20` 
                  : 'text-gray-400 bg-gray-100 dark:bg-gray-700'
              }`}>
                {tierConfig.name}
              </span>
            </div>
            
            <p className={`text-sm ${
              achievement.unlocked 
                ? 'text-gray-600 dark:text-gray-300' 
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              {achievement.description}
            </p>

            {/* Progress Bar (for locked achievements) */}
            {!achievement.unlocked && progress > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${tierConfig.bgColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Status and XP */}
        <div className="text-right">
          {achievement.unlocked ? (
            <div className="space-y-1">
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                ✓ Unlocked
              </span>
              {achievement.unlockedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  +{achievement.xpReward} XP
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-gray-400 dark:text-gray-500 text-sm">
                Locked
              </span>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  +{achievement.xpReward} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rarity indicator */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
        achievement.unlocked 
          ? rarityConfig.bgColor.replace('from-', 'bg-').replace(' to-', '')
          : 'bg-gray-300 dark:bg-gray-600'
      }`} />
    </div>
  );
};

export default AchievementCard;
