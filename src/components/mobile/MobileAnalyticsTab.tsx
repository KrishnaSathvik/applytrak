import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Award, 
  Building,
  Lock
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const MobileAnalyticsTab: React.FC = () => {
  const { applications, analytics, auth } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'basic' | 'advanced'>('overview');

  // Calculate analytics data
  const totalApplications = applications.length;
  const applicationsByStatus = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const applicationsByMonth = applications.reduce((acc, app) => {
    const date = new Date(app.dateApplied);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Advanced Analytics: Company Success Rates
  const companySuccessRates = useMemo(() => {
    const companyStats: Record<string, { total: number; interviews: number; offers: number }> = {};
    
    applications.forEach(app => {
      if (!companyStats[app.company]) {
        companyStats[app.company] = { total: 0, interviews: 0, offers: 0 };
      }
      companyStats[app.company].total++;
      if (app.status === 'Interview') companyStats[app.company].interviews++;
      if (app.status === 'Offer') companyStats[app.company].offers++;
    });

    return Object.entries(companyStats)
      .filter(([, stats]) => stats.total >= 2) // Only companies with 2+ applications
      .map(([company, stats]) => ({
        company,
        total: stats.total,
        interviewRate: (stats.interviews / stats.total) * 100,
        offerRate: (stats.offers / stats.total) * 100,
        successRate: ((stats.interviews + stats.offers) / stats.total) * 100
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5); // Top 5 companies for mobile
  }, [applications]);

  // Advanced Analytics: Salary Trends
  const salaryTrends = useMemo(() => {
    const salaryData = applications
      .filter(app => app.salary && app.salary.trim() !== '')
      .map(app => {
        // Extract numeric salary value
        const salaryMatch = app.salary!.match(/[\d,]+/);
        const salaryNum = salaryMatch ? parseInt(salaryMatch[0].replace(/,/g, '')) : 0;
        return {
          company: app.company,
          position: app.position,
          salary: salaryNum,
          status: app.status,
          type: app.type,
          employmentType: app.employmentType,
          date: new Date(app.dateApplied)
        };
      })
      .filter(item => item.salary > 0)
      .sort((a, b) => b.salary - a.salary);

    const averageSalary = salaryData.length > 0 
      ? Math.round(salaryData.reduce((sum, item) => sum + item.salary, 0) / salaryData.length)
      : 0;

    const salaryByJobType = salaryData.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item.salary);
      return acc;
    }, {} as Record<string, number[]>);

    const salaryByJobTypeAvg = Object.entries(salaryByJobType).map(([jobType, salaries]) => ({
      jobType,
      average: Math.round((salaries as number[]).reduce((sum, s) => sum + s, 0) / (salaries as number[]).length),
      count: (salaries as number[]).length
    }));

    return {
      all: salaryData,
      average: averageSalary,
      byType: salaryByJobTypeAvg,
      highest: salaryData[0],
      lowest: salaryData[salaryData.length - 1]
    };
  }, [applications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'Interview': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'Offer': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'Rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getSuccessRate = () => {
    if (totalApplications === 0) return 0;
    const successful = applicationsByStatus['Offer'] || 0;
    return Math.round((successful / totalApplications) * 100);
  };

  const getInterviewRate = () => {
    if (totalApplications === 0) return 0;
    const interviews = (applicationsByStatus['Interview'] || 0) + (applicationsByStatus['Offer'] || 0);
    return Math.round((interviews / totalApplications) * 100);
  };

  // Check if user has exceeded free plan limits
  const isFreeUser = !auth.isAuthenticated;
  const hasExceededFreeLimit = applications.length > 50;
  
  // If user is not authenticated and has exceeded free limit, show upgrade message
  if (isFreeUser && hasExceededFreeLimit) {
    return (
      <div className="mobile-content">
        {/* Header Section */}
        <div className="card">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="mobile-text-xl mobile-font-bold text-gray-900 dark:text-gray-100 mb-2">
              Upgrade to Pro for More Analytics
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You've reached the free plan limit of 50 applications. Upgrade to Pro to unlock advanced analytics for unlimited applications.
            </p>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="mobile-space-y-4">
          <div className="card">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mobile-text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Success Rate Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your interview-to-offer conversion rates and identify your most effective job search strategies.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mobile-text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Performance Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track application velocity, response times, and optimize your job search pipeline for better results.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mobile-text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Goal Progress</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Visualize your progress toward weekly and monthly application goals with interactive charts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content">
      <div className="mobile-space-y-6">
      {/* Header Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="text-center py-8">
          <BarChart3 className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Track your application progress and insights
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card">
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex items-center">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                activeTab === 'overview' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                activeTab === 'basic' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Basic
            </button>
            {auth.isAuthenticated ? (
              <button
                onClick={() => setActiveTab('advanced')}
                className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                  activeTab === 'advanced' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Building className="h-4 w-4" />
                Advanced
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('advanced')}
                className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                  activeTab === 'advanced' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Building className="h-4 w-4" />
                Advanced
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="mobile-space-y-4">
          {/* Key Metrics */}
          <div className="card">
            <h2 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-blue-200 dark:border-blue-700 pb-2">
              Summary Overview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
              Key performance metrics and application statistics
            </p>
            
            <div className="mobile-grid-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <h3 className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wider mb-2">
                  Total Applications
                </h3>
                <div className="mobile-text-2xl mobile-font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {totalApplications}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  All time applications
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <h3 className="text-xs font-bold text-green-800 dark:text-green-200 uppercase tracking-wider mb-2">
                  Success Rate
                </h3>
                <div className="mobile-text-2xl mobile-font-bold text-green-600 dark:text-green-400 mb-1">
                  {getSuccessRate()}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Applications → Offers
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider mb-2">
                  Interview Rate
                </h3>
                <div className="mobile-text-2xl mobile-font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {getInterviewRate()}%
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  Applications → Interviews
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                <h3 className="text-xs font-bold text-purple-800 dark:text-purple-200 uppercase tracking-wider mb-2">
                  Avg Response Time
                </h3>
                <div className="mobile-text-2xl mobile-font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {analytics.averageResponseTime === 0 ? '-' : `${analytics.averageResponseTime}d`}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  Days to hear back
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          {totalApplications > 0 && (
            <div className="card">
              <h2 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-blue-200 dark:border-blue-700 pb-2">
                Key Insights
              </h2>
              <div className="mobile-space-y-4">
                {/* Application Momentum */}
                {(() => {
                  // Calculate application timeline data
                  const timelineData: Record<string, number> = {};
                  applications.forEach(app => {
                    const date = new Date(app.dateApplied);
                    const weekKey = `${date.getFullYear()}-W${String(Math.ceil(date.getDate() / 7)).padStart(2, '0')}`;
                    timelineData[weekKey] = (timelineData[weekKey] || 0) + 1;
                  });

                  const timelineArray = Object.entries(timelineData)
                    .map(([week, count]) => ({ week, applications: count }))
                    .sort((a, b) => a.week.localeCompare(b.week));

                  if (timelineArray.length < 2) return null;

                  const recent = timelineArray.slice(-4); // Last 4 weeks
                  const previous = timelineArray.slice(-8, -4); // Previous 4 weeks
                  
                  const recentAvg = recent.reduce((sum, week) => sum + week.applications, 0) / recent.length;
                  const previousAvg = previous.reduce((sum, week) => sum + week.applications, 0) / previous.length;
                  
                  const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
                  
                  return (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Application Momentum
                      </h4>
                      <p className="mobile-text-2xl mobile-font-bold text-purple-600 dark:text-purple-400">
                        {Math.round(recentAvg)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-bold">apps/week</span>
                        {change !== 0 && (
                          <span className={`ml-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({change > 0 ? '+' : ''}{Math.round(change)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}

                {/* Best Performing Source */}
                {(() => {
                  const sourceData = applications.reduce((acc, app) => {
                    if (app.jobSource) {
                      if (!acc[app.jobSource]) {
                        acc[app.jobSource] = { total: 0, successful: 0 };
                      }
                      acc[app.jobSource].total++;
                      if (app.status === 'Interview' || app.status === 'Offer') {
                        acc[app.jobSource].successful++;
                      }
                    }
                    return acc;
                  }, {} as Record<string, { total: number; successful: number }>);
                  
                  const bestSource = Object.entries(sourceData)
                    .filter(([, data]) => data.total >= 2)
                    .map(([source, data]) => ({
                      source,
                      successRate: (data.successful / data.total) * 100
                    }))
                    .sort((a, b) => b.successRate - a.successRate)[0];
                  
                  return bestSource ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Best Performing Source
                      </h4>
                      <p className="mobile-text-2xl mobile-font-bold text-green-600 dark:text-green-400">
                        {bestSource.source}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {bestSource.successRate.toFixed(1)}% success rate
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'basic' && (
        <div className="mobile-space-y-4">
          {/* Status Breakdown */}
          <div className="card">
            <h2 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-blue-200 dark:border-blue-700 pb-2">
              Status Breakdown
            </h2>
            
            <div className="mobile-space-y-3">
              {Object.entries(applicationsByStatus).map(([status, count]) => {
                const percentage = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
                return (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                        {status}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {count} applications
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Progress */}
          {Object.keys(applicationsByMonth).length > 0 && (
            <div className="card">
              <h2 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-purple-200 dark:border-purple-700 pb-2">
                Monthly Progress
              </h2>
              
              <div className="mobile-space-y-3">
                {Object.entries(applicationsByMonth)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 6)
                  .map(([month, count]) => {
                    const date = new Date(month + '-01');
                    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return (
                      <div key={month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {monthName}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {count} applications
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'advanced' && !auth.isAuthenticated && (
        <div className="card">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="mobile-text-xl mobile-font-bold text-gray-900 dark:text-gray-100 mb-3">
              Login to See Full Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Sign up to access advanced analytics including company success rates, 
              salary analysis by job type, and detailed performance metrics with cloud sync.
            </p>
            <div className="mobile-space-y-3">
              <div className="flex items-center mobile-justify-center mobile-gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>✓ Company success rate analysis</span>
                <span>✓ Salary analysis by job type</span>
                <span>✓ Detailed performance metrics</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && auth.isAuthenticated && (
        <div className="mobile-space-y-4">
          {/* Company Success Rates */}
          {companySuccessRates.length > 0 && (
            <div className="card">
              <h2 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-green-200 dark:border-green-700 pb-2">
                Company Success Rates
              </h2>
              <p className="text-base text-gray-700 dark:text-gray-300 mb-4 font-medium">
                Companies with 2+ applications ranked by success rate
              </p>
              
              <div className="mobile-space-y-3">
                {companySuccessRates.map((company) => (
                  <div key={company.company} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {company.company}
                        </div>
                        <div className="mobile-text-xs text-gray-600 dark:text-gray-400">
                          {company.total} applications
                        </div>
                      </div>
                      <div className="mobile-text-right">
                        <div className="mobile-text-lg mobile-font-bold text-green-600 dark:text-green-400">
                          {company.successRate.toFixed(1)}%
                        </div>
                        <div className="mobile-text-xs text-gray-600 dark:text-gray-400">
                          success rate
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(company.successRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salary Analysis */}
          {salaryTrends.all.length > 0 && (
            <div className="card">
              <h2 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-purple-200 dark:border-purple-700 pb-2">
                Salary Analysis by Job Type
              </h2>
              
              <div className="mobile-space-y-4">
                <div className="mobile-grid-2">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="mobile-text-2xl mobile-font-bold text-blue-600 dark:text-blue-400 mb-1">
                      ${salaryTrends.average.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      Average Salary
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="mobile-text-2xl mobile-font-bold text-green-600 dark:text-green-400 mb-1">
                      {salaryTrends.all.length}
                    </div>
                    <div className="text-sm text-green-800 dark:text-green-200">
                      With Salary Data
                    </div>
                  </div>
                </div>

                {/* Salary by Job Type */}
                {salaryTrends.byType.length > 0 && (
                  <div className="mobile-space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Average Salary by Job Type
                    </h4>
                    {salaryTrends.byType.map((item) => (
                      <div key={item.jobType} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                            {item.jobType}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.count} applications
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          ${item.average.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {salaryTrends.highest && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Highest Offer
                    </h4>
                    <div className="mobile-text-xl mobile-font-bold text-green-600 dark:text-green-400 mb-1">
                      ${salaryTrends.highest.salary.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      {salaryTrends.highest.position} at {salaryTrends.highest.company}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                      {salaryTrends.highest.type} • {salaryTrends.highest.employmentType}
                    </div>
                  </div>
                )}

                {salaryTrends.lowest && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Lowest Offer
                    </h4>
                    <div className="mobile-text-xl mobile-font-bold text-blue-600 dark:text-blue-400 mb-1">
                      ${salaryTrends.lowest.salary.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {salaryTrends.lowest.position} at {salaryTrends.lowest.company}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                      {salaryTrends.lowest.type} • {salaryTrends.lowest.employmentType}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {totalApplications === 0 && (
        <div className="mobile-empty-state">
          <div className="mobile-empty-state-icon">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h3 className="mobile-empty-state-title">
            No data to analyze yet
          </h3>
          <p className="mobile-empty-state-description">
            Add some job applications to see your analytics and track your progress!
          </p>
        </div>
              )}
      </div>
    </div>
  );
};

export default MobileAnalyticsTab;