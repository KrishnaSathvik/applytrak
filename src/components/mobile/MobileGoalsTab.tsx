import React, { useState } from 'react';
import { Target, Award, TrendingUp, Settings, Calendar } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const MobileGoalsTab: React.FC = () => {
  const { 
    goals, 
    updateGoals,
    calculateProgress,
    applications
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'goals' | 'settings'>('goals');
  const [formData, setFormData] = useState({
    weeklyGoal: goals.weeklyGoal,
    monthlyGoal: goals.monthlyGoal,
    totalGoal: goals.totalGoal
  });

  React.useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  // Only update form data when switching to settings tab or when goals are first loaded
  React.useEffect(() => {
    if (activeTab === 'settings') {
      setFormData({
        weeklyGoal: goals.weeklyGoal,
        monthlyGoal: goals.monthlyGoal,
        totalGoal: goals.totalGoal
      });
    }
  }, [activeTab, goals]);

  const handleSaveGoals = async () => {
    // Validate goals
    if (formData.weeklyGoal < 1 || formData.monthlyGoal < 1 || formData.totalGoal < 1) {
      alert('Please enter valid goal values (minimum 1)');
      return;
    }
    
    if (formData.weeklyGoal > 50 || formData.monthlyGoal > 200 || formData.totalGoal > 1000) {
      alert('Please enter reasonable goal values');
      return;
    }

    try {
      await updateGoals(formData);
      // Switch back to goals tab after successful save
      setActiveTab('goals');
    } catch (error) {
      console.error('Failed to update goals:', error);
      alert('Failed to update goals. Please try again.');
    }
  };

  const getCurrentWeekApplications = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return applications.filter(app => {
      const appDate = new Date(app.dateApplied);
      return appDate >= startOfWeek && appDate <= endOfWeek;
    }).length;
  };

  const getCurrentMonthApplications = () => {
    const now = new Date();
    return applications.filter(app => {
      const appDate = new Date(app.dateApplied);
      return appDate.getMonth() === now.getMonth() && 
             appDate.getFullYear() === now.getFullYear();
    }).length;
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const currentWeekApps = getCurrentWeekApplications();
  const currentMonthApps = getCurrentMonthApplications();
  const totalApps = applications.length;

  const weeklyProgress = getProgressPercentage(currentWeekApps, goals.weeklyGoal);
  const monthlyProgress = getProgressPercentage(currentMonthApps, goals.monthlyGoal);
  const totalProgress = getProgressPercentage(totalApps, goals.totalGoal);

  return (
    <div className="mobile-content">
      <div className="mobile-space-y-6">
      {/* Header Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="text-center py-8">
          <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="mobile-text-xl font-bold text-gray-900 mb-2">
            Goal Setting & Progress
          </h1>
          <p className="mobile-text-sm text-gray-600 mb-4">
            Set targets, track progress, and celebrate your achievements
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card">
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex items-center">
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                activeTab === 'goals' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Target className="h-4 w-4" />
              Goals & Progress
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                activeTab === 'settings' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4" />
              Goal Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Goal Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Goal */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Goal</h3>
                </div>
                <span className={`text-2xl font-bold ${getProgressColor(weeklyProgress)}`}>
                  {Math.round(weeklyProgress)}%
                </span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {currentWeekApps}/{goals.weeklyGoal}
                </div>
                <div className="text-gray-600">Applications this week</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(weeklyProgress)}`}
                  style={{width: `${Math.min(100, weeklyProgress)}%`}}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                {weeklyProgress >= 100 
                  ? '🎯 Weekly goal achieved!' 
                  : `${goals.weeklyGoal - currentWeekApps} more to go`
                }
              </div>
            </div>

            {/* Monthly Goal */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Goal</h3>
                </div>
                <span className={`text-2xl font-bold ${getProgressColor(monthlyProgress)}`}>
                  {Math.round(monthlyProgress)}%
                </span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {currentMonthApps}/{goals.monthlyGoal}
                </div>
                <div className="text-gray-600">Applications this month</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(monthlyProgress)}`}
                  style={{width: `${Math.min(100, monthlyProgress)}%`}}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                {monthlyProgress >= 100 
                  ? '🎯 Monthly goal achieved!' 
                  : `${goals.monthlyGoal - currentMonthApps} more to go`
                }
              </div>
            </div>

            {/* Total Goal */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Award className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Total Goal</h3>
                </div>
                <span className={`text-2xl font-bold ${getProgressColor(totalProgress)}`}>
                  {Math.round(totalProgress)}%
                </span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {totalApps}/{goals.totalGoal}
                </div>
                <div className="text-gray-600">Total applications</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(totalProgress)}`}
                  style={{width: `${Math.min(100, totalProgress)}%`}}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                {totalProgress >= 100 
                  ? '🎯 Total goal achieved!' 
                  : `${goals.totalGoal - totalApps} more to go`
                }
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Goal Settings Form */}
          <div className="glass-card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Your Goals</h2>
              <p className="text-sm text-gray-600">Configure your weekly, monthly, and total application targets</p>
            </div>

            <div className="space-y-6">
              {/* Weekly Goal */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weekly Goal
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.weeklyGoal || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        weeklyGoal: value === '' ? 0 : parseInt(value) || 0 
                      }));
                    }}
                    className="mobile-form-input flex-1"
                    placeholder="e.g., 5"
                  />
                  <span className="text-sm text-gray-500">applications per week</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 3-10 applications per week</p>
              </div>

              {/* Monthly Goal */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monthly Goal
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={formData.monthlyGoal || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        monthlyGoal: value === '' ? 0 : parseInt(value) || 0 
                      }));
                    }}
                    className="mobile-form-input flex-1"
                    placeholder="e.g., 20"
                  />
                  <span className="text-sm text-gray-500">applications per month</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 15-50 applications per month</p>
              </div>

              {/* Total Goal */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Goal
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.totalGoal || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        totalGoal: value === '' ? 0 : parseInt(value) || 0 
                      }));
                    }}
                    className="mobile-form-input flex-1"
                    placeholder="e.g., 100"
                  />
                  <span className="text-sm text-gray-500">total applications</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 50-200 total applications</p>
              </div>

              {/* Action Buttons */}
              <div className="mobile-flex mobile-flex-col mobile-gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setFormData({ weeklyGoal: 5, monthlyGoal: 20, totalGoal: 50 })}
                  className="btn btn-secondary mobile-text-sm"
                >
                  Reset to Defaults
                </button>
                <div className="mobile-flex mobile-gap-3">
                  <button
                    onClick={() => setFormData({
                      weeklyGoal: goals.weeklyGoal,
                      monthlyGoal: goals.monthlyGoal,
                      totalGoal: goals.totalGoal
                    })}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGoals}
                    disabled={formData.weeklyGoal === goals.weeklyGoal && 
                             formData.monthlyGoal === goals.monthlyGoal && 
                             formData.totalGoal === goals.totalGoal}
                    className={`btn flex-1 ${
                      formData.weeklyGoal === goals.weeklyGoal && 
                      formData.monthlyGoal === goals.monthlyGoal && 
                      formData.totalGoal === goals.totalGoal
                        ? 'btn-secondary opacity-50 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    Save Goals
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
              )}
      </div>
    </div>
  );
};

export default MobileGoalsTab;
