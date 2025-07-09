// src/components/modals/GoalModal.tsx - ENTERPRISE ENHANCED WITH FIXES
import React, {forwardRef, useCallback, useEffect, useMemo} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    AlertTriangle,
    Award,
    BarChart3,
    Calendar,
    CheckCircle,
    Info,
    Save,
    Target,
    TrendingUp,
    X,
    Zap
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {cn} from '../../utils/helpers';

// ==========================================
// ENHANCED TYPES & INTERFACES
// ==========================================

interface GoalFormData {
    totalGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
}

interface ValidationState {
    weeklyMonthlyRatio: {
        isValid: boolean;
        message: string;
        severity: 'info' | 'warning' | 'error';
        suggestion?: string;
    };
    totalReachability: {
        isValid: boolean;
        message: string;
        weeksNeeded: number;
        monthsNeeded: number;
    };
    paceAnalysis: {
        dailyPace: number;
        weeklyToMonthlyRatio: number;
        isRealistic: boolean;
    };
}

interface TimelineCalculation {
    weeksToTotal: number;
    monthsToTotal: number;
    daysToWeekly: number;
    weeksToMonthly: number;
    averageDailyPace: number;
    isRealistic: boolean;
}

// ==========================================
// ENHANCED VALIDATION SCHEMA
// ==========================================

const createGoalValidationSchema = () => {
    return yup.object({
        totalGoal: yup
            .number()
            .transform((value, originalValue) => {
                return originalValue === '' ? undefined : value;
            })
            .required('Total goal is required')
            .min(1, 'Total goal must be at least 1')
            .max(10000, 'Total goal must be less than 10,000')
            .integer('Total goal must be a whole number')
            .test('realistic-total', 'This goal seems very ambitious. Are you sure?', function (value) {
                return !value || value <= 1000; // Warning for very high goals
            }),

        weeklyGoal: yup
            .number()
            .transform((value, originalValue) => {
                return originalValue === '' ? undefined : value;
            })
            .required('Weekly goal is required')
            .min(1, 'Weekly goal must be at least 1')
            .max(200, 'Weekly goal must be less than 200')
            .integer('Weekly goal must be a whole number')
            .test('realistic-weekly', 'This weekly goal seems very high', function (value) {
                return !value || value <= 100; // Warning for very high weekly goals
            }),

        monthlyGoal: yup
            .number()
            .transform((value, originalValue) => {
                return originalValue === '' ? undefined : value;
            })
            .required('Monthly goal is required')
            .min(1, 'Monthly goal must be at least 1')
            .max(2000, 'Monthly goal must be less than 2,000')
            .integer('Monthly goal must be a whole number')
            .test(
                'monthly-weekly-balance',
                'Monthly goal should align with your weekly goal',
                function (value) {
                    const {weeklyGoal} = this.parent;
                    if (!value || !weeklyGoal) return true;

                    // 🔧 FIXED: Better logic for weekly vs monthly validation
                    const weeksInMonth = 4.33; // Average weeks per month
                    const expectedMonthly = Math.round(weeklyGoal * weeksInMonth);
                    const tolerance = 0.3; // 30% tolerance

                    const minExpected = Math.round(expectedMonthly * (1 - tolerance));
                    const maxExpected = Math.round(expectedMonthly * (1 + tolerance));

                    if (value < minExpected) {
                        return this.createError({
                            message: `Monthly goal seems low. With ${weeklyGoal}/week, aim for around ${expectedMonthly}/month`
                        });
                    }

                    if (value > maxExpected) {
                        return this.createError({
                            message: `Monthly goal seems high. With ${weeklyGoal}/week, aim for around ${expectedMonthly}/month`
                        });
                    }

                    return true;
                }
            )
    });
};

// ==========================================
// ENHANCED GOAL MODAL COMPONENT
// ==========================================

const GoalModal = forwardRef<HTMLDivElement>(() => {
    const {
        modals,
        goals,
        closeGoalModal,
        updateGoals,
        ui,
        showToast
    } = useAppStore();

    const { goalSetting } = modals;

    // 🔧 ENHANCED: Form with better default handling
    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: {errors, isSubmitting, isDirty},
        trigger,
        clearErrors
    } = useForm<GoalFormData>({
        resolver: yupResolver(createGoalValidationSchema()),
        defaultValues: {
            totalGoal: goals.totalGoal || 100,
            weeklyGoal: goals.weeklyGoal || 5,
            monthlyGoal: goals.monthlyGoal || 20
        },
        mode: 'onChange' // Real-time validation
    });

    const watchedValues = watch();
    const {totalGoal, weeklyGoal, monthlyGoal} = watchedValues;

    // ==========================================
    // ENHANCED CALCULATIONS
    // ==========================================

    const timelineCalculations = useMemo((): TimelineCalculation => {
        if (!totalGoal || !weeklyGoal || !monthlyGoal) {
            return {
                weeksToTotal: 0,
                monthsToTotal: 0,
                daysToWeekly: 0,
                weeksToMonthly: 0,
                averageDailyPace: 0,
                isRealistic: true
            };
        }

        const weeksToTotal = Math.ceil(totalGoal / weeklyGoal);
        const monthsToTotal = Math.ceil(totalGoal / monthlyGoal);
        const daysToWeekly = Math.ceil(weeklyGoal / 7);
        const weeksToMonthly = Math.ceil(monthlyGoal / weeklyGoal);
        const averageDailyPace = weeklyGoal / 7;

        // Realistic assessment
        const isRealistic = averageDailyPace <= 10 && weeklyGoal <= 50;

        return {
            weeksToTotal,
            monthsToTotal,
            daysToWeekly,
            weeksToMonthly,
            averageDailyPace,
            isRealistic
        };
    }, [totalGoal, weeklyGoal, monthlyGoal]);

    const validationState = useMemo((): ValidationState => {
        if (!weeklyGoal || !monthlyGoal) {
            return {
                weeklyMonthlyRatio: {
                    isValid: true,
                    message: '',
                    severity: 'info'
                },
                totalReachability: {
                    isValid: true,
                    message: '',
                    weeksNeeded: 0,
                    monthsNeeded: 0
                },
                paceAnalysis: {
                    dailyPace: 0,
                    weeklyToMonthlyRatio: 0,
                    isRealistic: true
                }
            };
        }

        // 🔧 FIXED: Improved weekly vs monthly validation logic
        const weeksInMonth = 4.33;
        const expectedMonthlyFromWeekly = weeklyGoal * weeksInMonth;
        const ratio = monthlyGoal / expectedMonthlyFromWeekly;
        const dailyPace = weeklyGoal / 7;

        // Weekly vs Monthly validation
        let weeklyMonthlyValidation: ValidationState['weeklyMonthlyRatio'];

        if (ratio < 0.7) {
            weeklyMonthlyValidation = {
                isValid: false,
                message: `Monthly goal seems low for ${weeklyGoal} applications per week`,
                severity: 'warning',
                suggestion: `Consider increasing to ~${Math.round(expectedMonthlyFromWeekly)} monthly`
            };
        } else if (ratio > 1.3) {
            weeklyMonthlyValidation = {
                isValid: false,
                message: `Monthly goal seems high for ${weeklyGoal} applications per week`,
                severity: 'warning',
                suggestion: `Consider decreasing to ~${Math.round(expectedMonthlyFromWeekly)} monthly`
            };
        } else {
            weeklyMonthlyValidation = {
                isValid: true,
                message: 'Weekly and monthly goals are well balanced',
                severity: 'info'
            };
        }

        // Total reachability
        const weeksNeeded = totalGoal ? Math.ceil(totalGoal / weeklyGoal) : 0;
        const monthsNeeded = totalGoal ? Math.ceil(totalGoal / monthlyGoal) : 0;

        const totalReachability: ValidationState['totalReachability'] = {
            isValid: weeksNeeded <= 104, // 2 years max
            message: weeksNeeded > 104
                ? 'Total goal will take over 2 years at current pace'
                : `Estimated ${weeksNeeded} weeks (${monthsNeeded} months) to reach total goal`,
            weeksNeeded,
            monthsNeeded
        };

        // Pace analysis
        const paceAnalysis: ValidationState['paceAnalysis'] = {
            dailyPace,
            weeklyToMonthlyRatio: ratio,
            isRealistic: dailyPace <= 5 && weeklyGoal <= 35
        };

        return {
            weeklyMonthlyRatio: weeklyMonthlyValidation,
            totalReachability,
            paceAnalysis
        };
    }, [weeklyGoal, monthlyGoal, totalGoal]);

    // ==========================================
    // FORM HANDLERS
    // ==========================================

    // 🔧 ENHANCED: Initialize form when modal opens
    useEffect(() => {
        if (goalSetting.isOpen) {
            // Reset form with current goals
            reset({
                totalGoal: goals.totalGoal || 100,
                weeklyGoal: goals.weeklyGoal || 5,
                monthlyGoal: goals.monthlyGoal || 20
            });
            clearErrors();
        }
    }, [goalSetting.isOpen, goals, reset, clearErrors]);

    // 🔧 ENHANCED: Form submission with better error handling
    const onSubmit = useCallback(async (data: GoalFormData) => {
        try {
            // Validate one more time
            const isValid = await trigger();
            if (!isValid) {
                showToast({
                    type: 'error',
                    message: 'Please fix validation errors before saving'
                });
                return;
            }

            // 🔧 FIXED: Ensure data is properly formatted
            const goalsData = {
                totalGoal: Math.round(Number(data.totalGoal)),
                weeklyGoal: Math.round(Number(data.weeklyGoal)),
                monthlyGoal: Math.round(Number(data.monthlyGoal))
            };

            console.log('💾 Saving goals:', goalsData);

            await updateGoals(goalsData);

            showToast({
                type: 'success',
                message: '🎯 Goals updated successfully! Your progress will now be tracked.',
                duration: 4000
            });

            closeGoalModal();
            reset();
        } catch (error) {
            console.error('❌ Error updating goals:', error);
            showToast({
                type: 'error',
                message: 'Failed to update goals: ' + (error as Error).message
            });
        }
    }, [updateGoals, closeGoalModal, reset, trigger, showToast]);

    // Smart suggestions based on current values
    const getSmartSuggestions = useCallback(() => {
        if (!weeklyGoal) return [];

        const suggestions = [];
        const dailyPace = weeklyGoal / 7;

        if (dailyPace > 5) {
            suggestions.push({
                type: 'warning',
                message: 'Consider reducing weekly goal for sustainability',
                suggestion: `Try ${Math.ceil(weeklyGoal * 0.7)} weekly for a more manageable pace`
            });
        }

        if (monthlyGoal && weeklyGoal * 4 > monthlyGoal * 1.2) {
            suggestions.push({
                type: 'info',
                message: 'Your weekly pace could exceed monthly goal',
                suggestion: `Increase monthly to ${Math.ceil(weeklyGoal * 4.3)} or reduce weekly`
            });
        }

        return suggestions;
    }, [weeklyGoal, monthlyGoal]);

    const smartSuggestions = getSmartSuggestions();

    // Handle modal close
    const handleClose = useCallback(() => {
        if (isDirty) {
            const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
            if (!confirmClose) return;
        }
        closeGoalModal();
        reset();
    }, [isDirty, closeGoalModal, reset]);

    if (!goalSetting.isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Enhanced Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative w-full max-w-4xl transform transition-all duration-300 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Enhanced Header */}
                    <div
                        className="relative overflow-hidden border-b border-gray-200/50 dark:border-gray-700/50 rounded-t-xl">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-sm"></div>

                        <div className="relative z-10 flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div
                                    className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                                    <Target className="h-7 w-7 text-white drop-shadow-lg"/>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
                                        Set Application Goals
                                    </h2>
                                    <p className="text-white/95 font-semibold mt-1 leading-relaxed drop-shadow-md tracking-wide">
                                        Define your job search targets and track your progress
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold tracking-wide transition-all duration-200 hover:scale-105"
                                aria-label="Close modal"
                            >
                                <X className="h-5 w-5 drop-shadow-lg"/>
                            </button>
                        </div>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                        {/* Goal Input Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total Goal */}
                            <div className="space-y-3">
                                <label
                                    className="block text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide">
                                    <Target className="h-4 w-4 mr-2 inline"/>
                                    Total Application Goal
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('totalGoal')}
                                        type="number"
                                        min="1"
                                        max="10000"
                                        step="1"
                                        className={cn(
                                            'w-full px-4 py-3 border rounded-lg text-lg font-semibold bg-white dark:bg-gray-800 transition-all duration-200',
                                            errors.totalGoal
                                                ? 'border-red-500 ring-2 ring-red-500/20'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                        )}
                                        placeholder="100"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <Award className="h-5 w-5 text-gray-400"/>
                                    </div>
                                </div>
                                {errors.totalGoal && (
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                                        <AlertTriangle className="h-4 w-4 mr-1"/>
                                        {errors.totalGoal.message}
                                    </p>
                                )}

                                {/* Timeline Display */}
                                {totalGoal && weeklyGoal && (
                                    <div className="space-y-2 text-sm">
                                        <div
                                            className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <span className="font-medium text-blue-800 dark:text-blue-200">Estimated Time:</span>
                                            <span className="font-bold text-blue-900 dark:text-blue-100">
                                                {timelineCalculations.weeksToTotal} weeks
                                            </span>
                                        </div>
                                        <div
                                            className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <span
                                                className="font-medium text-purple-800 dark:text-purple-200">≈ Months:</span>
                                            <span className="font-bold text-purple-900 dark:text-purple-100">
                                                {timelineCalculations.monthsToTotal} months
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Weekly Goal */}
                            <div className="space-y-3">
                                <label
                                    className="block text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide">
                                    <Calendar className="h-4 w-4 mr-2 inline"/>
                                    Weekly Goal
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('weeklyGoal')}
                                        type="number"
                                        min="1"
                                        max="200"
                                        step="1"
                                        className={cn(
                                            'w-full px-4 py-3 border rounded-lg text-lg font-semibold bg-white dark:bg-gray-800 transition-all duration-200',
                                            errors.weeklyGoal
                                                ? 'border-red-500 ring-2 ring-red-500/20'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                        )}
                                        placeholder="5"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <TrendingUp className="h-5 w-5 text-gray-400"/>
                                    </div>
                                </div>
                                {errors.weeklyGoal && (
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                                        <AlertTriangle className="h-4 w-4 mr-1"/>
                                        {errors.weeklyGoal.message}
                                    </p>
                                )}

                                {/* Daily Pace */}
                                {weeklyGoal && (
                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                Daily Pace:
                                            </span>
                                            <span className="text-sm font-bold text-green-900 dark:text-green-100">
                                                ≈ {timelineCalculations.averageDailyPace.toFixed(1)} per day
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Monthly Goal */}
                            <div className="space-y-3">
                                <label
                                    className="block text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide">
                                    <BarChart3 className="h-4 w-4 mr-2 inline"/>
                                    Monthly Goal
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('monthlyGoal')}
                                        type="number"
                                        min="1"
                                        max="2000"
                                        step="1"
                                        className={cn(
                                            'w-full px-4 py-3 border rounded-lg text-lg font-semibold bg-white dark:bg-gray-800 transition-all duration-200',
                                            errors.monthlyGoal
                                                ? 'border-red-500 ring-2 ring-red-500/20'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                        )}
                                        placeholder="20"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <Calendar className="h-5 w-5 text-gray-400"/>
                                    </div>
                                </div>
                                {errors.monthlyGoal && (
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                                        <AlertTriangle className="h-4 w-4 mr-1"/>
                                        {errors.monthlyGoal.message}
                                    </p>
                                )}

                                {/* Weekly to Monthly Ratio */}
                                {weeklyGoal && monthlyGoal && (
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                                Weekly × 4.3:
                                            </span>
                                            <span className="text-sm font-bold text-purple-900 dark:text-purple-100">
                                                ≈ {Math.round(weeklyGoal * 4.3)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Validation Display */}
                        {(weeklyGoal && monthlyGoal) && (
                            <div className="space-y-4">
                                {/* Goal Balance Validation */}
                                <div className={cn(
                                    'p-4 rounded-lg border',
                                    validationState.weeklyMonthlyRatio.isValid
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                        : validationState.weeklyMonthlyRatio.severity === 'warning'
                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                )}>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            {validationState.weeklyMonthlyRatio.isValid ? (
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400"/>
                                            ) : validationState.weeklyMonthlyRatio.severity === 'warning' ? (
                                                <AlertTriangle
                                                    className="h-5 w-5 text-yellow-600 dark:text-yellow-400"/>
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400"/>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={cn(
                                                'font-bold text-sm mb-1',
                                                validationState.weeklyMonthlyRatio.isValid
                                                    ? 'text-green-800 dark:text-green-200'
                                                    : validationState.weeklyMonthlyRatio.severity === 'warning'
                                                        ? 'text-yellow-800 dark:text-yellow-200'
                                                        : 'text-red-800 dark:text-red-200'
                                            )}>
                                                Goal Balance Analysis
                                            </h4>
                                            <p className={cn(
                                                'text-sm font-medium',
                                                validationState.weeklyMonthlyRatio.isValid
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : validationState.weeklyMonthlyRatio.severity === 'warning'
                                                        ? 'text-yellow-700 dark:text-yellow-300'
                                                        : 'text-red-700 dark:text-red-300'
                                            )}>
                                                {validationState.weeklyMonthlyRatio.message}
                                            </p>
                                            {validationState.weeklyMonthlyRatio.suggestion && (
                                                <p className="text-xs font-medium mt-1 opacity-80">
                                                    💡 {validationState.weeklyMonthlyRatio.suggestion}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Smart Suggestions */}
                                {smartSuggestions.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center">
                                            <Zap className="h-4 w-4 mr-2"/>
                                            Smart Suggestions
                                        </h4>
                                        {smartSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                                            >
                                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                    {suggestion.message}
                                                </p>
                                                <p className="text-xs font-medium text-blue-600 dark:text-blue-300 mt-1">
                                                    💡 {suggestion.suggestion}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Goal Setting Tips */}
                        <div
                            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-3 flex items-center">
                                <Info className="h-4 w-4 mr-2"/>
                                Goal Setting Tips
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <ul className="text-sm space-y-2">
                                    <li className="flex items-start space-x-2">
                                        <span className="font-bold text-blue-500">•</span>
                                        <span className="text-gray-600 dark:text-gray-400">Set realistic goals based on your availability</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <span className="font-bold text-blue-500">•</span>
                                        <span className="text-gray-600 dark:text-gray-400">Weekly goals help maintain momentum</span>
                                    </li>
                                </ul>
                                <ul className="text-sm space-y-2">
                                    <li className="flex items-start space-x-2">
                                        <span className="font-bold text-blue-500">•</span>
                                        <span className="text-gray-600 dark:text-gray-400">Monthly goals provide accountability</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <span className="font-bold text-blue-500">•</span>
                                        <span
                                            className="text-gray-600 dark:text-gray-400">Adjust as you learn your pace</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || ui.isLoading}
                                className={cn(
                                    'px-6 py-2 text-sm font-bold text-white rounded-lg transition-all duration-200 flex items-center',
                                    isSubmitting || ui.isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transform hover:scale-105'
                                )}
                            >
                                {isSubmitting || ui.isLoading ? (
                                    <>
                                        <div
                                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2"/>
                                        Save Goals
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
});

GoalModal.displayName = 'GoalModal';

export default GoalModal;