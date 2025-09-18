import React, { useState } from 'react';
import { Target, Award, Trophy, Star, TrendingUp, Settings, BarChart3, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const GoalsTab: React.FC = () => {
  const { 
    goals, 
    goalProgress, 
    updateGoals,
    calculateProgress 
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
      alert('Failed to save goals. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to current goals and switch back to goals tab
    setFormData({
      weeklyGoal: goals.weeklyGoal,
      monthlyGoal: goals.monthlyGoal,
      totalGoal: goals.totalGoal
    });
    setActiveTab('goals');
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-600 dark:bg-green-400';
    if (percentage >= 80) return 'bg-blue-600 dark:bg-blue-400';
    if (percentage >= 60) return 'bg-yellow-600 dark:bg-yellow-400';
    if (percentage >= 40) return 'bg-orange-600 dark:bg-orange-400';
    return 'bg-red-600 dark:text-red-400';
  };

  const getMotivationalMessage = () => {
    const weeklyProgress = goalProgress.weeklyProgress;
    const monthlyProgress = goalProgress.monthlyProgress;
    
    if (weeklyProgress >= 100 && monthlyProgress >= 100) {
      return "🎉 You're absolutely crushing it! Keep up the amazing work!";
    } else if (weeklyProgress >= 80 || monthlyProgress >= 80) {
      return "🔥 You're so close! Just a little more effort to reach your goals!";
    } else if (weeklyProgress >= 50 || monthlyProgress >= 50) {
      return "💪 Great progress! You're building momentum - keep going!";
    } else if (weeklyProgress >= 25 || monthlyProgress >= 25) {
      return "🚀 Good start! Every application brings you closer to your goals!";
    } else {
      return "🌟 Ready to begin? Set your first goal and start your journey!";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="text-center py-8">
          <Target className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Goal Setting & Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
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
              <BarChart3 className="h-4 w-4" />
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
          {/* Motivational Message */}
          <div className="glass-card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30">
            <div className="text-center py-6">
              <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>

          {/* Goal Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Goal */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                                          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Goal</h3>
                </div>
                <span className={`text-2xl font-bold ${getProgressColor(goalProgress.weeklyProgress)}`}>
                  {Math.round(goalProgress.weeklyProgress)}%
                </span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {goalProgress.weeklyApplications}/{goals.weeklyGoal}
                </div>
                <div className="text-gray-600 dark:text-gray-300">Applications this week</div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(goalProgress.weeklyProgress)}`}
                  style={{width: `${Math.min(100, goalProgress.weeklyProgress)}%`}}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {goalProgress.weeklyProgress >= 100 
                  ? '🎯 Weekly goal achieved!' 
                  : `${goals.weeklyGoal - goalProgress.weeklyApplications} more to go`
                }
              </div>
            </div>

            {/* Monthly Goal */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Monthly Goal</h3>
                </div>
                <span className={`text-2xl font-bold ${getProgressColor(goalProgress.monthlyProgress)}`}>
                  {Math.round(goalProgress.monthlyProgress)}%
                </span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {goalProgress.monthlyApplications}/{goals.monthlyGoal}
                </div>
                <div className="text-gray-600 dark:text-gray-300">Applications this month</div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(goalProgress.monthlyProgress)}`}
                  style={{width: `${Math.min(100, goalProgress.monthlyProgress)}%`}}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {goalProgress.monthlyProgress >= 100 
                  ? '🎯 Monthly goal achieved!' 
                  : `${goals.monthlyGoal - goalProgress.monthlyApplications} more to go`
                }
              </div>
            </div>

            {/* Total Goal */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Award className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Goal</h3>
                </div>
                <span className={`text-2xl font-bold ${getProgressColor(goalProgress.totalProgress)}`}>
                  {Math.round(goalProgress.totalProgress)}%
                </span>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {goalProgress.totalApplications}/{goals.totalGoal}
                </div>
                <div className="text-gray-600 dark:text-gray-300">Total applications</div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(goalProgress.totalProgress)}`}
                  style={{width: `${Math.min(100, goalProgress.totalProgress)}%`}}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {goalProgress.totalProgress >= 100 
                  ? '🎯 Total goal achieved!' 
                  : `${goals.totalGoal - goalProgress.totalApplications} more to go`
                }
              </div>
            </div>
          </div>

          {/* Streak & Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Streak */}
            <div className="glass-card">
              <div className="flex items-center mb-4">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Streak</h3>
              </div>
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  {goalProgress.dailyStreak}
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-4">Days in a row</div>
                {goalProgress.dailyStreak > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      🔥 Amazing consistency!
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {goalProgress.dailyStreak === 1 
                        ? 'First day down!' 
                        : goalProgress.dailyStreak >= 7 
                        ? 'You\'re unstoppable!' 
                        : goalProgress.dailyStreak >= 3
                        ? 'Great momentum!'
                        : 'Keep it going!'
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Start your streak today!
                  </div>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="glass-card">
              <div className="flex items-center mb-4">
                <Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Achievements</h3>
              </div>
              <div className="space-y-4">
                {/* First Application */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      goalProgress.totalApplications > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}>
                      {goalProgress.totalApplications > 0 ? '✓' : '1'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">First Application</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Submit your first job application</div>
                    </div>
                  </div>
                  {goalProgress.totalApplications > 0 && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">Unlocked!</span>
                  )}
                </div>

                {/* Weekly Goal Achiever */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      goalProgress.weeklyProgress >= 100 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}>
                      {goalProgress.weeklyProgress >= 100 ? '✓' : '5'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Weekly Goal Achiever</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Meet your weekly application target</div>
                    </div>
                  </div>
                  {goalProgress.weeklyProgress >= 100 && (
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">Unlocked!</span>
                  )}
                </div>

                {/* Streak Master */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      goalProgress.dailyStreak >= 7 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}>
                      {goalProgress.dailyStreak >= 7 ? '✓' : '7'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Streak Master</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Maintain a 7+ day streak</div>
                    </div>
                  </div>
                  {goalProgress.dailyStreak >= 7 && (
                    <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">Unlocked!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Motivation */}
          <div className="glass-card bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200/30 dark:border-indigo-700/30">
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">💡 Tips for Success</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>• Set realistic goals:</strong> Start with achievable targets and increase gradually
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>• Track consistently:</strong> Log applications daily to maintain momentum
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>• Celebrate wins:</strong> Acknowledge every milestone, no matter how small
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>• Stay motivated:</strong> Remember why you started and where you want to go
                </div>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Set Your Goals</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Configure your weekly, monthly, and total application targets</p>
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
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 100"
                  />
                  <span className="text-sm text-gray-500">total applications</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 50-200 total applications</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFormData({ weeklyGoal: 5, monthlyGoal: 20, totalGoal: 50 })}
                  className="px-4 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                >
                  Reset to Defaults
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGoals}
                    disabled={formData.weeklyGoal === goals.weeklyGoal && 
                             formData.monthlyGoal === goals.monthlyGoal && 
                             formData.totalGoal === goals.totalGoal}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      formData.weeklyGoal === goals.weeklyGoal && 
                      formData.monthlyGoal === goals.monthlyGoal && 
                      formData.totalGoal === goals.totalGoal
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    }`}
                  >
                    Save Goals
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Goal Guidelines */}
          <div className="glass-card bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200/30 dark:border-green-700/30">
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🎯 Goal Setting Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Weekly Goals</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Start small and build momentum. 3-5 applications per week is a great starting point.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Monthly Goals</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Aim for consistency. Monthly goals should be achievable based on your weekly targets.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Goals</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Set ambitious but realistic long-term targets. Quality over quantity matters most.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsTab;
