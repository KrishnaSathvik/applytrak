// src/components/modals/GoalModal.tsx - COMPLETELY FIXED - NO LIMITS
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Save, Target, TrendingUp, X, Sparkles, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GoalFormData } from '../../types';

// FIXED: Removed restrictive limits - Allow any reasonable goals
const schema = yup.object({
    totalGoal: yup.number()
        .min(1, 'Must be at least 1')
        .max(10000, 'Must be less than 10,000') // Increased from 1000
        .required('Total goal is required'),
    weeklyGoal: yup.number()
        .min(1, 'Must be at least 1')
        .max(500, 'Must be less than 500') // Increased from 50
        .required('Weekly goal is required'),
    monthlyGoal: yup.number()
        .min(1, 'Must be at least 1')
        .max(2000, 'Must be less than 2,000') // FIXED: Increased from 200 to 2000
        .required('Monthly goal is required')
});

const GoalModal: React.FC = () => {
    const { modals, goals, closeGoalModal, updateGoals, ui } = useAppStore();
    const { goalSetting } = modals;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<GoalFormData>({
        resolver: yupResolver(schema),
        defaultValues: {
            totalGoal: goals.totalGoal,
            weeklyGoal: goals.weeklyGoal,
            monthlyGoal: goals.monthlyGoal
        }
    });

    const watchedValues = watch();

    // Initialize form when modal opens
    useEffect(() => {
        if (goalSetting.isOpen) {
            setValue('totalGoal', goals.totalGoal);
            setValue('weeklyGoal', goals.weeklyGoal);
            setValue('monthlyGoal', goals.monthlyGoal);
        }
    }, [goalSetting.isOpen, goals, setValue]);

    const onSubmit = async (data: GoalFormData) => {
        try {
            await updateGoals(data);
            closeGoalModal();
            reset();
        } catch (error) {
            console.error('Error updating goals:', error);
        }
    };

    // Calculate estimated timelines
    const calculateTimelines = () => {
        const { totalGoal, weeklyGoal, monthlyGoal } = watchedValues;

        const weeksToTotal = totalGoal && weeklyGoal ? Math.ceil(totalGoal / weeklyGoal) : 0;
        const monthsToTotal = totalGoal && monthlyGoal ? Math.ceil(totalGoal / monthlyGoal) : 0;

        return {
            weeksToTotal,
            monthsToTotal,
            daysToWeekly: weeklyGoal ? Math.ceil(weeklyGoal / 1) : 0,
            weeksToMonthly: monthlyGoal && weeklyGoal ? Math.ceil(monthlyGoal / weeklyGoal) : 0
        };
    };

    const timelines = calculateTimelines();

    if (!goalSetting.isOpen) return null;

    return (
        <div className="modal-overlay" onClick={closeGoalModal}>
            <div className="modal-content max-w-4xl bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-gray-900/95 dark:to-blue-950/95" onClick={(e) => e.stopPropagation()}>
                {/* Enhanced Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 text-white px-8 py-6 -mx-6 -mt-6 mb-8 rounded-t-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="glass rounded-xl p-3 bg-white/10">
                                <Target className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    Set Application Goals
                                    <Sparkles className="h-5 w-5 text-yellow-300" />
                                </h2>
                                <p className="text-primary-100 mt-1">
                                    Define your job search targets and track your progress
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeGoalModal}
                            className="glass rounded-xl p-2 hover:bg-white/20 transition-all duration-200 group"
                            aria-label="Close modal"
                        >
                            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Enhanced Goal Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Total Goal */}
                        <div className="space-y-4">
                            <div className="glass-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-200/30 dark:border-green-700/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="glass rounded-lg p-2 bg-green-500/20">
                                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <label className="form-label text-lg font-semibold text-green-700 dark:text-green-300">
                                        Total Application Goal
                                    </label>
                                </div>

                                <input
                                    {...register('totalGoal')}
                                    type="number"
                                    min="1"
                                    max="10000"
                                    className={`form-input text-xl font-bold text-center ${
                                        errors.totalGoal ? 'border-red-500' : 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                                    }`}
                                    placeholder="500"
                                />
                                {errors.totalGoal && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        ⚠️ {errors.totalGoal.message}
                                    </p>
                                )}

                                {timelines.weeksToTotal > 0 && (
                                    <div className="mt-4 glass rounded-lg p-4 bg-green-50/50 dark:bg-green-900/20">
                                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">📅 Timeline Estimate</p>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                ~{timelines.weeksToTotal} weeks
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                ~{timelines.monthsToTotal} months
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Goal */}
                        <div className="space-y-4">
                            <div className="glass-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-200/30 dark:border-blue-700/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="glass rounded-lg p-2 bg-blue-500/20">
                                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <label className="form-label text-lg font-semibold text-blue-700 dark:text-blue-300">
                                        Weekly Goal
                                    </label>
                                </div>

                                <input
                                    {...register('weeklyGoal')}
                                    type="number"
                                    min="1"
                                    max="500"
                                    className={`form-input text-xl font-bold text-center ${
                                        errors.weeklyGoal ? 'border-red-500' : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20'
                                    }`}
                                    placeholder="20"
                                />
                                {errors.weeklyGoal && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        ⚠️ {errors.weeklyGoal.message}
                                    </p>
                                )}

                                {watchedValues.weeklyGoal && (
                                    <div className="mt-4 glass rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/20">
                                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">📊 Daily Breakdown</p>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                ~{Math.ceil(watchedValues.weeklyGoal / 7)} per day
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                (spread across 7 days)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Goal - FIXED: No more 200 limit */}
                        <div className="space-y-4">
                            <div className="glass-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-200/30 dark:border-purple-700/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="glass rounded-lg p-2 bg-purple-500/20">
                                        <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <label className="form-label text-lg font-semibold text-purple-700 dark:text-purple-300">
                                        Monthly Goal
                                    </label>
                                </div>

                                <input
                                    {...register('monthlyGoal')}
                                    type="number"
                                    min="1"
                                    max="2000" // FIXED: Increased limit to 2000
                                    className={`form-input text-xl font-bold text-center ${
                                        errors.monthlyGoal ? 'border-red-500' : 'border-purple-300 focus:border-purple-500 focus:ring-purple-500/20'
                                    }`}
                                    placeholder="500" // FIXED: Increased placeholder
                                />
                                {errors.monthlyGoal && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        ⚠️ {errors.monthlyGoal.message}
                                    </p>
                                )}

                                {timelines.weeksToMonthly > 0 && (
                                    <div className="mt-4 glass rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/20">
                                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">📈 Weekly Pace</p>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                ~{timelines.weeksToMonthly} weeks
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                to reach monthly goal
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Goal Tips */}
                    <div className="glass-card bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border-2 border-indigo-200/30 dark:border-indigo-700/30">
                        <div className="flex items-start space-x-4">
                            <div className="glass rounded-xl p-3 bg-indigo-500/20">
                                <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    🎯 Goal Setting Pro Tips
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 font-bold">✓</span>
                                            Set realistic goals based on your availability
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 font-bold">✓</span>
                                            Weekly goals help maintain consistent momentum
                                        </li>
                                    </ul>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500 font-bold">✓</span>
                                            Monthly goals provide broader accountability
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-orange-500 font-bold">✓</span>
                                            Adjust goals as you learn your optimal pace
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Validation Summary */}
                    {watchedValues.weeklyGoal && watchedValues.monthlyGoal && (
                        <div className="glass-card">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                🔍 Goal Validation
                            </h4>
                            <div className="space-y-3">
                                {watchedValues.weeklyGoal * 4 > watchedValues.monthlyGoal && (
                                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-300/30">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                                Weekly goal may exceed monthly goal
                                            </p>
                                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                                {watchedValues.weeklyGoal * 4} weekly vs {watchedValues.monthlyGoal} monthly
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {watchedValues.weeklyGoal * 4 <= watchedValues.monthlyGoal && (
                                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300/30">
                                        <span className="text-2xl">✅</span>
                                        <div>
                                            <p className="font-medium text-green-800 dark:text-green-200">
                                                Goals are perfectly balanced!
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                Your weekly and monthly targets align well
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Enhanced Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button
                            type="button"
                            onClick={closeGoalModal}
                            className="btn btn-secondary btn-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || ui.isLoading}
                            className="btn btn-primary btn-lg group relative overflow-hidden"
                        >
                            {isSubmitting || ui.isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                    Saving Goals...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                                    Save Goals
                                    <Sparkles className="h-4 w-4 ml-2 group-hover:rotate-12 transition-transform duration-200" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalModal;