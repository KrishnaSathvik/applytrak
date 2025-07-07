import React, { useEffect } from 'react';
import { Award, Calendar, Target, TrendingUp, Star, Zap, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const GoalTracker: React.FC = () => {
    const { goals, progress, goalProgress, openGoalModal, calculateProgress } = useAppStore();

    // Force progress calculation on mount and when applications change
    useEffect(() => {
        calculateProgress();
    }, [calculateProgress]);

    // Use goalProgress as primary source, fallback to progress for compatibility
    const currentProgress = goalProgress || progress;

    const progressItems = [
        {
            label: 'Total Goal',
            current: currentProgress.totalApplications,
            target: goals.totalGoal,
            percentage: Math.round(currentProgress.totalProgress),
            color: 'from-primary-500 via-primary-600 to-secondary-500',
            lightColor: 'from-primary-100 to-primary-200',
            darkColor: 'from-primary-900 to-primary-800',
            icon: Target,
            description: 'Overall progress towards your total application goal',
            shortDesc: 'Total progress'
        },
        {
            label: 'Weekly Goal',
            current: currentProgress.weeklyApplications,
            target: goals.weeklyGoal,
            percentage: Math.round(currentProgress.weeklyProgress),
            color: 'from-blue-500 via-blue-600 to-cyan-500',
            lightColor: 'from-blue-100 to-cyan-200',
            darkColor: 'from-blue-900 to-cyan-800',
            icon: Calendar,
            description: 'Applications submitted this week',
            shortDesc: 'This week'
        },
        {
            label: 'Monthly Goal',
            current: currentProgress.monthlyApplications,
            target: goals.monthlyGoal,
            percentage: Math.round(currentProgress.monthlyProgress),
            color: 'from-purple-500 via-purple-600 to-pink-500',
            lightColor: 'from-purple-100 to-pink-200',
            darkColor: 'from-purple-900 to-pink-800',
            icon: Award,
            description: 'Applications submitted this month',
            shortDesc: 'This month'
        }
    ];

    const getMilestoneIcon = (percentage: number) => {
        if (percentage >= 100) return Trophy;
        if (percentage >= 75) return Star;
        if (percentage >= 50) return Zap;
        return Target;
    };

    const getMilestoneColor = (percentage: number) => {
        if (percentage >= 100) return 'text-yellow-500';
        if (percentage >= 75) return 'text-purple-500';
        if (percentage >= 50) return 'text-blue-500';
        return 'text-gray-500';
    };

    const getMilestoneMessage = (percentage: number, label: string) => {
        if (percentage >= 100) return `🎉 ${label} completed!`;
        if (percentage >= 90) return `Almost there! ${100 - percentage}% to go`;
        if (percentage >= 75) return `Great progress! Keep it up`;
        if (percentage >= 50) return `Halfway there! 💪`;
        if (percentage >= 25) return `Good start! 📈`;
        return `Let's get started! 🚀`;
    };

    // Mobile-specific shorter milestone messages
    const getMobileMessage = (percentage: number) => {
        if (percentage >= 100) return `🎉 Completed!`;
        if (percentage >= 90) return `Almost there!`;
        if (percentage >= 75) return `Great progress!`;
        if (percentage >= 50) return `Halfway! 💪`;
        if (percentage >= 25) return `Good start! 📈`;
        return `Let's go! 🚀`;
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Card - MOBILE RESPONSIVE */}
            <div className="glass-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                            <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gradient">
                                Application Goals
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                Track your job application progress
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openGoalModal}
                        className="btn btn-primary w-full sm:w-auto"
                    >
                        <Target className="h-4 w-4 mr-2" />
                        Set Goals
                    </button>
                </div>

                {/* Progress Grid - MOBILE RESPONSIVE: Stack on mobile, 3 columns on tablet+ */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
                    {progressItems.map((item) => {
                        const Icon = item.icon;
                        const MilestoneIcon = getMilestoneIcon(item.percentage);
                        const isCompleted = item.percentage >= 100;
                        const isNearCompletion = item.percentage >= 90;

                        return (
                            <div
                                key={item.label}
                                className={`glass-card space-y-3 sm:space-y-4 transition-all duration-500 ${
                                    isCompleted
                                        ? 'animate-pulse-glow border-l-yellow-500 shadow-glow'
                                        : isNearCompletion
                                            ? 'border-l-orange-500'
                                            : 'border-l-primary-500'
                                }`}
                            >
                                {/* Header - MOBILE OPTIMIZED */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                        <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-r ${item.lightColor} dark:${item.darkColor} flex-shrink-0`}>
                                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                                                {item.label}
                                            </h3>
                                            {/* Show different descriptions based on screen size */}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate sm:hidden">
                                                {item.shortDesc}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center space-x-1">
                                            <MilestoneIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${getMilestoneColor(item.percentage)}`} />
                                            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar - MOBILE FRIENDLY HEIGHT */}
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out rounded-full`}
                                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    />
                                </div>

                                {/* Stats - MOBILE RESPONSIVE */}
                                <div className="flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            {item.current}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400 mx-1">/</span>
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {item.target}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        <span className="hidden sm:inline">applications</span>
                                        <span className="sm:hidden">apps</span>
                                    </span>
                                </div>

                                {/* Milestone Message - MOBILE RESPONSIVE */}
                                <div className={`text-xs font-medium p-2 rounded-lg ${
                                    isCompleted
                                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/50 dark:to-yellow-800/50 dark:text-yellow-200'
                                        : isNearCompletion
                                            ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/50 dark:to-orange-800/50 dark:text-orange-200'
                                            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-800/50 dark:to-gray-700/50 dark:text-gray-300'
                                }`}>
                                    {/* Show shorter message on mobile */}
                                    <span className="sm:hidden">
                                        {getMobileMessage(item.percentage)}
                                    </span>
                                    <span className="hidden sm:inline">
                                        {getMilestoneMessage(item.percentage, item.label)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Weekly Streak Card - MOBILE RESPONSIVE */}
            {currentProgress.weeklyStreak > 0 && (
                <div className="glass-card bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-l-4 border-l-green-500">
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-gradient">
                                {currentProgress.weeklyStreak} Week Streak! 🔥
                            </div>
                            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                                <span className="hidden sm:inline">You've been consistently meeting your weekly goals</span>
                                <span className="sm:hidden">Consistent weekly progress!</span>
                            </p>
                        </div>
                        <div className="flex space-x-1">
                            {[...Array(Math.min(currentProgress.weeklyStreak, 5))].map((_, i) => (
                                <Star
                                    key={i}
                                    className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current"
                                />
                            ))}
                            {currentProgress.weeklyStreak > 5 && (
                                <span className="text-yellow-500 font-bold text-sm">+{currentProgress.weeklyStreak - 5}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats Summary - MOBILE RESPONSIVE GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="glass-card p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {currentProgress.totalApplications}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="hidden sm:inline">Total Applied</span>
                        <span className="sm:hidden">Total</span>
                    </div>
                </div>
                <div className="glass-card p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currentProgress.weeklyApplications}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">This Week</div>
                </div>
                <div className="glass-card p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {currentProgress.monthlyApplications}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">This Month</div>
                </div>
                <div className="glass-card p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        {currentProgress.weeklyStreak}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="hidden sm:inline">Week Streak</span>
                        <span className="sm:hidden">Streak</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoalTracker;