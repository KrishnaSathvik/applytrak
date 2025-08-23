// src/components/charts/AnalyticsDashboard.tsx
import React from 'react';
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Award, Calendar, Clock, TrendingUp} from 'lucide-react';
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
    const {analytics, ui} = useAppStore();

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

    const sourceData: SourceDataItem[] = analytics.sourceSuccessRates
        .filter(item => item.total > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

    // Calculate derived metrics
    const totalInterviews = analytics.statusDistribution.Interview + analytics.statusDistribution.Offer;
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
                                Interviews
                            </p>
                            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                                {totalInterviews}
                            </p>
                        </div>
                        <div className="glass rounded-lg p-2">
                            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                Avg Response
                            </p>
                            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                                {analytics.averageResponseTime === 0 ? '-' : `${analytics.averageResponseTime}d`}
                            </p>
                        </div>
                        <div className="glass rounded-lg p-2">
                            <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-xl font-bold text-gradient-static tracking-tight">Application Status</h3>
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
                        <h3 className="text-xl font-bold text-gradient-static tracking-tight">Job Type Distribution</h3>
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
                            <EmptyState icon={Calendar} message="No data available"/>
                        )}
                    </div>
                </div>

                {/* Success Rate by Source */}
                <div className="card lg:col-span-2">
                    <div className="card-header">
                        <h3 className="text-xl font-bold text-gradient-static tracking-tight">
                            Success Rate by Job Source
                        </h3>
                    </div>
                    <div className="h-80">
                        {sourceData.length > 0 ? (
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
                        ) : (
                            <EmptyState icon={Award} message="No source data available"/>
                        )}
                    </div>
                </div>
            </div>

            {/* Insights */}
            {analytics.totalApplications > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-xl font-bold text-gradient-static tracking-tight">Key Insights</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Most Used Job Type */}
                        {mostUsedJobType && (
                            <div className="glass rounded-lg p-4">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-wide">
                                    Most Applied Job Type
                                </h4>
                                <p className="text-2xl font-extrabold text-gradient-blue">
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
                                    <span
                                        className="font-bold">{bestPerformingSource.successRate.toFixed(1)}%</span> success
                                    rate
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
    );
};

export default AnalyticsDashboard;