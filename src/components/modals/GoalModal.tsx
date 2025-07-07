// src/components/modals/GoalModal.tsx - FIXED HEADER TEXT VISIBILITY
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Save, Target, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GoalFormData } from '../../types';

const schema = yup.object({
    totalGoal: yup.number()
        .min(1, 'Must be at least 1')
        .max(10000, 'Must be less than 10,000')
        .required('Total goal is required'),
    weeklyGoal: yup.number()
        .min(1, 'Must be at least 1')
        .max(500, 'Must be less than 500')
        .required('Weekly goal is required'),
    monthlyGoal: yup.number()
        .min(1, 'Must be at least 1')
        .max(2000, 'Must be less than 2,000')
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
            daysToWeekly: weeklyGoal ? Math.ceil(weeklyGoal / 7) : 0,
            weeksToMonthly: monthlyGoal && weeklyGoal ? Math.ceil(monthlyGoal / weeklyGoal) : 0
        };
    };

    const timelines = calculateTimelines();

    if (!goalSetting.isOpen) return null;

    return (
        <div className="modal-overlay" onClick={closeGoalModal}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
                {/* FIXED Header - Enhanced Visibility */}
                <div className="card-header relative overflow-hidden">
                    {/* Background overlay for better contrast */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 via-primary-500/90 to-secondary-600/90 backdrop-blur-sm"></div>

                    {/* Content with enhanced visibility */}
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                                <Target className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                            <div>
                                {/* FIXED: Perfect text visibility with multiple contrast methods */}
                                <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
                                    Set Application Goals
                                </h2>
                                <p className="text-white/95 font-semibold mt-1 leading-relaxed drop-shadow-md text-shadow-lg tracking-wide">
                                    Define your job search targets and track your progress
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeGoalModal}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold tracking-wide transition-all duration-200 hover:scale-105"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4 drop-shadow-lg" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Enhanced Goal Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Goal */}
                        <div className="space-y-3">
                            <label className="form-label-enhanced">
                                Total Application Goal
                            </label>
                            <input
                                {...register('totalGoal')}
                                type="number"
                                min="1"
                                max="10000"
                                className={`form-input-enhanced ${
                                    errors.totalGoal ? 'border-red-500' : ''
                                }`}
                                placeholder="100"
                            />
                            {errors.totalGoal && (
                                <p className="form-error">
                                    {errors.totalGoal.message}
                                </p>
                            )}

                            {timelines.weeksToTotal > 0 && (
                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 space-y-1">
                                    <p className="flex items-center justify-between">
                                        <span>≈ <span className="font-bold text-gradient-blue">{timelines.weeksToTotal}</span> weeks</span>
                                    </p>
                                    <p className="flex items-center justify-between">
                                        <span>≈ <span className="font-bold text-gradient-purple">{timelines.monthsToTotal}</span> months</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Weekly Goal */}
                        <div className="space-y-3">
                            <label className="form-label-enhanced">
                                Weekly Goal
                            </label>
                            <input
                                {...register('weeklyGoal')}
                                type="number"
                                min="1"
                                max="500"
                                className={`form-input-enhanced ${
                                    errors.weeklyGoal ? 'border-red-500' : ''
                                }`}
                                placeholder="5"
                            />
                            {errors.weeklyGoal && (
                                <p className="form-error">
                                    {errors.weeklyGoal.message}
                                </p>
                            )}

                            {watchedValues.weeklyGoal && (
                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                    <p>≈ <span className="font-bold text-gradient-blue">{timelines.daysToWeekly}</span> per day</p>
                                </div>
                            )}
                        </div>

                        {/* Monthly Goal */}
                        <div className="space-y-3">
                            <label className="form-label-enhanced">
                                Monthly Goal
                            </label>
                            <input
                                {...register('monthlyGoal')}
                                type="number"
                                min="1"
                                max="2000"
                                className={`form-input-enhanced ${
                                    errors.monthlyGoal ? 'border-red-500' : ''
                                }`}
                                placeholder="20"
                            />
                            {errors.monthlyGoal && (
                                <p className="form-error">
                                    {errors.monthlyGoal.message}
                                </p>
                            )}

                            {timelines.weeksToMonthly > 0 && (
                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                    <p>≈ <span className="font-bold text-gradient-purple">{timelines.weeksToMonthly}</span> weeks to reach</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Goal Tips */}
                    <div className="glass-card">
                        <h4 className="font-bold text-gradient-static text-lg mb-3 tracking-wide">
                            💡 Goal Setting Tips
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ul className="text-sm font-medium text-gray-600 dark:text-gray-400 space-y-2">
                                <li className="flex items-start space-x-2">
                                    <span className="font-bold text-primary-500">•</span>
                                    <span className="leading-relaxed">Set realistic goals based on your availability</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="font-bold text-primary-500">•</span>
                                    <span className="leading-relaxed">Weekly goals help maintain consistent momentum</span>
                                </li>
                            </ul>
                            <ul className="text-sm font-medium text-gray-600 dark:text-gray-400 space-y-2">
                                <li className="flex items-start space-x-2">
                                    <span className="font-bold text-primary-500">•</span>
                                    <span className="leading-relaxed">Monthly goals provide broader accountability</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="font-bold text-primary-500">•</span>
                                    <span className="leading-relaxed">Adjust goals as you learn your optimal pace</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Enhanced Validation Summary */}
                    {watchedValues.weeklyGoal && watchedValues.monthlyGoal && (
                        <div className="glass-card">
                            <h4 className="font-bold text-gradient-static text-lg mb-3 tracking-wide">
                                📊 Goal Validation
                            </h4>
                            {watchedValues.weeklyGoal * 4 > watchedValues.monthlyGoal ? (
                                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-1 tracking-wide">
                                        ⚠️ Weekly goal may exceed monthly goal
                                    </p>
                                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 leading-relaxed">
                                        <span className="font-bold text-gradient-blue">{watchedValues.weeklyGoal * 4}</span> weekly vs <span className="font-bold text-gradient-purple">{watchedValues.monthlyGoal}</span> monthly
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <p className="text-sm font-bold text-green-800 dark:text-green-200 mb-1 tracking-wide">
                                        ✓ Goals are well balanced
                                    </p>
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 leading-relaxed">
                                        Your weekly and monthly targets align well
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Enhanced Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={closeGoalModal}
                            className="btn btn-secondary font-bold tracking-wide"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || ui.isLoading}
                            className="btn btn-primary font-bold tracking-wide"
                        >
                            {isSubmitting || ui.isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    <span className="font-bold tracking-wide">Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    <span className="font-bold tracking-wide">Save Goals</span>
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