// src/components/achievements/AchievementBadge.tsx - Achievement Badge Component
import React from 'react';
import { AchievementTier, AchievementRarity } from '../../types/achievements';
import { ACHIEVEMENT_TIERS, ACHIEVEMENT_RARITY } from '../../types/achievements';

interface AchievementBadgeProps {
  tier: AchievementTier;
  rarity: AchievementRarity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  tier,
  rarity,
  size = 'md',
  className = ''
}) => {
  const tierConfig = ACHIEVEMENT_TIERS[tier];
  const rarityConfig = ACHIEVEMENT_RARITY[rarity];

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main badge */}
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
        rarityConfig.bgColor
      }`}>
        {tierConfig.name.charAt(0)}
      </div>
      
      {/* Rarity glow effect */}
      <div className={`absolute inset-0 rounded-full ${rarityConfig.glowColor} opacity-50 blur-sm`} />
    </div>
  );
};

export default AchievementBadge;
