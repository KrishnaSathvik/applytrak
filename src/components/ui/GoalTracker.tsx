import React, {useEffect, useMemo} from 'react';
import {Award, Calendar, Star, Target, TrendingUp, Trophy, Zap} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

// Constants for better maintainability
const PROGRESS_THRESHOLDS = {
    COMPLETED: 100,
    NEAR_COMPLETION: 90,
    GREAT_PROGRESS: 75,
    HALFWAY: 50,
    GOOD_START: 25,
} as const;

const MAX_STREAK_STARS = 5;

// Type definitions for better type safety
interface ProgressItem {
    label: string;
    current: number;
    target: number;
    percentage: number;
    color: string;
    lightColor: string;
    darkColor: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    shortDesc: string;
}

interface MilestoneConfig {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    message: string;
    mobileMessage: string;
}

const GoalTracker: React.FC = () => {
    const {goals, goalProgress, openGoalModal, calculateProgress} = useAppStore();

    // Force progress calculation on mount and when applications change
    useEffect(() => {
        calculateProgress();
    }, [calculateProgress]);

    // Memoized progress items for better performance
    const progressItems: ProgressItem[] = useMemo(() => [
        {
            label: 'Total Goal',
            current: goalProgress.totalApplications,
            target: goals.totalGoal,
            percentage: Math.round(goalProgress.totalProgress),
            color: 'from-primary-500 via-primary-600 to-secondary-500',
            lightColor: 'from-primary-100 to-primary-200',
            darkColor: 'from-primary-900 to-primary-800',
            icon: Target,
            description: 'Overall progress towards your total application goal',
            shortDesc: 'Total progress'
        },
        {
            label: 'Weekly Goal',
            current: goalProgress.weeklyApplications,
            target: goals.weeklyGoal,
            percentage: Math.round(goalProgress.weeklyProgress),
            color: 'from-blue-500 via-blue-600 to-cyan-500',
            lightColor: 'from-blue-100 to-cyan-200',
            darkColor: 'from-blue-900 to-cyan-800',
            icon: Calendar,
            description: 'Applications submitted this week',
            shortDesc: 'This week'
        },
        {
            label: 'Monthly Goal',
            current: goalProgress.monthlyApplications,
            target: goals.monthlyGoal,
            percentage: Math.round(goalProgress.monthlyProgress),
            color: 'from-purple-500 via-purple-600 to-pink-500',
            lightColor: 'from-purple-100 to-pink-200',
            darkColor: 'from-purple-900 to-pink-800',
            icon: Award,
            description: 'Applications submitted this month',
            shortDesc: 'This month'
        }
    ], [goalProgress, goals]);

    // Utility functions for milestone management
    const getMilestoneConfig = (percentage: number, label: string): MilestoneConfig => {
        if (percentage >= PROGRESS_THRESHOLDS.COMPLETED) {
            return {
                icon: Trophy,
                color: 'text-yellow-500',
                message: `🎉 ${label} completed!`,
                mobileMessage: '🎉 Completed!'
            };
        }
        if (percentage >= PROGRESS_THRESHOLDS.NEAR_COMPLETION) {
            return {
                icon: Star,
                color: 'text-purple-500',
                message: `Almost there! ${PROGRESS_THRESHOLDS.COMPLETED - percentage}% to go`,
                mobileMessage: 'Almost there!'
            };
        }
        if (percentage >= PROGRESS_THRESHOLDS.GREAT_PROGRESS) {
            return {
                icon: Star,
                color: 'text-purple-500',
                message: 'Great progress! Keep it up',
                mobileMessage: 'Great progress!'
            };
        }
        if (percentage >= PROGRESS_THRESHOLDS.HALFWAY) {
            return {
                icon: Zap,
                color: 'text-blue-500',
                message: 'Halfway there! 💪',
                mobileMessage: 'Halfway! 💪'
            };
        }
        if (percentage >= PROGRESS_THRESHOLDS.GOOD_START) {
            return {
                icon: Target,
                color: 'text-gray-500',
                message: 'Good start! 📈',
                mobileMessage: 'Good start! 📈'
            };
        }
        return {
            icon: Target,
            color: 'text-gray-500',
            message: "Let's get started! 🚀",
            mobileMessage: "Let's go! 🚀"
        };
    };

    // Utility function for progress card styling
    const getProgressCardStyles = (percentage: number): string => {
        const baseStyles = 'glass-card space-y-3 sm:space-y-4 transition-all duration-500 hover:shadow-lg transform hover:scale-102';

        if (percentage >= PROGRESS_THRESHOLDS.COMPLETED) {
            return `${baseStyles} animate-pulse-glow border-l-4 border-l-yellow-500 shadow-glow bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20`;
        }
        if (percentage >= PROGRESS_THRESHOLDS.NEAR_COMPLETION) {
            return `${baseStyles} border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20`;
        }
        return `${baseStyles} border-l-4 border-l-primary-500 bg-gradient-to-br from-primary-50/30 to-secondary-50/30 dark:from-primary-900/10 dark:to-secondary-900/10`;
    };

    // Utility function for milestone message styling
    const getMilestoneMessageStyles = (isCompleted: boolean, isNearCompletion: boolean): string => {
        const baseStyles = 'text-xs font-bold p-2 rounded-lg tracking-wide shadow-sm';

        if (isCompleted) {
            return `${baseStyles} bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/50 dark:to-yellow-800/50 dark:text-yellow-200 border border-yellow-300/50`;
        }
        if (isNearCompletion) {
            return `${baseStyles} bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/50 dark:to-orange-800/50 dark:text-orange-200 border border-orange-300/50`;
        }
        return `${baseStyles} bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-800/50 dark:to-gray-700/50 dark:text-gray-300 border border-gray-300/50 dark:border-gray-600/50`;
    };

    // Render streak stars component
    const renderStreakStars = (streakCount: number) => (
        <div className="flex space-x-1">
            {[...Array(Math.min(streakCount, MAX_STREAK_STARS))].map((_, index) => (
                <Star
                    key={index}
                    className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current drop-shadow-sm"
                />
            ))}
            {streakCount > MAX_STREAK_STARS && (
                <span className="text-yellow-500 font-extrabold text-sm drop-shadow-sm">
          +{streakCount - MAX_STREAK_STARS}
        </span>
            )}
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Card */}
            <header className="glass-card relative overflow-hidden">
                {/* Background gradient */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-primary-600/15 to-secondary-500/20 dark:from-primary-400/30 dark:via-primary-500/25 dark:to-secondary-400/30"/>

                {/* Content */}
                <div className="relative z-10">
                    <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
                        <div className="flex items-center space-x-3">
                            <div
                                className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
                                <Target className="h-5 w-5 sm:h-6 sm:w-6"/>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                  <span
                      className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-primary-300 dark:to-secondary-400">
                    Application Goals
                  </span>
                                </h1>
                                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 leading-relaxed mt-1">
                                    Define your job search targets and track your progress
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={openGoalModal}
                            className="btn btn-primary w-full sm:w-auto font-bold tracking-wide shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            aria-label="Open goal settings modal"
                        >
                            <Target className="h-4 w-4 mr-2"/>
                            <span className="font-bold tracking-wide">Set Goals</span>
                        </button>
                    </div>

                    {/* Progress Grid */}
                    <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
                        {progressItems.map((item) => {
                            const Icon = item.icon;
                            const milestoneConfig = getMilestoneConfig(item.percentage, item.label);
                            const MilestoneIcon = milestoneConfig.icon;
                            const isCompleted = item.percentage >= PROGRESS_THRESHOLDS.COMPLETED;
                            const isNearCompletion = item.percentage >= PROGRESS_THRESHOLDS.NEAR_COMPLETION;

                            return (
                                <article
                                    key={item.label}
                                    className={getProgressCardStyles(item.percentage)}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                            <div
                                                className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-r ${item.lightColor} dark:bg-gradient-to-r dark:${item.darkColor} flex-shrink-0 shadow-sm`}>
                                                <Icon
                                                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300"/>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h2 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate tracking-wide">
                                                    {item.label}
                                                </h2>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate sm:hidden tracking-wide">
                                                    {item.shortDesc}
                                                </p>
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:block leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="flex items-center space-x-1">
                                                <MilestoneIcon
                                                    className={`h-3 w-3 sm:h-4 sm:w-4 ${milestoneConfig.color} drop-shadow-sm`}/>
                                                <span className="text-lg sm:text-xl font-extrabold text-gradient-blue">
                          {item.percentage}%
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div
                                        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out rounded-full shadow-sm`}
                                            style={{width: `${Math.min(item.percentage, 100)}%`}}
                                            role="progressbar"
                                            aria-valuenow={item.percentage}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`${item.label} progress: ${item.percentage}%`}
                                        />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm">
                      <span className="font-extrabold text-lg text-gradient-static">
                        {item.current}
                      </span>
                                            <span className="text-gray-500 dark:text-gray-400 mx-1 font-medium">/</span>
                                            <span className="text-gray-600 dark:text-gray-400 font-bold">
                        {item.target}
                      </span>
                                        </div>
                                        <span
                                            className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                      <span className="hidden sm:inline">applications</span>
                      <span className="sm:hidden">apps</span>
                    </span>
                                    </div>

                                    {/* Milestone Message */}
                                    <div className={getMilestoneMessageStyles(isCompleted, isNearCompletion)}>
                    <span className="sm:hidden">
                      {milestoneConfig.mobileMessage}
                    </span>
                                        <span className="hidden sm:inline">
                      {milestoneConfig.message}
                    </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Weekly Streak Card */}
            {goalProgress.weeklyStreak > 0 && (
                <section
                    className="glass-card bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div
                        className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <div
                            className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6"/>
                        </div>
                        <div className="text-center">
                            <div className="text-xl sm:text-3xl font-extrabold text-gradient-static">
                                {goalProgress.weeklyStreak} Week Streak! 🔥
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300 mt-1 leading-relaxed tracking-wide">
                                <span
                                    className="hidden sm:inline">You've been consistently meeting your weekly goals</span>
                                <span className="sm:hidden">Consistent weekly progress!</span>
                            </p>
                        </div>
                        {renderStreakStars(goalProgress.weeklyStreak)}
                    </div>
                </section>
            )}

            {/* Quick Stats Summary */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div
                    className="glass-card p-3 sm:p-4 text-center hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-gradient-to-br from-primary-50/30 to-secondary-50/30 dark:from-primary-900/10 dark:to-secondary-900/10">
                    <div className="text-2xl sm:text-4xl font-extrabold text-gradient-static mb-1">
                        {goalProgress.totalApplications}
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">
                        <span className="hidden sm:inline">Total Applied</span>
                        <span className="sm:hidden">Total</span>
                    </div>
                </div>

                <div
                    className="glass-card p-3 sm:p-4 text-center hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-900/10 dark:to-cyan-900/10">
                    <div className="text-2xl sm:text-4xl font-extrabold text-gradient-blue mb-1">
                        {goalProgress.weeklyApplications}
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">
                        This Week
                    </div>
                </div>

                <div
                    className="glass-card p-3 sm:p-4 text-center hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10">
                    <div className="text-2xl sm:text-4xl font-extrabold text-gradient-purple mb-1">
                        {goalProgress.monthlyApplications}
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">
                        This Month
                    </div>
                </div>

                <div
                    className="glass-card p-3 sm:p-4 text-center hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/10">
                    <div className="text-2xl sm:text-4xl font-extrabold text-green-600 dark:text-green-400 mb-1">
                        {goalProgress.weeklyStreak}
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">
                        <span className="hidden sm:inline">Week Streak</span>
                        <span className="sm:hidden">Streak</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GoalTracker;