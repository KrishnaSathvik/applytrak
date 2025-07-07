// src/components/charts/AnalyticsDashboard.tsx - COMPLETE FIXED VERSION
import React from 'react';
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Award, Calendar, Clock, TrendingUp} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

const AnalyticsDashboard: React.FC = () => {
    const {analytics, ui} = useAppStore();

    // Colors for charts
    const statusColors = {
        Applied: '#4A5E54',
        Interview: '#17A2B8',
        Offer: '#28A745',
        Rejected: '#DC3545'
    };

    const typeColors = {
        Remote: '#36A2EB',
        Onsite: '#FF9F40',
        Hybrid: '#9966FF'
    };

    // Prepare status data for pie chart
    const statusData = Object.entries(analytics.statusDistribution).map(([status, count]) => ({
        name: status,
        value: count,
        color: statusColors[status as keyof typeof statusColors]
    })).filter(item => item.value > 0);

    // Prepare type data for bar chart
    const typeData = Object.entries(analytics.typeDistribution).map(([type, count]) => ({
        name: type,
        value: count,
        color: typeColors[type as keyof typeof typeColors]
    }));

    // Prepare source success rate data
    const sourceData = analytics.sourceSuccessRates
        .filter(item => item.total > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5); // Top 5 sources

    const CustomTooltip = ({active, payload, label}: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass rounded-lg p-3 border border-white/20">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {label}: {payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    const SuccessRateTooltip = ({active, payload, label}: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="glass rounded-lg p-3 border border-white/20">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Success Rate: {data.successRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Offers: {data.offers} / {data.total}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interviews</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {analytics.statusDistribution.Interview + analytics.statusDistribution.Offer}
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
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
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
                        <h3 className="text-lg font-semibold">Application Status</h3>
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
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                                    <p>No data available</p>
                                </div>
                            </div>
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
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {item.name} ({item.value})
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Job Type Distribution */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Job Type Distribution</h3>
                    </div>
                    <div className="h-80">
                        {typeData.some(item => item.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={typeData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                    <CartesianGrid strokeDasharray="3 3"
                                                   stroke={ui.theme === 'dark' ? '#374151' : '#E5E7EB'}/>
                                    <XAxis
                                        dataKey="name"
                                        stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                    />
                                    <YAxis
                                        stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
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
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                                    <p>No data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Success Rate by Source */}
                <div className="card lg:col-span-2">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Success Rate by Job Source</h3>
                    </div>
                    <div className="h-80">
                        {sourceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sourceData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                    <CartesianGrid strokeDasharray="3 3"
                                                   stroke={ui.theme === 'dark' ? '#374151' : '#E5E7EB'}/>
                                    <XAxis
                                        dataKey="source"
                                        stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        stroke={ui.theme === 'dark' ? '#9CA3AF' : '#6B7280'}
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
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                                    <p>No source data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Insights */}
            {analytics.totalApplications > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-semibold">Insights</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Most Used Job Type */}
                        {typeData.length > 0 && (
                            <div className="glass rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Most Applied Job Type
                                </h4>
                                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                    {typeData.reduce((max, item) => item.value > max.value ? item : max).name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {typeData.reduce((max, item) => item.value > max.value ? item : max).value} applications
                                </p>
                            </div>
                        )}

                        {/* Best Performing Source */}
                        {sourceData.length > 0 && (
                            <div className="glass rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Best Performing Source
                                </h4>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {sourceData[0].source}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {sourceData[0].successRate.toFixed(1)}% success rate
                                </p>
                            </div>
                        )}

                        {/* Application Velocity */}
                        <div className="glass rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Application Velocity
                            </h4>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {analytics.totalApplications > 0 ?
                                    Math.round(analytics.totalApplications / Math.max(1, Math.ceil((Date.now() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))))
                                    : 0
                                }
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
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