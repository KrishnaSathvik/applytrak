// src/components/modals/GoalModal.tsx - Simplified to match main UI
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
                {/* Simple Header - matches main app style */}
                <div className="card-header">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Target className="h-6 w-6" />
                            <div>
                                <h2 className="text-xl font-semibold">Set Application Goals</h2>
                                <p className="text-sm opacity-90 mt-1">
                                    Define your job search targets and track your progress
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeGoalModal}
                            className="btn btn-secondary btn-sm"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Simple Goal Inputs - matches your form styling */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Goal */}
                        <div className="space-y-3">
                            <label className="form-label">
                                Total Application Goal
                            </label>
                            <input
                                {...register('totalGoal')}
                                type="number"
                                min="1"
                                max="10000"
                                className={`form-input ${
                                    errors.totalGoal ? 'border-red-500' : ''
                                }`}
                                placeholder="100"
                            />
                            {errors.totalGoal && (
                                <p className="text-sm text-red-500">
                                    {errors.totalGoal.message}
                                </p>
                            )}

                            {timelines.weeksToTotal > 0 && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>≈ {timelines.weeksToTotal} weeks</p>
                                    <p>≈ {timelines.monthsToTotal} months</p>
                                </div>
                            )}
                        </div>

                        {/* Weekly Goal */}
                        <div className="space-y-3">
                            <label className="form-label">
                                Weekly Goal
                            </label>
                            <input
                                {...register('weeklyGoal')}
                                type="number"
                                min="1"
                                max="500"
                                className={`form-input ${
                                    errors.weeklyGoal ? 'border-red-500' : ''
                                }`}
                                placeholder="5"
                            />
                            {errors.weeklyGoal && (
                                <p className="text-sm text-red-500">
                                    {errors.weeklyGoal.message}
                                </p>
                            )}

                            {watchedValues.weeklyGoal && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>≈ {timelines.daysToWeekly} per day</p>
                                </div>
                            )}
                        </div>

                        {/* Monthly Goal */}
                        <div className="space-y-3">
                            <label className="form-label">
                                Monthly Goal
                            </label>
                            <input
                                {...register('monthlyGoal')}
                                type="number"
                                min="1"
                                max="2000"
                                className={`form-input ${
                                    errors.monthlyGoal ? 'border-red-500' : ''
                                }`}
                                placeholder="20"
                            />
                            {errors.monthlyGoal && (
                                <p className="text-sm text-red-500">
                                    {errors.monthlyGoal.message}
                                </p>
                            )}

                            {timelines.weeksToMonthly > 0 && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>≈ {timelines.weeksToMonthly} weeks to reach</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Simple Goal Tips - matches card style */}
                    <div className="card">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Goal Setting Tips
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <li>• Set realistic goals based on your availability</li>
                                <li>• Weekly goals help maintain consistent momentum</li>
                            </ul>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <li>• Monthly goals provide broader accountability</li>
                                <li>• Adjust goals as you learn your optimal pace</li>
                            </ul>
                        </div>
                    </div>

                    {/* Simple Validation Summary */}
                    {watchedValues.weeklyGoal && watchedValues.monthlyGoal && (
                        <div className="card">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Goal Validation
                            </h4>
                            {watchedValues.weeklyGoal * 4 > watchedValues.monthlyGoal ? (
                                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        ⚠️ Weekly goal may exceed monthly goal
                                    </p>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                        {watchedValues.weeklyGoal * 4} weekly vs {watchedValues.monthlyGoal} monthly
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        ✓ Goals are well balanced
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        Your weekly and monthly targets align well
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Simple Action Buttons - matches your button style */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={closeGoalModal}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || ui.isLoading}
                            className="btn btn-primary"
                        >
                            {isSubmitting || ui.isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Goals
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