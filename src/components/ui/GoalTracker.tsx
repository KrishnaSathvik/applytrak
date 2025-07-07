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
            description: 'Overall progress towards your total application goal'
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
            description: 'Applications submitted this week'
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
            description: 'Applications submitted this month'
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

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="goal-card">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                            <Target className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gradient">
                                Application Goals
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Track your job application progress
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openGoalModal}
                        className="btn btn-primary btn-md hover:shadow-glow"
                    >
                        <Target className="h-4 w-4 mr-2" />
                        Set Goals
                    </button>
                </div>

                {/* Progress Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {progressItems.map((item) => {
                        const Icon = item.icon;
                        const MilestoneIcon = getMilestoneIcon(item.percentage);
                        const isCompleted = item.percentage >= 100;
                        const isNearCompletion = item.percentage >= 90;

                        return (
                            <div
                                key={item.label}
                                className={`glass-card space-y-4 transition-all duration-500 ${
                                    isCompleted
                                        ? 'animate-pulse-glow border-l-yellow-500 shadow-glow'
                                        : isNearCompletion
                                            ? 'border-l-orange-500'
                                            : 'border-l-primary-500'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg bg-gradient-to-r ${item.lightColor} dark:${item.darkColor}`}>
                                            <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                {item.label}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center space-x-1">
                                            <MilestoneIcon className={`h-4 w-4 ${getMilestoneColor(item.percentage)}`} />
                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="progress-container">
                                    <div
                                        className={`progress-bar bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out`}
                                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    />
                                </div>

                                {/* Stats */}
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
                                        applications
                                    </span>
                                </div>

                                {/* Milestone Message */}
                                <div className={`text-xs font-medium p-2 rounded-lg ${
                                    isCompleted
                                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/50 dark:to-yellow-800/50 dark:text-yellow-200'
                                        : isNearCompletion
                                            ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/50 dark:to-orange-800/50 dark:text-orange-200'
                                            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-800/50 dark:to-gray-700/50 dark:text-gray-300'
                                }`}>
                                    {getMilestoneMessage(item.percentage, item.label)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Weekly Streak Card */}
            {currentProgress.weeklyStreak > 0 && (
                <div className="goal-card bg-gradient-to-r from-success-50/80 to-success-100/80 dark:from-success-900/30 dark:to-success-800/30 border-l-4 border-l-success-500 animate-bounce-gentle">
                    <div className="flex items-center justify-center space-x-3">
                        <div className="p-3 rounded-full bg-gradient-to-r from-success-500 to-success-600 text-white animate-pulse-glow">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gradient-success">
                                {currentProgress.weeklyStreak} Week Streak! 🔥
                            </div>
                            <p className="text-sm text-success-700 dark:text-success-300 mt-1">
                                You've been consistently meeting your weekly goals
                            </p>
                        </div>
                        <div className="flex space-x-1">
                            {[...Array(Math.min(currentProgress.weeklyStreak, 5))].map((_, i) => (
                                <Star
                                    key={i}
                                    className="h-5 w-5 text-yellow-500 fill-current animate-bounce"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                            {currentProgress.weeklyStreak > 5 && (
                                <span className="text-yellow-500 font-bold">+{currentProgress.weeklyStreak - 5}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-subtle rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {currentProgress.totalApplications}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Applied</div>
                </div>
                <div className="glass-subtle rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currentProgress.weeklyApplications}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">This Week</div>
                </div>
                <div className="glass-subtle rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {currentProgress.monthlyApplications}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">This Month</div>
                </div>
                <div className="glass-subtle rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                        {currentProgress.weeklyStreak}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Week Streak</div>
                </div>
            </div>
        </div>
    );
};

export default GoalTracker;