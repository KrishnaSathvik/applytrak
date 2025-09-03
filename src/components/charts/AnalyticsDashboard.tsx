// src/components/charts/AnalyticsDashboard.tsx
import React, { useMemo, useState } from 'react';
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart} from 'recharts';
import {Award, Clock, TrendingUp, BarChart3, Lock, DollarSign, Building, Target} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';


// Chart color configurations
const STATUS_COLORS = {
    Applied: '#4A5E54',
    Interview: '#17A2B8',
    Offer: '#28A745',
    Rejected: '#DC3545'
} as const;

const TYPE_COLORS = {
    Remote: '#36A2EB',
    Onsite: '#FF9F40',
    Hybrid: '#9966FF'
} as const;

// Type definitions
interface ChartDataItem {
    name: string;
    value: number;
    color: string;
}

interface SourceDataItem {
    source: string;
    successRate: number;
    offers: number;
    total: number;
}

interface TooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; payload?: any }>;
    label?: string;
}

const AnalyticsDashboard: React.FC = () => {
    const {analytics, ui, auth, applications} = useAppStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'basic' | 'advanced'>('overview');

    // Prepare chart data
    const statusData: ChartDataItem[] = Object.entries(analytics.statusDistribution)
        .map(([status, count]) => ({
            name: status,
            value: count,
            color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]
        }))
        .filter(item => item.value > 0);

    const typeData: ChartDataItem[] = Object.entries(analytics.typeDistribution)
        .map(([type, count]) => ({
            name: type,
            value: count,
            color: TYPE_COLORS[type as keyof typeof TYPE_COLORS]
        }));

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
            .slice(0, 10); // Top 10 companies
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
                    date: new Date(app.dateApplied)
                };
            })
            .filter(item => item.salary > 0)
            .sort((a, b) => b.salary - a.salary);

        const averageSalary = salaryData.length > 0 
            ? Math.round(salaryData.reduce((sum, item) => sum + item.salary, 0) / salaryData.length)
            : 0;

        const salaryByType = salaryData.reduce((acc, item) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item.salary);
            return acc;
        }, {} as Record<string, number[]>);

        const salaryByTypeAvg = Object.entries(salaryByType).map(([type, salaries]) => ({
            type,
            average: Math.round((salaries as number[]).reduce((sum, s) => sum + s, 0) / (salaries as number[]).length),
            count: (salaries as number[]).length
        }));

        return {
            all: salaryData,
            average: averageSalary,
            byType: salaryByTypeAvg,
            highest: salaryData[0],
            lowest: salaryData[salaryData.length - 1]
        };
    }, [applications]);

    // Advanced Analytics: Application Timeline
    const applicationTimeline = useMemo(() => {
        const timelineData: Record<string, number> = {};
        
        applications.forEach(app => {
            const month = new Date(app.dateApplied).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
            });
            timelineData[month] = (timelineData[month] || 0) + 1;
        });

        return Object.entries(timelineData)
            .map(([month, count]) => ({ month, applications: count }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
            .slice(-12); // Last 12 months
    }, [applications]);

    // Advanced Analytics: Response Time Analysis
    const responseTimeAnalysis = useMemo(() => {
        const companyResponseTimes: Record<string, { totalDays: number; count: number; applications: any[] }> = {};
        
        applications.forEach(app => {
            if (app.status !== 'Applied' && app.dateApplied) {
                const appliedDate = new Date(app.dateApplied);
                const responseDate = new Date(app.updatedAt || app.createdAt);
                const daysDiff = Math.ceil((responseDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff > 0 && daysDiff < 365) { // Reasonable response time
                    if (!companyResponseTimes[app.company]) {
                        companyResponseTimes[app.company] = { totalDays: 0, count: 0, applications: [] };
                    }
                    companyResponseTimes[app.company].totalDays += daysDiff;
                    companyResponseTimes[app.company].count += 1;
                    companyResponseTimes[app.company].applications.push({
                        ...app,
                        responseDays: daysDiff
                    });
                }
            }
        });

        return Object.entries(companyResponseTimes)
            .filter(([, data]) => data.count >= 2) // Only companies with 2+ responses
            .map(([company, data]) => ({
                company,
                averageResponseDays: Math.round(data.totalDays / data.count),
                totalResponses: data.count,
                applications: data.applications
            }))
            .sort((a, b) => a.averageResponseDays - b.averageResponseDays) // Fastest responders first
            .slice(0, 10); // Top 10 companies
    }, [applications]);

    // Check if user has exceeded free plan limits
    const isFreeUser = !auth.isAuthenticated;
    const hasExceededFreeLimit = applications.length > 50;
    
    // If user is not authenticated and has exceeded free limit, show upgrade message
    if (isFreeUser && hasExceededFreeLimit) {
        return (
            <div className="space-y-8">
                                {/* Header Section */}
                <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="h-10 w-10 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Upgrade to Pro for More Analytics
                        </h1>
                        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                            You've reached the free plan limit of 50 applications. Upgrade to Pro to unlock advanced analytics for unlimited applications, including company success rates and salary trend analysis.
                        </p>
                    </div>
                </div>

                {/* Feature Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Success Rate Tracking</h3>
                        <p className="text-gray-600 text-sm">
                            Monitor your interview-to-offer conversion rates and identify your most effective job search strategies.
                        </p>
                    </div>

                    <div className="glass-card p-6 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
                        <p className="text-gray-600 text-sm">
                            Track application velocity, response times, and optimize your job search pipeline for better results.
                        </p>
                    </div>

                    <div className="glass-card p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Goal Progress</h3>
                        <p className="text-gray-600 text-sm">
                            Visualize your progress toward weekly and monthly application goals with interactive charts.
                        </p>
                    </div>
                </div>


            </div>
        );
    }

    const sourceData: SourceDataItem[] = analytics.sourceSuccessRates
        .filter(item => item.total > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

    // Calculate derived metrics
    const interviewRate = analytics.totalApplications > 0 
        ? Math.round((analytics.statusDistribution.Interview / analytics.totalApplications) * 100)
        : 0;
    const applicationVelocity = analytics.totalApplications > 0
        ? Math.round(analytics.totalApplications / Math.max(1, Math.ceil((Date.now() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))))
        : 0;

    const mostUsedJobType = typeData.length > 0
        ? typeData.reduce((max, item) => item.value > max.value ? item : max)
        : null;

    const bestPerformingSource = sourceData.length > 0 ? sourceData[0] : null;

    // Custom tooltip components
    const CustomTooltip: React.FC<TooltipProps> = ({active, payload, label}) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass rounded-lg p-3 border border-white/20">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide">
                        {label}: <span className="font-extrabold text-gradient-blue">{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const SuccessRateTooltip: React.FC<TooltipProps> = ({active, payload, label}) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="glass rounded-lg p-3 border border-white/20">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Success Rate: <span
                        className="font-bold text-gradient-blue">{data.successRate.toFixed(1)}%</span>
                    </p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Offers: <span className="font-bold">{data.offers}</span> / <span
                        className="font-bold">{data.total}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // Empty state component
    const EmptyState: React.FC<{ icon: React.ComponentType<any>; message: string }> = ({icon: Icon, message}) => (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
                <Icon className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                <p className="font-semibold text-lg">{message}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                Total Applications
                            </p>
                            <p className="text-3xl font-extrabold text-gradient-static">
                                {analytics.totalApplications}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                                All time applications
                            </p>
                        </div>
                        <div className="glass rounded-lg p-2">
                            <TrendingUp className="h-6 w-6 text-primary-600 dark:text-primary-400"/>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                Success Rate
                            </p>
                            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                                {analytics.successRate}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                                Applications → Offers
                            </p>
                        </div>
                        <div className="glass rounded-lg p-2">
                            <Award className="h-6 w-6 text-green-600 dark:text-green-400"/>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                Interview Rate
                            </p>
                            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                                {interviewRate}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                                Applications → Interviews
                            </p>
                        </div>
                        <div className="glass rounded-lg p-2">
                            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                Avg Response Time
                            </p>
                            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                                {analytics.averageResponseTime === 0 ? '-' : `${analytics.averageResponseTime}d`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                                Days to hear back
                            </p>
                        </div>
                        <div className="glass rounded-lg p-2">
                            <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                        </div>
                    </div>
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
                            Basic Analytics
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
                                Advanced Analytics
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
                                Advanced Analytics
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Insights */}
                    {analytics.totalApplications > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Key Insights</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Most Used Job Type */}
                                {mostUsedJobType && (
                                    <div className="glass rounded-lg p-4">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-wide">
                                            Most Used Job Type
                                        </h4>
                                        <p className="text-2xl font-extrabold text-gradient-purple">
                                            {mostUsedJobType.name}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide">
                                            <span className="font-bold">{mostUsedJobType.value}</span> applications
                                        </p>
                                    </div>
                                )}

                                {/* Best Performing Source */}
                                {bestPerformingSource && (
                                    <div className="glass rounded-lg p-4">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-wide">
                                            Best Performing Source
                                        </h4>
                                        <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                                            {bestPerformingSource.source}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide">
                                            <span className="font-bold">{bestPerformingSource.successRate.toFixed(1)}%</span> success rate
                                        </p>
                                    </div>
                                )}

                                {/* Application Velocity */}
                                <div className="glass rounded-lg p-4">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-wide">
                                        Application Velocity
                                    </h4>
                                    <p className="text-2xl font-extrabold text-gradient-purple">
                                        {applicationVelocity}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide">
                                        applications per week
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'basic' && (
                <div className="space-y-6">
                    {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Application Status Distribution</h3>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            Breakdown of your applications by current status
                        </p>
                    </div>
                    <div className="h-80">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color}/>
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip/>}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState icon={TrendingUp} message="No data available"/>
                        )}
                    </div>

                    {/* Legend */}
                    {statusData.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-4">
                            {statusData.map((item) => (
                                <div key={item.name} className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{backgroundColor: item.color}}
                                    />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {item.name} <span className="font-bold">({item.value})</span>
                  </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Job Type Distribution */}
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Job Type Distribution</h3>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            Applications by work arrangement (Remote, Onsite, Hybrid)
                        </p>
                    </div>
                    <div className="h-80">
                        {typeData.some(item => item.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={typeData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={ui.theme === 'dark' ? '#374151' : '#E5E7EB'}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                        fontSize={12}
                                        fontWeight="600"
                                    />
                                    <YAxis
                                        stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                        fontSize={12}
                                        fontWeight="600"
                                    />
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color}/>
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState icon={Clock} message="No data available"/>
                        )}
                    </div>
                </div>


            </div>
                </div>
            )}

            {activeTab === 'advanced' && !auth.isAuthenticated && (
                <div className="glass-card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200/30 dark:border-purple-700/30">
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Login to See Full Analytics
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                            Sign up to access advanced analytics including company success rates, 
                            salary trends, and detailed performance metrics with cloud sync.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>✓ Company success rate analysis</span>
                                <span>✓ Salary trend tracking</span>
                                <span>✓ Detailed performance metrics</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'advanced' && auth.isAuthenticated && (
                <div className="space-y-6">
                    {/* Pro Features Upgrade Prompt for Free Users */}
                    {applications.length > 0 && isFreeUser && (
                        <div className="glass-card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200/30 dark:border-purple-700/30">
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    Unlock Advanced Analytics with Pro
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto text-lg">
                                    Get detailed insights with Company Success Rates, Salary Trend Analysis, Application Timeline, and more advanced metrics.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 max-w-5xl mx-auto">
                                    <span className="flex items-center gap-2">
                                        <Building className="h-5 w-5" />
                                        <span className="font-medium">Company Success Rates</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        <span className="font-medium">Success Rate by Job Source</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        <span className="font-medium">Average Salary by Job Type</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        <span className="font-medium">Salary Statistics & Insights</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        <span className="font-medium">Application Timeline</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        <span className="font-medium">Response Time Analysis</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Advanced Analytics Section - Pro Features */}
            {applications.length > 0 && auth.isAuthenticated && (
                <>
                    {/* Company Success Rates */}
                    {companySuccessRates.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <div className="flex items-center gap-2">
                                    <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Company Success Rates
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    Companies with 2+ applications ranked by interview and offer success rate
                                </p>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={companySuccessRates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis 
                                            dataKey="company" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            fontSize={12}
                                        />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip 
                                            formatter={(value: number, name: string) => [
                                                `${value.toFixed(1)}%`,
                                                name === 'successRate' ? 'Success Rate' :
                                                name === 'interviewRate' ? 'Interview Rate' : 'Offer Rate'
                                            ]}
                                            labelFormatter={(label) => `Company: ${label}`}
                                        />
                                        <Bar dataKey="successRate" fill="#10b981" name="Success Rate" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Success Rate by Source */}
                    {sourceData.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Success Rate by Job Source
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    Which job sources are most effective for getting interviews and offers
                                </p>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sourceData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke={ui.theme === 'dark' ? '#374151' : '#E5E7EB'}
                                        />
                                        <XAxis
                                            dataKey="source"
                                            stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                            fontSize={12}
                                            fontWeight="600"
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                            fontSize={12}
                                            fontWeight="600"
                                        />
                                        <Tooltip content={<SuccessRateTooltip/>}/>
                                        <Bar
                                            dataKey="successRate"
                                            fill="#FF6384"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Salary Analysis */}
                    {salaryTrends.all.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Salary by Job Type */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                            Average Salary by Job Type
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Salary comparison across Remote, Onsite, and Hybrid positions
                                    </p>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salaryTrends.byType}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <XAxis dataKey="type" />
                                            <YAxis 
                                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip 
                                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Average Salary']}
                                                labelFormatter={(label) => `Job Type: ${label}`}
                                            />
                                            <Bar dataKey="average" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Salary Statistics */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                            Salary Statistics & Insights
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Key salary metrics and your highest/lowest offers
                                    </p>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                ${salaryTrends.average.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {salaryTrends.all.length}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Applications with Salary</p>
                                        </div>
                                    </div>
                                    
                                    {salaryTrends.highest && (
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                            <p className="font-semibold text-green-800 dark:text-green-200 mb-1">
                                                Highest Offer
                                            </p>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                ${salaryTrends.highest.salary.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {salaryTrends.highest.position} at {salaryTrends.highest.company}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Application Timeline */}
                    {applicationTimeline.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Application Timeline
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    Your job application activity and trends over the last 12 months
                                </p>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={applicationTimeline}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value: number) => [value, 'Applications']}
                                            labelFormatter={(label) => `Month: ${label}`}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="applications" 
                                            stroke="#8b5cf6" 
                                            fill="#8b5cf6" 
                                            fillOpacity={0.3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Response Time Analysis */}
                    {responseTimeAnalysis.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Response Time Analysis
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    Average response time by company (fastest responders first)
                                </p>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={responseTimeAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis 
                                            dataKey="company" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            fontSize={12}
                                        />
                                        <YAxis 
                                            domain={[0, 'dataMax + 5']}
                                            label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip 
                                            formatter={(value: number, name: string) => [
                                                `${value} days`,
                                                name === 'averageResponseDays' ? 'Average Response Time' : 'Total Responses'
                                            ]}
                                            labelFormatter={(label) => `Company: ${label}`}
                                        />
                                        <Bar 
                                            dataKey="averageResponseDays" 
                                            fill="#f59e0b" 
                                            name="Average Response Time"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </>
            )}
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;